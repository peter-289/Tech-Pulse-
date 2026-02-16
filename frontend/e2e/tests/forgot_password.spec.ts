import { test, expect } from '@playwright/test';
import fetch from 'node-fetch';

function uniqueEmail() {
  return `e2e_${Date.now()}@example.test`;
}

async function waitForMailhog(toEmail: string, timeout = 15000) {
  const mailhogUrl = process.env.MAILHOG_API || 'http://127.0.0.1:8025/api/v2/messages';
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const res = await fetch(mailhogUrl);
    const body = await res.json();
    const items = body.items || [];
    const msg = items.find((m: any) => {
      try {
        const to = m.Content?.Headers?.To || [];
        return to.some((t: string) => t.includes(toEmail));
      } catch (e) { return false; }
    });
    if (msg) return msg;
    await new Promise(r => setTimeout(r, 500));
  }
  return null;
}


test('forgot password full flow (register, verify, reset, login)', async ({ page, baseURL }) => {
  const email = uniqueEmail();
  const username = `user_${Date.now()}`;
  const password = 'Test1234X!';
  const newPassword = 'NewPass12345X!';

  // 1) Register
  await page.goto('/register');
  await page.fill('input[name="fullname"]', 'E2E Tester');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.fill('input[name="confirm_password"]', password);
  await page.click('button:has-text("Register")');

  // Wait for verification email to be sent via MailHog
  const verifyMsg = await waitForMailhog(email, 20000);
  expect(verifyMsg).not.toBeNull();
  const html = verifyMsg.Content?.Body || '';
  const match = html.match(/href=\"(https?:\\/\\/[^\"]+\")/);
  // alternative: search for /email-verification\?token=...
  const tokenMatch = html.match(/email-verification\?token=([^\"]+)/);
  expect(tokenMatch).not.toBeNull();
  const verifyLink = tokenMatch ? tokenMatch[0].replace(/&amp;/g, '&') : null;
  expect(verifyLink).not.toBeNull();

  // 2) Visit verification link to verify email
  const relative = verifyLink.replace(/^https?:\/\/[\w\.:-]+?\//, '/');
  await page.goto(relative);

  // 3) Login
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);
  await page.click('button:has-text("Login")');
  // Should see resources page or welcome banner
  await expect(page.locator('text=Welcome')).toBeVisible({timeout:5000});

  // 4) Click Forgot password link
  await page.goto('/login');
  await page.click('a:has-text("Forgot password?")');
  await expect(page.locator('text=Forgot your password')).toBeVisible();
  await page.fill('input[name="email"]', email);
  await page.click('button:has-text("Send reset link")');

  // Wait for reset email
  const resetMsg = await waitForMailhog(email, 20000);
  expect(resetMsg).not.toBeNull();
  const resetHtml = resetMsg.Content?.Body || '';
  const resetTokenMatch = resetHtml.match(/password-reset\/(\S+)\"/);
  expect(resetTokenMatch).not.toBeNull();
  const resetUrlMatch = resetHtml.match(/href=\"(https?:\\/\\/[^\"]+password-reset\/[^"]+)\"/);
  const resetLink = resetUrlMatch ? resetUrlMatch[1] : null;
  expect(resetLink).not.toBeNull();

  // Visit reset link
  const resetRelative = resetLink.replace(/^https?:\/\/[\w\.:-]+?\//, '/');
  await page.goto(resetRelative);
  // Fill new password and submit - form uses new_password and confirm_password
  await page.fill('input[name="new_password"]', newPassword);
  await page.fill('input[name="confirm_password"]', newPassword);
  await page.click('button:has-text("Reset Password")');

  // After success, attempt login with new password
  await page.goto('/login');
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', newPassword);
  await page.click('button:has-text("Login")');
  await expect(page.locator('text=Welcome')).toBeVisible({timeout:5000});
});
