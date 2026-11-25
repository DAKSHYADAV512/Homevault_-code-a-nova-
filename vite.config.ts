
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const disableHMR = env.DISABLE_HMR === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': new URL('./src/', import.meta.url).pathname,
      },
    },

    server: {
      hmr: !disableHMR,
      watch: disableHMR ? null : {},
    },
  };
});
