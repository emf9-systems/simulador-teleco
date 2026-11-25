/* =====================================================================
   Prueba práctica: tareas al azar en los módulos + preguntas del profesor
   ===================================================================== */
(function () {
  'use strict';
  // helpers que trabajan sobre el módulo de la tarea (aunque no sea el que está abierto)
  function H(a, mod) {
    const def = Modules[mod], cab = a.cablesBy[mod], st = a.states[mod], sc = a.scope.settings[mod];
    const n = Engine.buildNets(def, cab);
    const conn = (x, y) => n.netOf[x] !== undefined && n.netOf[x] === n.netOf[y];
    const probe = id => !!sc && sc.ch.some(c => c.probe === id && c.on);
    const probeCh = id => sc ? sc.ch.findIndex(c => c.probe === id && c.on) : -1;
    const dataTo = inp => ['d1', 'd2', 'd3', 'd4'].find(d => conn(d, inp));
    const fft = id => a.cur.id === mod && a.scope.view === 'fft' && sc && sc.ch[sc.fft.src].probe === id;
    const trigOn = id => sc && sc.ch[sc.trig.src].probe === id;
    return { def, st, sc, conn, probe, probeCh, dataTo, fft, trigOn };
  }

  const T = [
    /* ------------------------------ FSK ------------------------------ */
    { mod: 'fsk', title: 'Moduladora y modulada FSK',
      task: 'Usando D1 como moduladora, muestra en el osciloscopio, a la vez y con imagen estable, la señal moduladora (CH1) y la señal FSK modulada (CH2).',
      ok: a => { const h = H(a, 'fsk'); return h.st.power && h.conn('d1', 'data_in') && h.probe('d1') && h.probe('fsk_out') && h.trigOn('d1'); },
      hint: 'Enciende el módulo, pon un cable de D1 a DATA INPUT, pon las sondas en D1 y en FSK OUTPUT, dispara con el canal de D1 y pulsa AUTOSET.',
      qs: [
        ['¿Qué frecuencias tiene la señal FSK y de dónde salen?', 'Con "1" sale 5 kHz y con "0" sale 1,25 kHz. Las dos vienen del contador 74163, que divide el reloj de 10 kHz del 555: QA (pin 14) = ÷2 y QC (pin 12) = ÷8. Las compuertas NAND del 7400 forman el multiplexor que elige una u otra según el dato.'],
        ['¿Cuánto vale la desviación de frecuencia?', 'Δf = (f1 − f0)/2 = (5000 − 1250)/2 = 1875 Hz, alrededor de una frecuencia central de 3,125 kHz.'],
        ['¿Por qué la imagen queda estable al disparar con la moduladora?', 'Porque el dato es periódico (D1 = 312,5 Hz) y el osciloscopio empieza cada barrido en el mismo flanco del dato. Si se dispara con la FSK, cada barrido arranca en un punto distinto de la trama y la imagen "corre".']
      ] },
    { mod: 'fsk', title: 'Moduladora D4 y su duty',
      task: 'Conecta D4 como moduladora del FSK y mide con el osciloscopio la frecuencia y el ciclo de trabajo (duty) de D4.',
      ok: a => { const h = H(a, 'fsk'); return h.st.power && h.conn('d4', 'data_in') && h.probe('d4'); },
      hint: 'Cable de D4 a DATA INPUT, sonda en D4 y AUTOSET. Lee "f" y "duty" en las mediciones de abajo de la pantalla.',
      qs: [
        ['¿Qué frecuencia y duty mediste y por qué tiene ese duty?', 'f = 62,5 Hz (T = 16 ms) y duty de 20 %. D4 es la salida QD del contador decimal 7490, que vale 1 solo en las cuentas 8 y 9 de cada ciclo de 10 (2/10 = 20 %).'],
        ['¿Por qué D1 tiene 312,5 Hz y D4 62,5 Hz?', 'El 7490 recibe 625 Hz (QD del 74163 = 10 kHz/16). QA divide por 2 → 312,5 Hz y el ciclo completo de 10 cuentas → 62,5 Hz.'],
        ['¿Cómo se ve la FSK con D4?', 'Pasa el 20 % del tiempo en 5 kHz (marca) y el 80 % en 1,25 kHz (espacio).']
      ] },
    { mod: 'fsk', title: 'Espectro de la FSK',
      task: 'Con cualquier dato conectado, muestra en el analizador de espectro la composición espectral de la señal FSK.',
      ok: a => { const h = H(a, 'fsk'); return h.st.power && !!h.dataTo('data_in') && h.fft('fsk_out'); },
      hint: 'Sonda en FSK OUTPUT, pestaña "Analizador de espectro" y elige el canal de esa sonda.',
      qs: [
        ['¿Qué componentes aparecen y por qué?', 'Dos grupos de rayas en 1,25 kHz y 5 kHz (una FSK es como dos ASK superpuestas), con bandas laterales separadas por la frecuencia del dato, más armónicos impares (3,75 kHz, 6,25 kHz, 15 kHz…) porque la salida es cuadrada y no senoidal.'],
        ['¿Cuál es el ancho de banda aproximado?', 'B ≈ |f1 − f0| + 2·fb. Con D1, fb = 625 b/s, así que B ≈ 3750 + 1250 = 5 kHz (sin contar los armónicos de la cuadrada).'],
        ['¿Qué cambia si usas D4 en vez de D1?', 'Las bandas laterales se acercan (separación de 62,5 Hz en vez de 312,5 Hz) y el tono de 1,25 kHz pesa más, porque el dato pasa el 80 % del tiempo en "0".']
      ] },
    { mod: 'fsk', title: 'Demodulación FSK',
      task: 'Demodula la señal FSK y muestra el dato original (CH1) junto al dato recuperado (CH2). Ajusta P1 y P2 si es necesario.',
      ok: a => { const h = H(a, 'fsk'); const d = h.dataTo('data_in'); return h.st.power && !!d && h.conn('fsk_out', 'fsk_in') && h.probe(d) && h.probe('data_out'); },
      hint: 'Cable de FSK OUTPUT a FSK INPUT. Sondas en el dato y en DATA OUTPUT. Prueba con D2, D3 o D4 y mueve P1/P2.',
      qs: [
        ['Explica las etapas del demodulador.', 'Pasabanda MFB (IC5-A) sintonizado con P1, que convierte frecuencia en amplitud; rectificador de precisión (IC5-B); pasabajos (IC5-C, ≈ 1 kHz) que entrega la envolvente; y comparador (IC5-D) con umbral P2. El zener de 5,1 V limita la salida a nivel TTL.'],
        ['¿Qué hacen P1 y P2?', 'P1 cambia la frecuencia central del filtro pasabanda, y P2 el umbral del comparador que decide entre "1" y "0".'],
        ['¿Por qué el dato recuperado sale con retardo, o a veces invertido?', 'El retardo viene de los filtros (el pasabajos necesita tiempo para cargarse). Sale invertido si el filtro queda sintonizado cerca de 5 kHz, porque entonces el "1" da más amplitud y el comparador invierte. Tipo de demodulación: no coherente.']
      ] },
    { mod: 'fsk', title: 'Reloj básico (555)',
      task: 'Mide el reloj básico del módulo FSK: frecuencia, periodo, amplitud y duty.',
      ok: a => { const h = H(a, 'fsk'); return h.st.power && h.probe('clk'); },
      hint: 'Sonda en BASIC CLOCK y AUTOSET.',
      qs: [
        ['¿Cómo calculas la frecuencia teórica?', 'f = 1,44/((R1 + 2R2)·C1) = 1,44/((560 + 2·680 k)·100 pF) ≈ 10,6 kHz. El panel dice 10 kHz; la diferencia viene de las tolerancias.'],
        ['¿Por qué el duty es ≈ 50 %?', 'Duty = (R1 + R2)/(R1 + 2R2). Como R1 (560 Ω) es mucho menor que R2 (680 kΩ), queda ≈ 50 %.'],
        ['¿Para qué se usa este reloj?', 'Es la base de tiempo de todo el modulador: el 74163 lo divide para obtener las dos frecuencias de la FSK y el reloj del 7490, que genera los datos.']
      ] },
    /* ------------------------------ PSK ------------------------------ */
    { mod: 'psk', title: 'Moduladora y modulada BPSK',
      task: 'Genera una señal PSK con D1 como dato y muestra la moduladora (CH1) y la modulada (CH2), con imagen estable.',
      ok: a => { const h = H(a, 'psk'); return h.st.power && h.conn('car_out', 'mod_car_in') && h.conn('d1', 'mod_data_in') && h.probe('d1') && h.probe('psk_out'); },
      hint: 'CARRIER OUTPUT → CARRIER INPUT del modulador, D1 → DATA INPUT, sondas en D1 y en PSK O/P, trigger en D1.',
      qs: [
        ['¿Qué ocurre en la señal cuando cambia el dato?', 'La portadora invierte su fase (salto de 180°) sin cambiar ni amplitud ni frecuencia.'],
        ['¿Cómo genera el módulo los dos estados de fase?', 'Un 741 inversor de ganancia −1 (R12 = R13 = 47 k) entrega la portadora desfasada 180°. El multiplexor analógico CD4051 elige la portadora directa o la invertida según el dato.'],
        ['¿Por qué los saltos de fase coinciden con los cruces por cero?', 'Los datos los genera un 7490 que cuenta los ciclos de la misma portadora (cuadrada por TR1). Por eso están sincronizados con ella.']
      ] },
    { mod: 'psk', title: 'Espectro BPSK',
      task: 'Muestra el espectro de la señal PSK con D1 como moduladora. Después cambia a D4 y observa la diferencia en la frecuencia portadora.',
      ok: a => { const h = H(a, 'psk'); return h.st.power && h.conn('car_out', 'mod_car_in') && h.fft('psk_out') && h.conn('d4', 'mod_data_in'); },
      hint: 'Arma el modulador, sonda en PSK O/P y analizador de espectro. Primero con D1 y luego con D4.',
      qs: [
        ['Con D1, ¿por qué no aparece la portadora (≈ 22 kHz)?', 'Porque BPSK = portadora × dato bipolar (±1). D1 tiene duty de 50 %, así que su valor medio es 0 y la portadora queda suprimida (como en DSB-SC). Aparecen rayas en fc ± fD (11 kHz y 33 kHz).'],
        ['Con D4, ¿por qué sí aparece la portadora?', 'D4 tiene duty de 20 %: el valor medio bipolar es 0,2 − 0,8 = −0,6 ≠ 0, así que queda una raya en fc de 0,6·A, más bandas laterales cada fc/10.'],
        ['¿Cuál es el ancho de banda mínimo de BPSK?', 'B = fb (Nyquist). El lóbulo principal del espectro, de nulo a nulo, mide 2·fb.']
      ] },
    { mod: 'psk', title: 'Demodulación BPSK',
      task: 'Demodula la PSK y muestra el dato original junto al recuperado.',
      ok: a => { const h = H(a, 'psk'); const d = h.dataTo('mod_data_in'); return h.st.power && !!d && h.conn('car_out', 'mod_car_in') && h.conn('psk_out', 'dem_psk_in') && h.conn('car_out', 'dem_car_in') && h.probe('demod_out') && h.probe(d); },
      hint: 'PSK O/P → PSK INPUT y CARRIER OUTPUT → CARRIER INPUT (demodulador). Sondas en el dato y en DEMOD. OUTPUT.',
      qs: [
        ['¿Por qué el demodulador necesita la portadora?', 'Porque la detección es coherente: compara la fase de la PSK con una referencia. La XOR (7486) entre las dos señales cuadradas vale 0 en fase y 1 en contrafase, lo que equivale a multiplicar y filtrar.'],
        ['¿Qué pasa si quitas el cable de la referencia?', 'La XOR compara contra un nivel fijo y la salida pasa a ser la propia PSK cuadrada, que ya no es el dato. Con la referencia invertida, el dato sale invertido: es la ambigüedad de 180°.'],
        ['¿Cómo se soluciona la ambigüedad de fase?', 'Con codificación diferencial (DPSK): se transmiten los cambios y no la fase absoluta.']
      ] },
    { mod: 'psk', title: 'Portadora del módulo PSK',
      task: 'Mide la portadora del módulo PSK: forma de onda, frecuencia y amplitud pico a pico.',
      ok: a => { const h = H(a, 'psk'); return h.st.power && h.probe('car_out'); },
      hint: 'Sonda en CARRIER OUTPUT y AUTOSET.',
      qs: [
        ['¿Qué circuito genera la portadora?', 'Un oscilador puente de Wien con un 741 (IC1). La red RC (C1 = C2 = 0,001 µF, R1 = 10 k, PR1) fija la frecuencia, y los diodos D1 y D2 estabilizan la amplitud.'],
        ['¿Cómo se calcula su frecuencia?', 'f = 1/(2π·√(R1·PR1·C1·C2)). Con PR1 ≈ 5,2 kΩ da ≈ 22 kHz. Para que oscile, la ganancia del amplificador tiene que ser 3.'],
        ['¿Qué valores mediste?', 'Una senoide de ≈ 5 Vpp a ≈ 22 kHz (T ≈ 45 µs). Si mueves PR1, cambia la frecuencia.']
      ] },
    /* ------------------------------ QAM ------------------------------ */
    { mod: 'qam', title: 'Desfase de las portadoras',
      task: 'Demuestra con el osciloscopio que SIN1 y SIN2 están desfasadas 90°: con el tiempo de retardo o con el modo X-Y.',
      ok: a => { const h = H(a, 'qam'); return h.probe('sin1') && h.probe('sin2'); },
      hint: 'Sondas en SIN1 y SIN2, AUTOSET, y luego "Modo X-Y".',
      qs: [
        ['¿Cómo calculas el desfase con el retardo?', 'φ = 360°·Δt·f. A 500 kHz el periodo es 2 µs, así que 90° corresponde a 0,5 µs entre cruces por cero equivalentes.'],
        ['¿Qué figura sale en X-Y y por qué?', 'Un círculo (o una elipse si las escalas no son iguales). Son dos senoides de igual frecuencia desfasadas 90°: x = sen ωt, y = cos ωt.'],
        ['¿Y con SIN1 contra SIN3?', 'Una recta con pendiente negativa, porque están en contrafase (180°).']
      ] },
    { mod: 'qam', title: 'Salida 8-QAM',
      task: 'Arma el conexionado 8-QAM de la guía y muestra la salida modulada estable, disparando con el reloj de sincronismo.',
      ok: a => { const h = H(a, 'qam'); return h.conn('sdata', 'nrz_in') && h.conn('nrz_out', 'tb_data') && h.conn('sclk', 'tb_clk') && h.conn('ibit', 'cip1') && h.conn('qbit', 'cip2') && h.conn('cbit', 'cip3') && ['1', '2', '3', '4'].every(k => h.conn('sin' + k, 'inp' + k)) && h.probe('mod_out') && h.trigOn('sync'); },
      hint: 'S-DATA→NRZ IN, NRZ OUT→DATA, S-CLK→CLK, I/Q/C-BIT→C I/P-1/2/3, SIN1-4→IN/P-1-4. Sondas en SYNC CLK (trigger) y MOD OUTPUT.',
      qs: [
        ['¿Cuántos bits hay por símbolo y qué hace cada uno?', 'Tres (un tribit). I elige 0° o 180°, Q elige 90° o 270° (la suma da ±45° o ±135°) y C elige la amplitud (relación 0,414).'],
        ['¿Cuánto dura cada símbolo y cuál es la tasa de baudios?', 'Con S-CLK de 250 kHz, cada símbolo dura 3 bits = 12 µs, así que la tasa es 83,3 kbaudios. El ancho de banda mínimo es fb/3 y la eficiencia, 3 b/s/Hz.'],
        ['¿Para qué sirve el tribit coder?', 'Convierte los datos de serie a paralelo: junta 3 bits y los mantiene durante 3 periodos de bit, para que el modulador tenga I, Q y C estables durante todo el símbolo.']
      ] },
    { mod: 'qam', title: 'Símbolo pedido con los switches',
      task: 'Con el conexionado 8-QAM armado, configura SW1 a SW3 para que TODOS los símbolos sean I=1, Q=1, C=0 (tribit 110), y muestra la salida.',
      ok: a => { const h = H(a, 'qam'); const f = h.def.frame(h.st).join(''); return f === '110'.repeat(8) && h.conn('ibit', 'cip1') && h.conn('qbit', 'cip2') && h.conn('cbit', 'cip3') && h.probe('mod_out'); },
      hint: 'La trama es SW1 (bits 1 a 8), SW2 (9 a 16) y SW3 (17 a 24). El patrón 110 se repite 8 veces.',
      qs: [
        ['¿Qué fase y amplitud tiene la salida?', 'Fase +45° (I y Q en 1) y amplitud baja (C = 0), o sea 0,414 veces la alta (0,765 V frente a 1,848 V en la tabla de Tomasi).'],
        ['¿Qué ves en el osciloscopio y en el espectro?', 'Como todos los símbolos son iguales, no hay cambios: es una senoide pura de 500 kHz. En el espectro aparece una sola raya en 500 kHz.'],
        ['¿Cómo pondrías el símbolo de máxima amplitud a −135°?', 'Con I = 0, Q = 0 y C = 1, o sea el tribit 001 repetido.']
      ] },
    { mod: 'qam', title: 'Conexión DQAM',
      task: 'Modifica el conexionado para obtener DQAM: I y Q deben pasar por los codificadores diferenciales antes del modulador.',
      ok: a => { const h = H(a, 'qam'); return h.conn('ibit', 'de1_in') && h.conn('de1_out', 'cip1') && h.conn('qbit', 'de2_in') && h.conn('de2_out', 'cip2') && h.conn('cbit', 'cip3') && h.probe('mod_out'); },
      hint: 'I-BIT→DIFF. ENC-1 IN, DE-1 OUT→C I/P-1; Q-BIT→DIFF. ENC-2 IN, DE-2 OUT→C I/P-2. Quita los cables directos de I y Q a C I/P.',
      qs: [
        ['¿Qué hace un codificador diferencial?', 'Calcula salida = entrada XOR (salida anterior retardada un símbolo). El "1" se codifica como un cambio y el "0" como mantener el estado.'],
        ['¿Por qué se usa DQAM?', 'El receptor recupera la portadora con un PLL que puede quedar enganchado con un error de 90° o 180°. Si la información va en los cambios, ese error fijo no afecta los datos.'],
        ['¿Se puede dejar de pasar algún cable a C I/P-1 o C I/P-2 directo?', 'No. Si un cable sigue yendo directo, quedan dos salidas unidas (I-BIT y DE-1 OUT) en la misma entrada, lo que en el equipo real es un cortocircuito entre salidas. El simulador lo marca con una advertencia.']
      ] },
    { mod: 'qam', title: 'Falla misteriosa',
      task: 'El profesor activó una falla escondida en el kit QAM. Con el conexionado 8-QAM armado, mide hasta descubrir cuál es y respóndela aquí.',
      fault: true,
      ok: a => a._faultAns && a._faultAns === a.states.qam.hiddenFault,
      hint: 'Revisa una por una las portadoras, S-CLK, S-DATA, los bits I, Q y C, y la salida. Compara con lo que debería haber.',
      qs: [
        ['¿Cómo llegaste a la falla?', 'Siguiendo la señal desde el origen hasta la salida: primero las fuentes (reloj, datos y portadoras), después las etapas intermedias (tribit) y al final la salida. La primera señal que no corresponde con lo esperado delimita el bloque con la falla.'],
        ['¿Qué efecto tiene en la constelación?', 'Sin SIN2: los símbolos con Q = 1 pierden su componente de 90°. Con C pegado en 0: quedan 4 fases con una sola amplitud (como QPSK). Sin reloj: no hay símbolos y sale una portadora fija. Con C ignorado: 4 fases con amplitud alta.'],
        ['¿Qué instrumento conviene para cada falla?', 'El osciloscopio sirve para tiempos y niveles (relojes, bits, desfases). El analizador de espectro sirve para ver si la salida dejó de estar modulada (una sola raya).']
      ] },
    { mod: 'qam', title: 'Tasa de símbolos',
      task: 'Mide la frecuencia de S-CLK y la de I-CLK (o SYNC CLK) y relaciónalas.',
      ok: a => { const h = H(a, 'qam'); return h.probe('sclk') && (h.probe('iclk') || h.probe('sync')); },
      hint: 'Sondas en S-CLK y en I-CLK. Para I-CLK hay que tener conectado S-CLK → CLK del tribit coder.',
      qs: [
        ['¿Qué relación hay entre las frecuencias?', 'I-CLK = S-CLK/3 (250 kHz/3 = 83,3 kHz), porque cada símbolo agrupa 3 bits.'],
        ['¿Qué duty tiene I-CLK y por qué?', 'Un tercio: está en alto durante el primer bit de cada tribit. Q-CLK y C-CLK son iguales pero desplazadas uno y dos bits.'],
        ['¿Qué significa eso para el ancho de banda?', 'La tasa de cambio de la salida es fb/3, así que el ancho de banda mínimo es fb/3, la tercera parte que en BPSK con la misma tasa de bits.']
      ] }
  ];

  let P = null;  // prueba activa
  const Practice = {
    tasks: T,
    active() { return P; },
    render(root) {
      if (!P) {
        root.innerHTML = `<h1>🧪 Prueba práctica de laboratorio</h1>
<p>Simula el formato real: te tocan <b>1 a 4 tareas al azar</b> en los módulos. El simulador detecta solo cuándo cada tarea está lograda. Después vienen <b>2 o 3 preguntas puntuales del profesor</b> sobre lo que mostraste: respóndelas en voz alta o por escrito antes de ver la respuesta.</p>
<div class="row" style="align-items:center"><label>Tareas <select id="pn"><option>1</option><option>2</option><option selected>3</option><option>4</option></select></label>
<label>Módulo <select id="pm"><option value="">Cualquiera</option><option value="fsk">FSK</option><option value="psk">PSK</option><option value="qam">QAM</option></select></label>
<label>Tiempo <select id="pt"><option value="20">20 min</option><option value="40" selected>40 min</option><option value="60">60 min</option></select></label>
<label class="chk"><input type="checkbox" id="pc" checked> Partir con los módulos sin cables y apagados (como en el lab)</label>
<button id="pGo" class="active">Comenzar prueba</button></div>
<h2>Banco de tareas (${T.length})</h2><ul>${T.map(t => `<li><b>[${t.mod.toUpperCase()}]</b> ${t.title}</li>`).join('')}</ul>`;
        root.querySelector('#pGo').onclick = () => this.start(+root.querySelector('#pn').value, root.querySelector('#pm').value, +root.querySelector('#pt').value, root.querySelector('#pc').checked, root);
        return;
      }
      const draw = () => {
        const done = P.items.filter(x => x.done).length;
        root.innerHTML = `<h1>🧪 Prueba práctica</h1><div class="row" style="align-items:center;gap:18px"><span class="timer" id="pTimer"></span><span class="score">${done} / ${P.items.length} tareas logradas</span><button id="pEnd">Terminar / nueva prueba</button></div>` +
          P.items.map((x, k) => `<div class="quizQ ${x.done ? 'answered' : ''}"><b>Tarea ${k + 1} · ${x.t.mod.toUpperCase()} · ${x.t.title}</b> ${x.done ? '<span style="color:#3ddc84">✔ lograda</span>' : '<span class="muted">pendiente</span>'}
            <p>${x.t.task}</p>
            <div class="row"><button data-go="${k}">→ Ir al módulo ${x.t.mod.toUpperCase()}</button><button data-h="${k}">Pista</button></div>
            <div class="muted small" id="ph${k}" hidden>${x.t.hint}</div>
            <div style="margin-top:8px"><b>Preguntas del profesor</b> ${x.done ? '' : '<span class="muted small">(se habilitan al lograr la tarea)</span>'}
            ${x.done ? x.t.qs.map(q => `<details class="qa"><summary>${q[0]}</summary><div>${q[1]}</div></details>`).join('') : ''}</div></div>`).join('');
        root.querySelectorAll('[data-go]').forEach(b => b.onclick = () => App.go(P.items[+b.dataset.go].t.mod));
        root.querySelectorAll('[data-h]').forEach(b => b.onclick = () => { root.querySelector('#ph' + b.dataset.h).hidden = false; });
        root.querySelector('#pEnd').onclick = () => { this.stop(); this.render(root); };
        tick();
      };
      const tick = () => {
        const t = root.querySelector('#pTimer'); if (!t || !P) return;
        const s = Math.max(0, Math.round((P.end - Date.now()) / 1000));
        t.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; t.style.color = s < 180 ? '#ff6b6b' : '';
      };
      clearInterval(this._ti); this._ti = setInterval(tick, 1000);
      draw();
    },
    start(n, mod, min, clean, root) {
      let pool = T.filter(t => !mod || t.mod === mod).map(t => [Math.random(), t]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, n);
      P = { items: pool.map(t => ({ t, done: false })), end: Date.now() + min * 60000 };
      if (clean) ['fsk', 'psk', 'qam'].forEach(m => {
        if (!pool.some(t => t.mod === m)) return;
        App.cablesBy[m] = []; if (m !== 'qam') App.states[m].power = false;
        const sc = App.scope.settings[m]; if (sc) sc.ch.forEach(c => c.probe = null);
      });
      App._faultAns = null; App.states.qam.hiddenFault = 0;
      if (pool.some(t => t.fault)) App.states.qam.hiddenFault = 1 + Math.floor(Math.random() * 4);
      this.render(root);
    },
    stop() { P = null; App.states.qam.hiddenFault = 0; App._faultAns = null; clearInterval(this._ti); App.drawBanner && App.drawBanner(); },
    // se llama periódicamente desde la app
    update() {
      if (!P) return false;
      let changed = false;
      P.items.forEach(x => { if (!x.done) { let ok = false; try { ok = x.t.ok(App); } catch (e) { } if (ok) { x.done = true; changed = true; } } });
      return changed;
    }
  };
  window.Practice = Practice;
})();
