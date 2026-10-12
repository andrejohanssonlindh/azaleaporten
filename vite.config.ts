/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';

function appVersion(): string {
  const day = new Date().toISOString().slice(0, 10);
  try {
    return `${day}+${execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()}`;
  } catch {
    return `${day}+dev`;
  }
}

const VERSION = appVersion();

// version.json: knappen "Hämta senaste versionen" frågar webben vilken version som ligger där nu.
// Den får aldrig hamna i service workerns cache (då skulle den alltid svara med den gamla).
const versionFile = (): Plugin => ({
  name: 'azalea-version',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: VERSION }) });
  },
});

// base måste matcha repots namn på GitHub Pages: https://<användare>.github.io/azaleaporten/
export default defineConfig({
  base: '/azaleaporten/',
  define: { __APP_VERSION__: JSON.stringify(VERSION) },
  plugins: [
    preact(),
    versionFile(),
    VitePWA({
      // 'prompt': ny version laddas i bakgrunden men aktiveras först när barnet trycker "Uppdatera" (aldrig mitt i en runda)
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,enc}'], globIgnores: ['version.json'] },
      manifest: {
        name: 'Azaleaporten',
        short_name: 'Azaleaporten',
        description: 'Ett äventyr där du övar matte, svenska och engelska.',
        lang: 'sv',
        theme_color: '#2f2346',
        background_color: '#2f2346',
        display: 'standalone',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
