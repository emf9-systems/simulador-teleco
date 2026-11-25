# Simulador de laboratorio: FSK · PSK · QAM/DQAM

Simulador web de los módulos de entrenamiento **TESCA** usados en las experiencias 7 (FSK), 8 (PSK) y 9 (QAM) de Telecomunicaciones.

**Usarlo en línea:** https://emf9-systems.github.io/simulador-teleco/

## Qué tiene
- Paneles con la **foto real** de cada módulo, con bornes clicables.
- **Cables** para interconectar bornes. Las señales se calculan según el circuito y las conexiones: una entrada sin conectar no recibe señal.
- **Osciloscopio de 2 canales**: V/div, acople DC/AC/GND, tiempo/div, trigger (fuente, pendiente, nivel, AUTO/NORMAL, SINGLE), modo X-Y, AUTOSET y mediciones automáticas (Vpp, f, T, duty…).
- **Analizador de espectro** (FFT) para estudiar la composición espectral.
- Perillas y switches: P1 y P2 del demodulador FSK, PR1 de la portadora PSK, SW1 a SW3 (trama de 24 bits), SW4 (fallas) y RESET del kit QAM.
- **Guía de cada experiencia**, con pasos que se marcan solos.
- **Prueba práctica**: 1 a 4 tareas al azar en los módulos (incluida una "falla misteriosa" en QAM) que se verifican solas, seguidas de 2 o 3 preguntas del profesor por tarea.
- Sección de **estudio**, **preguntas probables** y **preguntas de alternativas** con cronómetro.

## Uso local
Abre `index.html` en el navegador. No necesita instalar nada.

## Fidelidad
Ver la pestaña **Ayuda → "Qué tan fiel es"**: qué valores salen del circuito o de la ficha técnica y cuáles son supuestos (por ejemplo, el reloj del kit QAM y las fallas de SW4).
