# ¡Multiplicador!

Juego para practicar las **tablas de multiplicar** (del 1 al 10) en Primaria: aparece una multiplicación y se elige el resultado correcto entre tres opciones.

**Web:** https://voodatari.github.io/multiplierquiz/

Pensado para jugarse en el aula, en la pizarra digital o en los ordenadores del alumnado. Funciona en el navegador, sin instalar nada.

## Modos de juego

| Modo | Cómo se juega |
|---|---|
| ⏱️ **Contrarreloj** | Tantos aciertos como se pueda en un tiempo fijo: de 10 s a 2 min, o «Toda la canción». |
| 💀 **Muerte súbita** | Un fallo y se acaba. Se elige el tiempo por pregunta: infinito, 10, 5 o 3 segundos. |
| 🎯 **Práctica libre** | Sin tiempo ni ranking, a tu ritmo. |

Al terminar se ve el resumen de la partida (aciertos, errores, aciertos por segundo) y el ranking.

## Opciones de la ⚙️ del menú

- **Modo ligero**: quita el desenfoque para equipos poco potentes. Se activa solo si el equipo parece modesto.
- **Escala fija**: el juego se ve igual aunque Windows use una escala de pantalla del 125 % o 150 %.

## Modo docente (opcional)

Sin iniciar sesión, el juego guarda un ranking local en el propio navegador. Con **👩‍🏫 Acceso docente**:

- Se crean clases y se importa el alumnado desde el **PDF de Séneca** con las fotos de la clase. El PDF se lee en el navegador y no se sube a ningún sitio.
- Antes de cada partida se elige quién juega, o se sortea.
- Cada partida se guarda: hay **rankings de la sesión** (la clase de hoy), **de la clase** y un **historial** por alumno.

Comparte el proyecto de Supabase con el [Redondeador](https://github.com/voodatari/redondeo): la cuenta, las clases y el alumnado son comunes y las partidas van por separado. La puesta en marcha está en [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) y el esquema de la base de datos, en [`supabase/schema.sql`](supabase/schema.sql) (es el mismo archivo en los dos juegos).

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks ni compilación: lo que hay en el repositorio es exactamente lo que se publica.

| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css` | Todas las pantallas y sus estilos |
| `main.js`, `ui-manager.js`, `game-logic.js` | Arranque, pantallas y lógica del juego |
| `ranking.js` | Ranking local (modo invitado) |
| `audio.js` | Música y efectos; en Chrome, la música se repite sin cortes con Web Audio |
| `ajustes.js`, `rendimiento.js`, `escala.js` | Menú de opciones, modo ligero y escala fija |
| `effects.js`, `background-animation.js` | Cuenta atrás, confeti, avisos y fondo animado |
| `config.js`, `teacher-data.js`, `teacher-ui.js` | Modo docente con Supabase |
| `pdf-import.js` | Lectura del PDF de Séneca con pdf.js |

### Probarlo en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic puede fallar.

- **VS Code**: extensión *Live Server* → clic derecho en `index.html` → *Open with Live Server*.
- **Node**: `npx serve .`
- **Python**: `python -m http.server 8080` y abrir http://localhost:8080

## Créditos de terceros

- [supabase-js](https://github.com/supabase/supabase-js) (MIT) y [pdf.js](https://github.com/mozilla/pdf.js) (Apache 2.0), cargados desde CDN.
- Tipografías [Fredoka](https://fonts.google.com/specimen/Fredoka) y [Poppins](https://fonts.google.com/specimen/Poppins) (SIL Open Font License), de Google Fonts.

---

Hecho por Daniel Vera (profe Dani).
