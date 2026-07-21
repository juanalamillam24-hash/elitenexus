import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base debe ser el nombre del repositorio entre barras, para GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: "/elitenexus/",
});
