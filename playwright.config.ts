import { defineConfig, devices } from '@playwright/test';

const PORT = 4317;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `python3 -m http.server ${PORT} --directory out`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
