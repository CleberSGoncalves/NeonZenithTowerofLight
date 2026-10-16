import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Obrigatório CrazyGames: caminhos estritamente relativos
  server: {
    port: 3012,
    host: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
});
