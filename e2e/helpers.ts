import { Page } from '@playwright/test';

export const ADMIN = {
  email: 'admin@agilipet.local',
  password: 'admin123',
};

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/e-mail/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  // Aguarda redirecionar para o dashboard
  await page.waitForURL(/dashboard|\/$/);
}
