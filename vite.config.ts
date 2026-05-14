import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Replaces __SW_VERSION__ in public/sw.js with a build timestamp.
 *  Dev  → server middleware intercepts /sw.js before static serving.
 *  Build → closeBundle rewrites dist/sw.js after copy. */
function swVersionPlugin(): Plugin {
  const version = Date.now().toString();
  return {
    name: 'sw-version',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/sw.js') {
          const filePath = path.resolve(__dirname, 'public/sw.js');
          const content = fs.readFileSync(filePath, 'utf-8');
          res.setHeader('Content-Type', 'application/javascript');
          res.setHeader('Cache-Control', 'no-cache');
          res.end(content.replace('__SW_VERSION__', version));
          return;
        }
        next();
      });
    },
    closeBundle() {
      const outPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(outPath)) {
        const content = fs.readFileSync(outPath, 'utf-8');
        fs.writeFileSync(outPath, content.replace('__SW_VERSION__', version));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), swVersionPlugin()],
  server: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('@react-three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
            return 'charts-vendor';
          }
          if (id.includes('node_modules/jspdf') || id.includes('jspdf-autotable')) {
            return 'pdf-vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion-vendor';
          }
          if (id.includes('node_modules/i18next') || id.includes('react-i18next')) {
            return 'i18n-vendor';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }
        },
      },
    },
  },
})
