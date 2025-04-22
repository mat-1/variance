import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { wasm } from '@rollup/plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import inject from '@rollup/plugin-inject';
import { svgLoader } from './viteSvgLoader';

const copyFiles = {
  targets: [
    { src: '_redirects', dest: '' },
    { src: 'config.json', dest: '' },
    { src: 'public/res/android', dest: 'public/' },
    { src: 'public/res/emoji', dest: 'public/' },
    { src: 'public/manifest.json', dest: '' },
    { src: 'public/favicon.ico', dest: '' },
  ],
};

export default defineConfig({
  appType: 'spa',
  publicDir: false,
  base: '',
  server: { port: 8080, host: true },
  plugins: [viteStaticCopy(copyFiles), svgLoader(), wasm(), react()],
  optimizeDeps: {
    esbuildOptions: {
      define: { global: 'globalThis' },
      plugins: [
        // Enable esbuild polyfill plugins
        NodeGlobalsPolyfillPlugin({ process: false, buffer: true }),
      ],
    },
    // required to make the wasm get loaded
    exclude: ['@matrix-org/matrix-sdk-crypto-wasm'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    copyPublicDir: false,
    rollupOptions: { plugins: [inject({ Buffer: ['buffer', 'Buffer'] })] },
    target: 'esnext',
  },
});
