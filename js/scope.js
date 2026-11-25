/* =====================================================================
   Osciloscopio digital de 2 canales + analizador de espectro (FFT)
   ===================================================================== */
(function (G) {
  'use strict';

  const VDIV = [0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10];
  const TDIV = (() => { const a = []; for (let e = -8; e <= -1; e++) [1, 2, 5].forEach(m => a.push(m * Math.pow(10, e))); return a; })();
  const COL = ['#ffd84a', '#3fe0ff'];

  function fmtV(v) { const a = Math.abs(v); if (a >= 1) return v.toFixed(2) + ' V'; if (a >= 1e-3) return (v * 1e3).toFixed(1) + ' mV'; return (v * 1e3).toFixed(2) + ' mV'; }
  function fmtT(t) { const a = Math.abs(t); if (a >= 1) return t.toFixed(2) + ' s'; if (a >= 1e-3) return +(t * 1e3).toPrecision(3) + ' ms'; if (a >= 1e-6) return +(t * 1e6).toPrecision(3) + ' µs'; return +(t * 1e9).toPrecision(3) + ' ns'; }
  function fmtF(f) { if (f >= 1e6) return +(f / 1e6).toPrecision(4) + ' MHz'; if (f >= 1e3) return +(f / 1e3).toPrecision(4) + ' kHz'; return +f.toPrecision(4) + ' Hz'; }
  function fmtDiv(v, unit) { if (unit === 'V') return v >= 1 ? v + ' V' : (v * 1000) + ' mV'; if (v >= 1e-3) return +(v * 1e3).toPrecision(3) + ' ms'; if (v >= 1e-6) return +(v * 1e6).toPrecision(3) + ' µs'; return +(v * 1e9).toPrecision(3) + ' ns'; }

  /* ---------- FFT radix 2 ---------- */
  function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const ar = re[i + k], ai = im[i + k], br = re[i + k + len / 2], bi = im[i + k + len / 2];
          const tr = br * cr - bi * ci, ti = br * ci + bi * cr;
          re[i + k] = ar + tr; im[i + k] = ai + ti; re[i + k + len / 2] = ar - tr; im[i + k + len / 2] = ai - ti;
          const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
        }
      }
    }
  }

  /* ---------- medición automática ---------- */
  function measure(y, dt) {
    const n = y.length; if (n < 4) return null;
    let mx = -Infinity, mn = Infinity, sum = 0, sq = 0;
    for (let i = 0; i < n; i++) { const v = y[i]; if (v > mx) mx = v; if (v < mn) mn = v; sum += v; sq += v * v; }
    const pp = mx - mn, mid = (mx + mn) / 2, hy = pp * 0.1;
    const res = { max: mx, min: mn, pp, avg: sum / n, rms: Math.sqrt(sq / n), freq: null, period: null, duty: null };
    if (pp < 0.02) return res;
    let state = y[0] > mid, rises = [], highT = 0, lastRise = -1;
    let highAcc = 0, cycleAcc = 0;
    for (let i = 1; i < n; i++) {
      const v = y[i];
      if (!state && v > mid + hy) { state = true; rises.push(i); }
      else if (state && v < mid - hy) { state = false; }
    }
    if (rises.length >= 2) {
      const a = rises[0], b = rises[rises.length - 1];
      res.period = (b - a) * dt / (rises.length - 1); res.freq = 1 / res.period;
      let h = 0; for (let i = a; i < b; i++) if (y[i] > mid) h++;
      res.duty = h / (b - a);
    }
    return res;
  }

  class Scope {
    constructor(app, root) {
      this.app = app; this.root = root;
      this.canvas = root.querySelector('canvas.screen');
      this.ctx = this.canvas.getContext('2d');
      this.settings = {};
      this.simT = 0.05; this.last = performance.now();
      this.frozen = null; this.view = 'scope';
      this.buildControls();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
      const ro = new ResizeObserver(() => this.resize()); ro.observe(this.canvas);
      this.resize();
    }
    resize() {
      const r = this.canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      this.canvas.width = Math.max(300, Math.round(r.width * dpr)); this.canvas.height = Math.max(240, Math.round(r.height * dpr));
      this.dirty = true;
    }
    // ajustes por módulo
    get S() {
      const id = this.app.cur.id;
      if (!this.settings[id]) {
        const def = this.app.cur;
        this.settings[id] = {
          ch: [{ on: true, probe: null, vdiv: 2, pos: 2, coup: 'DC' }, { on: true, probe: null, vdiv: 2, pos: -2, coup: 'DC' }],
          tdiv: def.tdivDefault, hpos: 0, trig: { src: 0, slope: 1, level: 1, mode: 'auto' }, run: true, xy: false,
          fft: { src: 1, span: null, ref: 10 }
        };
      }
      return this.settings[id];
    }
    buildControls() {
      const R = this.root, opt = (arr, f) => arr.map(v => `<option value="${v}">${f(v)}</option>`).join('');
      R.querySelector('.ctl').innerHTML = `
      <div class="grp chgrp" data-ch="0"><div class="gt"><span class="dot" style="background:${COL[0]}"></span>CH1 <label class="sw"><input type="checkbox" class="on"> ON</label></div>
        <div class="probe">sonda: <b class="pname">—</b></div>
        <label>V/div <select class="vdiv">${opt(VDIV, v => fmtDiv(v, 'V'))}</select></label>
        <label>Acople <select class="coup"><option>DC</option><option>AC</option><option>GND</option></select></label>
        <label>Posición <input type="range" class="pos" min="-4" max="4" step="0.1"></label></div>
      <div class="grp chgrp" data-ch="1"><div class="gt"><span class="dot" style="background:${COL[1]}"></span>CH2 <label class="sw"><input type="checkbox" class="on"> ON</label></div>
        <div class="probe">sonda: <b class="pname">—</b></div>
        <label>V/div <select class="vdiv">${opt(VDIV, v => fmtDiv(v, 'V'))}</select></label>
        <label>Acople <select class="coup"><option>DC</option><option>AC</option><option>GND</option></select></label>
        <label>Posición <input type="range" class="pos" min="-4" max="4" step="0.1"></label></div>
      <div class="grp"><div class="gt">Horizontal</div>
        <label>Tiempo/div <select class="tdiv"></select></label>
        <label>Posición <input type="range" class="hpos" min="-5" max="5" step="0.1"></label>
        <div class="row"><button class="b-xy">Modo X-Y</button><button class="b-auto" title="Ajusta V/div y tiempo/div automáticamente">AUTOSET</button></div></div>
      <div class="grp"><div class="gt">Disparo (trigger)</div>
        <label>Fuente <select class="tsrc"><option value="0">CH1</option><option value="1">CH2</option></select></label>
        <label>Pendiente <select class="tslope"><option value="1">↑ subida</option><option value="-1">↓ bajada</option></select></label>
        <label>Nivel <input type="range" class="tlev" min="-12" max="12" step="0.05"><span class="tlevv"></span></label>
        <label>Modo <select class="tmode"><option value="auto">AUTO</option><option value="normal">NORMAL</option></select></label>
        <div class="row"><button class="b-run">RUN/STOP</button><button class="b-single">SINGLE</button></div></div>`;
      const q = s => R.querySelector(s);
      R.querySelectorAll('.chgrp').forEach(g => {
        const i = +g.dataset.ch;
        g.querySelector('.on').onchange = e => { this.S.ch[i].on = e.target.checked; this.dirty = true; };
        g.querySelector('.vdiv').onchange = e => { this.S.ch[i].vdiv = +e.target.value; this.dirty = true; };
        g.querySelector('.coup').onchange = e => { this.S.ch[i].coup = e.target.value; this.dirty = true; };
        g.querySelector('.pos').oninput = e => { this.S.ch[i].pos = +e.target.value; this.dirty = true; };
      });
      q('.tdiv').onchange = e => { this.S.tdiv = +e.target.value; this.dirty = true; };
      q('.hpos').oninput = e => { this.S.hpos = +e.target.value; this.dirty = true; };
      q('.b-xy').onclick = () => { this.S.xy = !this.S.xy; if (this.S.xy) this.S.ch.forEach(c => c.pos = 0); this.sync(); };
      q('.b-auto').onclick = () => this.autoset();
      q('.tsrc').onchange = e => { this.S.trig.src = +e.target.value; };
      q('.tslope').onchange = e => { this.S.trig.slope = +e.target.value; };
      q('.tlev').oninput = e => { this.S.trig.level = +e.target.value; this.sync(); };
      q('.tmode').onchange = e => { this.S.trig.mode = e.target.value; };
      q('.b-run').onclick = () => { this.S.run = !this.S.run; this.single = false; this.sync(); };
      q('.b-single').onclick = () => { this.S.run = true; this.single = true; this.sync(); };
      // espectro
      const F = R.querySelector('.fftctl');
      F.querySelector('.fsrc').onchange = e => { this.S.fft.src = +e.target.value; };
      F.querySelector('.fspan').onchange = e => { this.S.fft.span = +e.target.value; };
      F.querySelector('.fref').onchange = e => { this.S.fft.ref = +e.target.value; };
      R.querySelectorAll('.viewtab').forEach(b => b.onclick = () => { this.view = b.dataset.view; this.sync(); });
    }
    spans() {
      const id = this.app.cur.id;
      return id === 'fsk' ? [5e3, 10e3, 25e3, 50e3] : id === 'psk' ? [25e3, 50e3, 100e3, 250e3] : [500e3, 1e6, 2e6, 5e6];
    }
    // refleja los ajustes en los controles
    sync() {
      const S = this.S, R = this.root, def = this.app.cur;
      R.querySelectorAll('.chgrp').forEach(g => {
        const i = +g.dataset.ch, c = S.ch[i];
        g.querySelector('.on').checked = c.on; g.querySelector('.vdiv').value = c.vdiv;
        g.querySelector('.coup').value = c.coup; g.querySelector('.pos').value = c.pos;
        const j = c.probe && this.app.jack(c.probe);
        g.querySelector('.pname').textContent = j ? j.label : 'sin conectar';
      });
      const tsel = R.querySelector('.tdiv');
      const list = TDIV.filter(v => v >= def.tdivRange[0] * 0.999 && v <= def.tdivRange[1] * 1.001);
      tsel.innerHTML = list.map(v => `<option value="${v}">${fmtDiv(v, 's')}</option>`).join('');
      if (!list.some(v => Math.abs(v - S.tdiv) / v < 1e-6)) S.tdiv = def.tdivDefault;
      tsel.value = list.find(v => Math.abs(v - S.tdiv) / v < 1e-6);
      R.querySelector('.hpos').value = S.hpos;
      R.querySelector('.tsrc').value = S.trig.src; R.querySelector('.tslope').value = S.trig.slope;
      R.querySelector('.tlev').value = S.trig.level; R.querySelector('.tlevv').textContent = fmtV(S.trig.level);
      R.querySelector('.tmode').value = S.trig.mode;
      R.querySelector('.b-run').classList.toggle('stop', !S.run);
      R.querySelector('.b-run').textContent = S.run ? 'RUN ▶ (clic = STOP)' : 'STOP ■ (clic = RUN)';
      R.querySelector('.b-xy').classList.toggle('active', S.xy);
      const sp = this.spans(); if (!S.fft.span || !sp.includes(S.fft.span)) S.fft.span = sp[1];
      R.querySelector('.fspan').innerHTML = sp.map(v => `<option value="${v}">0 – ${fmtF(v)}</option>`).join('');
      R.querySelector('.fspan').value = S.fft.span; R.querySelector('.fsrc').value = S.fft.src; R.querySelector('.fref').value = S.fft.ref;
      R.querySelectorAll('.viewtab').forEach(b => b.classList.toggle('active', b.dataset.view === this.view));
      R.querySelector('.ctl').style.display = this.view === 'scope' ? '' : 'none';
      R.querySelector('.fftctl').style.display = this.view === 'fft' ? '' : 'none';
      this.frozen = null; this.dirty = true;
    }
    setProbe(ch, jackId) { this.S.ch[ch].probe = jackId; this.S.ch[ch].on = true; this.sync(); }

    acquire(tA, tB, dt) {
      const ids = this.S.ch.map(c => c.probe);
      return Engine.acquire(this.app.cur, this.app.state, this.app.cables, ids.filter(Boolean), tA, tB, dt);
    }
    chanData(acq, i, n0, n) {
      const c = this.S.ch[i]; if (!c.probe || !acq.data[c.probe]) return null;
      let y = acq.data[c.probe].subarray(n0, n0 + n);
      if (c.coup === 'GND') return new Float32Array(y.length);
      if (c.coup === 'AC') { let m = 0; const src = acq.data[c.probe]; for (let k = 0; k < src.length; k++) m += src[k]; m /= src.length; const z = new Float32Array(y.length); for (let k = 0; k < y.length; k++) z[k] = y[k] - m; return z; }
      return y;
    }

    loop(now) {
      requestAnimationFrame(this.loop);
      const el = Math.min(0.1, (now - this.last) / 1000); this.last = now;
      this.simT += el;
      if (!this.app.cur || this.app.view !== 'module') return;
      if (now - (this.lastDraw || 0) < (this.heavy ? 180 : 70) && !this.dirty) return;
      this.lastDraw = now; this.dirty = false;
      const t0 = performance.now();
      try { this.view === 'fft' ? this.drawFFT() : this.drawScope(); } catch (e) { console.error(e); }
      this.heavy = performance.now() - t0 > 40;
    }

    /* ---------------- osciloscopio ---------------- */
    drawScope() {
      const S = this.S, def = this.app.cur;
      if (!S.run && this.frozen) { this.render(this.frozen); return; }
      const W = 10 * S.tdiv;
      let dt = W / 2500; dt = Math.min(dt, def.dtMax); dt = Math.max(dt, def.dtMin);
      if ((2.2 * W) / dt > 400000) dt = 2.2 * W / 400000;
      const tA = this.simT, tB = tA + 2.2 * W;
      const acq = this.acquire(tA, tB, dt);
      const nW = Math.round(W / acq.dt), total = acq.data[Object.keys(acq.data)[0]] ? acq.data[Object.keys(acq.data)[0]].length : 0;
      // disparo
      const tr = S.trig, trc = S.ch[tr.src];
      let start = -1;
      const pre = Math.round(nW * (0.5 + S.hpos / 10));
      if (trc.probe && acq.data[trc.probe] && !S.xy) {
        const y = this.chanData(acq, tr.src, 0, total);
        for (let i = Math.max(1, pre); i < total - (nW - pre); i++) {
          const a = y[i - 1], b = y[i];
          if (tr.slope > 0 ? (a < tr.level && b >= tr.level) : (a > tr.level && b <= tr.level)) { start = i - pre; break; }
        }
      }
      let triggered = start >= 0;
      if (!triggered) {
        if (tr.mode === 'normal' && this.frozen && !S.xy) { this.render(this.frozen, true); return; }
        start = 0;
      }
      const frame = { dt: acq.dt, n: nW, ch: [0, 1].map(i => this.S.ch[i].on ? this.chanData(acq, i, start, nW) : null), triggered, pre };
      this.frozen = frame;
      if (this.single && triggered) { this.single = false; S.run = false; this.sync(); this.frozen = frame; }
      this.render(frame, !triggered);
    }
    grid(ctx, w, h, nx, ny) {
      ctx.fillStyle = '#06140f'; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(120,200,160,0.22)'; ctx.lineWidth = 1;
      for (let i = 0; i <= nx; i++) { const x = Math.round(i * w / nx) + 0.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let j = 0; j <= ny; j++) { const y = Math.round(j * h / ny) + 0.5; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(120,200,160,0.45)';
      ctx.beginPath(); ctx.moveTo(w / 2 + 0.5, 0); ctx.lineTo(w / 2 + 0.5, h); ctx.moveTo(0, h / 2 + 0.5); ctx.lineTo(w, h / 2 + 0.5); ctx.stroke();
      for (let i = 0; i <= nx * 5; i++) { const x = i * w / (nx * 5); ctx.beginPath(); ctx.moveTo(x, h / 2 - 3); ctx.lineTo(x, h / 2 + 3); ctx.stroke(); }
      for (let j = 0; j <= ny * 5; j++) { const y = j * h / (ny * 5); ctx.beginPath(); ctx.moveTo(w / 2 - 3, y); ctx.lineTo(w / 2 + 3, y); ctx.stroke(); }
    }
    render(fr, untrig) {
      const S = this.S, cv = this.canvas, ctx = this.ctx, dpr = window.devicePixelRatio || 1;
      const w = cv.width, hTot = cv.height, info = Math.round(84 * dpr), h = hTot - info;
      ctx.save(); ctx.clearRect(0, 0, w, hTot);
      this.grid(ctx, w, h, 10, 8);
      const divH = h / 8, divW = w / 10;
      ctx.lineWidth = 1.6 * dpr;
      if (S.xy) {
        const a = fr.ch[0], b = fr.ch[1];
        if (a && b) {
          ctx.strokeStyle = COL[0]; ctx.globalAlpha = 0.8; ctx.beginPath();
          const n = a.length, st = Math.max(1, Math.floor(n / 6000));
          for (let i = 0; i < n; i += st) {
            const x = w / 2 + (a[i] / S.ch[0].vdiv + S.ch[0].pos) * divW, y = h / 2 - (b[i] / S.ch[1].vdiv + S.ch[1].pos) * divH;
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          ctx.stroke(); ctx.globalAlpha = 1;
        } else this.msg(ctx, w, h, 'Modo X-Y: conecta CH1 (eje X) y CH2 (eje Y)');
      } else {
        [0, 1].forEach(i => {
          const y = fr.ch[i]; if (!y) return;
          const c = S.ch[i], n = y.length;
          const Y = v => { const p = h / 2 - (v / c.vdiv + c.pos) * divH; return Math.max(-4, Math.min(h + 4, p)); };
          ctx.strokeStyle = COL[i]; ctx.fillStyle = COL[i];
          ctx.beginPath();
          if (n <= w * 1.5) {
            for (let k = 0; k < n; k++) { const x = k / (n - 1) * w; k ? ctx.lineTo(x, Y(y[k])) : ctx.moveTo(x, Y(y[k])); }
          } else {
            // envolvente mín/máx por columna (como un osciloscopio digital real)
            let prevMax = null;
            for (let px = 0; px < w; px++) {
              const a0 = Math.floor(px * n / w), a1 = Math.max(a0 + 1, Math.floor((px + 1) * n / w));
              let mn = Infinity, mx = -Infinity;
              for (let k = a0; k < a1 && k < n; k++) { if (y[k] < mn) mn = y[k]; if (y[k] > mx) mx = y[k]; }
              if (px === 0) ctx.moveTo(px, Y(mx));
              ctx.lineTo(px, Y(mx)); ctx.lineTo(px, Y(mn));
            }
          }
          ctx.stroke();
          // marcador de nivel 0
          const z = h / 2 - c.pos * divH;
          ctx.beginPath(); ctx.moveTo(0, z - 6 * dpr); ctx.lineTo(9 * dpr, z); ctx.lineTo(0, z + 6 * dpr); ctx.fill();
          ctx.font = `bold ${10 * dpr}px system-ui`; ctx.fillStyle = '#000'; ctx.fillText(i + 1, 1 * dpr, z + 3.5 * dpr);
        });
        // marcadores de disparo
        const tc = S.ch[S.trig.src];
        if (tc.on && tc.probe) {
          const ty = h / 2 - (S.trig.level / tc.vdiv + tc.pos) * divH;
          ctx.fillStyle = '#ff8a3d'; ctx.beginPath(); ctx.moveTo(w, ty - 6 * dpr); ctx.lineTo(w - 9 * dpr, ty); ctx.lineTo(w, ty + 6 * dpr); ctx.fill();
          const tx = (fr.pre / fr.n) * w;
          ctx.beginPath(); ctx.moveTo(tx - 6 * dpr, 0); ctx.lineTo(tx, 9 * dpr); ctx.lineTo(tx + 6 * dpr, 0); ctx.fill();
        }
        if (!fr.ch[0] && !fr.ch[1]) this.msg(ctx, w, h, 'Conecta una sonda: botón "Sonda CH1/CH2" y clic en un borne');
        else if (!this.app.state.power) this.msg(ctx, w, h, 'Módulo APAGADO — enciende POWER');
      }
      // barra de información
      ctx.fillStyle = '#0c1a14'; ctx.fillRect(0, h, w, info);
      ctx.font = `${10.5 * dpr}px ui-monospace, Menlo, Consolas, monospace`;
      let x = 6 * dpr; const y1 = h + 15 * dpr;
      [0, 1].forEach(i => {
        const c = S.ch[i]; ctx.fillStyle = COL[i];
        const txt = `CH${i + 1} ${c.on ? fmtDiv(c.vdiv, 'V') + '/div ' + c.coup : 'OFF'}`;
        ctx.fillText(txt, x, y1); x += ctx.measureText(txt).width + 14 * dpr;
      });
      ctx.fillStyle = '#e6f2ec';
      const tt = `M ${fmtDiv(S.tdiv, 's')}/div   T: CH${S.trig.src + 1} ${S.trig.slope > 0 ? '↑' : '↓'} ${fmtV(S.trig.level)}  ${S.run ? (untrig ? 'AUTO (sin disparo)' : "TRIG'D") : 'STOP'}`;
      ctx.fillText(tt, x, y1);
      // mediciones
      [0, 1].forEach(i => {
        const yy = h + (31 + 26 * i) * dpr, d = fr.ch[i]; ctx.fillStyle = COL[i];
        if (!d) { ctx.fillText(`CH${i + 1}: —`, 6 * dpr, yy); return; }
        const m = measure(d, fr.dt);
        ctx.fillText(`CH${i + 1}: Vpp ${fmtV(m.pp)}  Vmáx ${fmtV(m.max)}  Vmín ${fmtV(m.min)}  Vprom ${fmtV(m.avg)}  Vrms ${fmtV(m.rms)}`, 6 * dpr, yy);
        ctx.fillText(`     f ${m.freq ? fmtF(m.freq) : '—'}   T ${m.period ? fmtT(m.period) : '—'}   duty ${m.duty != null ? (m.duty * 100).toFixed(1) + ' %' : '—'}`, 6 * dpr, yy + 12 * dpr);
      });
      ctx.restore();
    }
    msg(ctx, w, h, t) {
      const dpr = window.devicePixelRatio || 1;
      ctx.font = `${13 * dpr}px system-ui`; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center';
      ctx.fillText(t, w / 2, h / 2 - 30 * dpr); ctx.textAlign = 'left';
    }

    /* ---------------- analizador de espectro ---------------- */
    drawFFT() {
      const S = this.S, def = this.app.cur, cv = this.canvas, ctx = this.ctx, dpr = window.devicePixelRatio || 1;
      const w = cv.width, hTot = cv.height, info = Math.round(64 * dpr), h = hTot - info;
      const ch = S.ch[S.fft.src], span = S.fft.span, N = 16384;
      ctx.clearRect(0, 0, w, hTot); this.grid(ctx, w, h, 10, 10);
      ctx.font = `${11 * dpr}px ui-monospace, Menlo, monospace`;
      if (!ch.probe) { this.msg(ctx, w, h, `Conecta la sonda CH${S.fft.src + 1}: el analizador mide esa señal`); return; }
      if (!S.run && this.fftFrozen) { this.fftPlot(this.fftFrozen); return; }
      const dtS = def.dtMax, fsT = 10 * span, dec = Math.max(1, Math.round(1 / (fsT * dtS))), dtF = dtS * dec;
      const acq = Engine.acquire(def, this.app.state, this.app.cables, [ch.probe], this.simT, this.simT + N * dtF + dtS, dtS);
      const src = acq.data[ch.probe];
      const re = new Float64Array(N), im = new Float64Array(N);
      let wsum = 0;
      for (let k = 0; k < N; k++) {
        let s = 0; for (let j = 0; j < dec; j++) s += src[k * dec + j] || 0;
        const wv = 0.5 - 0.5 * Math.cos(2 * Math.PI * k / (N - 1));
        re[k] = (s / dec) * wv; wsum += wv;
      }
      fft(re, im);
      const fs = 1 / dtF, df = fs / N, mags = new Float64Array(N / 2);
      for (let k = 0; k < N / 2; k++) { const a = 2 * Math.hypot(re[k], im[k]) / wsum; mags[k] = k === 0 ? a / 2 : a; }
      this.fftFrozen = { mags, df, span, ref: S.fft.ref };
      this.fftPlot(this.fftFrozen);
    }
    fftPlot(F) {
      const S = this.S, cv = this.canvas, ctx = this.ctx, dpr = window.devicePixelRatio || 1;
      const w = cv.width, hTot = cv.height, info = Math.round(64 * dpr), h = hTot - info;
      const { mags, df, span } = F, ref = S.fft.ref, range = 100;
      const kMax = Math.min(mags.length - 1, Math.floor(span / df));
      const Y = db => Math.max(0, Math.min(h, (ref - db) / range * h));
      ctx.strokeStyle = COL[S.fft.src]; ctx.lineWidth = 1.4 * dpr; ctx.beginPath();
      for (let px = 0; px < w; px++) {
        const a0 = Math.floor(px * kMax / w), a1 = Math.max(a0 + 1, Math.floor((px + 1) * kMax / w));
        let mx = 1e-9; for (let k = a0; k < a1; k++) if (mags[k] > mx) mx = mags[k];
        const db = 20 * Math.log10(mx);
        px ? ctx.lineTo(px, Y(db)) : ctx.moveTo(px, Y(db));
      }
      ctx.stroke();
      // picos
      const peaks = [];
      for (let k = 2; k < kMax - 1; k++) {
        const m = mags[k];
        if (m > mags[k - 1] && m >= mags[k + 1] && 20 * Math.log10(m) > ref - 70) peaks.push([k, m]);
      }
      peaks.sort((a, b) => b[1] - a[1]);
      const sel = [];
      peaks.forEach(p => { if (sel.length < 8 && sel.every(q => Math.abs(q[0] - p[0]) * df > span / 60)) sel.push(p); });
      ctx.font = `${10 * dpr}px ui-monospace, monospace`; ctx.fillStyle = '#ffffff';
      sel.forEach(([k, m]) => {
        const x = k / kMax * w, y = Y(20 * Math.log10(m));
        ctx.beginPath(); ctx.arc(x, y, 3 * dpr, 0, 7); ctx.fill();
        ctx.fillText(fmtF(k * df), Math.min(x + 4 * dpr, w - 70 * dpr), Math.max(12 * dpr, y - 5 * dpr));
      });
      // escala
      ctx.fillStyle = 'rgba(230,242,236,0.8)';
      for (let j = 0; j <= 10; j += 2) ctx.fillText((ref - j * 10) + ' dBV', 3 * dpr, j * h / 10 + 11 * dpr);
      ctx.fillStyle = '#0c1a14'; ctx.fillRect(0, h, w, info);
      ctx.fillStyle = '#e6f2ec'; ctx.font = `${11 * dpr}px ui-monospace, Menlo, monospace`;
      ctx.fillText(`ANALIZADOR DE ESPECTRO · CH${S.fft.src + 1} · 0 – ${fmtF(span)} (${fmtF(span / 10)}/div) · 10 dB/div · ref ${ref} dBV · RBW ≈ ${fmtF(df * 1.5)}`, 6 * dpr, h + 15 * dpr);
      const list = sel.slice().sort((a, b) => a[0] - b[0]).slice(0, 6).map(([k, m]) => `${fmtF(k * df)}: ${(20 * Math.log10(m)).toFixed(1)} dBV (${fmtV(m)} pico)`);
      ctx.fillStyle = COL[S.fft.src];
      ctx.fillText(list.slice(0, 3).join('   '), 6 * dpr, h + 33 * dpr);
      ctx.fillText(list.slice(3).join('   '), 6 * dpr, h + 49 * dpr);
    }

    /* ---------------- AUTOSET ---------------- */
    autoset() {
      const S = this.S, def = this.app.cur;
      const W = 10 * def.tdivRange[1] * 0.5;
      let dt = Math.max(def.dtMax, W / 200000);
      const ids = S.ch.map(c => c.probe);
      const acq = Engine.acquire(def, this.app.state, this.app.cables, ids.filter(Boolean), this.simT, this.simT + W, dt);
      let fRef = null;
      [0, 1].forEach(i => {
        const c = S.ch[i]; if (!c.probe) return;
        const m = measure(acq.data[c.probe], acq.dt);
        const span = Math.max(Math.abs(m.max), Math.abs(m.min), m.pp / 2, 0.01);
        c.vdiv = VDIV.find(v => v * 3.2 >= span) || 10; c.on = true; c.coup = 'DC';
        c.pos = i === 0 ? (S.ch[1].probe ? 2 : 0) : (S.ch[0].probe ? -2 : 0);
        if (m.freq && (fRef === null || i === S.trig.src)) fRef = m.freq;
        if (i === S.trig.src) S.trig.level = +(((m.max + m.min) / 2).toFixed(2));
      });
      if (fRef) {
        const want = 3 / fRef / 10;
        const list = TDIV.filter(v => v >= def.tdivRange[0] && v <= def.tdivRange[1]);
        S.tdiv = list.find(v => v >= want) || list[list.length - 1];
      }
      S.run = true; this.sync();
    }
  }

  G.Scope = Scope;
  G.ScopeUtil = { fmtV, fmtT, fmtF, measure };
})(window);
