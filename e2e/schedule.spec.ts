import { test, expect } from '@playwright/test';
import { loginAs, ADMIN } from './helpers';

test.describe('Agenda', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto('/schedule');
  });

  test('exibe a página de agenda', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /agenda/i })).toBeVisible();
  });

  test('abre modal de novo agendamento ao clicar em Novo', async ({ page }) => {
    await page.getByRole('button', { name: /novo|agendar/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('cria agendamento de consulta', async ({ page }) => {
    await page.getByRole('button', { name: /novo|agendar/i }).first().click();
    const dialog = page.getByRole('dialog');

    // Seleciona tipo consulta
    await dialog.getByRole('combobox').first().selectOption({ label: /consulta/i });

    // Seleciona tutor (primeiro da lista)
    const tutorSelect = dialog.getByLabel(/tutor/i);
    await tutorSelect.click();
    await page.getByRole('option').first().click();

    // Seleciona pet (primeiro disponível)
    const petSelect = dialog.getByLabel(/pet/i);
    await petSelect.click();
    await page.getByRole('option').first().click();

    // Data e hora
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await dialog.getByLabel(/data/i).fill(dateStr);
    await dialog.getByLabel(/hora/i).fill('10:00');

    await dialog.getByRole('button', { name: /salvar|confirmar/i }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });
});
