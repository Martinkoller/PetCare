import { test, expect } from '@playwright/test';
import { loginAs, ADMIN } from './helpers';

test.describe('Autenticação', () => {
  test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/e-mail/i).fill(ADMIN.email);
    await page.getByLabel(/senha/i).fill('senhaerrada');
    await page.getByRole('button', { name: /entrar/i }).click();

    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    await expect(page).toHaveURL(/login/);
  });

  test('acesso direto ao dashboard sem login redireciona para login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });

  test('logout limpa sessão e redireciona para login', async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    // Clica no menu de usuário / botão logout
    await page.getByRole('button', { name: /sair|logout/i }).first().click();
    await expect(page).toHaveURL(/login/);
  });
});
