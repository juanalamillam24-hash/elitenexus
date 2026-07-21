# NEXUS · ELITE — Torre de Control

Checklist diaria de agentes con metas de FTD y Bots, vista de agente y vista de
directora. Los datos viven en **Supabase** (base de datos real) y el código se
publica desde **GitHub**.

No necesitas saber programar para seguir estos pasos. Ve en orden.

---

## Parte 1 · Crear la base de datos en Supabase

1. Entra a https://supabase.com y crea una cuenta gratis.
2. Haz clic en **New project**. Ponle un nombre (ej. `nexus-elite`) y una
   contraseña de base de datos (guárdala en un lugar seguro). Elige la región
   más cercana. Espera 1–2 minutos a que se cree.
3. En el menú de la izquierda entra a **SQL Editor** → **New query**.
4. Abre el archivo `supabase/schema.sql` de este proyecto, copia **todo** su
   contenido, pégalo en el editor y presiona **Run**. Debe decir "Success".
5. En el menú entra a **Project Settings** (el engranaje) → **API**. Ahí verás:
   - **Project URL** → es tu `VITE_SUPABASE_URL`
   - **anon public** key → es tu `VITE_SUPABASE_ANON_KEY`

   Copia esos dos valores; los usarás en la Parte 3.

---

## Parte 2 · Subir el código a GitHub

1. Entra a https://github.com y crea una cuenta si no tienes.
2. Haz clic en **New repository**. Nombre: `nexus-elite`. Déjalo **Public** o
   **Private** (cualquiera sirve). Crea el repo.
3. Sube los archivos de este proyecto. La forma más fácil sin usar la terminal:
   en la página del repo vacío haz clic en **uploading an existing file** y
   arrastra **todas** las carpetas y archivos de este proyecto (menos
   `node_modules`, que ni existe todavía). Confirma con **Commit changes**.

> Importante: **no subas tu archivo `.env`** con las claves. El `.gitignore` ya
> lo evita. Las claves se ponen en el panel de Vercel/Netlify (Parte 3).

---

## Parte 3 · Publicar la app (recomendado: Vercel)

Vercel es lo más simple y gratis para este tipo de app.

1. Entra a https://vercel.com y regístrate con tu cuenta de **GitHub**.
2. Clic en **Add New… → Project**, elige el repo `nexus-elite` e **Import**.
3. Vercel detecta que es un proyecto **Vite** solo. No cambies nada del build.
4. Abre **Environment Variables** y agrega estas dos (las de la Parte 1):
   - `VITE_SUPABASE_URL` = tu Project URL
   - `VITE_SUPABASE_ANON_KEY` = tu clave anon public
5. Clic en **Deploy**. En ~1 minuto te da un enlace tipo
   `https://nexus-elite.vercel.app`. **Ese es el enlace que compartes por
   WhatsApp a tus agentes.**

Cada vez que cambies algo en GitHub, Vercel vuelve a publicar solo.

---

## Cómo se usa

- **Agentes:** entran al enlace, buscan su nombre en "Soy agente", marcan su
  checklist, metas de FTD y Bots, y tareas extra. Todo se guarda solo.
- **Directora (Juana):** entra con el botón dorado "Entrar como Juana Lamilla".
  Ve el ranking del día de todo el equipo, rendimiento promedio, FTDs y Bots
  logrados vs. meta, y quién tiene pendientes. Usa el selector de fecha para
  revisar días anteriores.

Todos comparten la misma base de datos, por eso tú ves el trabajo de cada agente
en tiempo real.

---

## Nota de seguridad

El acceso es **por nombre, sin contraseña**. Cualquiera con el enlace puede
entrar como cualquier agente, incluida la vista de directora. Es cómodo para un
equipo interno de confianza. Si quieres proteger la vista de directora (o cada
agente) con un PIN, se puede agregar después.

---

## Correr en tu computador (opcional, solo si quieres probar local)

Necesitas tener instalado Node.js (https://nodejs.org).

```bash
npm install
cp .env.example .env   # y edita .env con tus claves de Supabase
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173).
