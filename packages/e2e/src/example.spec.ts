import { devLog } from '@easygrid/utils/console';
import { expect, test } from '@playwright/test';

test('example', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  devLog('info', 'example');
  await expect(page).toHaveTitle(/Playwright/);
});
