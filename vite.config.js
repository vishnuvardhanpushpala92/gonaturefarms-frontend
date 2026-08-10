import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv reads .env / .env.local etc. into config-time variables. Vite only
  // auto-exposes VITE_-prefixed vars to import.meta.env for *client* code; the
  // config file itself needs this explicit call to see values from .env at all
  // (plain process.env.VITE_API_PROXY_TARGET would otherwise only pick up an
  // actual shell-exported variable, silently ignoring the .env file).
  const env = loadEnv(mode, process.cwd(), '');
  // Spring Boot backend listens on 8080 (see server.port in application.properties).
  // Previously this defaulted to 5000, which nothing was listening on — every /api
  // call hit ECONNREFUSED at the proxy layer and Vite returned a generic 500 to the
  // browser before the request ever reached Spring Boot.
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // Forwards /api and /uploads calls to the Spring Boot backend during local dev,
        // so the frontend can keep using relative paths exactly like the original app.
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist'
    }
  };
});
