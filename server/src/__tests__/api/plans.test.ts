import request from 'supertest';
import { app, cleanDb, prismaTest } from '../setup/testApp';
import { hashPassword } from '../../utils/hash';
import { generateToken } from '../../utils/jwt';

afterAll(async () => {
  await prismaTest.$disconnect();
});

async function createOrg(plan: string, status = 'active') {
  const cnpj = Math.random().toString().slice(2, 16).padEnd(14, '0');
  const email = `org_${Math.random().toString(36).slice(2)}@test.com`;

  const org = await prismaTest.organization.create({
    data: {
      name: 'Org Plano',
      cnpj,
      email,
      status,
      plan,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(),
    },
  });

  const userEmail = `user_${Math.random().toString(36).slice(2)}@test.com`;
  const user = await prismaTest.user.create({
    data: {
      email: userEmail,
      passwordHash: await hashPassword('senha123'),
      name: 'Admin',
      role: 'admin',
      organizationId: org.id,
    },
  });

  return { org, user, email: userEmail };
}

describe('Planos — token contém plano correto', () => {
  beforeEach(() => cleanDb());

  it('plano essencial → token.plan = essencial', async () => {
    const { email } = await createOrg('essencial');
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'senha123' });

    expect(res.status).toBe(200);
    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(payload.plan).toBe('essencial');
  });

  it('plano hotel → token.plan = hotel', async () => {
    const { email } = await createOrg('hotel');
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'senha123' });

    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(payload.plan).toBe('hotel');
  });

  it('plano clinica → token.plan = clinica', async () => {
    const { email } = await createOrg('clinica');
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'senha123' });

    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(payload.plan).toBe('clinica');
  });

  it('trial sempre retorna plan=clinica no token (acesso total)', async () => {
    const { email } = await createOrg('essencial', 'trial');
    const res = await request(app)
      .post('/auth/login')
      .send({ email, password: 'senha123' });

    const payload = JSON.parse(Buffer.from(res.body.token.split('.')[1], 'base64').toString());
    expect(payload.plan).toBe('clinica');
  });
});

describe('SAAS — alterar plano', () => {
  beforeEach(() => cleanDb());

  it('saas_admin pode mudar plano de uma organização', async () => {
    const { org } = await createOrg('essencial');

    // Cria saas_admin
    const saasAdmin = await prismaTest.user.create({
      data: {
        email: 'saas@admin.com',
        passwordHash: await hashPassword('admin123'),
        name: 'SAAS Admin',
        role: 'saas_admin',
        organizationId: null,
      },
    });

    const saasToken = generateToken(saasAdmin.id, 'saas_admin', null, null);

    const res = await request(app)
      .patch(`/saas/organizations/${org.id}/plan`)
      .set('Authorization', `Bearer ${saasToken}`)
      .send({ plan: 'clinica' });

    expect(res.status).toBe(200);

    const updated = await prismaTest.organization.findUnique({ where: { id: org.id } });
    expect(updated?.plan).toBe('clinica');
  });

  it('plano inválido retorna 400', async () => {
    const { org } = await createOrg('essencial');
    const saasAdmin = await prismaTest.user.create({
      data: {
        email: 'saas2@admin.com',
        passwordHash: await hashPassword('admin123'),
        name: 'SAAS Admin',
        role: 'saas_admin',
        organizationId: null,
      },
    });
    const saasToken = generateToken(saasAdmin.id, 'saas_admin', null, null);

    const res = await request(app)
      .patch(`/saas/organizations/${org.id}/plan`)
      .set('Authorization', `Bearer ${saasToken}`)
      .send({ plan: 'premium_gold' });

    expect(res.status).toBe(400);
  });

  it('não-saas_admin não pode alterar plano', async () => {
    const { org, user } = await createOrg('essencial');
    const userToken = generateToken(user.id, 'admin', org.id, 'essencial');

    const res = await request(app)
      .patch(`/saas/organizations/${org.id}/plan`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ plan: 'clinica' });

    expect(res.status).toBe(403);
  });
});
