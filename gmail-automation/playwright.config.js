import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    headless: false,
    viewport: null,
    launchOptions: {
        args: ['--start-maximized'],
    },
    video: 'on',
    screenshot: 'on',
    trace: 'on'
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
