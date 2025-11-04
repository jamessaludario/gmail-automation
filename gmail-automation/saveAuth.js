import { chromium } from '@playwright/test';

(async () => {
  // Launch browser in visible (non-headless) mode
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Gmail
  await page.goto('https://mail.google.com');

  console.log('\n🟢 Please log in manually to your Gmail account.');
  console.log('⏳ You have 60 seconds to complete the login.');

  // Wait 60 seconds for you to finish login manually
  await page.waitForTimeout(60000);

  // Save the authenticated state to a JSON file
  await context.storageState({ path: 'gmailState.json' });
  console.log('\n✅ Login state saved as gmailState.json\n');

  await browser.close();
})();
