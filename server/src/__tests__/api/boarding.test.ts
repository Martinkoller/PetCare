import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';

let token: string;
let orgId: string;
let petId: string;
let clientId: string;

beforeEach(async () => {
  await cleanDb();
  const { org } = await seedTestOrg();
  orgId = org.id;

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@teste.com', password: 'senha123' });
  token = loginRes.body.token;

  const clientRes = await request(app)
    .post('/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Tutor Teste', phone: '(49) 99999-0001' });
  clientId = clientRes.body.id;

  const petRes = await request(app)
    .post('/pets')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Rex', species: 'dog', clientId });
  petId = petRes.body.id;
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

describe('GET /boardings', () => {
  it('retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/boardings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/boardings');
    expect(res.status).toBe(401);
  });
});

describe('POST /boardings', () => {
  it('cria hospedagem com dados válidos', async () => {
    const res = await request(app)
      .post('/boardings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        petId,
        checkIn: '2026-06-01T10:00:00.000Z',
        checkOut: '2026-06-05T10:00:00.000Z',
        kennelNumber: 'K-01',
        status: 'reserved',
        dailyRate: 80,
        totalPrice: 320,
      });

    expect(res.status).toBe(201);
    expect(res.body.petId).toBe(petId);
    expect(res.body.kennelNumber).toBe('K-01');
    expect(res.body.dailyRate).toBe(80);
    expect(res.body.organizationId).toBe(orgId);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/boardings')
      .send({ petId, kennelNumber: 'K-01', status: 'reserved', dailyRate: 80 });
    expect(res.status).toBe(401);
  });
});

describe('PUT /boardings/:id', () => {
  it('atualiza status da hospedagem', async () => {
    const createRes = await request(app)
      .post('/boardings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        petId,
        checkIn: '2026-06-01T10:00:00.000Z',
        checkOut: '2026-06-05T10:00:00.000Z',
        kennelNumber: 'K-02',
        status: 'reserved',
        dailyRate: 80,
        totalPrice: 320,
      });

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/boardings/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active', actualCheckIn: '2026-06-01T11:00:00.000Z' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('active');
  });
});

describe('DELETE /boardings/:id', () => {
  it('exclui hospedagem existente', async () => {
    const createRes = await request(app)
      .post('/boardings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        petId,
        checkIn: '2026-06-01T10:00:00.000Z',
        checkOut: '2026-06-03T10:00:00.000Z',
        kennelNumber: 'K-03',
        status: 'reserved',
        dailyRate: 80,
        totalPrice: 160,
      });

    const id = createRes.body.id;

    const del = await request(app)
      .delete(`/boardings/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const get = await request(app)
      .get('/boardings')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.length).toBe(0);
  });
});

describe('POST /boardings/:id/services', () => {
  it('adiciona serviço à hospedagem', async () => {
    const createRes = await request(app)
      .post('/boardings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        petId,
        checkIn: '2026-06-01T10:00:00.000Z',
        checkOut: '2026-06-05T10:00:00.000Z',
        kennelNumber: 'K-04',
        status: 'reserved',
        dailyRate: 80,
        totalPrice: 320,
      });

    const id = createRes.body.id;

    const svcRes = await request(app)
      .post(`/boardings/${id}/services`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Banho', quantity: 1, unitPrice: 50, totalPrice: 50 });

    expect(svcRes.status).toBe(201);
    expect(svcRes.body.name).toBe('Banho');
    expect(svcRes.body.boardingId).toBe(id);
  });
});
