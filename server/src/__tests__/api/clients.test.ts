import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';

let token: string;
let orgId: string;

beforeEach(async () => {
  await cleanDb();
  const { org } = await seedTestOrg();
  orgId = org.id;

  const res = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@teste.com', password: 'senha123' });
  token = res.body.token;
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

describe('GET /clients', () => {
  it('retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/clients');
    expect(res.status).toBe(401);
  });
});

describe('POST /clients', () => {
  it('cria cliente com dados válidos', async () => {
    const res = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'João Tutor', phone: '(49) 99971-5125', email: 'joao@email.com' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('João Tutor');
    expect(res.body.organizationId).toBe(orgId);
  });

  it('retorna 400 sem nome', async () => {
    const res = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '(49) 99999-0000' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /clients/:id', () => {
  it('atualiza cliente existente', async () => {
    const create = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria', phone: '(49) 99971-5125' });

    const id = create.body.id;

    const res = await request(app)
      .put(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria Atualizada', phone: '(49) 99971-5125' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Maria Atualizada');
  });
});

describe('DELETE /clients/:id', () => {
  it('remove cliente existente', async () => {
    const create = await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Deletar', phone: '(49) 99971-5125' });

    const id = create.body.id;

    const res = await request(app)
      .delete(`/clients/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Confirma que sumiu
    const list = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(list.body.find((c: any) => c.id === id)).toBeUndefined();
  });
});

describe('Isolamento multi-tenant', () => {
  it('não retorna clientes de outra organização', async () => {
    // Cria segunda org
    const { hashPassword } = require('../../utils/hash');
    const org2 = await prismaTest.organization.create({
      data: {
        name: 'Outra Org',
        cnpj: '11111111000100',
        email: 'outra@org.com',
        status: 'active',
        plan: 'clinica',
        trialEndsAt: new Date(Date.now() + 9999999),
        confirmedAt: new Date(),
      },
    });
    await prismaTest.user.create({
      data: {
        email: 'admin2@outra.com',
        passwordHash: await hashPassword('senha123'),
        name: 'Admin2',
        role: 'admin',
        organizationId: org2.id,
      },
    });

    // Cria cliente na org2
    const login2 = await request(app)
      .post('/auth/login')
      .send({ email: 'admin2@outra.com', password: 'senha123' });
    await request(app)
      .post('/clients')
      .set('Authorization', `Bearer ${login2.body.token}`)
      .send({ name: 'Cliente Org2', phone: '(11) 99999-9999' });

    // Org1 não deve ver cliente da org2
    const res = await request(app)
      .get('/clients')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.find((c: any) => c.name === 'Cliente Org2')).toBeUndefined();
  });
});
