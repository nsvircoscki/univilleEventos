import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
const servidor = {
  host: true, port: 5173, strictPort: true,
  proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') } },
};
export default defineConfig({ server: servidor, preview: servidor, plugins: [react(), tailwindcss()] });
