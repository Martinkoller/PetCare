# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: grooming.spec.ts >> Kanban — Banho e Tosa >> exibe as colunas do kanban
- Location: e2e\grooming.spec.ts:14:3

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
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
  1  | import { Page } from '@playwright/test';
  2  | 
  3  | export const ADMIN = {
  4  |   email: 'admin@agilipet.local',
  5  |   password: 'admin123',
  6  | };
  7  | 
  8  | export async function loginAs(page: Page, email: string, password: string) {
  9  |   await page.goto('/login');
> 10 |   await page.getByLabel(/e-mail/i).fill(email);
     |                                    ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  11 |   await page.getByLabel(/senha/i).fill(password);
  12 |   await page.getByRole('button', { name: /entrar/i }).click();
  13 |   // Aguarda redirecionar para o dashboard
  14 |   await page.waitForURL(/dashboard|\/$/);
  15 | }
  16 | 
```