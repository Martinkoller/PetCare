import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../utils/hash';

// Garante que o Prisma aponte para o banco de teste
const TEST_DB_URL = 'mysql://petcare:petcare2026@localhost:3306/petcare_test';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.JWT_SECRET    = 'test_secret_123';

export const prismaTest = new PrismaClient({
  datasources: { db: { url: TEST_DB_URL } },
});

// Importa o app Express (sem iniciar o servidor HTTP)
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const app = require('../../index').app;

// Limpa todas as tabelas em ordem segura (FK)
export async function cleanDb() {
  await prismaTest.notificationLog.deleteMany();
  await prismaTest.clientInteraction.deleteMany();
  await prismaTest.clientPortalAccess.deleteMany();
  await prismaTest.clientOrder.deleteMany();
  await prismaTest.saleItem.deleteMany();
  await prismaTest.sale.deleteMany();
  await prismaTest.productBatch.deleteMany();
  await prismaTest.product.deleteMany();
  await prismaTest.task.deleteMany();
  await prismaTest.vaccination.deleteMany();
  await prismaTest.medicalRecord.deleteMany();
  await prismaTest.hospitalizationLog.deleteMany();
  await prismaTest.hospitalizationStay.deleteMany();
  await prismaTest.boardingStay.deleteMany();
  await prismaTest.kennel.deleteMany();
  await prismaTest.appointment.deleteMany();
  await prismaTest.appointmentTemplate.deleteMany();
  await prismaTest.messageTemplate.deleteMany();
  await prismaTest.serviceCatalogItem.deleteMany();
  await prismaTest.pet.deleteMany();
  await prismaTest.client.deleteMany();
  await prismaTest.user.deleteMany();
  await prismaTest.organization.deleteMany();
}

// Cria organização + admin para os testes
export async function seedTestOrg() {
  const org = await prismaTest.organization.create({
    data: {
      name: 'Clínica Teste',
      cnpj: '12345678000190',
      email: 'org@teste.com',
      status: 'active',
      plan: 'clinica',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(),
    },
  });

  const passwordHash = await hashPassword('senha123');
  const admin = await prismaTest.user.create({
    data: {
      email: 'admin@teste.com',
      passwordHash,
      name: 'Admin Teste',
      role: 'admin',
      organizationId: org.id,
    },
  });

  return { org, admin };
}
