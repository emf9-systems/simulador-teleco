/* =====================================================================
   Aplicación: paneles interactivos, cables, sondas, controles y guías
   ===================================================================== */
(function () {
  'use strict';
  const M = window.Modules;
  const NS = 'http://www.w3.org/2000/svg';
  const CABLE_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00', '#212121', '#eeeeee'];
  const IMG_W = 1600, IMG_H = 720;
  const $ = s => document.querySelector(s);
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  /* ---------------------------- guías ---------------------------- */
  const has = (app, a, b) => app.cables.some(c => (c.a === a && c.b === b) || (c.a === b && c.b === a));
  const netHas = (app, a, b) => { const n = Engine.buildNets(app.cur, app.cables); return n.netOf[a] !== undefined && n.netOf[a] === n.netOf[b]; };
  const probe = (app, ch, id) => app.scope.S.ch[ch].probe === id;
  const probeAny = (app, id) => probe(app, 0, id) || probe(app, 1, id);
  const dataTo = (app, inId) => ['d1', 'd2', 'd3', 'd4'].find(d => netHas(app, d, inId));

  const GUIDES = {
    fsk: [
      { t: 'Enciende el módulo (interruptor POWER, abajo a la izquierda).', ok: a => a.state.power },
      { t: 'Mide el reloj básico: Sonda CH1 en BASIC CLOCK. Pulsa AUTOSET. Debes ver una cuadrada de 10 kHz (T = 100 µs).', ok: a => probeAny(a, 'clk') },
      { t: 'Observa los datos D1…D4 (prueba cada uno con CH1). D1 = 312,5 Hz con duty de 50 %; D2, D3 y D4 tienen periodo de 16 ms con duty de 40 %, 40 % y 20 %.', ok: a => ['d1', 'd2', 'd3', 'd4'].some(d => probeAny(a, d)) },
      { t: 'Cable de D1 a DATA INPUT (la señal moduladora).', ok: a => !!dataTo(a, 'data_in') },
      { t: 'Moduladora en CH1 (D1) y modulada en CH2 (FSK OUTPUT). Trigger en CH1. Con "1" la salida va a 5 kHz y con "0" a 1,25 kHz.', ok: a => probe(a, 0, dataTo(a, 'data_in') || 'd1') && probe(a, 1, 'fsk_out') },
      { t: 'Analizador de espectro sobre FSK OUTPUT (pestaña "Analizador de espectro", señal CH2). Aparecen 1,25 kHz y 5 kHz y sus armónicos impares (es una señal cuadrada), con bandas laterales separadas por la frecuencia de los datos.', ok: a => a.scope.view === 'fft' },
      { t: 'Repite con otra moduladora (D2, D3 o D4) y compara.', ok: a => ['d2', 'd3', 'd4'].some(d => netHas(a, d, 'data_in')) },
      { t: 'Demodulación: cable de FSK OUTPUT a FSK INPUT. Pon CH2 en DATA OUTPUT.', ok: a => netHas(a, 'fsk_out', 'fsk_in') && probeAny(a, 'data_out') },
      { t: 'Ajusta P1 (frecuencia central del filtro pasabanda) y P2 (umbral del comparador) hasta que DATA OUTPUT sea igual al dato. Activa los puntos de prueba internos para ver el filtro, el rectificador y el pasabajos.', ok: a => netHas(a, 'fsk_out', 'fsk_in') && probeAny(a, 'data_out') && (a.state.knobs.p1 !== 0.7 || a.state.knobs.p2 !== 0.2) }
    ],
    psk: [
      { t: 'Enciende el módulo (POWER).', ok: a => a.state.power },
      { t: 'Mide la portadora: CH1 en CARRIER OUTPUT y pulsa AUTOSET. Es una senoide de ≈ 5 Vpp a ≈ 22 kHz.', ok: a => probeAny(a, 'car_out') },
      { t: 'Cable de CARRIER OUTPUT a CARRIER INPUT del modulador.', ok: a => netHas(a, 'car_out', 'mod_car_in') },
      { t: 'Cable de D1 a DATA INPUT del modulador.', ok: a => !!dataTo(a, 'mod_data_in') },
      { t: 'CH1 en el dato (D1) y CH2 en PSK O/P, con trigger en CH1. Fíjate en el salto de fase de 180° en cada cambio de bit.', ok: a => probeAny(a, 'psk_out') && probeAny(a, dataTo(a, 'mod_data_in') || 'd1') },
      { t: 'Analizador de espectro sobre PSK O/P: la portadora queda suprimida y aparecen bandas laterales a fc ± (múltiplos impares de la frecuencia fundamental del dato).', ok: a => a.scope.view === 'fft' },
      { t: 'Prueba otra moduladora (D2, D3 o D4).', ok: a => ['d2', 'd3', 'd4'].some(d => netHas(a, d, 'mod_data_in')) },
      { t: 'Demodulación: cable de PSK O/P a PSK INPUT, y de CARRIER OUTPUT a CARRIER INPUT del demodulador (la referencia coherente).', ok: a => netHas(a, 'psk_out', 'dem_psk_in') && netHas(a, 'car_out', 'dem_car_in') },
      { t: 'CH1 en el dato y CH2 en DEMOD. OUTPUT: deben coincidir. Prueba a quitar el cable de la portadora del demodulador y mira qué pasa.', ok: a => probeAny(a, 'demod_out') }
    ],
    qam: [
      { t: 'Comprueba las 4 portadoras: CH1 en 0° SIN1 y CH2 en 90° SIN2 (luego SIN3 y SIN4). Mide el desfase: 90° = 0,5 µs a 500 kHz. Prueba el modo X-Y: con 90° se ve un círculo, con 180° una recta.', ok: a => probeAny(a, 'sin1') && (probeAny(a, 'sin2') || probeAny(a, 'sin3') || probeAny(a, 'sin4')) },
      { t: 'Observa S-CLK y S-DATA (dispara con CH1 = S-CLK o SYNC CLK). Cambia los switches SW1, SW2 y SW3 y mira cómo cambia la trama de 24 bits.', ok: a => probeAny(a, 'sdata') },
      { t: 'Conexionado de la guía: S-DATA → NRZ-L IN, NRZ-L OUT → DATA (tribit), S-CLK → CLK (tribit).', ok: a => netHas(a, 'sdata', 'nrz_in') && netHas(a, 'nrz_out', 'tb_data') && netHas(a, 'sclk', 'tb_clk') },
      { t: 'Bits del tribit al modulador: I-BIT → C I/P-1, Q-BIT → C I/P-2, C-BIT → C I/P-3.', ok: a => netHas(a, 'ibit', 'cip1') && netHas(a, 'qbit', 'cip2') && netHas(a, 'cbit', 'cip3') },
      { t: 'Portadoras al modulador: SIN1 → IN/P-1, SIN2 → IN/P-2, SIN3 → IN/P-3, SIN4 → IN/P-4.', ok: a => netHas(a, 'sin1', 'inp1') && netHas(a, 'sin2', 'inp2') && netHas(a, 'sin3', 'inp3') && netHas(a, 'sin4', 'inp4') },
      { t: 'CH1 en SYNC CLK (trigger) y CH2 en MOD OUTPUT. Verás 8 símbolos distintos: 4 fases × 2 amplitudes, cada uno de 12 µs (6 ciclos de portadora).', ok: a => probeAny(a, 'mod_out') },
      { t: 'Espectro de MOD OUTPUT: lóbulo centrado en 500 kHz con nulos a ± la tasa de símbolos (83,3 kHz) y líneas separadas 1/96 µs ≈ 10,4 kHz porque la trama se repite.', ok: a => a.scope.view === 'fft' && probeAny(a, 'mod_out') },
      { t: 'DQAM (opcional): I-BIT → DIFF. ENCODER-1 IN, DE-1 OUT → C I/P-1; Q-BIT → DIFF. ENCODER-2 IN, DE-2 OUT → C I/P-2. Luego prueba los SWITCH FAULTS (SW4).', ok: a => netHas(a, 'de1_out', 'cip1') || netHas(a, 'de2_out', 'cip2') }
    ]
  };
  const AUTOWIRE = {
    fsk: { cables: [['d1', 'data_in'], ['fsk_out', 'fsk_in']], probes: ['d1', 'fsk_out'], power: true },
    psk: { cables: [['car_out', 'mod_car_in'], ['d1', 'mod_data_in'], ['psk_out', 'dem_psk_in'], ['car_out', 'dem_car_in']], probes: ['d1', 'psk_out'], power: true },
    qam: { cables: [['sdata', 'nrz_in'], ['nrz_out', 'tb_data'], ['sclk', 'tb_clk'], ['ibit', 'cip1'], ['qbit', 'cip2'], ['cbit', 'cip3'], ['sin1', 'inp1'], ['sin2', 'inp2'], ['sin3', 'inp3'], ['sin4', 'inp4']], probes: ['sync', 'mod_out'], power: true }
  };

  /* ---------------------------- app ---------------------------- */
  const App = {
    states: {}, cablesBy: {}, view: 'module', mode: 'cable', color: 0, pending: null, selJack: null,
    get cables() { return this.cablesBy[this.cur.id]; },
    set cables(v) { this.cablesBy[this.cur.id] = v; },
    jack(id) { return this.cur.jacks.find(j => j.id === id); },

    init() {
      M.list.forEach(d => {
        this.states[d.id] = JSON.parse(JSON.stringify(d.defaults)); this.states[d.id].tReset = 0;
        this.cablesBy[d.id] = [];
      });
      this.load();
      this.cur = M.fsk; this.state = this.states.fsk;
      this.scope = new Scope(this, $('#scope'));
      // toolbar
      document.querySelectorAll('.modes button').forEach(b => b.onclick = () => this.setMode(b.dataset.mode));
      const cc = $('.colors');
      CABLE_COLORS.forEach((c, i) => { const s = document.createElement('span'); s.style.background = c; s.onclick = () => { this.color = i; this.paintColors(); }; cc.appendChild(s); });
      this.paintColors();
      $('#showTP').onchange = () => this.drawPanel();
      $('#btnClear').onclick = () => { if (confirmClear()) { this.cables = []; this.afterChange(); } };
      $('#btnAutoWire').onclick = () => this.autoWire();
      document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => this.go(b.dataset.tab));
      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.key === 'Escape') { this.pending = null; this.drawPanel(); }
        if (e.key === '1') this.setMode('p0'); if (e.key === '2') this.setMode('p1'); if (e.key === 'c') this.setMode('cable');
      });
      const h = (location.hash || '#fsk').slice(1);
      this.go(['fsk', 'psk', 'qam', 'study', 'quiz', 'help'].includes(h) ? h : 'fsk');
      window.addEventListener('hashchange', () => { const t = location.hash.slice(1); if (t && t !== this._tab) this.go(t); });
      setInterval(() => this.updateGuide(), 700);
    },
    paintColors() { document.querySelectorAll('.colors span').forEach((s, i) => s.classList.toggle('sel', i === this.color)); },
    setMode(m) { this.mode = m; this.pending = null; document.querySelectorAll('.modes button').forEach(b => b.classList.toggle('active', b.dataset.mode === m)); this.drawPanel(); },

    go(tab) {
      this._tab = tab;
      document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      ['moduleView', 'studyView', 'quizView', 'helpView'].forEach(v => $('#' + v).hidden = true);
      history.replaceState(null, '', '#' + tab);
      if (M[tab]) {
        this.view = 'module'; this.cur = M[tab]; this.state = this.states[tab];
        $('#moduleView').hidden = false;
        this.pending = null; this.selJack = null;
        const S = this.scope.S;
        if (!S.ch[0].probe && !S.ch[1].probe && !this.cables.length) { /* sin sondas al inicio */ }
        this.drawPanel(); this.drawControls(); this.scope.sync(); this.drawGuide(); this.showJack(null);
        this.scope.resize();
      } else {
        this.view = tab;
        $('#' + tab + 'View').hidden = false;
        Study.render(tab, $('#' + tab + 'View'));
      }
      window.scrollTo(0, 0);
    },

    /* ---------------- panel SVG ---------------- */
    drawPanel() {
      const svg = $('#panel'), d = this.cur, vb = d.viewBox;
      svg.setAttribute('viewBox', vb.join(' '));
      svg.innerHTML = '';
      el('image', { href: d.image, x: 0, y: 0, width: IMG_W, height: IMG_H, preserveAspectRatio: 'none' }, svg);
      const showTP = $('#showTP').checked;
      const used = new Set(); this.cables.forEach(c => { used.add(c.a); used.add(c.b); });
      // controles
      d.controls.forEach(c => this.drawCtrl(svg, c));
      // capas: cables debajo, bornes encima (para poder hacer clic en un borne que ya tiene cable)
      const layerC = el('g', {}, svg);
      const layerJ = el('g', {}, svg);
      d.jacks.forEach(j => {
        const g = el('g', { class: 'jack' + (j.dir === 'tp' ? ' tp' : '') + (j.dir === 'tp' && !showTP ? ' hidden' : '') + (used.has(j.id) ? ' used' : '') + (this.pending === j.id || this.selJack === j.id ? ' sel' : ''), 'data-id': j.id }, layerJ);
        el('circle', { class: 'hit', cx: j.x, cy: j.y, r: j.dir === 'tp' ? 9 : (d.id === 'qam' ? 13 : 17) }, g);
        g.addEventListener('mouseenter', e => this.tip(j, e));
        g.addEventListener('mousemove', e => this.tipMove(e));
        g.addEventListener('mouseleave', () => this.tip(null));
        g.addEventListener('click', e => { e.stopPropagation(); this.clickJack(j); });
      });
      // cables
      this.cables.forEach((c, i) => {
        const a = this.jack(c.a), b = this.jack(c.b); if (!a || !b) return;
        const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy), sag = 30 + dist * 0.25;
        const p = `M${a.x},${a.y} C${a.x + dx * 0.15},${a.y + sag} ${b.x - dx * 0.15},${b.y + sag} ${b.x},${b.y}`;
        const col = CABLE_COLORS[c.color % CABLE_COLORS.length];
        const path = el('path', { class: 'cable', d: p, stroke: col, 'stroke-width': 6.5, 'stroke-opacity': 0.92 }, layerC);
        const t = document.createElementNS(NS, 'title'); t.textContent = `${a.label} ↔ ${b.label} (clic para quitar)`; path.appendChild(t);
        path.addEventListener('click', e => { e.stopPropagation(); this.cables.splice(i, 1); this.afterChange(); });
        [a, b].forEach(j => { el('circle', { class: 'plug', cx: j.x, cy: j.y, r: 8, fill: col, stroke: '#111', 'stroke-width': 2 }, layerC); });
      });
      // sondas
      const S = this.scope.S, pc = ['#ffd84a', '#3fe0ff'];
      S.ch.forEach((c, i) => {
        const j = c.probe && this.jack(c.probe); if (!j) return;
        const ox = i ? 26 : -26;
        el('line', { x1: j.x, y1: j.y, x2: j.x + ox, y2: j.y - 34, stroke: pc[i], 'stroke-width': 4, class: 'plug' }, svg);
        el('circle', { cx: j.x, cy: j.y, r: 5, fill: pc[i], class: 'plug' }, svg);
        const r = el('rect', { x: j.x + ox - 22, y: j.y - 52, width: 44, height: 20, rx: 5, fill: pc[i], class: 'plug' }, svg);
        const tx = el('text', { x: j.x + ox, y: j.y - 37, 'text-anchor': 'middle', fill: '#000', class: 'probeTag' }, svg); tx.textContent = 'CH' + (i + 1);
      });
      // cable pendiente
      if (this.pending) {
        const j = this.jack(this.pending);
        this.rubber = el('line', { x1: j.x, y1: j.y, x2: j.x, y2: j.y, stroke: CABLE_COLORS[this.color], 'stroke-width': 5, 'stroke-dasharray': '10 6', 'pointer-events': 'none' }, svg);
        svg.onmousemove = e => { const p = this.svgPt(e); this.rubber.setAttribute('x2', p.x); this.rubber.setAttribute('y2', p.y); };
      } else svg.onmousemove = null;
      svg.onclick = () => { if (this.pending) { this.pending = null; this.drawPanel(); } };
      // power apagado: velo
      if (!this.state.power) el('rect', { x: vb[0], y: vb[1], width: vb[2], height: vb[3], fill: 'rgba(0,0,0,0.25)', 'pointer-events': 'none' }, svg);
      this.status();
    },
    svgPt(e) { const svg = $('#panel'), p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); },
    drawCtrl(svg, c) {
      const s = this.state, g = el('g', { class: 'ctrl' }, svg);
      const t = document.createElementNS(NS, 'title'); t.textContent = c.label; g.appendChild(t);
      if (c.type === 'power') {
        el('rect', { class: 'hl', x: c.x, y: c.y, width: c.w, height: c.h, rx: 6 }, g);
        const on = s.power;
        el('rect', { x: c.x + c.w + 4, y: c.y + c.h / 2 - 13, width: 46, height: 26, rx: 13, fill: on ? '#3ddc84' : '#b33', stroke: '#000', 'pointer-events': 'none' }, g);
        const tx = el('text', { x: c.x + c.w + 27, y: c.y + c.h / 2 + 5, 'text-anchor': 'middle', fill: on ? '#012' : '#fff', 'font-size': 14, 'font-weight': 700, 'pointer-events': 'none' }, g); tx.textContent = on ? 'ON' : 'OFF';
        g.onclick = e => { e.stopPropagation(); s.power = !s.power; this.afterChange(true); };
      } else if (c.type === 'knob') {
        const v = s.knobs[c.id], ang = (-135 + 270 * v) * Math.PI / 180;
        el('circle', { class: 'hl', cx: c.x, cy: c.y, r: c.r }, g);
        el('line', { x1: c.x, y1: c.y, x2: c.x + Math.sin(ang) * c.r * 0.85, y2: c.y - Math.cos(ang) * c.r * 0.85, stroke: '#ffd84a', 'stroke-width': c.r > 30 ? 6 : 4, 'stroke-linecap': 'round', 'pointer-events': 'none' }, g);
        const set = nv => { s.knobs[c.id] = Math.max(0, Math.min(1, nv)); this.afterChange(true); };
        g.addEventListener('wheel', e => { e.preventDefault(); set(s.knobs[c.id] - Math.sign(e.deltaY) * 0.02); }, { passive: false });
        g.addEventListener('pointerdown', e => {
          e.preventDefault(); e.stopPropagation(); const y0 = e.clientY, v0 = s.knobs[c.id];
          const mv = ev => { s.knobs[c.id] = Math.max(0, Math.min(1, v0 + (y0 - ev.clientY) / 250)); this.drawControls(); this.scope.dirty = true; this.status(); };
          const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); this.afterChange(true); };
          window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
        });
      } else if (c.type === 'dip' || c.type === 'faults') {
        el('rect', { class: 'hl', x: c.x, y: c.y, width: c.w, height: c.h, rx: 4 }, g);
        g.onclick = e => { e.stopPropagation(); $('#controlsCard').scrollIntoView({ behavior: 'smooth', block: 'center' }); flash($('#controlsCard')); };
      } else if (c.type === 'button') {
        el('circle', { class: 'hl', cx: c.x, cy: c.y, r: c.r }, g);
        g.onclick = e => { e.stopPropagation(); s.tReset = this.scope.simT; this.afterChange(true); flash($('#statusbar')); this.say('RESET: el generador de datos reinicia la trama desde el bit 1.'); };
      }
    },

    clickJack(j) {
      if (this.mode === 'p0' || this.mode === 'p1') {
        const ch = this.mode === 'p0' ? 0 : 1;
        this.scope.setProbe(ch, j.id);
        this.selJack = j.id; this.showJack(j); this.drawPanel(); this.save();
        return;
      }
      if (j.dir === 'tp') { this.say('Los puntos de prueba internos solo se pueden medir con la sonda (no admiten cables).'); this.selJack = j.id; this.showJack(j); this.drawPanel(); return; }
      if (!this.pending) { this.pending = j.id; this.selJack = j.id; this.showJack(j); this.drawPanel(); this.say(`Cable desde <b>${j.label}</b>: ahora haz clic en el borne de destino (Esc para cancelar).`); return; }
      if (this.pending === j.id) { this.pending = null; this.drawPanel(); return; }
      const a = this.pending; this.pending = null;
      if (!has(this, a, j.id)) this.cables.push({ a, b: j.id, color: this.color });
      this.color = (this.color + 1) % CABLE_COLORS.length; this.paintColors();
      this.afterChange();
    },
    afterChange(ctrlOnly) {
      this.drawPanel(); this.drawControls(); this.scope.frozen = null; this.scope.fftFrozen = null; this.scope.dirty = true; this.save(); this.updateGuide();
      if (this.selJack) this.showJack(this.jack(this.selJack));
    },
    autoWire() {
      const w = AUTOWIRE[this.cur.id];
      this.cables = w.cables.map(([a, b], i) => ({ a, b, color: i }));
      if (w.power) this.state.power = true;
      this.scope.S.ch[0].probe = w.probes[0]; this.scope.S.ch[1].probe = w.probes[1];
      this.scope.S.trig.src = 0;
      this.afterChange(); this.scope.autoset();
    },

    /* ---------------- info y tooltips ---------------- */
    jackText(j) {
      const nets = Engine.buildNets(this.cur, this.cables), net = nets.netOf[j.id];
      let conn = '';
      if (net !== undefined) {
        const others = nets.members[net].filter(x => x !== j.id).map(x => this.jack(x).label);
        conn = `<div><b>Conectado a:</b> ${others.join(', ')}</div>`;
        if (nets.drivers[net].length > 1) conn += `<div class="warn">⚠ Hay ${nets.drivers[net].length} salidas unidas en este cable (en el equipo real esto es un cortocircuito entre salidas).</div>`;
      } else if (j.dir === 'in') conn = '<div class="muted">Entrada sin conectar (al aire).</div>';
      const kind = { in: 'Entrada', out: 'Salida', gnd: 'Tierra', tp: 'Punto de prueba interno' }[j.dir];
      return `<div><b>${j.label}</b> <span class="muted">· ${kind}</span></div><div>${j.desc}</div><div><b>Qué deberías medir:</b> ${j.expect}</div>${conn}`;
    },
    tip(j, e) {
      const t = $('#tip');
      if (!j) { t.hidden = true; return; }
      t.innerHTML = this.jackText(j); t.hidden = false; this.tipMove(e);
    },
    tipMove(e) {
      const t = $('#tip'), r = $('.panelWrap').getBoundingClientRect();
      let x = e.clientX - r.left + 16, y = e.clientY - r.top + 16;
      if (x + 340 > r.width) x = Math.max(4, e.clientX - r.left - 340);
      if (y + t.offsetHeight > r.height) y = Math.max(4, e.clientY - r.top - t.offsetHeight - 10);
      t.style.left = x + 'px'; t.style.top = y + 'px';
    },
    showJack(j) {
      const box = $('#jackInfo');
      if (!j) { box.innerHTML = 'Pasa el mouse sobre un borne (círculo) para ver qué señal hay ahí. Haz clic para seleccionarlo.<br><br><b>Cómo se usa:</b><br>• <b>Cable</b>: clic en un borne y luego en otro. Clic sobre un cable para quitarlo.<br>• <b>Sonda CH1 / CH2</b>: clic en el borne que quieres medir (teclas 1 y 2).<br>• Las perillas se giran arrastrando hacia arriba o abajo, con la rueda del mouse o con los deslizadores de "Controles".'; box.className = 'muted'; return; }
      box.className = ''; box.innerHTML = this.jackText(j) + `<div class="row"><button data-p="0"><span class="dot y"></span>Medir con CH1</button><button data-p="1"><span class="dot c"></span>Medir con CH2</button></div>`;
      box.querySelectorAll('button').forEach(b => b.onclick = () => { this.scope.setProbe(+b.dataset.p, j.id); this.drawPanel(); this.save(); });
    },
    say(html) { $('#statusbar').innerHTML = html; clearTimeout(this._sayT); this._sayT = setTimeout(() => this.status(), 6000); },
    status() {
      const nets = Engine.buildNets(this.cur, this.cables);
      const shorts = Object.values(nets.drivers).filter(d => d.length > 1);
      let s = `${this.cur.name} · ${this.state.power ? '<span style="color:#3ddc84">ENCENDIDO</span>' : '<span class="warn">APAGADO</span>'} · ${this.cables.length} cable(s)`;
      if (shorts.length) s += ` · <span class="warn">⚠ salidas unidas: ${shorts.map(d => d.map(x => this.jack(x).label).join(' + ')).join('; ')}</span>`;
      if (this.cur.id === 'qam') { const f = Object.keys(this.state.switches).filter(k => k.startsWith('sw4_') && this.state.switches[k]); if (f.length) s += ` · <span class="warn">FALLAS activas: ${f.map(k => 'F' + k.slice(4)).join(', ')}</span>`; }
      $('#statusbar').innerHTML = s;
    },

    /* ---------------- controles laterales ---------------- */
    drawControls() {
      const box = $('#controls'), d = this.cur, s = this.state;
      let h = `<div class="ctlItem"><button class="pwr ${s.power ? 'on' : 'off'}" id="cPwr">POWER: ${s.power ? 'ON' : 'OFF'}</button></div>`;
      if (d.id === 'qam') h = `<div class="ctlItem muted small">El kit QAM se alimenta con su fuente externa (siempre encendido aquí).</div>`;
      d.controls.filter(c => c.type === 'knob').forEach(c => {
        h += `<div class="ctlItem"><div class="lbl"><span>${c.label}</span><b>${Math.round(s.knobs[c.id] * 100)} %</b></div><input type="range" min="0" max="1" step="0.005" value="${s.knobs[c.id]}" data-k="${c.id}"><div class="muted small">${c.info(s.knobs[c.id])}</div></div>`;
      });
      if (d.id === 'qam') {
        h += `<div class="ctlItem"><div class="lbl"><span>Generador de datos (ON = 1)</span></div>`;
        for (let w = 1; w <= 3; w++) {
          h += `<div class="dipRow"><span class="name">SW${w}</span>`;
          for (let i = 1; i <= 8; i++) { const on = s.switches[`sw${w}_${i}`]; h += `<button class="dip ${on ? 'on' : 'off'}" data-sw="sw${w}_${i}" title="bit ${(w - 1) * 8 + i}"><i></i>${i}</button>`; }
          h += `</div>`;
        }
        h += `<div class="row"><button id="pAll">Los 8 tribits</button><button id="pAlt">1010…</button><button id="pZero">Todo 0</button><button id="pOne">Todo 1</button><button id="pRnd">Aleatorio</button></div></div>`;
        h += `<div class="ctlItem"><div class="lbl"><span>SW4 · SWITCH FAULTS</span></div><div class="dipRow">`;
        for (let k = 1; k <= 4; k++) { const on = s.switches['sw4_' + k]; h += `<button class="dip ${on ? 'on' : 'off'}" data-sw="sw4_${k}" title="${d.faults[k - 1]}"><i></i>${k}</button>`; }
        h += `</div><div class="muted small">${d.faults.map((f, i) => (s.switches['sw4_' + (i + 1)] ? '<b style="color:#ffb547">● ' : '○ ') + f + (s.switches['sw4_' + (i + 1)] ? '</b>' : '')).join('<br>')}<br><i>Fallas simuladas (didácticas): las del kit real pueden ser otras; revisa el manual del laboratorio.</i></div></div>`;
        h += `<div class="ctlItem"><button id="cReset">RESET KEY (reinicia la trama)</button></div>`;
        // tabla de tribits
        const fr = d.frame(s); h += `<div class="ctlItem"><div class="lbl"><span>Trama actual → símbolos 8-QAM</span></div><table class="tribitTable"><tr><th>Símb.</th><th>I</th><th>Q</th><th>C</th><th>Fase</th><th>Amplitud</th></tr>`;
        for (let k = 0; k < 8; k++) { const I = fr[3 * k], Q = fr[3 * k + 1], C = fr[3 * k + 2], r = d.table(I, Q, C); h += `<tr><td>${k + 1}</td><td>${I}</td><td>${Q}</td><td>${C}</td><td>${r.phase}°</td><td>${C ? 'alta (1,0)' : 'baja (0,41)'}</td></tr>`; }
        h += `</table><div class="muted small">Sin codificación diferencial. Con DQAM, I y Q pasan antes por los codificadores diferenciales.</div></div>`;
      }
      box.innerHTML = h;
      const p = box.querySelector('#cPwr'); if (p) p.onclick = () => { s.power = !s.power; this.afterChange(true); };
      box.querySelectorAll('input[data-k]').forEach(r => r.oninput = () => { s.knobs[r.dataset.k] = +r.value; this.drawPanel(); this.scope.dirty = true; this.scope.frozen = null; r.parentElement.querySelector('b').textContent = Math.round(+r.value * 100) + ' %'; r.parentElement.querySelector('.small').textContent = d.controls.find(c => c.id === r.dataset.k).info(+r.value); this.save(); });
      box.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { s.switches[b.dataset.sw] = !s.switches[b.dataset.sw]; this.afterChange(true); });
      const setFrame = bits => { bits.forEach((b, i) => s.switches[`sw${1 + Math.floor(i / 8)}_${1 + i % 8}`] = !!b); this.afterChange(true); };
      const q = id => box.querySelector(id);
      if (q('#pAll')) {
        q('#pAll').onclick = () => setFrame('000001010011100101110111'.split('').map(Number));
        q('#pAlt').onclick = () => setFrame(Array.from({ length: 24 }, (_, i) => (i + 1) % 2));
        q('#pZero').onclick = () => setFrame(Array(24).fill(0));
        q('#pOne').onclick = () => setFrame(Array(24).fill(1));
        q('#pRnd').onclick = () => setFrame(Array.from({ length: 24 }, () => Math.random() < 0.5 ? 1 : 0));
        q('#cReset').onclick = () => { s.tReset = this.scope.simT; this.afterChange(true); };
      }
    },

    /* ---------------- guía ---------------- */
    drawGuide() {
      const g = GUIDES[this.cur.id];
      $('#guide').innerHTML = g.map((s, i) => `<li data-i="${i}">${s.t}</li>`).join('');
      this.updateGuide();
    },
    updateGuide() {
      if (this.view !== 'module') return;
      const g = GUIDES[this.cur.id];
      document.querySelectorAll('#guide li').forEach(li => { let ok = false; try { ok = g[+li.dataset.i].ok(this); } catch (e) { } li.classList.toggle('done', !!ok); });
    },

    /* ---------------- persistencia ---------------- */
    save() {
      try {
        const sc = {}; for (const k in this.scope.settings) sc[k] = this.scope.settings[k];
        localStorage.setItem('simTeleco_v1', JSON.stringify({ states: this.states, cables: this.cablesBy, scope: sc }));
      } catch (e) { }
    },
    load() {
      try {
        const d = JSON.parse(localStorage.getItem('simTeleco_v1') || 'null'); if (!d) return;
        for (const k in d.states) if (this.states[k]) { Object.assign(this.states[k].knobs, d.states[k].knobs); Object.assign(this.states[k].switches, d.states[k].switches); this.states[k].power = d.states[k].power; }
        for (const k in d.cables) if (this.cablesBy[k]) this.cablesBy[k] = d.cables[k];
        this._scopeSaved = d.scope;
      } catch (e) { }
    }
  };
  function confirmClear() { return true; }
  function flash(e) { e.animate([{ boxShadow: '0 0 0 3px #ffd84a' }, { boxShadow: '0 0 0 0 transparent' }], { duration: 900 }); }

  window.App = App;
  window.addEventListener('DOMContentLoaded', () => {
    App.init();
    if (App._scopeSaved) { Object.assign(App.scope.settings, App._scopeSaved); App.scope.sync(); App.drawPanel(); }
  });
})();
