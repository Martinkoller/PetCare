# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Autenticação >> login com senha errada exibe mensagem de erro
- Location: e2e\auth.spec.ts:10:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/e-mail/i)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - region "Notifications (F8)":
      - list
    - region "Notifications alt+T"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e8]
        - heading "AgiliPet" [level=1] [ref=e13]
        - paragraph [ref=e14]: Faça login para continuar
      - generic [ref=e15]:
        - generic [ref=e16]:
          - text: E-mail
          - textbox "seu@email.com" [ref=e17]
        - generic [ref=e18]:
          - text: Senha
          - generic [ref=e19]:
            - textbox "••••••••" [ref=e20]
            - button [ref=e21] [cursor=pointer]:
              - img [ref=e22]
        - button "Entrar" [ref=e25] [cursor=pointer]
        - paragraph [ref=e26]:
          - text: Não tem conta?
          - link "Cadastre-se grátis" [ref=e27] [cursor=pointer]:
            - /url: /register
  - generic [ref=e28] [cursor=pointer]:
    - img "Skip" [ref=e29]
    - generic [ref=e30]: Criado com o Skip
    - button "Fechar badge" [ref=e31]:
      - img [ref=e32]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAs, ADMIN } from './helpers';
  3  | 
  4  | test.describe('Autenticação', () => {
  5  |   test('login com credenciais válidas redireciona para dashboard', async ({ page }) => {
  6  |     await loginAs(page, ADMIN.email, ADMIN.password);
  7  |     await expect(page).toHaveURL(/dashboard/);
  8  |   });
  9  | 
  10 |   test('login com senha errada exibe mensagem de erro', async ({ page }) => {
  11 |     await page.goto('/login');
> 12 |     await page.getByLabel(/e-mail/i).fill(ADMIN.email);
     |                                      ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  13 |     await page.getByLabel(/senha/i).fill('senhaerrada');
  14 |     await page.getByRole('button', { name: /entrar/i }).click();
  15 | 
  16 |     await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
  17 |     await expect(page).toHaveURL(/login/);
  18 |   });
  19 | 
  20 |   test('acesso direto ao dashboard sem login redireciona para login', async ({ page }) => {
  21 |     await page.goto('/dashboard');
  22 |     await expect(page).toHaveURL(/login/);
  23 |   });
  24 | 
  25 |   test('logout limpa sessão e redireciona para login', async ({ page }) => {
  26 |     await loginAs(page, ADMIN.email, ADMIN.password);
  27 |     // Clica no menu de usuário / botão logout
  28 |     await page.getByRole('button', { name: /sair|logout/i }).first().click();
  29 |     await expect(page).toHaveURL(/login/);
  30 |   });
  31 | });
  32 | 
```