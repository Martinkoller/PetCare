import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';

let token: string;
let orgId: string;
let productId: string;

beforeEach(async () => {
  await cleanDb();
  const { org } = await seedTestOrg();
  orgId = org.id;

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@teste.com', password: 'senha123' });
  token = loginRes.body.token;

  const productRes = await request(app)
    .post('/products')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Ração Premium', category: 'food', price: 120, stock: 50 });
  productId = productRes.body.id;
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

describe('GET /sales', () => {
  it('retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/sales')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/sales');
    expect(res.status).toBe(401);
  });
});

describe('POST /sales', () => {
  it('cria venda com item válido', async () => {
    const res = await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        total: 120,
        status: 'completed',
        items: [
          {
            productId,
            productName: 'Ração Premium',
            quantity: 1,
            unitPrice: 120,
            total: 120,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.total).toBe(120);
    expect(res.body.organizationId).toBe(orgId);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productName).toBe('Ração Premium');
  });

  it('retorna 400 sem items', async () => {
    const res = await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ total: 100, status: 'completed' });

    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/sales')
      .send({ total: 100, items: [{ productId, productName: 'X', quantity: 1, unitPrice: 100, total: 100 }] });
    expect(res.status).toBe(401);
  });

  it('desconta estoque após venda', async () => {
    await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        total: 240,
        status: 'completed',
        items: [{ productId, productName: 'Ração Premium', quantity: 2, unitPrice: 120, total: 240 }],
      });

    const productRes = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);

    const product = productRes.body.find((p: any) => p.id === productId);
    expect(product.stock).toBe(48);
  });
});

describe('PATCH /sales/:id/cancel', () => {
  it('cancela venda existente', async () => {
    const saleRes = await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        total: 120,
        status: 'completed',
        items: [{ productId, productName: 'Ração Premium', quantity: 1, unitPrice: 120, total: 120 }],
      });

    const id = saleRes.body.id;

    const cancelRes = await request(app)
      .patch(`/sales/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.status).toBe('cancelled');
  });

  it('retorna 404 para venda inexistente', async () => {
    const res = await request(app)
      .patch('/sales/00000000-0000-0000-0000-000000000000/cancel')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('retorna 400 ao cancelar venda já cancelada', async () => {
    const saleRes = await request(app)
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        total: 120,
        status: 'completed',
        items: [{ productId, productName: 'Ração Premium', quantity: 1, unitPrice: 120, total: 120 }],
      });

    const id = saleRes.body.id;
    await request(app).patch(`/sales/${id}/cancel`).set('Authorization', `Bearer ${token}`);

    const res = await request(app)
      .patch(`/sales/${id}/cancel`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
