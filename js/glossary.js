/* =====================================================================
   Glosario de etapas: recorte de cada etapa del módulo + qué es, qué hace,
   cómo funciona y cómo se usa/conecta en las experiencias 7, 8 y 9.
   ===================================================================== */
(function () {
  'use strict';

  // Cada etapa: img (recorte), t (nombre), tag (chip), que, hace, como, uso, mide
  const MODS = [
    {
      id: 'fsk', title: 'FSK · TESCA 40506 (Experiencia 7)',
      intro: 'En la experiencia 7 se arma una modulación FSK con el módulo, se miden portadora, moduladora (D1 y luego otra) y modulada en el tiempo y en el espectro, se calcula la desviación de frecuencia y después se demodula. La mitad de arriba del panel es el <b>modulador y generador de datos</b>; la mitad de abajo es el <b>demodulador</b>.',
      wiring: [
        ['D1 (DATA)', 'DATA INPUT', 'El dato D1 es la señal moduladora. Después se repite con D2, D3 o D4.'],
        ['FSK OUTPUT', 'FSK INPUT', 'Lleva la señal modulada al demodulador.'],
        ['Sonda CH1', 'D1 (o el dato usado)', 'Moduladora. Úsala como fuente de trigger.'],
        ['Sonda CH2', 'FSK OUTPUT y luego DATA OUTPUT', 'Modulada y, al final, el dato recuperado.']
      ],
      stages: [
        { img: 'fsk_reloj555', t: 'Reloj básico · IC1-555', tag: 'Modulador',
          que: 'Un temporizador 555 conectado como <b>oscilador astable</b> (R1 = 560 Ω, R2 = 680 kΩ, C1 = 100 pF, C2 = 0,1 µF en el pin 5).',
          hace: 'Genera la onda cuadrada de <b>10 kHz</b> que es el reloj de todo el modulador. De ella salen, por división, las dos frecuencias del FSK y los datos.',
          como: 'C1 se carga a través de R1 + R2 hasta 2/3 de Vcc y se descarga solo por R2 (pin 7) hasta 1/3 de Vcc. Cada vez que cruza esos umbrales la salida (pin 3) cambia de estado. Como R2 es mucho mayor que R1, la carga y la descarga duran casi lo mismo y el ciclo de trabajo queda cerca del 50 %.<br>f = 1,44 / ((R1 + 2·R2)·C1) ≈ 10,6 kHz (la serigrafía dice 10 kHz).',
          uso: 'No se conecta nada: trabaja solo al encender el módulo. El borne <b>BASIC CLOCK (10 KHz)</b> sirve para medirlo, con su GND justo debajo.',
          mide: 'Cuadrada TTL de 0 a 5 V, periodo 100 µs, duty ≈ 50 %.' },
        { img: 'fsk_74163', t: 'Divisor de frecuencia · IC2-74163', tag: 'Modulador',
          que: 'Contador binario síncrono de 4 bits (TTL).',
          hace: 'Divide el reloj de 10 kHz por 2, 4, 8 y 16. Así obtiene las dos <b>"portadoras"</b> del FSK y el reloj de los datos.',
          como: 'Avanza una cuenta en cada flanco de subida del reloj (pin 2). Cada salida es un bit de la cuenta, y cada bit cambia a la mitad de la frecuencia del anterior:<br>QA (pin 14) = 5 kHz → frecuencia de <b>marca</b> ("1")<br>QB (pin 13) = 2,5 kHz (no se usa)<br>QC (pin 12) = 1,25 kHz → frecuencia de <b>espacio</b> ("0")<br>QD (pin 11) = 625 Hz → reloj del 7490.',
          uso: 'Es interno, no tiene bornes. Las dos frecuencias del FSK se ven en FSK OUTPUT: con DATA INPUT al aire (una entrada TTL abierta se lee como "1") sale 5 kHz, y con DATA INPUT a GND sale 1,25 kHz. Así se pueden medir las "portadoras" que pide el paso 2 del informe.',
          mide: 'En el simulador, activa "Puntos de prueba internos" para ver los pines 14, 12 y 11.' },
        { img: 'fsk_7490', t: 'Generador de datos · IC3-7490 → D1…D4', tag: 'Modulador',
          que: 'Contador de décadas (cuenta de 0 a 9 en BCD). Sus salidas pasan por R16…R19 de 1 kΩ a los bornes D1…D4.',
          hace: 'Fabrica las señales de datos (moduladoras) D1, D2, D3 y D4.',
          como: 'Cuenta los pulsos de 625 Hz del 74163, o sea avanza cada 1,6 ms. Cada salida es un bit de la cuenta BCD:<br>D1 = QA: alterna 0101… → 312,5 Hz, duty 50 %<br>D2 = QB, D3 = QC y D4 = QD: se repiten cada 10 cuentas (16 ms → 62,5 Hz) con duty de 40 %, 40 % y 20 %.',
          uso: 'Se toma <b>un</b> dato y se lleva con un cable a <b>DATA INPUT</b>. El informe pide empezar con D1 y repetir con al menos otro (D2, D3 o D4). También se mide con CH1 para tener la moduladora en pantalla.',
          mide: 'Cuadradas TTL 0-5 V. D1: periodo 3,2 ms (bits de 1,6 ms). D2-D4: periodo 16 ms.' },
        { img: 'fsk_mux7400', t: 'Modulador (multiplexor) · IC4-7400', tag: 'Modulador',
          que: 'Cuatro compuertas NAND (un 7400) armadas como <b>multiplexor 2:1</b>, con el borne DATA INPUT y la salida FSK OUTPUT.',
          hace: 'Es el <b>modulador FSK</b> propiamente tal: deja pasar 5 kHz cuando el dato es "1" y 1,25 kHz cuando el dato es "0".',
          como: 'Una NAND invierte el dato. Otra NAND combina el dato con QA (5 kHz) y una tercera combina el dato invertido con QC (1,25 kHz). La cuarta NAND junta las dos: salida = DATO·QA + DATO̅·QC. Como las dos frecuencias salen del mismo contador, el cambio de frecuencia es casi de fase continua.',
          uso: 'Entrada: cable desde D1 (u otro dato) a <b>DATA INPUT</b>. Salida: <b>FSK OUTPUT</b>, que se mide con CH2 y se lleva con un cable a FSK INPUT para demodular.',
          mide: 'Cuadrada de amplitud constante (0-5 V) que cambia entre 5 kHz y 1,25 kHz. f central = 3,125 kHz; desviación Δf = (5 − 1,25)/2 = 1,875 kHz. En el espectro aparecen rayas alrededor de 1,25 kHz y de 5 kHz, más sus armónicos impares por ser cuadrada.' },
        { img: 'fsk_pasabanda', t: 'Filtro pasabanda · IC5-A (TL084) + P1', tag: 'Demodulador',
          que: 'Filtro pasabanda activo de realimentación múltiple (MFB) con R3 = 1 kΩ, R4 = 22 kΩ, C3 = C4 = 0,047 µF y el potenciómetro P1 (<b>FSK INPUT DEMODULATOR ADJ.</b>).',
          hace: 'Deja pasar fuerte una de las dos frecuencias y atenúa la otra. Así convierte el FSK (cambio de frecuencia) en una señal que <b>cambia de amplitud</b>, parecida a una ASK.',
          como: 'La frecuencia central del filtro depende de P1: f0 = (1/2πC)·√((R3 + P1)/(R3·R4·P1)). Ganancia en el centro = −R4/(2·R3) ≈ −11. Además convierte la cuadrada en algo casi senoidal, porque elimina los armónicos.',
          uso: 'Entrada en el borne <b>FSK INPUT</b> (cable desde FSK OUTPUT). Se gira P1 hasta que una frecuencia salga grande y la otra chica.',
          mide: 'Senoide de amplitud grande durante un bit y pequeña durante el otro.' },
        { img: 'fsk_rectificador', t: 'Rectificador de precisión · IC5-B', tag: 'Demodulador',
          que: 'Amplificador operacional con los diodos D1 y D2 (1N4148) en la realimentación (R6 = 120 kΩ, R7 = 47 kΩ, R8 = 82 kΩ).',
          hace: 'Rectifica la señal filtrada: deja solo su magnitud, sin la parte negativa (o positiva).',
          como: 'Al estar los diodos dentro del lazo del operacional, la caída de 0,6 V del diodo se compensa y se pueden rectificar señales pequeñas sin perder esos 0,6 V. Por eso se llama "de precisión".',
          uso: 'Etapa interna: no se conecta nada.',
          mide: 'Semiciclos de la señal filtrada, más altos durante el bit cuya frecuencia está cerca de f0.' },
        { img: 'fsk_pasabajos', t: 'Filtro pasabajos · IC5-C', tag: 'Demodulador',
          que: 'Integrador con pérdidas: R11 = 1,5 kΩ en paralelo con C5 = 0,1 µF en la realimentación, entradas por R9 y R10 de 1 kΩ.',
          hace: 'Saca la <b>envolvente</b>: un nivel de tensión alto o bajo según cuál frecuencia llegó.',
          como: 'Su corte es fc = 1/(2π·R11·C5) ≈ 1,06 kHz, así que elimina la frecuencia de la portadora y deja el promedio de la señal rectificada, que sigue al dato.',
          uso: 'Etapa interna: no se conecta nada.',
          mide: 'Escalones (alto o bajo) que siguen al dato, con algo de rizado.' },
        { img: 'fsk_comparador', t: 'Comparador · IC5-D + P2 + ZD1', tag: 'Demodulador',
          que: 'Operacional usado como comparador. El umbral sale de P2 (<b>FSK OUTPUT DEMODULATOR ADJ.</b>), un divisor desde +12 V. El zener ZD1 de 5,1 V y R14 = 5,1 kΩ limitan la salida. En el recorte también se ve el pasabajos IC5-C a la izquierda.',
          hace: 'Decide si cada momento es "1" o "0" y entrega el <b>dato recuperado</b> con niveles TTL en <b>DATA OUTPUT</b>.',
          como: 'Compara la envolvente con el umbral de P2. Si la envolvente está por encima, la salida va a un estado; si está por debajo, al otro. El zener recorta la salida a unos 5 V para que sea compatible con lógica TTL.',
          uso: 'Se mide <b>DATA OUTPUT</b> con CH2 y el dato original con CH1. Se ajustan P1 y P2 hasta que ambas sean iguales. Si el filtro quedó centrado en 5 kHz, el dato puede salir invertido.',
          mide: 'Cuadrada igual al dato (D1), con un pequeño retardo.' }
      ]
    },
    {
      id: 'psk', title: 'PSK · TESCA (Experiencia 8)',
      intro: 'En la experiencia 8 se genera una BPSK: la portadora cambia su fase entre 0° y 180° según el dato. Se miden portadora, moduladora (D1 y otra) y modulada en el tiempo y en el espectro, y luego se demodula. Arriba están el <b>generador de portadora</b> y el <b>generador de datos</b>; abajo a la izquierda el <b>modulador</b> y abajo a la derecha el <b>demodulador</b>.',
      wiring: [
        ['CARRIER OUTPUT', 'CARRIER INPUT (modulador)', 'La portadora que se va a modular.'],
        ['D1 (DATA OUTPUT)', 'DATA INPUT (modulador)', 'La moduladora. Después se repite con D2, D3 o D4.'],
        ['PSK O/P', 'PSK INPUT (demodulador)', 'La señal modulada entra al demodulador.'],
        ['CARRIER OUTPUT', 'CARRIER INPUT (demodulador)', 'Portadora de referencia: la demodulación es coherente.'],
        ['Sonda CH1 / CH2', 'D1 / PSK O/P y luego DEMOD. OUTPUT', 'Moduladora (trigger), modulada y dato recuperado.']
      ],
      stages: [
        { img: 'psk_portadora', t: 'Generador de portadora · IC1-741 (puente de Wien)', tag: 'Generadores',
          que: 'Oscilador senoidal <b>puente de Wien</b> con un 741: C1 = C2 = 0,001 µF, R1 = 10 kΩ y el preset PR1 de 10 kΩ. Los diodos D1 y D2 (1N4148) estabilizan la amplitud. La salida sale por C3 = 33 µF y R5 = 1 kΩ.',
          hace: 'Produce la <b>portadora senoidal</b> de ≈ 22 kHz y ≈ 5 Vpp que se modula.',
          como: 'La red RC (Wien) solo deja la fase en 0° a una frecuencia, f = 1/(2π·√(R1·PR1·C1·C2)). A esa frecuencia el amplificador, con ganancia 3, mantiene la oscilación. Los diodos bajan la ganancia cuando la amplitud crece, y así la senoide no se deforma. PR1 ajusta la frecuencia.',
          uso: 'El borne <b>CARRIER OUTPUT</b> se lleva con cables a <b>CARRIER INPUT del modulador</b> y a <b>CARRIER INPUT del demodulador</b>. Es la "portadora" que pide medir el paso 2.',
          mide: 'Senoide ≈ 5 Vpp, ≈ 22 kHz (T ≈ 45 µs). En el espectro, una sola raya en fc.' },
        { img: 'psk_buffer_tr1', t: 'Cuadrador de portadora · IC2-A (TL084) + TR1', tag: 'Generadores',
          que: 'Un operacional del TL084 (IC2-A) como comparador, más la red C4, R6, D3 y el transistor TR1 BC-107.',
          hace: 'Convierte la senoide en <b>pulsos TTL</b> de la misma frecuencia para hacer contar al 7490.',
          como: 'IC2-A compara la portadora con 0 V y entrega una cuadrada. C4, R6 y D3 la acoplan y recortan, y TR1 la deja con niveles de 0 a 5 V que la lógica TTL entiende.',
          uso: 'Etapa interna: no se conecta nada. Gracias a ella los datos quedan <b>sincronizados con la portadora</b> y los saltos de fase ocurren en los cruces por cero.',
          mide: 'Pulsos TTL a la frecuencia de la portadora.' },
        { img: 'psk_7490', t: 'Generador de datos · IC3-7490 → D1…D4', tag: 'Generadores',
          que: 'Contador de décadas 7490 con resistencias R8…R11 de 1 kΩ hacia los bornes D1…D4 (DATA OUTPUT).',
          hace: 'Genera las señales moduladoras a partir de los ciclos de la portadora.',
          como: 'Cuenta los pulsos que vienen de TR1 (uno por ciclo de portadora) de 0 a 9. Según el simulador: D1 cambia en cada ciclo (fc/2 ≈ 11 kHz) y D2, D3 y D4 se repiten cada 10 ciclos de portadora (fc/10 ≈ 2,2 kHz) con distintos duty.',
          uso: 'Cable desde <b>D1</b> a <b>DATA INPUT del modulador</b>. El informe pide luego repetir con otro dato.',
          mide: 'Cuadradas TTL 0-5 V sincronizadas con la portadora.' },
        { img: 'psk_modulador', t: 'Modulador PSK · IC-4 741 + IC5-4051', tag: 'Modulador',
          que: 'Un 741 como <b>amplificador inversor</b> (R12 = R13 = 47 kΩ, ganancia −1) y un <b>multiplexor analógico CD4051</b> alimentado con ±5 V.',
          hace: 'Entrega la portadora tal cual (0°) o invertida (180°) según el dato: eso es la <b>BPSK</b>.',
          como: 'La portadora de CARRIER INPUT llega a un canal del 4051 directamente y a otro canal a través del inversor (que la desfasa 180°). El dato de DATA INPUT entra al pin de selección del 4051 y elige cuál de las dos sale por el pin 3 hacia <b>PSK O/P</b>. Matemáticamente es multiplicar la portadora por ±1.',
          uso: 'Cables: CARRIER OUTPUT → <b>CARRIER INPUT</b>, D1 → <b>DATA INPUT</b>. Salida en <b>PSK O/P</b> (CH2), con la moduladora en CH1 como trigger.',
          mide: 'Senoide de amplitud y frecuencia constantes con un <b>salto de 180°</b> en cada cambio de bit. En el espectro la portadora queda suprimida y aparecen bandas laterales a fc ± la frecuencia del dato (y sus armónicos impares).' },
        { img: 'psk_demod_psk', t: 'Demodulador: cuadrador PSK y detector XOR · IC2-D, TR2, TR3, IC6-7486', tag: 'Demodulador',
          que: 'Comparador IC2-D (TL084), la red C6, R15, D4, los transistores TR2 y TR3 BC-107 y las compuertas XOR del 7486 (IC6). Termina en el filtro R20-C7 y el borne <b>DEMOD. OUTPUT</b>.',
          hace: 'Compara la fase de la señal recibida con la portadora de referencia y recupera el dato.',
          como: 'IC2-D convierte la PSK en cuadrada y TR2 la lleva a niveles TTL. Una XOR compara esa cuadrada con la portadora de referencia (también cuadrada): si están en fase la XOR da "0", y si están en contrafase da "1". El filtro R20-C7 quita los pulsitos de los bordes y la última XOR fija la polaridad, así que en DEMOD. OUTPUT sale el dato.',
          uso: 'Cable de <b>PSK O/P</b> a <b>PSK INPUT</b>. Se mide <b>DEMOD. OUTPUT</b> con CH2 junto al dato en CH1: deben coincidir.',
          mide: 'Cuadrada TTL igual al dato original.' },
        { img: 'psk_demod_ref', t: 'Demodulador: portadora de referencia · IC2-C, IC2-B, TR4', tag: 'Demodulador',
          que: 'IC2-C como inversor (R21 = R22 = 47 kΩ), IC2-B como comparador, la red C8, R24, D5 y el transistor TR4 BC-107.',
          hace: 'Prepara la <b>portadora de referencia</b> que necesita el detector XOR.',
          como: 'La portadora entra por CARRIER INPUT, se invierte en IC2-C, se cuadra en IC2-B y TR4 la deja en niveles TTL. Sin esta referencia no se puede saber si la fase es 0° o 180°: por eso es una <b>demodulación coherente</b>.',
          uso: 'Cable de <b>CARRIER OUTPUT</b> a este <b>CARRIER INPUT</b> (el del demodulador). Si lo quitas, DEMOD. OUTPUT deja de seguir al dato.',
          mide: 'Cuadrada TTL a la frecuencia de la portadora.' }
      ]
    },
    {
      id: 'qam', title: 'QAM/DQAM · TESCA 40623 (Experiencia 9)',
      intro: 'En la experiencia 9 se estudia el módulo a nivel de bloques, se comprueba el desfase de las 4 portadoras, se observan distintas tramas de bits con los switches y se arma el conexionado de la figura del informe para ver la señal 8-QAM en el tiempo y en el espectro. Las etapas de la parte de arriba de la placa son los circuitos integrados; las de abajo (las que tienen bornes) son las que se usan.',
      figure: { src: 'img/glosario/qam_conexionado_informe.png', cap: 'Conexionado pedido en el paso 4 del informe de la experiencia 9.' },
      wiring: [
        ['S-DATA', 'NRZ-L CODER · IN', 'Los datos seriales de la trama.'],
        ['NRZ-L CODER · OUT', 'TRIBIT CODER · DATA', 'Datos con formato NRZ-L al codificador tribit.'],
        ['S-CLK', 'TRIBIT CODER · CLK', 'Reloj de bit para agrupar de a 3 bits.'],
        ['I-BIT / Q-BIT / C-BIT', 'C I/P-1 / C I/P-2 / C I/P-3', 'Los 3 bits de cada símbolo controlan el modulador.'],
        ['SIN1 / SIN2 / SIN3 / SIN4', 'IN/P-1 / IN/P-2 / IN/P-3 / IN/P-4', 'Las 4 portadoras (0°, 90°, 180°, 270°).'],
        ['Sonda CH1 / CH2', 'SYNC-CLK / MOD OUTPUT', 'Trigger por símbolo y señal 8-QAM.']
      ],
      stages: [
        { img: 'qam_datos', t: 'Generador de reloj y datos · SW1, SW2, SW3, S-CLK, S-DATA', tag: 'Datos',
          que: 'Oscilador a cristal con divisores (bloque CLK GENERATOR) y registros de desplazamiento 74165 cargados desde los <b>switches SW1, SW2 y SW3</b> (8 bits cada uno = trama de 24 bits).',
          hace: 'Entrega el <b>reloj de bit (S-CLK)</b> y los <b>datos seriales (S-DATA)</b> que se van a transmitir.',
          como: 'Los switches fijan los 24 bits (ON = "1", según el simulador). Los registros los sacan uno por uno al ritmo de S-CLK y, al terminar, la trama se repite. Cambiar los switches cambia la trama que se ve en S-DATA.',
          uso: 'Paso 3 del informe: medir S-CLK y S-DATA y mover los switches. Paso 4: <b>S-DATA → NRZ-L IN</b> y <b>S-CLK → TRIBIT CLK</b>.',
          mide: 'S-CLK: cuadrada TTL (en el simulador 250 kHz, T = 4 µs, valor supuesto). S-DATA: tren NRZ de 24 bits que se repite.' },
        { img: 'qam_nrz', t: 'Codificador NRZ-L · NRZ-L CODER', tag: 'Codificación',
          que: 'Bloque con borne IN y borne OUT.',
          hace: 'Da a los datos el formato <b>NRZ-L</b> (Non Return to Zero - Level).',
          como: 'En NRZ-L un "1" es nivel alto y un "0" es nivel bajo durante <b>todo</b> el tiempo de bit, sin volver a cero en la mitad. Como S-DATA ya viene así, la salida se ve igual a la entrada.',
          uso: 'Cables: <b>S-DATA → IN</b> y <b>OUT → DATA del TRIBIT CODER</b>.',
          mide: 'Igual que S-DATA.' },
        { img: 'qam_tribit', t: 'Codificador tribit · TRIBIT CLOCK GENERATOR + TRIBIT CODER', tag: 'Codificación',
          que: 'Un generador de relojes tribit (I-CLK, Q-CLK, C-CLK) y un convertidor <b>serie → paralelo</b> hecho con flip-flops 7474.',
          hace: 'Agrupa los bits de a <b>3 (tribit)</b> y entrega cada grupo en paralelo como <b>I-BIT, Q-BIT y C-BIT</b>. Cada combinación de 3 bits será uno de los 8 símbolos de la 8-QAM.',
          como: 'El generador de reloj divide S-CLK por 3 y da tres relojes desfasados un bit: I-CLK captura el 1.er bit, Q-CLK el 2.º y C-CLK el 3.º. Cuando están los tres, el codificador los presenta juntos y los mantiene durante 3 tiempos de bit. Por eso la tasa de símbolos es 1/3 de la de bits.',
          uso: 'Entradas: <b>S-CLK → CLK</b> y <b>NRZ-L OUT → DATA</b>. Salidas: <b>I-BIT → C I/P-1</b>, <b>Q-BIT → C I/P-2</b>, <b>C-BIT → C I/P-3</b>.',
          mide: 'I-BIT, Q-BIT y C-BIT: niveles NRZ que duran 3 bits (12 µs en el simulador). I-CLK, Q-CLK y C-CLK: un pulso cada 3 bits, corridos un bit entre sí.' },
        { img: 'qam_diff', t: 'Codificadores diferenciales 1 y 2 · DIFFERENTIAL ENCODER (DQAM)', tag: 'Opcional',
          que: 'Dos bloques iguales con una compuerta XOR y un retardo (DELAY, un flip-flop).',
          hace: 'Convierten la QAM en <b>DQAM</b>: la información va en el <b>cambio</b> de fase entre símbolos y no en la fase absoluta.',
          como: 'Salida = entrada XOR salida anterior. Si la entrada es "1" la salida cambia; si es "0" se mantiene. Así el receptor no necesita saber la fase absoluta de la portadora.',
          uso: '<b>No se usan</b> en el conexionado del informe. Para probar DQAM: I-BIT → IN del encoder 1 y su OUT → C I/P-1; Q-BIT → IN del encoder 2 y su OUT → C I/P-2.',
          mide: 'Una señal que cambia de nivel cada vez que la entrada vale "1".' },
        { img: 'qam_portadoras', t: 'Generador de portadoras · SIN1 a SIN4', tag: 'Portadoras',
          que: 'Oscilador y redes desfasadoras (con los presets VR1 a VR4 de la parte superior de la placa).',
          hace: 'Entrega <b>4 senoides de la misma frecuencia</b> desfasadas: <b>0° (SIN1), 90° (SIN2), 180° (SIN3) y 270° (SIN4)</b>.',
          como: 'De una senoide base se obtiene una en cuadratura (90°) y se invierten ambas para lograr 180° y 270°. La 0° y la 180° forman el canal I (en fase) y la 90° y la 270° el canal Q (en cuadratura).',
          uso: 'Paso 2 del informe: medir el desfase entre pares (CH1 en SIN1 y CH2 en SIN2, SIN3, SIN4). Paso 4: <b>SIN1 → IN/P-1, SIN2 → IN/P-2, SIN3 → IN/P-3, SIN4 → IN/P-4</b>.',
          mide: 'Senoides de 500 kHz (T = 2 µs): 90° = 0,5 µs de corrimiento, 180° = 1 µs. En X-Y: con 90° un círculo o elipse, con 180° una recta.' },
        { img: 'qam_modulador', t: 'Modulador de portadora · CARRIER MODULATOR, MOD OUTPUT, SYNC-CLK, RESET', tag: 'Modulador',
          que: 'Llaves analógicas y un sumador. Tiene 4 entradas de portadora (IN/P-1…4), 3 entradas de control (C I/P-1…3), la salida <b>MOD OUTPUT</b>, el reloj <b>SYNC-CLK</b> y el botón <b>RESET KEY</b>.',
          hace: 'Arma la señal <b>8-QAM</b>: 4 fases × 2 amplitudes = 8 símbolos, uno por cada tribit.',
          como: 'El bit I elige 0° ("1") o 180° ("0"). El bit Q elige 90° ("1") o 270° ("0"). Se suman las dos y la fase resultante queda en 45°, 135°, 225° o 315°. El bit C elige la amplitud: alta ("1") o baja ("0", ≈ 0,41 de la alta).',
          uso: 'Entradas según el conexionado de la figura (SIN → IN/P y bits → C I/P). Se mide <b>MOD OUTPUT</b> con CH2, disparando con CH1 en <b>SYNC-CLK</b>. RESET KEY reinicia la trama.',
          mide: 'Portadora de 500 kHz que cada símbolo (3 bits) cambia de fase y/o amplitud. En el espectro, un lóbulo centrado en 500 kHz.' },
        { img: 'qam_sw4', t: 'Interruptores de fallas · SW4 (SWITCH FAULTS)', tag: 'Fallas',
          que: 'DIP switch de 4 posiciones.',
          hace: 'Introduce fallas en el circuito para practicar diagnóstico.',
          como: 'Cada switch en ON interrumpe o altera una parte del circuito. Las fallas del simulador son inventadas con fines didácticos, porque no hay información del fabricante sobre cuáles son las reales.',
          uso: 'Durante la experiencia deben estar todos en <b>OFF</b>. Si algo no se ve bien, revisa SW4 primero.',
          mide: '—' }
      ]
    }
  ];

  function stageCard(m, s, i) {
    const src = 'img/glosario/' + s.img + '.jpg';
    return `<article class="gCard" id="g-${s.img}">
      <a class="gImg" href="${src}" target="_blank" rel="noopener" title="Abrir el recorte en grande"><img src="${src}" alt="Recorte del panel: ${s.t}" loading="lazy"></a>
      <div class="gTxt">
        <div class="gHead"><span class="gNum">${i + 1}</span><h3>${s.t}</h3><span class="gTag">${s.tag}</span></div>
        <dl>
          <dt>¿Qué es?</dt><dd>${s.que}</dd>
          <dt>¿Qué hace?</dt><dd>${s.hace}</dd>
          <dt>¿Cómo funciona?</dt><dd>${s.como}</dd>
          <dt>¿Cómo se usa y conecta en la experiencia?</dt><dd>${s.uso}</dd>
          <dt>¿Qué se ve en el osciloscopio?</dt><dd>${s.mide}</dd>
        </dl>
      </div>
    </article>`;
  }

  function modSection(m) {
    return `<section class="gMod" id="g-${m.id}">
      <h2>${m.title}</h2>
      <p>${m.intro}</p>
      <h3>Conexiones de la experiencia (resumen)</h3>
      <table><tr><th>Desde</th><th>Hacia</th><th>Para qué</th></tr>
        ${m.wiring.map(w => `<tr><td><b>${w[0]}</b></td><td><b>${w[1]}</b></td><td>${w[2]}</td></tr>`).join('')}</table>
      ${m.figure ? `<figure class="gFig"><img src="${m.figure.src}" alt="${m.figure.cap}"><figcaption>${m.figure.cap}</figcaption></figure>` : ''}
      <p class="noprint"><a class="gBtn" href="#${m.id}">▶ Abrir el módulo ${m.id.toUpperCase()} en el simulador y armarlo</a></p>
      <h3>Etapas del módulo</h3>
      ${m.stages.map((s, i) => stageCard(m, s, i)).join('')}
    </section>`;
  }

  const Glossary = {
    data: MODS,
    render(root) {
      root.innerHTML = `<h1>📖 Glosario de etapas</h1>
        <p>Para cada módulo de las experiencias 7, 8 y 9: un recorte de cada etapa tomado de la foto del panel, qué es, qué hace, cómo funciona y cómo se usa y conecta en la experiencia. Haz clic en un recorte para verlo en grande.</p>
        <div class="note">Los valores de frecuencia son los que usa el simulador. Los de FSK salen de la serigrafía del módulo; los de PSK de la ficha del fabricante y los de QAM (reloj de bit 250 kHz) son supuestos. Si en el laboratorio mides otra cosa, vale tu medición.</div>
        <div class="subtabs noprint" id="gNav">
          ${MODS.map(m => `<button data-g="${m.id}">${m.id.toUpperCase()}</button>`).join('')}
          <button id="gPrint" class="ghost">🖨 Imprimir / guardar PDF</button>
        </div>
        ${MODS.map(modSection).join('')}`;
      root.querySelectorAll('#gNav [data-g]').forEach(b => b.onclick = () => document.getElementById('g-' + b.dataset.g).scrollIntoView({ behavior: 'smooth' }));
      root.querySelector('#gPrint').onclick = () => window.print();
    }
  };
  window.Glossary = Glossary;
})();
