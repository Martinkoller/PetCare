import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:3000';

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === 'admin@agilipet.local' && body.password === 'admin123') {
      return HttpResponse.json({
        token: 'fake.jwt.token',
        user: {
          id: 'user-1',
          email: 'admin@agilipet.local',
          name: 'Admin',
          role: 'admin',
          organizationId: 'org-1',
        },
      });
    }
    return HttpResponse.json({ error: 'Credenciais inválidas.' }, { status: 401 });
  }),

  http.get(`${BASE}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth === 'Bearer fake.jwt.token') {
      return HttpResponse.json({
        id: 'user-1',
        email: 'admin@agilipet.local',
        name: 'Admin',
        role: 'admin',
        organizationId: 'org-1',
      });
    }
    return HttpResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }),

  // Clients
  http.get(`${BASE}/clients`, () =>
    HttpResponse.json([
      { id: 'c-1', name: 'Ana Silva', phone: '(49) 99971-5125', organizationId: 'org-1' },
      { id: 'c-2', name: 'Bruno Santos', phone: '(49) 99971-5125', organizationId: 'org-1' },
    ])
  ),

  // Organization
  http.get(`${BASE}/organization/me`, () =>
    HttpResponse.json({
      id: 'org-1',
      name: 'AgiliPet',
      status: 'active',
      plan: 'clinica',
      trialEndsAt: new Date(Date.now() + 9999999).toISOString(),
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })
  ),
];
