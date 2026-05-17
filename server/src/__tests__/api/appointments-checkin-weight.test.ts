import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';
import { hashPassword } from '../../utils/hash';

let token: string;
let orgId: string;
let petId: string;

async function seedAppointment(overrides: Record<string, unknown> = {}) {
  const client = await prismaTest.client.create({
    data: { name: 'Tutor Teste', organizationId: orgId },
  });
  const pet = await prismaTest.pet.create({
    data: { name: 'Thor', organizationId: orgId, clientId: client.id },
  });
  petId = pet.id;
  return prismaTest.appointment.create({
    data: {
      organizationId: orgId,
      petId: pet.id,
      serviceType: 'grooming',
      date: new Date('2026-05-15T10:00:00'),
      status: 'scheduled',
      ...overrides,
    },
  });
}

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

describe('PATCH /api/appointments/:id — checkinWeight', () => {
  it('aceita checkinWeight positivo e retorna 200 com o valor', async () => {
    const apt = await seedAppointment();

    const res = await request(app)
      .patch(`/api/appointments/${apt.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checkinWeight: 4.5 });

    expect(res.status).toBe(200);
    expect(res.body.checkinWeight).toBe(4.5);
  });

  it('aceita checkinWeight null e retorna 200 com campo nulo', async () => {
    const apt = await seedAppointment({ checkinWeight: 4.5 });

    const res = await request(app)
      .patch(`/api/appointments/${apt.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checkinWeight: null });

    expect(res.status).toBe(200);
    expect(res.body.checkinWeight == null).toBe(true);
  });

  it('rejeita checkinWeight negativo com 400 e mensagem clara', async () => {
    const apt = await seedAppointment();

    const res = await request(app)
      .patch(`/api/appointments/${apt.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checkinWeight: -1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Peso nao pode ser negativo');
  });

  it('retorna 403 ao acessar appointment de outra organização', async () => {
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

    const client2 = await prismaTest.client.create({
      data: { name: 'Tutor Org2', organizationId: org2.id },
    });
    const pet2 = await prismaTest.pet.create({
      data: { name: 'Rex', organizationId: org2.id, clientId: client2.id },
    });
    const apt2 = await prismaTest.appointment.create({
      data: {
        organizationId: org2.id,
        petId: pet2.id,
        serviceType: 'grooming',
        date: new Date('2026-05-15T10:00:00'),
        status: 'scheduled',
      },
    });

    const res = await request(app)
      .patch(`/api/appointments/${apt2.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ checkinWeight: 3.0 });

    expect(res.status).toBe(403);
  });
});
