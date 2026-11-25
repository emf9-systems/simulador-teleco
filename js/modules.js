/* =====================================================================
   Definición de los 3 módulos TESCA: bornes, controles y circuito
   Coordenadas (x, y) en píxeles de la foto de cada panel.
   ===================================================================== */
(function (G) {
  'use strict';
  const E = G.Engine;
  const { mod, frac, biquad, runBiquad, rcLowpass } = E;
  const H = 4.2;  // nivel alto TTL típico medido (V)

  const fmtF = f => f >= 1e6 ? (f / 1e6).toFixed(3).replace(/\.?0+$/, '') + ' MHz' : f >= 1e3 ? (f / 1e3).toFixed(3).replace(/\.?0+$/, '') + ' kHz' : f.toFixed(2).replace(/\.?0+$/, '') + ' Hz';

  function dc(v) { return c => c.constant(v); }
  function fromT(fn) { return c => { const a = new Float32Array(c.n), t = c.t; for (let i = 0; i < c.n; i++) a[i] = fn(t[i]); return a; }; }

  /* =================================================================
     MÓDULO FSK — TESCA 40506
     ================================================================= */
  const FSK_CLK = 10000;          // reloj básico (555) nominal: 10 kHz
  const fsk = {
    id: 'fsk', name: 'FSK — TESCA 40506', short: 'FSK',
    image: 'img/fsk.jpg', viewBox: [255, 12, 1095, 705], theme: 'dark',
    dtMin: 1e-6, dtMax: 2e-6, warm: 0.006, align: 0,
    tdivRange: [5e-6, 20e-3], tdivDefault: 500e-6,
    defaults: { power: false, knobs: { p1: 0.7, p2: 0.2 }, switches: {} },
    jacks: [
      { id: 'clk', label: 'BASIC CLOCK (10 kHz)', x: 530, y: 220, dir: 'out',
        desc: 'Salida del 555 (IC1) en modo astable. Es el reloj base de todo el modulador.',
        expect: 'Onda cuadrada TTL 0 a ~4,2 V, 10 kHz (T = 100 µs), duty ≈ 50 %. Teórico 1,44/((R1+2R2)·C1) ≈ 10,6 kHz.' },
      { id: 'gnd1', label: 'GND (reloj)', x: 530, y: 330, dir: 'gnd', desc: 'Tierra del circuito.', expect: '0 V' },
      { id: 'v5', label: '+5V (INT.)', x: 788, y: 172, dir: 'out', desc: 'Fuente interna de +5 V que alimenta la lógica TTL.', expect: 'Continua +5 V (con acople DC).' },
      { id: 'd1', label: 'DATA D1', x: 881, y: 170, dir: 'out',
        desc: 'Salida QA (pin 12) del contador decimal 7490, que cuenta los pulsos de 625 Hz (QD del 74163).',
        expect: 'Cuadrada 312,5 Hz (T = 3,2 ms), duty 50 %, 0 a ~4,2 V.' },
      { id: 'd2', label: 'DATA D2', x: 883, y: 228, dir: 'out',
        desc: 'Salida QB (pin 9) del 7490. En la secuencia BCD 0-9 queda en 1 en las cuentas 2,3,6,7.',
        expect: 'Periodo 16 ms (62,5 Hz), patrón 0011001100 → dos pulsos de 3,2 ms por ciclo, duty 40 %.' },
      { id: 'd3', label: 'DATA D3', x: 884, y: 285, dir: 'out',
        desc: 'Salida QC (pin 8) del 7490. En 1 durante las cuentas 4,5,6,7.',
        expect: 'Periodo 16 ms (62,5 Hz), un pulso de 6,4 ms en alto, duty 40 %.' },
      { id: 'd4', label: 'DATA D4', x: 886, y: 342, dir: 'out',
        desc: 'Salida QD (pin 11) del 7490. En 1 solo durante las cuentas 8 y 9.',
        expect: 'Periodo 16 ms (62,5 Hz), pulso de 3,2 ms en alto, duty 20 %.' },
      { id: 'data_in', label: 'DATA INPUT', x: 1065, y: 128, dir: 'in',
        desc: 'Entrada de datos del modulador (compuertas NAND IC4-7400 que funcionan como multiplexor 2:1).',
        expect: 'Aquí se conecta D1…D4. Si queda al aire, la entrada TTL se lee como "1".' },
      { id: 'fsk_out', label: 'FSK OUTPUT', x: 1209, y: 207, dir: 'out',
        desc: 'Salida del modulador FSK. Con dato "1" sale la frecuencia del pin 14 del 74163 (QA = 5 kHz); con dato "0" la del pin 12 (QC = 1,25 kHz).',
        expect: 'Cuadrada TTL que alterna entre 5 kHz (marca, "1") y 1,25 kHz (espacio, "0"). Δf = 1,875 kHz, fc central = 3,125 kHz.' },
      { id: 'gnd2', label: 'GND (FSK out)', x: 1216, y: 307, dir: 'gnd', desc: 'Tierra.', expect: '0 V' },
      { id: 'fsk_in', label: 'FSK INPUT (demod.)', x: 428, y: 466, dir: 'in',
        desc: 'Entrada del demodulador: filtro pasabanda activo IC5-A (MFB) sintonizable con P1.',
        expect: 'Conectar aquí FSK OUTPUT.' },
      { id: 'gnd3', label: 'GND (FSK in)', x: 428, y: 585, dir: 'gnd', desc: 'Tierra de la entrada.', expect: '0 V' },
      { id: 'v12', label: '+12V (INT.)', x: 1153, y: 487, dir: 'out', desc: 'Fuente +12 V de los amplificadores operacionales.', expect: '+12 V continua' },
      { id: 'vm12', label: '-12V (INT.)', x: 1162, y: 582, dir: 'out', desc: 'Fuente −12 V de los amplificadores operacionales.', expect: '−12 V continua' },
      { id: 'data_out', label: 'DATA OUTPUT', x: 1229, y: 440, dir: 'out',
        desc: 'Salida del comparador IC5-D recortada por el zener ZD1 de 5,1 V.',
        expect: 'Datos recuperados: ~5,1 V en "1" y ~−0,7 V en "0". Debe ser igual al dato aplicado (con un pequeño retardo) si P1 y P2 están bien ajustados.' },
      { id: 'gnd4', label: 'GND (data out)', x: 1236, y: 546, dir: 'gnd', desc: 'Tierra.', expect: '0 V' },
      // Puntos de prueba internos (solo para sonda)
      { id: 'tp_qa', label: 'TP · IC2-74163 pin 14 (QA)', x: 812, y: 207, dir: 'tp', desc: 'Salida QA del contador 74163 = reloj ÷ 2. Es la frecuencia de MARCA del FSK.', expect: 'Cuadrada 5 kHz.' },
      { id: 'tp_qc', label: 'TP · IC2-74163 pin 12 (QC)', x: 812, y: 232, dir: 'tp', desc: 'Salida QC del 74163 = reloj ÷ 8. Es la frecuencia de ESPACIO del FSK.', expect: 'Cuadrada 1,25 kHz.' },
      { id: 'tp_qd', label: 'TP · IC2-74163 pin 11 (QD)', x: 812, y: 256, dir: 'tp', desc: 'Salida QD del 74163 = reloj ÷ 16; es el reloj del 7490.', expect: 'Cuadrada 625 Hz.' },
      { id: 'tp_bpf', label: 'TP · IC5-A pin 1 (pasabanda)', x: 690, y: 478, dir: 'tp', desc: 'Salida del filtro pasabanda MFB (ganancia en el centro = −R4/(2·R3) = −11). Se satura en ±10,5 V.', expect: 'Senoide grande para la frecuencia cercana a f0 y pequeña para la otra: el FSK se convierte en una señal de amplitud variable (como ASK).' },
      { id: 'tp_rect', label: 'TP · IC5-B pin 7 (rectificador)', x: 905, y: 473, dir: 'tp', desc: 'Rectificador de precisión con D1/D2 1N4148.', expect: 'Semiciclos negativos de la señal filtrada.' },
      { id: 'tp_lpf', label: 'TP · IC5-C pin 8 (pasabajos)', x: 1062, y: 487, dir: 'tp', desc: 'Pasabajos activo R11=1k5, C5=0,1 µF (fc ≈ 1,06 kHz), ganancia −1,5. Saca la envolvente.', expect: 'Envolvente: nivel alto para una frecuencia y bajo para la otra, con rizado.' }
    ],
    controls: [
      { id: 'power', type: 'power', x: 318, y: 560, w: 56, h: 90, label: 'POWER' },
      { id: 'p1', type: 'knob', x: 608, y: 565, r: 46, label: 'P1 · FSK INPUT DEMODULATOR ADJ.',
        info: v => { const Rp = 10 * Math.pow(100, v); const f0 = 1 / (2 * Math.PI * 47e-9) * Math.sqrt((1000 + Rp) / (1000 * 22000 * Rp)); return 'P1 = ' + Rp.toFixed(0) + ' Ω → f0 del pasabanda ≈ ' + fmtF(f0); } },
      { id: 'p2', type: 'knob', x: 777, y: 565, r: 46, label: 'P2 · FSK OUTPUT DEMODULATOR ADJ.',
        info: v => 'Umbral del comparador IC5-D = ' + (12 * v).toFixed(2) + ' V' }
    ],
    compute: {
      clk: fromT(t => frac(t * FSK_CLK) < 0.5 ? H : 0),
      gnd1: dc(0), gnd2: dc(0), gnd3: dc(0), gnd4: dc(0),
      v5: dc(5), v12: dc(12), vm12: dc(-12),
      tp_qa: fromT(t => (Math.floor(t * FSK_CLK) & 1) ? H : 0),
      tp_qc: fromT(t => (Math.floor(t * FSK_CLK) & 4) ? H : 0),
      tp_qd: fromT(t => (Math.floor(t * FSK_CLK) & 8) ? H : 0),
      // 7490 avanza con el flanco de bajada de QD (cada 16 ciclos de reloj)
      d1: fromT(t => (mod(Math.floor(t * FSK_CLK / 16), 10) & 1) ? H : 0),
      d2: fromT(t => (mod(Math.floor(t * FSK_CLK / 16), 10) & 2) ? H : 0),
      d3: fromT(t => (mod(Math.floor(t * FSK_CLK / 16), 10) & 4) ? H : 0),
      d4: fromT(t => (mod(Math.floor(t * FSK_CLK / 16), 10) & 8) ? H : 0),
      fsk_out: c => {
        const d = c.logic('data_in'), qa = c.node('tp_qa'), qc = c.node('tp_qc');
        const a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = (d ? d[i] : 1) ? qa[i] : qc[i];
        return a;
      },
      tp_bpf: c => {
        const x = c.in('fsk_in'); if (!x) return c.zeros();
        const R1 = 1000, R2 = 22000, C = 47e-9, Rp = 10 * Math.pow(100, c.s.knobs.p1);
        // MFB pasabanda: H(s) = -(s/(R1C)) / (s² + 2s/(R2C) + (R1+Rp)/(R1·R2·Rp·C²))
        const co = biquad(0, -1 / (R1 * C), 0, 1, 2 / (R2 * C), (R1 + Rp) / (R1 * R2 * Rp * C * C), c.dt);
        return runBiquad(x, co, -10.5, 10.5);
      },
      tp_rect: c => {
        const x = c.node('tp_bpf'), a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = -0.39 * Math.abs(x[i]);   // rectificador de onda completa de precisión, ganancia ≈ R7/R6 = 0,39
        return a;
      },
      tp_lpf: c => {
        const x = c.node('tp_rect');
        const co = biquad(0, 0, -1.5, 0, 1500 * 0.1e-6, 1, c.dt);   // -Rf/Rin / (1 + s·Rf·C)
        return runBiquad(x, co, -10.5, 10.5);
      },
      data_out: c => {
        const v = c.node('tp_lpf'), th = 12 * c.s.knobs.p2, a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = th > v[i] ? 5.1 : -0.7;   // V+ = umbral P2, V- = envolvente
        return a;
      }
    },
    scopeHint: { ch1: 'd1', ch2: 'fsk_out' }
  };

  /* =================================================================
     MÓDULO PSK — TESCA (portadora 741 + 7490 + 4051 + TL084 + 7486)
     ================================================================= */
  const pskFc = s => 1 / (2 * Math.PI * 1e-9 * Math.sqrt(10000 * (2000 + 8000 * s.knobs.pr1)));
  const PSK_A = 2.5;   // 5 Vpp
  const pskCount = (t, fc) => mod(Math.floor(t * fc), 10);
  const psk = {
    id: 'psk', name: 'PSK — TESCA (BPSK)', short: 'PSK',
    image: 'img/psk.jpg', viewBox: [300, 40, 1035, 665], theme: 'dark',
    dtMin: 0.25e-6, dtMax: 0.5e-6, warm: 200e-6, align: 0,
    tdivRange: [1e-6, 2e-3], tdivDefault: 50e-6,
    defaults: { power: false, knobs: { pr1: 0.4 }, switches: {} },
    jacks: [
      { id: 'v5', label: '+5V (INT.)', x: 568, y: 205, dir: 'out', desc: 'Fuente interna +5 V.', expect: '+5 V continua' },
      { id: 'vm5', label: '-5V (INT.)', x: 568, y: 318, dir: 'out', desc: 'Fuente interna −5 V (el 741 y el 4051 trabajan con ±5 V).', expect: '−5 V continua' },
      { id: 'car_out', label: 'CARRIER OUTPUT', x: 735, y: 210, dir: 'out',
        desc: 'Salida del oscilador senoidal puente de Wien (IC1-741, C1 = C2 = 0,001 µF, R1 = 10 k, PR1). Pasa por el condensador C3 de 33 µF.',
        expect: 'Senoide ≈ 5 Vpp, ≈ 22 kHz (f = 1/(2π·C·√(R1·PR1))). Se ajusta con el preset PR1.' },
      { id: 'd1', label: 'DATA D1', x: 1219, y: 178, dir: 'out',
        desc: 'Pin 12 (QA) del 7490. El 7490 cuenta los ciclos de la portadora, que el transistor TR1 BC-107 convierte en pulsos.',
        expect: 'Cuadrada a fc/2 (≈ 11 kHz), duty 50 %. Cada bit dura 1 ciclo de portadora.' },
      { id: 'd2', label: 'DATA D2', x: 1220, y: 233, dir: 'out',
        desc: 'Pin 11 (QD) del 7490: en 1 solo en las cuentas 8 y 9.',
        expect: 'Periodo 10 ciclos de portadora (fc/10 ≈ 2,2 kHz), duty 20 %.' },
      { id: 'd3', label: 'DATA D3', x: 1221, y: 288, dir: 'out',
        desc: 'Pin 9 (QB) del 7490: en 1 en las cuentas 2,3,6,7.',
        expect: 'Periodo fc/10, patrón 0011001100 (duty 40 %).' },
      { id: 'd4', label: 'DATA D4', x: 1222, y: 341, dir: 'out',
        desc: 'Pin 8 (QC) del 7490: en 1 en las cuentas 4,5,6,7.',
        expect: 'Periodo fc/10, un pulso de 4 ciclos de portadora (duty 40 %).' },
      { id: 'mod_car_in', label: 'CARRIER INPUT (modulador)', x: 452, y: 485, dir: 'in',
        desc: 'Entrada de portadora del modulador. Va directa al canal X1 del 4051 y, a través del inversor IC-4 741 (R12 = R13 = 47 k, ganancia −1), al canal X0.',
        expect: 'Conectar CARRIER OUTPUT.' },
      { id: 'mod_data_in', label: 'DATA INPUT (modulador)', x: 450, y: 590, dir: 'in',
        desc: 'Entrada de control (pin 11 = A) del multiplexor analógico CD4051.',
        expect: 'Conectar D1…D4. "1" elige la portadora (0°), "0" la portadora invertida (180°).' },
      { id: 'psk_out', label: 'PSK O/P', x: 716, y: 445, dir: 'out',
        desc: 'Salida del multiplexor 4051 (pin 3): BPSK.',
        expect: 'Senoide de igual amplitud y frecuencia que la portadora, con saltos de fase de 180° en cada cambio de dato.' },
      { id: 'gnd1', label: 'GND (modulador)', x: 714, y: 592, dir: 'gnd', desc: 'Tierra.', expect: '0 V' },
      { id: 'dem_psk_in', label: 'PSK INPUT (demod.)', x: 768, y: 447, dir: 'in',
        desc: 'Entrada del demodulador: comparador IC2-D que cuadra la señal PSK.', expect: 'Conectar PSK O/P.' },
      { id: 'dem_car_in', label: 'CARRIER INPUT (demod.)', x: 775, y: 590, dir: 'in',
        desc: 'Portadora de referencia (detección coherente). Pasa por IC2-C (inversor) e IC2-B (comparador).', expect: 'Conectar CARRIER OUTPUT (la misma portadora del modulador).' },
      { id: 'demod_out', label: 'DEMOD. OUTPUT', x: 1243, y: 438, dir: 'out',
        desc: 'Salida de la compuerta XOR IC6-7486 tras el filtro R20-C7.',
        expect: 'Debe reproducir el dato aplicado al modulador (TTL 0 / ~4,2 V).' },
      { id: 'gnd2', label: 'GND (demod.)', x: 1246, y: 553, dir: 'gnd', desc: 'Tierra.', expect: '0 V' },
      { id: 'tp_inv', label: 'TP · IC-4 741 pin 6', x: 600, y: 500, dir: 'tp', desc: 'Salida del inversor (ganancia −R13/R12 = −1).', expect: 'Portadora desfasada 180°.' },
      { id: 'tp_sqpsk', label: 'TP · IC2-D pin 14', x: 843, y: 487, dir: 'tp', desc: 'PSK cuadrada por el comparador.', expect: 'Cuadrada ±V con los mismos saltos de fase.' },
      { id: 'tp_sqcar', label: 'TP · IC2-B pin 7', x: 978, y: 603, dir: 'tp', desc: 'Portadora de referencia cuadrada.', expect: 'Cuadrada a fc.' },
      { id: 'tp_xor', label: 'TP · IC6 pin 3 (XOR)', x: 1040, y: 440, dir: 'tp', desc: 'XOR entre PSK cuadrada y referencia cuadrada (detector de fase).', expect: '"1" cuando están en contrafase, "0" cuando están en fase.' }
    ],
    controls: [
      { id: 'power', type: 'power', x: 352, y: 512, w: 64, h: 136, label: 'POWER' },
      { id: 'pr1', type: 'knob', x: 470, y: 322, r: 22, label: 'PR1 (preset frecuencia portadora)',
        info: v => 'PR1 = ' + ((2000 + 8000 * v) / 1000).toFixed(1) + ' kΩ → fc ≈ ' + fmtF(pskFc({ knobs: { pr1: v } })) }
    ],
    compute: {
      v5: dc(5), vm5: dc(-5), gnd1: dc(0), gnd2: dc(0),
      car_out: c => { const fc = pskFc(c.s); return fromT(t => PSK_A * Math.sin(2 * Math.PI * fc * t))(c); },
      d1: c => { const fc = pskFc(c.s); return fromT(t => (pskCount(t, fc) & 1) ? H : 0)(c); },
      d2: c => { const fc = pskFc(c.s); return fromT(t => (pskCount(t, fc) & 8) ? H : 0)(c); },
      d3: c => { const fc = pskFc(c.s); return fromT(t => (pskCount(t, fc) & 2) ? H : 0)(c); },
      d4: c => { const fc = pskFc(c.s); return fromT(t => (pskCount(t, fc) & 4) ? H : 0)(c); },
      tp_inv: c => { const x = c.in('mod_car_in'); if (!x) return c.zeros(); const a = new Float32Array(c.n); for (let i = 0; i < c.n; i++) a[i] = -x[i]; return a; },
      psk_out: c => {
        const x = c.in('mod_car_in'); if (!x) return c.zeros();
        const inv = c.node('tp_inv'), d = c.logic('mod_data_in'), a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = (d ? d[i] : 0) ? x[i] : inv[i];
        return a;
      },
      tp_sqpsk: c => { const x = c.in('dem_psk_in'), a = new Float32Array(c.n); for (let i = 0; i < c.n; i++) a[i] = (x ? x[i] : 0) > 0.02 ? 4.2 : -4.2; return a; },
      tp_sqcar: c => { const x = c.in('dem_car_in'), a = new Float32Array(c.n); for (let i = 0; i < c.n; i++) a[i] = (x ? x[i] : 0) > 0.02 ? 4.2 : -4.2; return a; },
      tp_xor: c => {
        const p = c.node('tp_sqpsk'), r = c.node('tp_sqcar'), a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = ((p[i] > 0) !== (r[i] > 0)) ? H : 0;
        return a;
      },
      demod_out: c => {
        const x = rcLowpass(c.node('tp_xor'), 2e-6, c.dt), a = new Float32Array(c.n);
        for (let i = 0; i < c.n; i++) a[i] = x[i] < 2.1 ? H : 0;   // última XOR usada como inversor
        return a;
      }
    },
    scopeHint: { ch1: 'd1', ch2: 'psk_out' }
  };

  /* =================================================================
     MÓDULO QAM/DQAM — TESCA 40623 (8-QAM)
     ================================================================= */
  const QFB = 250e3;      // reloj de bit S-CLK
  const QFC = 500e3;      // portadoras
  const QA = 2.0;         // amplitud de las portadoras (V pico)
  const qBit = (s, t) => Math.floor((t - (s.tReset || 0)) * QFB);
  const qFault = (s, k) => !!(s.switches['sw4_' + k]) || s.hiddenFault === k;   // hiddenFault: falla escondida de la prueba práctica
  function qFrame(s) { const b = []; for (let w = 1; w <= 3; w++) for (let i = 1; i <= 8; i++) b.push(s.switches['sw' + w + '_' + i] ? 1 : 0); return b; }

  function qamJ(id, label, x, y, dir, desc, expect) { return { id, label, x, y, dir, desc, expect }; }
  const qam = {
    id: 'qam', name: 'QAM/DQAM — TESCA 40623 (8-QAM)', short: 'QAM',
    image: 'img/qam.jpg', viewBox: [352, 12, 1000, 660], theme: 'blue',
    dtMin: 10e-9, dtMax: 20e-9, warm: 400e-6, align: 48 / QFB,
    tdivRange: [0.1e-6, 50e-6], tdivDefault: 10e-6,
    defaults: (() => {
      // trama por defecto: 000 001 010 011 100 101 110 111 (los 8 tribits)
      const bits = '000001010011100101110111'.split('').map(Number), sw = {};
      bits.forEach((b, i) => sw['sw' + (1 + Math.floor(i / 8)) + '_' + (1 + i % 8)] = !!b);
      for (let k = 1; k <= 4; k++) sw['sw4_' + k] = false;
      return { power: true, knobs: {}, switches: sw };
    })(),
    jacks: [
      qamJ('sclk', 'S-CLK', 538, 360, 'out', 'Reloj de bit del generador de datos.', 'Cuadrada TTL 250 kHz (T = 4 µs, duty 50 %). Los datos cambian en su flanco de subida.'),
      qamJ('sdata', 'S-DATA', 538, 452, 'out', 'Datos seriales NRZ-L: trama de 24 bits definida por SW1 (bits 1-8), SW2 (9-16) y SW3 (17-24), repetida.', 'Tren NRZ-L de 250 kb/s, periodo de trama 24 × 4 µs = 96 µs.'),
      qamJ('gnd', 'GND', 538, 555, 'gnd', 'Tierra.', '0 V'),
      qamJ('nrz_in', 'NRZ-L CODER · IN', 606, 357, 'in', 'Entrada del codificador NRZ-L.', 'Conectar S-DATA.'),
      qamJ('nrz_out', 'NRZ-L CODER · OUT', 686, 357, 'out', 'Salida NRZ-L (1 = nivel alto, 0 = nivel bajo durante todo el bit).', 'Igual que S-DATA (el codificador solo le da formato NRZ-L).'),
      qamJ('tb_clk', 'TRIBIT CODER · CLK', 742, 354, 'in', 'Reloj del generador de reloj tribit / codificador tribit.', 'Conectar S-CLK.'),
      qamJ('tb_data', 'TRIBIT CODER · DATA', 742, 442, 'in', 'Datos seriales que se agrupan de a 3 bits (tribit).', 'Conectar NRZ-L OUT (o S-DATA).'),
      qamJ('iclk', 'I-CLK', 838, 353, 'out', 'Reloj del bit I: un pulso cada 3 bits (en el 1.er bit del tribit).', 'Pulsos de 4 µs cada 12 µs (83,3 kHz, duty 33 %).'),
      qamJ('qclk', 'Q-CLK', 838, 400, 'out', 'Reloj del bit Q (2.º bit del tribit).', 'Como I-CLK pero retrasado 1 bit (4 µs).'),
      qamJ('cclk', 'C-CLK', 838, 444, 'out', 'Reloj del bit C (3.er bit del tribit).', 'Como I-CLK pero retrasado 2 bits (8 µs).'),
      qamJ('ibit', 'I-BIT', 962, 352, 'out', 'Bit I del tribit (fase del canal en fase), mantenido 3 bits.', 'NRZ a 83,3 kbaudios: cada nivel dura 12 µs.'),
      qamJ('qbit', 'Q-BIT', 962, 418, 'out', 'Bit Q del tribit (fase del canal en cuadratura).', 'NRZ, cada nivel dura 12 µs.'),
      qamJ('cbit', 'C-BIT', 962, 486, 'out', 'Bit C del tribit (control de amplitud).', 'NRZ, cada nivel dura 12 µs.'),
      qamJ('de1_in', 'DIFF. ENCODER-1 · IN', 608, 563, 'in', 'Codificador diferencial: salida = entrada XOR (salida anterior retardada 1 símbolo).', 'Conectar I-BIT para DQAM.'),
      qamJ('de1_out', 'DIFF. ENCODER-1 · OUT', 760, 560, 'out', 'Salida codificada diferencialmente.', 'Cambia de estado cada vez que la entrada vale "1".'),
      qamJ('de2_in', 'DIFF. ENCODER-2 · IN', 837, 560, 'in', 'Segundo codificador diferencial.', 'Conectar Q-BIT para DQAM.'),
      qamJ('de2_out', 'DIFF. ENCODER-2 · OUT', 972, 560, 'out', 'Salida codificada diferencialmente.', 'Cambia de estado cada vez que la entrada vale "1".'),
      qamJ('sin1', '0° SIN1', 1063, 337, 'out', 'Portadora 0°.', 'Senoide 500 kHz, ≈ 4 Vpp, fase 0°.'),
      qamJ('sin2', '90° SIN2', 1063, 381, 'out', 'Portadora 90°.', 'Senoide 500 kHz adelantada 90° (0,5 µs) respecto de SIN1.'),
      qamJ('sin3', '180° SIN3', 1064, 424, 'out', 'Portadora 180°.', 'Senoide 500 kHz invertida respecto de SIN1.'),
      qamJ('sin4', '270° SIN4', 1066, 469, 'out', 'Portadora 270°.', 'Senoide 500 kHz invertida respecto de SIN2.'),
      qamJ('inp1', 'CARRIER MOD · IN/P-1', 1146, 334, 'in', 'Portadora elegida cuando I = 1.', 'Conectar SIN1 (0°).'),
      qamJ('inp2', 'CARRIER MOD · IN/P-2', 1148, 378, 'in', 'Portadora elegida cuando Q = 1.', 'Conectar SIN2 (90°).'),
      qamJ('inp3', 'CARRIER MOD · IN/P-3', 1150, 423, 'in', 'Portadora elegida cuando I = 0.', 'Conectar SIN3 (180°).'),
      qamJ('inp4', 'CARRIER MOD · IN/P-4', 1152, 466, 'in', 'Portadora elegida cuando Q = 0.', 'Conectar SIN4 (270°).'),
      qamJ('cip1', 'CARRIER MOD · C I/P-1', 1154, 512, 'in', 'Bit de control I.', 'Conectar I-BIT (o DE-1 OUT en DQAM).'),
      qamJ('cip2', 'CARRIER MOD · C I/P-2', 1155, 559, 'in', 'Bit de control Q.', 'Conectar Q-BIT (o DE-2 OUT en DQAM).'),
      qamJ('cip3', 'CARRIER MOD · C I/P-3', 1157, 606, 'in', 'Bit de control C (amplitud).', 'Conectar C-BIT.'),
      qamJ('mod_out', 'MOD OUTPUT', 1281, 465, 'out', 'Salida 8-QAM: suma del canal I (0° o 180°) y del canal Q (90° o 270°), escalada por el bit C.', '500 kHz con 4 fases (45°, 135°, 225°, 315°) y 2 amplitudes (relación 0,414). Cambia cada 12 µs (6 ciclos de portadora por símbolo).'),
      qamJ('sync', 'SYNC CLK', 1286, 544, 'out', 'Reloj de sincronismo de símbolo (útil para disparar el osciloscopio).', 'Pulso de 4 µs cada 12 µs, coincide con el inicio de cada símbolo.')
    ],
    controls: [
      { id: 'sw1', type: 'dip', x: 372, y: 338, w: 60, h: 82, label: 'SW1 (bits 1-8)', word: 1 },
      { id: 'sw2', type: 'dip', x: 372, y: 424, w: 60, h: 82, label: 'SW2 (bits 9-16)', word: 2 },
      { id: 'sw3', type: 'dip', x: 372, y: 510, w: 60, h: 82, label: 'SW3 (bits 17-24)', word: 3 },
      { id: 'sw4', type: 'faults', x: 1012, y: 556, w: 78, h: 60, label: 'SW4 · SWITCH FAULTS' },
      { id: 'reset', type: 'button', x: 1282, y: 358, r: 22, label: 'RESET KEY' }
    ],
    faults: [
      'F1: la portadora de 90° (SIN2) no sale',
      'F2: el bit C del codificador tribit queda pegado en 0',
      'F3: el reloj del generador (S-CLK) se detiene',
      'F4: el modulador ignora el bit C (amplitud fija)'
    ],
    compute: {
      gnd: dc(0),
      sclk: c => { const s = c.s; if (qFault(s, 3)) return c.constant(H); return fromT(t => frac((t - (s.tReset || 0)) * QFB) < 0.5 ? H : 0)(c); },
      sdata: c => { const s = c.s, fr = qFrame(s); if (qFault(s, 3)) return c.constant(fr[0] ? H : 0); return fromT(t => fr[mod(qBit(s, t), 24)] ? H : 0)(c); },
      sync: c => { const s = c.s; if (qFault(s, 3)) return c.constant(H); return fromT(t => mod(qBit(s, t), 3) === 0 ? H : 0)(c); },
      nrz_out: c => { const d = c.logic('nrz_in'), a = new Float32Array(c.n); for (let i = 0; i < c.n; i++) a[i] = (d ? d[i] : 1) ? H : 0; return a; },
      _tribit: c => {
        // devuelve un objeto con todas las salidas del codificador tribit
        const s = c.s, ck = c.logic('tb_clk'), d = c.logic('tb_data'), n = c.n, t = c.t, tR = s.tReset || 0;
        const o = { i: new Float32Array(n), q: new Float32Array(n), cb: new Float32Array(n), ic: new Float32Array(n), qc: new Float32Array(n), cc: new Float32Array(n) };
        if (!ck) return o;
        const sr = [0, 0, 0]; let I = 0, Q = 0, C = 0, pend = null, slot = -1, prev = ck[0];
        for (let k = 0; k < n; k++) {
          const v = ck[k];
          if (v && !prev) {          // flanco de subida
            const idx = Math.round((t[k] - tR) * QFB); slot = mod(idx, 3);
            if (slot === 0 && pend) { I = pend[0]; Q = pend[1]; C = pend[2]; pend = null; }
          } else if (!v && prev) {   // flanco de bajada: se muestrea el dato
            const idx = Math.round((t[k] - tR) * QFB - 0.5), sl = mod(idx, 3);
            sr[sl] = d ? d[k] : 1;
            if (sl === 2) pend = sr.slice();
          }
          prev = v;
          if (qFault(s, 2)) C = 0;
          o.i[k] = I ? H : 0; o.q[k] = Q ? H : 0; o.cb[k] = C ? H : 0;
          o.ic[k] = slot === 0 ? H : 0; o.qc[k] = slot === 1 ? H : 0; o.cc[k] = slot === 2 ? H : 0;
        }
        return o;
      },
      ibit: c => c.node('_tribit').i, qbit: c => c.node('_tribit').q, cbit: c => c.node('_tribit').cb,
      iclk: c => c.node('_tribit').ic, qclk: c => c.node('_tribit').qc, cclk: c => c.node('_tribit').cc,
      de1_out: c => diffEnc(c, 'de1_in'), de2_out: c => diffEnc(c, 'de2_in'),
      sin1: c => qCarrier(c, 0), sin2: c => qFault(c.s, 1) ? c.zeros() : qCarrier(c, 90),
      sin3: c => qCarrier(c, 180), sin4: c => qCarrier(c, 270),
      mod_out: c => {
        const s = c.s, n = c.n, z = c.zeros();
        const in1 = c.in('inp1') || z, in2 = c.in('inp2') || z, in3 = c.in('inp3') || z, in4 = c.in('inp4') || z;
        const I = c.logic('cip1'), Q = c.logic('cip2'), C = c.logic('cip3'), a = new Float32Array(n);
        for (let k = 0; k < n; k++) {
          const ib = I ? I[k] : 1, qb = Q ? Q[k] : 1, cb = qFault(s, 4) ? 1 : (C ? C[k] : 1);
          const amp = cb ? 1 : 0.414;
          a[k] = amp * Math.SQRT1_2 * ((ib ? in1[k] : in3[k]) + (qb ? in2[k] : in4[k]));
        }
        return a;
      }
    },
    scopeHint: { ch1: 'sync', ch2: 'mod_out' }
  };
  function qCarrier(c, deg) { const s = c.s, tR = s.tReset || 0, ph = deg * Math.PI / 180; return fromT(t => QA * Math.sin(2 * Math.PI * QFC * (t - tR) + ph))(c); }
  function diffEnc(c, inId) {
    const s = c.s, d = c.logic(inId), n = c.n, t = c.t, tR = s.tReset || 0, a = new Float32Array(n);
    let q = 0, out = 0, m0 = null;
    for (let k = 0; k < n; k++) {
      const m = qFault(s, 3) ? 0 : Math.floor((t[k] - tR) * QFB / 3);
      if (m0 !== null && m !== m0) q = out;      // el flip-flop "DELAY" guarda la salida anterior
      m0 = m;
      out = (d ? d[k] : 1) ^ q;
      a[k] = out ? H : 0;
    }
    return a;
  }

  // Tabla 8-QAM (para la parte de estudio)
  qam.table = function (I, Q, C) {
    const ph = I && Q ? 45 : !I && Q ? 135 : !I && !Q ? 225 : 315;
    return { phase: ph, amp: C ? 1 : 0.414 };
  };
  qam.frame = qFrame;
  qam.consts = { QFB, QFC, QA };
  fsk.consts = { FSK_CLK };
  psk.pskFc = pskFc;

  G.Modules = { fsk, psk, qam, list: [fsk, psk, qam], fmtF };
  if (typeof module !== 'undefined') module.exports = G.Modules;
})(typeof window !== 'undefined' ? window : globalThis);
