/* =====================================================================
   Motor de simulación de señales (dominio del tiempo, muestreo uniforme)
   ---------------------------------------------------------------------
   Cada módulo define bornes (jacks) y funciones que calculan la forma
   de onda de cada salida sobre una "grilla" de tiempo {t0, dt, n}.
   Las entradas se resuelven a partir de los cables (redes/nets).
   ===================================================================== */
(function (G) {
  'use strict';

  const TTL_TH = 1.4;           // umbral de entrada TTL (V)

  function mod(a, n) { return ((a % n) + n) % n; }
  function frac(x) { return x - Math.floor(x); }

  /* ---------- filtros analógicos -> digitales (transformada bilineal) ---------- */
  // H(s) = (b2 s^2 + b1 s + b0) / (a2 s^2 + a1 s + a0)
  function biquad(b2, b1, b0, a2, a1, a0, dt) {
    const K = 2 / dt, K2 = K * K;
    const B0 = b2 * K2 + b1 * K + b0, B1 = 2 * b0 - 2 * b2 * K2, B2 = b2 * K2 - b1 * K + b0;
    const A0 = a2 * K2 + a1 * K + a0, A1 = 2 * a0 - 2 * a2 * K2, A2 = a2 * K2 - a1 * K + a0;
    return { b0: B0 / A0, b1: B1 / A0, b2: B2 / A0, a1: A1 / A0, a2: A2 / A0 };
  }
  function runBiquad(x, c, lo, hi) {
    const n = x.length, y = new Float32Array(n);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < n; i++) {
      const xi = x[i];
      let yi = c.b0 * xi + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
      x2 = x1; x1 = xi; y2 = y1; y1 = yi;
      if (lo !== undefined) yi = Math.max(lo, Math.min(hi, yi));
      y[i] = yi;
    }
    return y;
  }
  function rcLowpass(x, tau, dt) {
    const n = x.length, y = new Float32Array(n);
    const a = dt / (tau + dt);
    let s = x.length ? x[0] : 0;
    for (let i = 0; i < n; i++) { s += a * (x[i] - s); y[i] = s; }
    return y;
  }

  /* ---------- evaluador de una red de bornes ---------- */
  class Evaluator {
    constructor(def, state, cables, grid) {
      this.def = def; this.s = state; this.grid = grid;
      this.n = grid.n; this.dt = grid.dt; this.t0 = grid.t0;
      this.cache = new Map(); this.busy = new Set();
      this.jmap = {}; def.jacks.forEach(j => this.jmap[j.id] = j);
      this.nets = Engine.buildNets(def, cables);
      this._t = null;
    }
    get t() {
      if (!this._t) { const a = new Float64Array(this.n); for (let i = 0; i < this.n; i++) a[i] = this.t0 + i * this.dt; this._t = a; }
      return this._t;
    }
    zeros() { return new Float32Array(this.n); }
    constant(v) { const a = new Float32Array(this.n); a.fill(v); return a; }
    // valor de un borne (salida propia o lo que llega por el cable)
    jack(id) {
      const j = this.jmap[id];
      if (!j) return this.zeros();
      if (j.dir === 'in') {
        const v = this.in(id);
        return v ? v : this.floating(j);
      }
      return this.out(id);
    }
    floating(j) {
      // entrada sin conectar: el osciloscopio ve ruido de unos pocos mV
      const a = new Float32Array(this.n);
      for (let i = 0; i < this.n; i++) a[i] = (Math.random() - 0.5) * 0.01;
      return a;
    }
    out(id) {
      if (this.cache.has(id)) return this.cache.get(id);
      if (!this.s.power) { const z = this.zeros(); this.cache.set(id, z); return z; }
      if (this.busy.has(id)) return this.zeros(); // lazo combinacional: se corta
      this.busy.add(id);
      const fn = this.def.compute[id];
      let v = fn ? fn(this) : this.zeros();
      this.busy.delete(id);
      this.cache.set(id, v);
      return v;
    }
    // nodo interno (memo)
    node(name) { return this.out(name); }
    // entrada: busca la salida que maneja la red. null si no hay conexión.
    in(id) {
      const net = this.nets.netOf[id];
      if (net === undefined) return null;
      const drivers = this.nets.drivers[net];
      if (!drivers.length) return null;
      if (drivers.length === 1) return this.out(drivers[0]);
      // dos salidas unidas: "cortocircuito" -> promedio (y se avisa en la UI)
      const a = this.zeros();
      drivers.forEach(d => { const v = this.out(d); for (let i = 0; i < this.n; i++) a[i] += v[i] / drivers.length; });
      return a;
    }
    // entrada lógica: true/false por muestra; null si flota
    logic(id) {
      const v = this.in(id);
      if (!v) return null;
      const b = new Uint8Array(this.n);
      for (let i = 0; i < this.n; i++) b[i] = v[i] > TTL_TH ? 1 : 0;
      return b;
    }
  }

  const Engine = {
    TTL_TH, mod, frac, biquad, runBiquad, rcLowpass, Evaluator,

    // agrupa bornes conectados por cables (union-find)
    buildNets(def, cables) {
      const parent = {};
      const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
      def.jacks.forEach(j => parent[j.id] = j.id);
      cables.forEach(c => { if (parent[c.a] !== undefined && parent[c.b] !== undefined) parent[find(c.a)] = find(c.b); });
      const netOf = {}, drivers = {}, members = {};
      const connected = new Set(); cables.forEach(c => { connected.add(c.a); connected.add(c.b); });
      def.jacks.forEach(j => {
        if (!connected.has(j.id)) return;
        const r = find(j.id); netOf[j.id] = r;
        (members[r] = members[r] || []).push(j.id);
        drivers[r] = drivers[r] || [];
        if (j.dir !== 'in') drivers[r].push(j.id);
      });
      return { netOf, drivers, members };
    },

    // construye la grilla para una ventana [tA, tB]
    makeGrid(def, state, tA, tB, dtWanted) {
      const dt = Math.max(dtWanted, def.dtMin || 0);
      let start = tA - (def.warm || 0);
      if (def.align) {
        const ref = state.tReset || 0;
        start = ref + Math.floor((start - ref) / def.align) * def.align;
      }
      const n = Math.max(2, Math.ceil((tB - start) / dt) + 1);
      return { t0: start, dt, n, skip: Math.round((tA - start) / dt) };
    },

    // simula y devuelve las señales pedidas recortadas a [tA, tB]
    acquire(def, state, cables, ids, tA, tB, dt) {
      const grid = this.makeGrid(def, state, tA, tB, dt);
      const ev = new Evaluator(def, state, cables, grid);
      const res = {};
      ids.forEach(id => { if (id) res[id] = ev.jack(id).subarray(grid.skip); });
      return { data: res, dt: grid.dt, t0: grid.t0 + grid.skip * grid.dt };
    }
  };

  G.Engine = Engine;
  if (typeof module !== 'undefined') module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
