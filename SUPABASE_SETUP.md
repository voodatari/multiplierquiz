# Modo docente con Supabase: puesta en marcha

Sin configurar nada, el juego funciona igual que siempre (modo invitado con ranking local).
El modo docente se activa cuando rellenas `config.js` e inicias sesión con **👩‍🏫 Acceso docente**.

## 1. Crear el proyecto en Supabase

1. Entra en <https://supabase.com>, crea una cuenta gratuita y pulsa **New project**.
2. Ponle un nombre (p. ej. `multiplicador`), una contraseña de base de datos (guárdala) y la región **West EU**.
3. Espera 1-2 minutos a que el proyecto esté listo.

## 2. Crear las tablas

1. En el menú lateral: **SQL Editor** → **New query**.
2. Copia todo el contenido de [`supabase/schema.sql`](supabase/schema.sql), pégalo y pulsa **Run**.
3. Debe aparecer `Success. No rows returned`. En **Table Editor** verás las tablas `classes`, `students`, `sessions` y `games`.

El script activa *Row Level Security*: cada docente solo puede ver y modificar sus propios alumnos y partidas.
Se puede volver a ejecutar sin perder datos.

## 3. Permitir el acceso con usuario y contraseña

El juego usa nombre de usuario y contraseña. Internamente Supabase necesita un email, así que
`profe.dani` se guarda como `profe.dani@multiplicador.app`. No se envía ningún correo, pero hay que
desactivar la confirmación por email:

1. **Authentication** → **Sign In / Providers** (en versiones anteriores: **Providers**) → **Email**.
2. Comprueba que *Enable Email provider* está activado.
3. **Desactiva** *Confirm email* y guarda.

> Si al crear la cuenta aparece "Nombre de usuario no válido", cambia `AUTH_EMAIL_DOMAIN` en `config.js`
> por otro dominio, o escribe directamente un email real como nombre de usuario.

## 4. Conectar el juego

1. En Supabase: **Project Settings** → **API** (o **API Keys**).
2. Copia la **Project URL** y la clave **anon public** (o la **publishable key**, `sb_publishable_...`).
3. Pégalas en [`config.js`](config.js):

```js
const SUPABASE_URL = 'https://abcdefghijk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
```

La clave *anon* / *publishable* es pública por diseño: la seguridad la garantizan las políticas RLS.
**Nunca** pongas la clave `service_role` / `secret`.

## 5. Probar en local

Hay que servir la carpeta con un servidor web; abrir `index.html` con doble clic puede fallar.
Elige una opción:

- **VS Code**: instala la extensión *Live Server*, haz clic derecho en `index.html` → **Open with Live Server**.
- **Node**: en la carpeta del proyecto ejecuta `npx serve .` y abre la dirección que muestre (normalmente <http://localhost:3000>).
- **Python**: `python -m http.server 8080` y abre <http://localhost:8080>.

Recorrido de prueba:

1. **👩‍🏫 Acceso docente** → **Crear cuenta** (usuario + contraseña de al menos 6 caracteres).
2. Se abre **🧒 Alumnos**: arrastra el PDF de Séneca (listado de alumnos con foto).
3. Revisa los alumnos detectados (puedes corregir nombres o desmarcar alguno) → **Guardar alumnos**.
4. Elige un modo de juego → aparece el selector de alumnos → elige uno (o pulsa **🎲 Al azar**).
5. Al acabar se guarda la partida con fecha y hora, y se muestra su puesto en la sesión.
6. **🏆 Rankings**: ranking de la sesión, ranking total de la clase e historial de partidas.

## 6. Publicar en Netlify

No hace falta nada especial: sube los cambios (incluido `config.js` con tus claves) y Netlify
servirá la web igual que antes.

## Cómo funciona

| Concepto | Detalle |
|---|---|
| **Clase** | Grupo de alumnos (p. ej. "5º A"). Se crea al importar el PDF, con el nombre de la unidad. Puedes tener varias. |
| **Alumno** | Nombre, apellidos y foto en miniatura (JPEG de unos 15 KB, guardado en la base de datos y protegido por RLS). |
| **Sesión** | Agrupa las partidas de un día. Se crea sola con la primera partida del día; con **✨ Nueva sesión** empiezas otra cuando quieras. |
| **Partida** | Alumno, modo, configuración de tiempo, aciertos, errores, duración, fecha/hora y sesión. |
| **Ranking** | La mejor puntuación de cada alumno, por modo y configuración de tiempo (o "Todos"). En contrarreloj cuenta los aciertos; en muerte súbita, los aciertos seguidos. |
| **Práctica libre** | También se registra (botón **✅ Terminar y guardar**) y aparece en el historial. |
| **Sin conexión** | Si falla el guardado, la partida queda en cola en el navegador y se envía sola más tarde. |

Al importar un PDF en una clase que ya existe, los alumnos repetidos (mismo nombre y apellidos) no se
duplican: solo se actualiza su foto.
