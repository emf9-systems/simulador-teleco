/* =====================================================================
   Contenido de estudio, preguntas probables e interrogación simulada
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- diagrama de constelación 8-QAM ---------------- */
  function constellation() {
    const cx = 170, cy = 150, R = 110, r = R * 0.414;
    const pts = [[1, 1, 45], [0, 1, 135], [0, 0, 225], [1, 0, 315]];
    let s = `<svg class="diagram" viewBox="0 0 340 300" style="max-width:380px"><line x1="20" y1="${cy}" x2="320" y2="${cy}" stroke="#55626e"/><line x1="${cx}" y1="15" x2="${cx}" y2="285" stroke="#55626e"/>
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#2f3b46" stroke-dasharray="4 4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#2f3b46" stroke-dasharray="4 4"/>
      <text x="300" y="${cy - 6}">sen ωt (0°)</text><text x="${cx + 6}" y="26">cos ωt (90°)</text>`;
    pts.forEach(([I, Q, a]) => {
      [[0, r], [1, R]].forEach(([C, rad]) => {
        const x = cx + rad * Math.cos(a * Math.PI / 180), y = cy - rad * Math.sin(a * Math.PI / 180);
        s += `<circle cx="${x}" cy="${y}" r="6" fill="${C ? '#ffd84a' : '#3fe0ff'}"/><text x="${x + (Math.cos(a * Math.PI / 180) > 0 ? 8 : -36)}" y="${y + (C ? -6 : 14)}">${I}${Q}${C}</text>`;
      });
    });
    s += `<text x="10" y="295">Etiqueta = I Q C · amarillo: C=1 (amplitud 1) · celeste: C=0 (0,414)</text></svg>`;
    return s;
  }

  function blockFSK() {
    return `<svg class="diagram" viewBox="0 0 900 230">
      <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#9fb3c4"/></marker></defs>
      <g stroke="#9fb3c4" fill="none" marker-end="url(#ar)"><path d="M120,40 H165"/><path d="M290,40 H335"/><path d="M290,30 C320,10 600,10 640,30"/><path d="M290,52 C330,80 600,80 640,52"/><path d="M460,40 H520 V95 H640"/><path d="M760,52 H820"/>
      <path d="M120,180 H165"/><path d="M290,180 H335"/><path d="M460,180 H505"/><path d="M630,180 H675"/><path d="M800,180 H840"/></g>
      <g fill="#1d2a36" stroke="#4fb3ff"><rect x="20" y="20" width="100" height="40" rx="6"/><rect x="165" y="20" width="125" height="40" rx="6"/><rect x="335" y="20" width="125" height="40" rx="6"/><rect x="640" y="20" width="120" height="85" rx="6"/>
      <rect x="20" y="160" width="100" height="40" rx="6"/><rect x="165" y="160" width="125" height="40" rx="6"/><rect x="335" y="160" width="125" height="40" rx="6"/><rect x="505" y="160" width="125" height="40" rx="6"/><rect x="675" y="160" width="125" height="40" rx="6"/></g>
      <text x="32" y="44">555 · 10 kHz</text><text x="173" y="38">74163 (÷2,4,8,16)</text><text x="173" y="54">5k · 2,5k · 1,25k · 625</text><text x="343" y="38">7490 (÷10)</text><text x="343" y="54">D1…D4</text>
      <text x="648" y="45">NAND 7400</text><text x="648" y="62">mux 2:1</text><text x="648" y="79">"1"→5 kHz</text><text x="648" y="95">"0"→1,25 kHz</text><text x="772" y="45">FSK OUT</text><text x="470" y="34">DATA IN</text>
      <text x="300" y="14">QA 5 kHz (pin 14)</text><text x="300" y="92">QC 1,25 kHz (pin 12)</text>
      <text x="28" y="184">FSK INPUT</text><text x="172" y="178">Pasabanda MFB</text><text x="172" y="194">IC5-A · P1 = f0</text><text x="342" y="178">Rectificador</text><text x="342" y="194">IC5-B (D1,D2)</text><text x="512" y="178">Pasabajos</text><text x="512" y="194">IC5-C fc≈1 kHz</text><text x="682" y="178">Comparador</text><text x="682" y="194">IC5-D · P2 · ZD1</text><text x="806" y="172">DATA</text><text x="806" y="188">OUT</text>
      <text x="20" y="140" style="font-weight:700">Demodulador (no coherente, por envolvente)</text><text x="20" y="12" style="font-weight:700">Modulador</text></svg>`;
  }
  function blockPSK() {
    return `<svg class="diagram" viewBox="0 0 900 250">
      <defs><marker id="ar2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#9fb3c4"/></marker></defs>
      <g stroke="#9fb3c4" fill="none" marker-end="url(#ar2)"><path d="M150,40 H200"/><path d="M150,52 C170,110 180,110 200,110"/><path d="M330,110 H380"/><path d="M500,40 H600"/><path d="M500,70 H560 V60 H600"/><path d="M730,52 H780"/><path d="M380,40 H405"/>
      <path d="M120,200 H160"/><path d="M120,230 H160"/><path d="M290,200 H330 V210 H360"/><path d="M290,230 H330 V220 H360"/><path d="M490,215 H530"/><path d="M660,215 H700"/></g>
      <g fill="#1d2a36" stroke="#4fb3ff"><rect x="20" y="20" width="130" height="45" rx="6"/><rect x="200" y="90" width="130" height="40" rx="6"/><rect x="380" y="90" width="120" height="40" rx="6"/><rect x="405" y="20" width="95" height="40" rx="6"/><rect x="600" y="25" width="130" height="55" rx="6"/>
      <rect x="160" y="185" width="130" height="30" rx="6"/><rect x="160" y="220" width="130" height="25" rx="6"/><rect x="360" y="195" width="130" height="40" rx="6"/><rect x="530" y="195" width="130" height="40" rx="6"/></g>
      <text x="28" y="40">Oscilador Wien 741</text><text x="28" y="56">≈22 kHz · 5 Vpp</text><text x="208" y="108">TR1: cuadra la</text><text x="208" y="122">portadora</text><text x="388" y="108">7490 → D1…D4</text><text x="408" y="38">IC-4 inversor</text><text x="408" y="52">(−1) → 180°</text>
      <text x="608" y="44">4051 mux</text><text x="608" y="58">"1": 0° · "0": 180°</text><text x="608" y="72">→ PSK O/P</text><text x="560" y="88">DATA IN</text><text x="512" y="34">0° / 180°</text>
      <text x="22" y="204">PSK IN</text><text x="22" y="234">CARRIER IN</text><text x="168" y="205">IC2-D comparador</text><text x="168" y="238">IC2-C/IC2-B comp.</text><text x="368" y="213">XOR 7486</text><text x="368" y="228">(detector de fase)</text><text x="538" y="213">RC + XOR</text><text x="538" y="228">(inversor)</text><text x="705" y="219">DEMOD. OUT</text>
      <text x="20" y="175" style="font-weight:700">Demodulador coherente (necesita la portadora de referencia)</text><text x="20" y="13" style="font-weight:700">Generador de portadora, datos y modulador</text></svg>`;
  }
  function blockQAM() {
    return `<svg class="diagram" viewBox="0 0 900 220">
      <defs><marker id="ar3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#9fb3c4"/></marker></defs>
      <g stroke="#9fb3c4" fill="none" marker-end="url(#ar3)"><path d="M140,60 H175"/><path d="M285,60 H320"/><path d="M140,90 C200,120 280,110 320,95"/><path d="M450,45 H560"/><path d="M450,75 H560"/><path d="M450,105 H560"/><path d="M450,45 H480 V160 H500"/><path d="M620,160 H560 V150"/><path d="M490,190 H560"/><path d="M700,90 H760"/></g>
      <g fill="#1d2a36" stroke="#4fb3ff"><rect x="15" y="40" width="125" height="65" rx="6"/><rect x="175" y="40" width="110" height="40" rx="6"/><rect x="320" y="30" width="130" height="90" rx="6"/><rect x="560" y="30" width="140" height="130" rx="6"/><rect x="360" y="170" width="130" height="40" rx="6"/><rect x="500" y="140" width="0" height="0"/></g>
      <text x="22" y="60">Generador datos</text><text x="22" y="76">SW1-SW3 (24 bits)</text><text x="22" y="92">S-DATA · S-CLK</text><text x="182" y="58">NRZ-L CODER</text><text x="182" y="73">(+ DIFF. ENC.)</text>
      <text x="328" y="52">TRIBIT CODER</text><text x="328" y="68">serie → paralelo</text><text x="328" y="84">3 bits = 1 símbolo</text><text x="328" y="100">I · Q · C</text><text x="458" y="40">I-BIT</text><text x="458" y="70">Q-BIT</text><text x="458" y="100">C-BIT</text>
      <text x="568" y="52">CARRIER</text><text x="568" y="67">MODULATOR</text><text x="568" y="86">I: 0° o 180°</text><text x="568" y="101">Q: 90° o 270°</text><text x="568" y="116">C: amplitud</text><text x="568" y="131">alta/baja</text><text x="708" y="84">MOD OUTPUT</text><text x="708" y="100">8-QAM</text>
      <text x="368" y="188">Generador de</text><text x="368" y="203">portadoras 0/90/180/270°</text><text x="590" y="185">SIN1…SIN4 → IN/P-1…4</text></svg>`;
  }

  /* ---------------- contenido teórico ---------------- */
  const STUDY = {
    fsk: `
<h2>FSK · Modulación por desplazamiento de frecuencia (TESCA 40506)</h2>
<p><b>Idea:</b> el dato binario elige entre dos frecuencias: una para el "1" (<b>marca</b>) y otra para el "0" (<b>espacio</b>). La amplitud se mantiene constante; la información va en la frecuencia.</p>
${blockFSK()}
<h3>Cómo genera las señales el módulo (bloque por bloque)</h3>
<table><tr><th>Bloque</th><th>Qué hace</th><th>Señal resultante</th></tr>
<tr><td>IC1 · 555 astable (R1 = 560 Ω, R2 = 680 kΩ, C1 = 100 pF)</td><td>Oscilador de onda cuadrada: es el <b>reloj básico</b>.</td><td>BASIC CLOCK ≈ 10 kHz, duty ≈ 50 %</td></tr>
<tr><td>IC2 · 74163, contador binario síncrono de 4 bits</td><td>Divide el reloj por 2, 4, 8 y 16 (QA, QB, QC y QD).</td><td>5 kHz (pin 14), 2,5 kHz (pin 13), 1,25 kHz (pin 12), 625 Hz (pin 11)</td></tr>
<tr><td>IC3 · 7490, contador decimal (BCD 0 a 9)</td><td>Cuenta los pulsos de 625 Hz y genera las señales de datos D1 a D4.</td><td>D1 = 312,5 Hz (50 %); D2, D3 y D4 con periodo de 16 ms (40 %, 40 % y 20 %)</td></tr>
<tr><td>IC4 · 7400 (4 compuertas NAND)</td><td>Multiplexor 2:1: si el dato es "1" pasa QA y si es "0" pasa QC.</td><td>FSK OUTPUT: cuadrada de 5 kHz o de 1,25 kHz</td></tr></table>
<div class="formula">555 astable:  f = 1,44 / ((R1 + 2·R2)·C1) = 1,44 / ((560 + 1 360 000)·100 pF) ≈ 10,6 kHz   (la serigrafía dice 10 kHz)
t_alto = 0,693·(R1+R2)·C1 ≈ 47 µs    t_bajo = 0,693·R2·C1 ≈ 47 µs   → duty ≈ 50 %</div>
<h3>Datos D1…D4 (por qué tienen frecuencias y duty distintos)</h3>
<p>El 7490 cuenta 0,1,2…9 en binario BCD. Cada salida es un bit de esa cuenta, y avanza cada 1/625 Hz = 1,6 ms:</p>
<table><tr><th>Cuenta</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>Frecuencia</th><th>Duty</th></tr>
<tr><td>D1 = QA</td><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td><td>0</td><td>1</td><td>312,5 Hz</td><td>50 %</td></tr>
<tr><td>D2 = QB</td><td>0</td><td>0</td><td>1</td><td>1</td><td>0</td><td>0</td><td>1</td><td>1</td><td>0</td><td>0</td><td>62,5 Hz (patrón)</td><td>40 %</td></tr>
<tr><td>D3 = QC</td><td>0</td><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td><td>1</td><td>1</td><td>0</td><td>0</td><td>62,5 Hz</td><td>40 %</td></tr>
<tr><td>D4 = QD</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>0</td><td>1</td><td>1</td><td>62,5 Hz</td><td>20 %</td></tr></table>
<h3>Parámetros de la señal FSK (con D1)</h3>
<div class="formula">f_marca ("1") = 5 kHz      f_espacio ("0") = 1,25 kHz
Frecuencia central   fc = (f1 + f0)/2 = 3,125 kHz
Desviación de frecuencia   Δf = |f1 − f0|/2 = 1,875 kHz
Con D1: cada bit dura 1,6 ms → tasa de bits fb = 625 b/s (D1 = 312,5 Hz es la "alternancia 1010", cuya fundamental es fb/2)
Índice de modulación   h = |f1 − f0| / fb = 3750 / 625 = 6
Ancho de banda mínimo (Tomasi)   B ≈ |f1 − f0| + 2·fb = 3750 + 1250 = 5 kHz</div>
<h3>Espectro</h3>
<p>Una FSK binaria es como la <b>suma de dos ASK (OOK)</b>: una con portadora f1 encendida cuando el dato es 1 y otra con portadora f0 encendida cuando el dato es 0. En el analizador se ven <b>dos grupos de rayas, centrados en 1,25 kHz y en 5 kHz</b>, cada uno con bandas laterales separadas por la frecuencia de la moduladora (312,5 Hz con D1). Como la salida es cuadrada, además aparecen <b>armónicos impares</b> (3·1,25 = 3,75 kHz, 3·5 = 15 kHz, etc.). Si se cambia a D4, las rayas laterales se acercan (62,5 Hz) y la altura relativa de cada tono cambia según el duty: con D4 (20 % en 1) el tono de 1,25 kHz domina.</p>
<h3>Demodulador (no coherente)</h3>
<ol><li><b>IC5-A, filtro pasabanda activo de realimentación múltiple (MFB):</b> R3 = 1 k, R4 = 22 k, C3 = C4 = 0,047 µF y P1 a tierra. P1 mueve la frecuencia central f0 (≈ 1 kHz a 7 kHz). Una frecuencia pasa con mucha amplitud y la otra con poca, así que la FSK se convierte en algo parecido a una ASK.</li>
<li><b>IC5-B, rectificador de precisión</b> (D1 y D2 1N4148): deja pasar solo la magnitud.</li>
<li><b>IC5-C, pasabajos</b> (R11 = 1k5, C5 = 0,1 µF, fc ≈ 1,06 kHz): obtiene la envolvente.</li>
<li><b>IC5-D, comparador</b> con umbral P2 (divisor de +12 V): decide si es "1" o "0". El zener ZD1 de 5,1 V limita la salida a niveles compatibles con TTL.</li></ol>
<div class="formula">MFB: f0 = (1/2πC)·√((R3 + P1)/(R3·R4·P1))     ganancia en el centro = −R4/(2·R3) = −11     Q = ½·√(R4·(R3+P1)/(R3·P1))</div>
<div class="note">💡 Si el filtro queda centrado cerca de 5 kHz, el "1" sale con amplitud alta y el comparador <b>invierte</b> el dato. Si queda cerca de 1,25 kHz no lo invierte. Por eso hay que ajustar P1 y P2 mirando DATA OUTPUT junto con el dato original. Con D1 cada bit dura solo 2 ciclos de 1,25 kHz, así que la envolvente tiene mucho rizado y en el simulador el dato recuperado sale más deformado que con D2, D3 o D4.</div>`,

    psk: `
<h2>PSK · Modulación por desplazamiento de fase (BPSK)</h2>
<p><b>Idea:</b> la portadora mantiene amplitud y frecuencia; el dato cambia su <b>fase</b> entre 0° y 180°. Equivale a multiplicar la portadora por una señal NRZ bipolar (±1), es decir, una AM de doble banda lateral con portadora suprimida (DSB-SC).</p>
${blockPSK()}
<table><tr><th>Bloque</th><th>Qué hace</th><th>Señal</th></tr>
<tr><td>IC1 · 741, oscilador puente de Wien (C1 = C2 = 0,001 µF, R1 = 10 k, PR1 = 10 k)</td><td>Genera la portadora senoidal. Los diodos D1 y D2 estabilizan la amplitud.</td><td>CARRIER OUTPUT ≈ 5 Vpp, ≈ 22 kHz</td></tr>
<tr><td>IC2-A + TR1 (BC-107)</td><td>Convierten la senoide en pulsos (cuadrada) para hacer funcionar el contador.</td><td>Pulsos a fc</td></tr>
<tr><td>IC3 · 7490</td><td>Cuenta los ciclos de la portadora (por eso los datos están sincronizados con ella y cambian en sus cruces por cero).</td><td>D1 = fc/2 (1 bit por ciclo); D2, D3 y D4 con periodo de 10 ciclos</td></tr>
<tr><td>IC-4 · 741 inversor (R12 = R13 = 47 k)</td><td>Ganancia −1, o sea la portadora desfasada 180°.</td><td>−portadora</td></tr>
<tr><td>IC5 · CD4051 (multiplexor analógico)</td><td>El dato (pin 11) elige el canal X1 (portadora) o el X0 (portadora invertida).</td><td>PSK O/P</td></tr></table>
<div class="formula">Wien: f = 1/(2π·√(R1·PR1·C1·C2)) → con PR1 ≈ 5,2 kΩ: f ≈ 22 kHz;   condición de oscilación: ganancia del amplificador = 3
BPSK: s(t) = ±A·sen(2π·fc·t)       1 bit por símbolo → baudios = fb
Ancho de banda mínimo (Nyquist) B = fb ;   lóbulo principal del espectro (de nulo a nulo) = 2·fb</div>
<h3>Espectro (lo más preguntable)</h3>
<ul><li>Con <b>D1</b> (cuadrada de duty 50 %, valor medio bipolar = 0) <b>la portadora desaparece</b>. Quedan rayas en fc ± fD, fc ± 3fD, …, con fD = fc/2. Con fc = 22 kHz se ven rayas en 11 kHz y 33 kHz (y más arriba), pero no en 22 kHz.</li>
<li>Con <b>D4</b> (duty 20 %) la señal bipolar tiene valor medio −0,6, así que <b>aparece una raya en fc</b> con 0,6·A, más bandas laterales cada fc/10.</li>
<li>Regla general: la amplitud de la raya en fc es proporcional a |2·duty − 1|.</li></ul>
<h3>Demodulación (coherente)</h3>
<p>Necesita una <b>portadora de referencia en fase</b> (CARRIER INPUT del demodulador). La PSK y la referencia se cuadran con comparadores (IC2-D, IC2-C e IC2-B) y entran a una XOR (7486), que funciona como detector de fase: entrega 0 cuando están en fase y 1 cuando están en contrafase. Un filtro RC (R20 y C7) elimina los pulsos angostos y otra XOR, usada como inversor, entrega el dato.</p>
<div class="note">💡 Si la referencia llega invertida, o sin conectar, el dato sale invertido o queda basura. Esa es la <b>ambigüedad de fase de 180°</b> de la BPSK, y se resuelve con codificación diferencial (DPSK).</div>`,

    qam: `
<h2>QAM / DQAM · Modulación de amplitud en cuadratura (TESCA 40623, 8-QAM)</h2>
<p><b>Idea:</b> se transmiten varios bits por símbolo variando a la vez la <b>fase y la amplitud</b>. En 8-QAM se agrupan 3 bits (un <b>tribit</b> I, Q, C): I y Q eligen uno de 4 cuadrantes de fase y C elige una de 2 amplitudes. En total son 8 símbolos.</p>
${blockQAM()}
<h3>Bloques del kit</h3>
<table><tr><th>Bloque</th><th>Función</th></tr>
<tr><td>CLOCK & DATA GENERATOR (SW1, SW2, SW3)</td><td>Tres DIP switch de 8 bits forman una trama de 24 bits que se repite. Salidas S-DATA (serie, NRZ-L) y S-CLK (reloj de bit).</td></tr>
<tr><td>NRZ-L CODER</td><td>Formato NRZ-L: "1" = nivel alto y "0" = nivel bajo durante todo el bit, sin volver a cero.</td></tr>
<tr><td>TRIBIT CODER + TRIBIT CLOCK GENERATOR</td><td>Convertidor serie-paralelo: cada 3 bits entrega I, Q y C, que se mantienen durante 3 periodos de bit. I-CLK, Q-CLK y C-CLK indican qué bit del tribit se está cargando.</td></tr>
<tr><td>DIFFERENTIAL ENCODER-1 y 2</td><td>Salida = entrada XOR (salida anterior retardada un símbolo). Convierten QAM en <b>DQAM</b>: la información queda en los cambios de fase y no en la fase absoluta.</td></tr>
<tr><td>CARRIER GENERATOR</td><td>4 senoides de igual frecuencia (500 kHz según la ficha técnica) desfasadas 0°, 90°, 180° y 270°.</td></tr>
<tr><td>CARRIER MODULATOR</td><td>Canal I: 0° si I = 1 y 180° si I = 0. Canal Q: 90° si Q = 1 y 270° si Q = 0. Se suman, y C escala la amplitud.</td></tr>
<tr><td>SWITCH FAULTS (SW4)</td><td>Introducen fallas para diagnosticarlas con el osciloscopio.</td></tr></table>
<h3>Tabla de verdad 8-QAM (Tomasi)</h3>
<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start"><table style="max-width:520px"><tr><th>Q</th><th>I</th><th>C</th><th>Amplitud</th><th>Fase</th></tr>
<tr><td>0</td><td>0</td><td>0</td><td>0,765 V</td><td>−135°</td></tr><tr><td>0</td><td>0</td><td>1</td><td>1,848 V</td><td>−135°</td></tr>
<tr><td>0</td><td>1</td><td>0</td><td>0,765 V</td><td>−45°</td></tr><tr><td>0</td><td>1</td><td>1</td><td>1,848 V</td><td>−45°</td></tr>
<tr><td>1</td><td>0</td><td>0</td><td>0,765 V</td><td>+135°</td></tr><tr><td>1</td><td>0</td><td>1</td><td>1,848 V</td><td>+135°</td></tr>
<tr><td>1</td><td>1</td><td>0</td><td>0,765 V</td><td>+45°</td></tr><tr><td>1</td><td>1</td><td>1</td><td>1,848 V</td><td>+45°</td></tr></table>${constellation()}</div>
<p class="muted small">El orden en que el kit asigna los bits del tribit (I, Q, C) puede variar entre versiones. En el simulador, el 1.er bit es I, el 2.º es Q y el 3.º es C. Relación de amplitudes 0,765/1,848 = 0,414.</p>
<div class="formula">Bits por símbolo N = log2(M) = log2(8) = 3
Tasa de símbolos (baudios) = fb / 3        (con fb = 250 kb/s → 83,3 kbaudios, símbolo de 12 µs = 6 ciclos de 500 kHz)
Ancho de banda mínimo B = fb / 3   →   eficiencia = fb / B = 3 b/s/Hz
Comparación: BPSK 1 b/s/Hz · QPSK 2 b/s/Hz · 8-PSK y 8-QAM 3 b/s/Hz · 16-QAM 4 b/s/Hz</div>
<h3>Qué se ve con el osciloscopio</h3>
<ul><li><b>Portadoras:</b> SIN1 y SIN2 están desfasadas 90° (0,5 µs a 500 kHz). En modo X-Y forman un <b>círculo</b>. SIN1 y SIN3 forman una <b>recta inclinada a −45°</b> (contrafase).</li>
<li><b>MOD OUTPUT</b> disparado con SYNC CLK: tramos de 12 µs con 4 fases posibles y 2 amplitudes. Los cambios de fase se ven como "quiebres" en la senoide.</li>
<li><b>Espectro:</b> centrado en la portadora (500 kHz), con un lóbulo principal de ancho 2·baudios = 166,7 kHz (de nulo a nulo). Como la trama se repite cada 96 µs, el espectro tiene rayas separadas 10,42 kHz.</li></ul>
<div class="note">💡 Por qué DQAM: el receptor recupera la portadora con un PLL que puede quedar enganchado con 90° o 180° de error, lo que rota toda la constelación. Al codificar las diferencias, una rotación constante no cambia los datos decodificados.</div>`
  };

  /* ---------------- preguntas de desarrollo (respuesta oculta) ---------------- */
  const QA = [
    ['FSK', '¿Qué frecuencias corresponden al "1" y al "0" en el módulo FSK y de dónde salen?', 'De las salidas del contador 74163 que divide el reloj del 555 (10 kHz): QA (pin 14) = 10k/2 = 5 kHz para el "1" (marca) y QC (pin 12) = 10k/8 = 1,25 kHz para el "0" (espacio). Las compuertas NAND 7400 funcionan como multiplexor controlado por DATA INPUT.'],
    ['FSK', '¿Por qué D1, D2, D3 y D4 tienen formas distintas?', 'Son las 4 salidas del contador decimal 7490 (BCD 0 a 9), que cuenta los pulsos de 625 Hz. QA alterna en cada cuenta (312,5 Hz, 50 %). QB vale 1 en las cuentas 2,3,6,7 (40 %, con un patrón de dos pulsos). QC vale 1 en 4 a 7 (40 %). QD vale 1 en 8 y 9 (20 %). El ciclo completo dura 10 × 1,6 ms = 16 ms.'],
    ['FSK', 'Calcula la frecuencia del 555 con R1 = 560 Ω, R2 = 680 kΩ y C1 = 100 pF.', 'f = 1,44/((R1 + 2R2)·C) = 1,44/(1 360 560 × 100·10⁻¹²) ≈ 10,58 kHz. Duty = (R1+R2)/(R1+2R2) ≈ 50 %.'],
    ['FSK', 'Determina la desviación de frecuencia y el índice de modulación con D1.', 'Δf = (5000 − 1250)/2 = 1875 Hz. fb = 2 × 312,5 = 625 b/s. h = |f1 − f0|/fb = 3750/625 = 6.'],
    ['FSK', '¿Qué se ve en el espectro de la FSK?', 'Dos grupos de rayas, en 1,25 kHz y en 5 kHz (como dos ASK superpuestas), con bandas laterales separadas por la frecuencia de la moduladora, más los armónicos impares de cada tono porque la salida es cuadrada. El ancho de banda aproximado es |f1 − f0| + 2fb.'],
    ['FSK', 'Explica el demodulador FSK del módulo.', 'Es no coherente: (1) un pasabanda MFB (IC5-A) sintonizado con P1 convierte la diferencia de frecuencia en diferencia de amplitud; (2) un rectificador de precisión (IC5-B); (3) un pasabajos (IC5-C) que extrae la envolvente; (4) un comparador (IC5-D) con umbral P2, cuya salida limita el zener de 5,1 V.'],
    ['FSK', '¿Qué pasa si DATA INPUT queda desconectado?', 'Una entrada TTL al aire se comporta como "1", así que la salida queda fija en la frecuencia de marca (5 kHz).'],
    ['PSK', '¿Cómo genera la PSK el módulo?', 'La portadora va directa al canal X1 del multiplexor CD4051, y a través de un 741 inversor (ganancia −1, o sea 180°) al canal X0. El dato en la entrada de selección elige uno u otro: la salida es la portadora con fase 0° o 180°.'],
    ['PSK', '¿Por qué los datos del módulo PSK cambian justo en los cruces por cero de la portadora?', 'Porque el 7490 que genera D1 a D4 se alimenta con la misma portadora cuadrada por TR1. Los datos quedan sincronizados con la portadora, y los saltos de fase se ven limpios.'],
    ['PSK', '¿Qué componentes espectrales tiene la PSK con D1?', 'La moduladora bipolar tiene valor medio cero, así que la portadora queda suprimida. Hay rayas en fc ± fD, fc ± 3fD…, con fD = fc/2: con fc ≈ 22 kHz aparecen en 11 kHz y 33 kHz, entre otras.'],
    ['PSK', '¿Por qué con D4 aparece una raya en la frecuencia portadora?', 'D4 tiene duty de 20 %, y su versión bipolar tiene valor medio 0,2 − 0,8 = −0,6 ≠ 0. Ese valor medio deja una componente de portadora de 0,6·A.'],
    ['PSK', '¿Por qué el demodulador PSK necesita la portadora?', 'Porque es coherente: compara la fase de la señal recibida con una referencia (XOR de las dos señales cuadradas = multiplicador + filtro). Sin referencia, o con referencia invertida, el dato sale invertido o con basura (ambigüedad de 180°).'],
    ['PSK', '¿Cuál es el ancho de banda mínimo de BPSK?', 'B = fb (Nyquist), con 1 bit por baudio. El lóbulo principal del espectro (de nulo a nulo) mide 2fb.'],
    ['QAM', '¿Qué es un tribit y qué hace cada bit en 8-QAM?', 'Son 3 bits que forman un símbolo. I elige el sentido del canal en fase (0° o 180°), Q el del canal en cuadratura (90° o 270°) y C la amplitud (0,765 o 1,848 V, relación 0,414). Resultado: 4 fases (±45°, ±135°) × 2 amplitudes = 8 símbolos.'],
    ['QAM', '¿Cómo compruebas el desfase de las 4 portadoras?', 'Con dos canales en SIN1 y SINx, midiendo el retardo Δt entre cruces por cero: φ = 360°·Δt·f. A 500 kHz, 90° equivale a 0,5 µs. También en modo X-Y: 90° da un círculo y 180° una recta con pendiente negativa.'],
    ['QAM', 'Con fb = 250 kb/s, ¿cuál es la tasa de símbolos y el ancho de banda mínimo?', 'Baudios = fb/3 = 83,3 kbaudios (símbolo de 12 µs). B mínimo = fb/3 = 83,3 kHz. Eficiencia = 3 b/s/Hz.'],
    ['QAM', '¿Para qué sirven los switches SW1 a SW3?', 'Definen la trama de 24 bits (3 × 8) que el generador repite en S-DATA. Cambiándolos se eligen los tribits, y con ellos los símbolos de la salida. Ejemplo: con los 8 tribits 000…111 se ven los 8 símbolos.'],
    ['QAM', '¿Qué diferencia hay entre QAM y DQAM?', 'En DQAM los bits I y Q pasan antes por codificadores diferenciales (salida = entrada XOR salida anterior). La información queda en el cambio de fase entre símbolos, lo que hace al receptor inmune a una rotación fija de fase de la portadora recuperada.'],
    ['QAM', '¿Qué se observa en el espectro de la salida 8-QAM?', 'Energía centrada en la portadora (500 kHz) con un lóbulo principal de ancho 2·baudios entre nulos, más lóbulos secundarios. Como la trama se repite, el espectro es de rayas separadas 1/T_trama (10,42 kHz).'],
    ['QAM', 'Si la salida modulada muestra solo 4 fases y una sola amplitud, ¿qué podría estar fallando?', 'El bit C no llega o está fijo (cable C-BIT a C I/P-3 suelto, o una falla en el codificador tribit). En ese caso la señal se comporta como QPSK.'],
    ['General', 'Ordena por eficiencia espectral: FSK, BPSK, QPSK y 8-QAM.', 'FSK (menos de 1 b/s/Hz) < BPSK (1) < QPSK (2) < 8-QAM (3). A cambio, al aumentar los bits por símbolo se necesita más relación señal/ruido.'],
    ['General', '¿Cómo mides frecuencia y amplitud con el osciloscopio?', 'Periodo = divisiones horizontales × tiempo/div, y f = 1/T. Vpp = divisiones verticales × V/div. Conviene disparar (trigger) con la moduladora en CH1 y ver la modulada en CH2.']
  ];

  /* ---------------- banco de preguntas de alternativas ---------------- */
  const MCQ = [
    ['FSK', 'En el módulo FSK, el reloj básico (BASIC CLOCK) lo genera:', ['Un 555 en modo astable', 'Un 7490', 'Un oscilador de Wien', 'Un cristal de cuarzo'], 0, 'IC1 es un 555 astable con R1, R2 y C1 = 100 pF, que da ≈ 10 kHz.'],
    ['FSK', 'La frecuencia de D1 en el módulo FSK es aproximadamente:', ['312,5 Hz', '625 Hz', '5 kHz', '62,5 Hz'], 0, '10 kHz/16 = 625 Hz entra al 7490, y QA lo divide por 2: 312,5 Hz.'],
    ['FSK', 'El duty de D4 (QD del 7490) es:', ['20 %', '50 %', '40 %', '10 %'], 0, 'QD vale 1 solo en las cuentas 8 y 9 de 10: 2/10 = 20 %.'],
    ['FSK', 'Si DATA = "1", la salida FSK del módulo tiene una frecuencia de:', ['5 kHz', '1,25 kHz', '10 kHz', '2,5 kHz'], 0, 'Con "1" pasa QA (pin 14 del 74163) = 10 kHz/2.'],
    ['FSK', 'La desviación de frecuencia Δf de la FSK del módulo es:', ['1,875 kHz', '3,75 kHz', '3,125 kHz', '625 Hz'], 0, 'Δf = (5 − 1,25)/2 = 1,875 kHz.'],
    ['FSK', 'El demodulador FSK del módulo es del tipo:', ['No coherente (filtro + detector de envolvente + comparador)', 'Coherente con PLL', 'Discriminador de Foster-Seeley', 'Detector de cruces por cero digital'], 0, 'Pasabanda MFB, rectificador, pasabajos y comparador.'],
    ['FSK', 'La perilla P1 ("FSK INPUT DEMODULATOR ADJ.") ajusta:', ['La frecuencia central del pasabanda', 'El umbral del comparador', 'La frecuencia del 555', 'La amplitud de la salida'], 0, 'P1 es la resistencia a tierra del filtro MFB: cambia f0.'],
    ['FSK', 'La perilla P2 ajusta:', ['El umbral del comparador IC5-D', 'La frecuencia central del filtro', 'La ganancia del rectificador', 'El duty de los datos'], 0, 'P2 es un divisor de +12 V conectado a la entrada no inversora del comparador.'],
    ['FSK', 'El espectro de una FSK binaria se puede ver como:', ['La suma de dos señales ASK en f1 y f0', 'Una sola raya en fc', 'Un espectro plano', 'Una DSB-SC centrada en fc'], 0, 'Cada tono se "enciende" con el dato o con su complemento.'],
    ['PSK', 'En BPSK, cada cambio de bit produce un salto de fase de:', ['180°', '90°', '45°', '360°'], 0, 'Dos fases: 0° y 180°.'],
    ['PSK', 'En el modulador PSK del módulo, la portadora desfasada 180° la produce:', ['Un 741 inversor de ganancia −1', 'El 4051', 'El 7486', 'El transistor TR1'], 0, 'IC-4 741 con R12 = R13 = 47 k.'],
    ['PSK', 'El CD4051 del modulador PSK es:', ['Un multiplexor analógico', 'Un contador', 'Un comparador', 'Un oscilador'], 0, 'Selecciona entre la portadora y su versión invertida según el dato.'],
    ['PSK', 'La portadora del módulo PSK se genera con:', ['Un oscilador puente de Wien con un 741', 'Un 555', 'Un cristal', 'Un VCO 4046'], 0, 'C1, C2, R1 y PR1 forman la red de Wien; los diodos estabilizan la amplitud.'],
    ['PSK', 'Con D1 (duty 50 %) como moduladora, en el espectro BPSK la raya en fc:', ['Desaparece (portadora suprimida)', 'Es la más grande', 'Vale A/2', 'Se duplica'], 0, 'La NRZ bipolar con duty 50 % tiene valor medio cero.'],
    ['PSK', 'El demodulador PSK del módulo usa como detector de fase:', ['Una compuerta XOR (7486)', 'Un diodo de envolvente', 'Un PLL 565', 'Un filtro pasabanda'], 0, 'La XOR de las dos señales cuadradas indica si están en fase o en contrafase.'],
    ['PSK', 'Si al demodulador PSK no se le conecta la portadora de referencia:', ['No puede recuperar el dato correctamente', 'Funciona igual', 'Solo cambia la amplitud', 'La salida se duplica en frecuencia y es correcta'], 0, 'La detección es coherente: necesita la referencia.'],
    ['PSK', 'La ambigüedad de fase de 180° en BPSK se resuelve con:', ['Codificación diferencial (DPSK)', 'Más amplitud', 'Un filtro pasabajos', 'Un 555'], 0, 'Se codifican los cambios y no la fase absoluta.'],
    ['PSK', 'Ancho de banda mínimo (Nyquist) de BPSK para fb bits/s:', ['fb', 'fb/2', '2fb', 'fb/3'], 0, 'Un bit por baudio.'],
    ['QAM', '¿Cuántos bits por símbolo transmite 8-QAM?', ['3', '2', '8', '4'], 0, 'log2(8) = 3 (tribit).'],
    ['QAM', 'En 8-QAM, el bit C controla:', ['La amplitud', 'La fase del canal I', 'La frecuencia', 'El reloj'], 0, 'I y Q eligen el cuadrante de fase; C elige la amplitud.'],
    ['QAM', 'Las portadoras del kit QAM están desfasadas:', ['0°, 90°, 180° y 270°', '0° y 180°', '0°, 45°, 90° y 135°', 'Todas en fase'], 0, 'Es lo que hay que confirmar en el paso 2 del laboratorio.'],
    ['QAM', 'A 500 kHz, un desfase de 90° equivale a un retardo de:', ['0,5 µs', '2 µs', '1 µs', '0,25 µs'], 0, 'T = 2 µs, y 90° = T/4 = 0,5 µs.'],
    ['QAM', 'Con fb = 250 kb/s, la tasa de símbolos en 8-QAM es:', ['83,3 kbaudios', '250 kbaudios', '125 kbaudios', '62,5 kbaudios'], 0, 'fb/3.'],
    ['QAM', 'La relación entre las dos amplitudes de 8-QAM (0,765 V y 1,848 V) es:', ['0,414', '0,5', '0,707', '0,25'], 0, '0,765/1,848 ≈ 0,414 = √2 − 1.'],
    ['QAM', 'La función del TRIBIT CODER es:', ['Convertir los datos serie en grupos paralelos de 3 bits (I, Q, C)', 'Generar las portadoras', 'Codificar diferencialmente', 'Filtrar la salida'], 0, 'Es un convertidor serie-paralelo con latch.'],
    ['QAM', 'Los switches SW1, SW2 y SW3 del kit QAM sirven para:', ['Definir la trama de 24 bits de datos', 'Introducir fallas', 'Elegir la portadora', 'Encender el kit'], 0, 'Son 3 × 8 bits. SW4 es el de las fallas.'],
    ['QAM', 'El codificador diferencial calcula:', ['salida = entrada XOR salida anterior', 'salida = entrada AND reloj', 'salida = NOT entrada', 'salida = entrada retardada'], 0, 'e_k = d_k ⊕ e_(k−1).'],
    ['QAM', 'En el modo X-Y, SIN1 contra SIN2 (90°) se ve como:', ['Un círculo (o elipse)', 'Una recta a 45°', 'Un punto', 'Una cuadrada'], 0, 'Figura de Lissajous con desfase de 90°.'],
    ['QAM', 'La eficiencia espectral teórica de 8-QAM es:', ['3 b/s/Hz', '1 b/s/Hz', '8 b/s/Hz', '2 b/s/Hz'], 0, 'N bits por baudio con B mínimo = baudios.'],
    ['General', 'Para ver estable una señal modulada con datos, lo mejor es disparar (trigger) con:', ['La señal moduladora o el reloj de sincronismo', 'La señal modulada', 'La tierra', 'Da lo mismo'], 0, 'La moduladora, o SYNC CLK en QAM, marca el inicio de cada bit o símbolo.'],
    ['General', 'Un osciloscopio con acople AC:', ['Elimina la componente continua de la señal', 'Elimina la componente alterna', 'Duplica la amplitud', 'Mide corriente'], 0, 'Con acople AC un condensador bloquea la continua.']
  ];

  /* ---------------- render ---------------- */
  let quiz = null;
  const Study = {
    render(tab, root) {
      if (tab === 'study') return this.study(root);
      if (tab === 'quiz') return this.quiz(root);
      if (tab === 'help') return this.help(root);
    },
    study(root) {
      const sub = root.dataset.sub || 'fsk';
      root.innerHTML = `<h1>📚 Estudio para la interrogación</h1>
        <div class="subtabs">${['fsk', 'psk', 'qam', 'preg'].map(s => `<button data-s="${s}" class="${s === sub ? 'active' : ''}">${{ fsk: 'FSK', psk: 'PSK', qam: 'QAM / DQAM', preg: 'Preguntas probables' }[s]}</button>`).join('')}</div><div id="stBody"></div>`;
      root.querySelectorAll('.subtabs button').forEach(b => b.onclick = () => { root.dataset.sub = b.dataset.s; this.study(root); });
      const body = root.querySelector('#stBody');
      if (sub === 'preg') {
        body.innerHTML = `<p>Preguntas de desarrollo basadas en las guías de las experiencias 7, 8 y 9 (objetivos: formas de onda en el tiempo y composición espectral, valores de frecuencia y amplitud, demodulación y consistencia). Intenta responder antes de abrir cada una.</p>` +
          ['FSK', 'PSK', 'QAM', 'General'].map(g => `<h2>${g}</h2>` + QA.filter(q => q[0] === g).map(q => `<details class="qa"><summary>${q[1]}</summary><div>${q[2]}</div></details>`).join('')).join('');
      } else body.innerHTML = STUDY[sub] + `<p><button onclick="location.hash='${sub}';App.go('${sub}')">→ Ir al simulador ${sub.toUpperCase()}</button></p>`;
    },
    quiz(root) {
      if (!quiz) {
        root.innerHTML = `<h1>📝 Interrogación simulada</h1>
          <p>Se eligen preguntas al azar del banco (${MCQ.length} preguntas de FSK, PSK, QAM y uso del osciloscopio), con cronómetro. Cada respuesta muestra la explicación.</p>
          <div class="row"><label>Cantidad <select id="qn"><option>10</option><option selected>15</option><option>20</option><option value="${MCQ.length}">Todas (${MCQ.length})</option></select></label>
          <label>Tema <select id="qt"><option value="">Todos</option><option>FSK</option><option>PSK</option><option>QAM</option></select></label>
          <label>Tiempo <select id="qm"><option value="15">15 min</option><option value="30" selected>30 min</option><option value="60">60 min</option></select></label>
          <button id="qStart" class="active">Comenzar</button></div>`;
        root.querySelector('#qStart').onclick = () => {
          const n = +root.querySelector('#qn').value, t = root.querySelector('#qt').value, m = +root.querySelector('#qm').value;
          let pool = MCQ.filter(q => !t || q[0] === t || q[0] === 'General');
          pool = pool.map(q => [Math.random(), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]).slice(0, n);
          quiz = { qs: pool.map(q => { const order = q[2].map((o, i) => [Math.random(), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]); return { q, order, ans: null }; }), end: Date.now() + m * 60000 };
          this.quiz(root);
        };
        return;
      }
      const draw = () => {
        const done = quiz.qs.filter(x => x.ans !== null).length, ok = quiz.qs.filter(x => x.ans === x.q[3]).length;
        root.innerHTML = `<h1>📝 Interrogación simulada</h1><div class="row" style="align-items:center;gap:18px"><span class="timer" id="qTimer"></span><span class="score">${ok} / ${done} correctas · ${quiz.qs.length - done} sin responder</span><button id="qNew">Nueva interrogación</button></div>` +
          quiz.qs.map((x, k) => `<div class="quizQ ${x.ans !== null ? 'answered' : ''}" data-k="${k}"><b>${k + 1}. [${x.q[0]}]</b> ${x.q[1]}<div class="opts">${x.order.map(i => `<button data-i="${i}" class="${x.ans !== null ? (i === x.q[3] ? 'right' : (i === x.ans ? 'wrong' : '')) : ''}">${x.q[2][i]}</button>`).join('')}</div><div class="exp">${x.ans === x.q[3] ? '✅ Correcto. ' : '❌ Incorrecto. '}${x.q[4]}</div></div>`).join('') +
          (done === quiz.qs.length ? `<div class="card"><div class="score">Resultado: ${ok}/${quiz.qs.length} (nota ≈ ${(1 + 6 * ok / quiz.qs.length).toFixed(1)} en escala 1 a 7)</div></div>` : '');
        root.querySelectorAll('.quizQ').forEach(div => div.querySelectorAll('.opts button').forEach(b => b.onclick = () => { const x = quiz.qs[+div.dataset.k]; if (x.ans !== null) return; x.ans = +b.dataset.i; const y = window.scrollY; draw(); window.scrollTo(0, y); }));
        root.querySelector('#qNew').onclick = () => { quiz = null; this.quiz(root); };
        tick();
      };
      const tick = () => {
        const t = root.querySelector('#qTimer'); if (!t || !quiz) return;
        const s = Math.max(0, Math.round((quiz.end - Date.now()) / 1000));
        t.textContent = `⏱ ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        t.style.color = s < 120 ? '#ff6b6b' : '';
      };
      clearInterval(this._qi); this._qi = setInterval(tick, 1000);
      draw();
    },
    help(root) {
      root.innerHTML = `<h1>❔ Cómo usar el simulador</h1>
<h2>Paneles</h2>
<ul><li>Cada módulo se muestra con la <b>foto real del panel</b>. Los bornes son los círculos que se iluminan al pasar el mouse. Al pasar sobre uno ves qué es y <b>qué señal deberías medir ahí</b>.</li>
<li><b>🔌 Cable:</b> clic en un borne y luego en otro. Se pueden conectar varios cables al mismo borne. Clic sobre un cable para quitarlo. Con <kbd>Esc</kbd> cancelas un cable a medio poner.</li>
<li><b>Sonda CH1 / CH2:</b> elige el modo (o pulsa las teclas <kbd>1</kbd> y <kbd>2</kbd>) y haz clic en el borne a medir. Se puede medir cualquier borne, aunque no tenga cable.</li>
<li><b>Puntos de prueba internos</b> (círculos naranjos punteados): pines de los integrados que no tienen borne en el panel real, pero sirven para entender el circuito (por ejemplo, la salida del filtro del demodulador FSK).</li>
<li><b>POWER:</b> los módulos FSK y PSK parten <b>apagados</b>, igual que en el laboratorio. Sin encenderlos todo mide 0 V.</li>
<li>Una entrada <b>sin conectar</b> no recibe señal: el modulador o demodulador se comporta como en la realidad (por ejemplo, una entrada TTL al aire se lee como "1").</li></ul>
<h2>Osciloscopio</h2>
<ul><li>V/div, posición y acople (DC/AC/GND) por canal; tiempo/div y posición horizontal; disparo por nivel y pendiente; modo AUTO o NORMAL; RUN/STOP y SINGLE; modo X-Y.</li>
<li><b>AUTOSET</b> ajusta escalas y nivel de disparo automáticamente.</li>
<li>Abajo de la pantalla se muestran las <b>mediciones automáticas</b>: Vpp, Vmáx, Vmín, Vprom, Vrms, frecuencia, periodo y duty.</li>
<li><b>Analizador de espectro:</b> calcula la FFT (ventana Hann) de la señal de CH1 o CH2 y marca los picos con su frecuencia y nivel en dBV.</li></ul>
<h2>Qué tan fiel es (léelo)</h2>
<table><tr><th>Dato</th><th>Origen</th></tr>
<tr><td>Bornes, controles y bloques de cada panel</td><td>Fotos de tus módulos.</td></tr>
<tr><td>FSK: 10 kHz, 74163 → 5 k / 1,25 k, 7490 → D1 a D4, demodulador MFB + rectificador + pasabajos + comparador con los valores de R y C serigrafiados</td><td>Derivado del circuito impreso en el panel.</td></tr>
<tr><td>FSK: qué frecuencia corresponde al "1" (5 kHz) y cuál al "0" (1,25 kHz)</td><td>Deducido del cableado del 7400; verifícalo en el laboratorio (si fuera al revés, solo se intercambian).</td></tr>
<tr><td>PSK: portadora ≈ 22 kHz y 5 Vpp, 7490 contando ciclos de portadora, 4051 + inversor, demodulador con XOR 7486</td><td>Ficha técnica TESCA del kit PSK y circuito del panel.</td></tr>
<tr><td>QAM: portadoras de 500 kHz a 0°, 90°, 180° y 270°, trama de 24 bits con 3 × 8 switches, tribit I/Q/C, DQAM</td><td>Ficha técnica TESCA 40623.</td></tr>
<tr><td>QAM: reloj de bit 250 kHz, amplitud de 4 Vpp, asignación de bits del tribit y las 4 fallas de SW4</td><td><b>Supuestos razonables</b>: la ficha no los precisa (dice 250 kHz o 250 Hz). Compáralos con lo que midas.</td></tr></table>
<p class="muted">Simulador de estudio. No reemplaza el manual del fabricante.</p>`;
    }
  };
  window.Study = Study;
})();
