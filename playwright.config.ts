import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4173/azaleaporten/',
    // Service workern skulle annars gå förbi page.route (som vi använder för att servera testpaket).
    serviceWorkers: 'block',
  },
  projects: [
    { name: 'dator', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobil', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/azaleaporten/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
