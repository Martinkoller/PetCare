import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

describe('POST /auth/login', () => {
  it('retorna token com dados válidos', async () => {
    await seedTestOrg();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@teste.com', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@teste.com');
    expect(res.body.user.role).toBe('admin');
  });

  it('retorna 401 com senha errada', async () => {
    await seedTestOrg();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@teste.com', password: 'senhaerrada' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais inválidas.');
  });

  it('retorna 401 com email inexistente', async () => {
    await seedTestOrg();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@teste.com', password: 'senha123' });

    expect(res.status).toBe(401);
  });

  it('retorna trial_expired quando trial vencido', async () => {
    const org = await prismaTest.organization.create({
      data: {
        name: 'Expirada',
        cnpj: '99999999000100',
        email: 'exp@teste.com',
        status: 'trial',
        plan: 'essencial',
        trialEndsAt: new Date('2020-01-01'), // passado
        confirmedAt: new Date(),
      },
    });
    const { hashPassword } = require('../../utils/hash');
    await prismaTest.user.create({
      data: {
        email: 'exp@teste.com',
        passwordHash: await hashPassword('senha123'),
        name: 'Expirado',
        role: 'admin',
        organizationId: org.id,
      },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'exp@teste.com', password: 'senha123' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('trial_expired');
  });

  it('token contém plan=clinica quando status=trial', async () => {
    await seedTestOrg();

    // Força status trial no banco
    await prismaTest.organization.updateMany({
      where: { email: 'org@teste.com' },
      data: { status: 'trial', trialEndsAt: new Date(Date.now() + 99999999) },
    });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@teste.com', password: 'senha123' });

    expect(res.status).toBe(200);
    const payload = JSON.parse(
      Buffer.from(res.body.token.split('.')[1], 'base64').toString()
    );
    expect(payload.plan).toBe('clinica');
  });
});

describe('GET /auth/me', () => {
  it('retorna dados do usuário autenticado', async () => {
    await seedTestOrg();
    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@teste.com', password: 'senha123' });

    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@teste.com');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(res.status).toBe(401);
  });
});
