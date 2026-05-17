import request from 'supertest';
import { app, cleanDb, seedTestOrg, prismaTest } from '../setup/testApp';

let token: string;

beforeEach(async () => {
  await cleanDb();
  await seedTestOrg();

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: 'admin@teste.com', password: 'senha123' });
  token = loginRes.body.token;
});

afterAll(async () => {
  await prismaTest.$disconnect();
});

describe('GET /products', () => {
  it('retorna lista vazia inicialmente', async () => {
    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/products');
    expect(res.status).toBe(401);
  });
});

describe('POST /products', () => {
  it('cria produto com dados válidos', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Shampoo Canino',
        category: 'grooming',
        price: 35,
        stock: 20,
        minStock: 5,
        unit: 'unidade',
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Shampoo Canino');
    expect(res.body.stock).toBe(20);
    expect(res.body.price).toBe(35);
  });

  it('cria produto com lotes', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Vacina Antirrábica',
        category: 'medicine',
        price: 90,
        stock: 10,
        batches: [
          { code: 'LOT-001', quantity: 10, expirationDate: '2027-06-01' },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.batches).toHaveLength(1);
    expect(res.body.batches[0].code).toBe('LOT-001');
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app)
      .post('/products')
      .send({ name: 'X', category: 'food', price: 10, stock: 5 });
    expect(res.status).toBe(401);
  });
});

describe('PUT /products/:id', () => {
  it('atualiza produto existente', async () => {
    const createRes = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ração Gato', category: 'food', price: 60, stock: 30 });

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ração Gato Premium', price: 75, stock: 30 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Ração Gato Premium');
    expect(res.body.price).toBe(75);
  });

  it('atualiza lotes do produto', async () => {
    const createRes = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Antibiótico',
        category: 'medicine',
        price: 45,
        stock: 5,
        batches: [{ code: 'LOT-A', quantity: 5, expirationDate: '2026-12-01' }],
      });

    const id = createRes.body.id;

    const res = await request(app)
      .put(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        batches: [
          { code: 'LOT-B', quantity: 8, expirationDate: '2027-03-01' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.batches).toHaveLength(1);
    expect(res.body.batches[0].code).toBe('LOT-B');
  });
});

describe('DELETE /products/:id', () => {
  it('exclui produto existente', async () => {
    const createRes = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Produto Temporário', category: 'other', price: 10, stock: 0 });

    const id = createRes.body.id;

    const del = await request(app)
      .delete(`/products/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(204);

    const get = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);
    expect(get.body.find((p: any) => p.id === id)).toBeUndefined();
  });
});

describe('Inventory low-stock logic', () => {
  it('produto com stock abaixo de minStock é retornado corretamente', async () => {
    await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Produto Crítico', category: 'medicine', price: 20, stock: 2, minStock: 10 });

    const res = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);

    const produto = res.body.find((p: any) => p.name === 'Produto Crítico');
    expect(produto).toBeDefined();
    expect(produto.stock).toBeLessThan(produto.minStock);
  });
});
