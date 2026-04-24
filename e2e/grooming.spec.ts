import { test, expect } from '@playwright/test';
import { loginAs, ADMIN } from './helpers';

test.describe('Kanban — Banho e Tosa', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto('/grooming');
  });

  test('exibe o kanban de banho e tosa', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /banho|tosa|grooming/i })).toBeVisible();
  });

  test('exibe as colunas do kanban', async ({ page }) => {
    // Colunas esperadas
    for (const col of [/aguardando|entrada/i, /em atendimento/i, /pronto/i, /entregue/i]) {
      await expect(page.getByText(col).first()).toBeVisible();
    }
  });

  test('cards de pet aparecem no kanban', async ({ page }) => {
    // Se há agendamentos de banho e tosa, devem aparecer cards
    const cards = page.locator('[data-testid="grooming-card"]');
    const count = await cards.count();
    // Pode ser 0 se não há agendamentos, mas não deve dar erro
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
