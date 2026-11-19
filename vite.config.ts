import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// No GitHub Pages o site fica em /geradorlaudo/; localmente fica na raiz.
// O workflow de deploy define BASE=/geradorlaudo/.
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
});
