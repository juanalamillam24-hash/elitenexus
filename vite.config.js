import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Si publicas en GitHub Pages en https://USUARIO.github.io/NOMBRE-REPO/
// cambia base por "/NOMBRE-REPO/". Para Vercel o Netlify, deja "/".
export default defineConfig({
  plugins: [react()],
  base: "/",
});
