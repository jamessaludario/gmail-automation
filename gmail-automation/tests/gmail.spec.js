import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const { validUser, invalidUser, emails } = config;

const STORAGE_STATE = path.resolve(__dirname, '../gmailState.json');
const VIDEOS_DIR = path.resolve(__dirname, '../videos');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR);

let browser;
let context;
let page;

// ---------------------------
// Hooks
// ---------------------------
test.beforeEach(async ({}, testInfo) => {
  const videoPath = path.join(VIDEOS_DIR, `${testInfo.title.replace(/\s+/g, '_')}.webm`);
  
  browser = await chromium.launch({ headless: false, args: ['--start-maximized'] });
  context = await browser.newContext({
    viewport: null,
    recordVideo: { dir: VIDEOS_DIR, size: { width: 1280, height: 720 } },
  });
  page = await context.newPage();

  // Attach page and context to testInfo
  testInfo.context = context;
  testInfo.page = page;

  // Store the desired video path in testInfo for afterEach
  testInfo.videoPath = videoPath;
});

test.afterEach(async ({}, testInfo) => {

  if (context) await context.close();

  const videos = await fs.promises.readdir(VIDEOS_DIR);
  const lastVideo = videos
    .filter(f => f.endsWith('.webm'))
    .map(f => path.join(VIDEOS_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0];

  if (lastVideo && testInfo.videoPath) {
    fs.renameSync(lastVideo, testInfo.videoPath);
    console.log(`Saved video for "${testInfo.title}" -> ${testInfo.videoPath}`);
  }

  if (browser) await browser.close();
});


// ---------------------------
// LOGIN FLOW TESTS
// ---------------------------
test.describe('Login Flow Tests', () => {
  test('1. Login with valid credentials', async () => {
    await login(page, validUser.email, validUser.password);
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible({ timeout: 20000 });

    // Save session
    await context.storageState({ path: STORAGE_STATE });
  });

  test('2. Login with invalid credentials', async () => {
    await login(page, invalidUser.email, invalidUser.password);
    await expect(page.locator('text=Wrong password')).toBeVisible({ timeout: 15000 });
  });
});

// ---------------------------
// LOGGED-IN TESTS (reuse session)
// ---------------------------
test.describe('Logged-In Gmail Tests', () => {
  test.use({ storageState: fs.existsSync(STORAGE_STATE) ? STORAGE_STATE : undefined });

  test.beforeEach(async () => {
    if (!fs.existsSync(STORAGE_STATE)) {
      await login(page, validUser.email, validUser.password);
      await saveSession(page);
    }

    await page.goto('https://mail.google.com/mail/u/0/#inbox');
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible({ timeout: 20000 });
  });

  test('3. Compose and send an email successfully', async () => {
    await composeEmail(page, emails[0].recipient, emails[0].subject, emails[0].body);
    await expect(page.locator('text=Message sent')).toBeVisible({ timeout: 15000 });
  });

  test('4. Compose email without recipient should show warning', async () => {
    await composeEmail(page, '', 'No Recipient Test', 'This should fail.');
    await expect(page.locator('text=Please specify at least one recipient')).toBeVisible({ timeout: 10000 });
  });

  test('5. Compose email with missing subject', async () => {
    await composeEmail(page, emails[1].recipient, '', 'Email with no subject.');
    await expect(page.locator('text=Message sent')).toBeVisible({ timeout: 15000 });
  });

  test('6. Compose multiple emails', async () => {
    for (const emailData of emails) {
      await composeEmail(page, emailData.recipient, emailData.subject, emailData.body);
      await expect(page.locator('text=Message sent')).toBeVisible({ timeout: 15000 });
    }
  });

  test('7. Navigate inbox and open first email', async () => {
    await page.waitForSelector('table[role="grid"] tr');
    await page.locator('table[role="grid"] tr').first().click();
    await page.waitForTimeout(2000);
    await page.goBack();
    await expect(page.getByRole('link', { name: 'Inbox' })).toBeVisible({ timeout: 15000 });
  });

  test('8. Logout successfully', async () => {
    await page.click('a[aria-label*="Google Account"], img[alt*="Google Account"], button[aria-label*="Google Account"]');
    const accountFrame = page.frameLocator('iframe[name*="account"], iframe[src*="SignOutOptions"]');

    await accountFrame.getByRole('link', { name: /Sign out/i }).click();
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
  });
});

// ---------------------------
// Helper Functions
// ---------------------------
async function login(page, email, password) {
  await page.goto('https://accounts.google.com/signin/v2/identifier?continue=https://mail.google.com/mail/&service=mail');
  await page.fill('input[type="email"]', email);
  await page.click('text=Next');

  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await page.fill('input[type="password"]', password);
  await page.click('text=Next');

  const inboxLocator = page.getByRole('link', { name: 'Inbox' });
  const loginErrorLocator = page.locator('text=Wrong password');

  await Promise.race([
    inboxLocator.waitFor({ timeout: 30000 }),
    loginErrorLocator.waitFor({ timeout: 30000 }),
  ]);
}

async function saveSession(page) {
  await page.context().storageState({ path: STORAGE_STATE });
}

async function composeEmail(page, recipient, subject, body) {
  await page.locator('text=Compose').click();

  if (recipient) {
    const recipientInput = page.getByLabel('To recipients');
    await recipientInput.fill(recipient);
  }

  if (subject) {
    const subjectInput = page.locator('input[name="subjectbox"]');
    await subjectInput.fill(subject);
  }

  await page.locator('div[aria-label="Message Body"]').fill(body);
  await page.getByRole('button', { name: 'Send ‪(Ctrl-Enter)‬' }).click();
}
