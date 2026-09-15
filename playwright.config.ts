import { defineConfig } from '@playwright/test';

const viewports = [320, 360, 390, 768, 1024, 1440];

export default defineConfig({
  workers: 2,
  reporter: [['list'], ['html', {open:'never'}]],
  testDir: './tests/e2e',
  testMatch: /.*\.spec\.ts/,
  testIgnore: /production-smoke\.spec\.ts/,
  use: { baseURL: 'http://127.0.0.1:8788', browserName: 'chromium', trace:'retain-on-failure', screenshot:'only-on-failure' },
  projects: viewports.map(width => ({
    name: `chromium-${width}`,
    use: { viewport: { width, height: width < 768 ? 800 : 900 } }
  })),
  webServer: {
    command: 'npm run preview:pages',
    url: 'http://127.0.0.1:8788',
    reuseExistingServer: false
  }
});
