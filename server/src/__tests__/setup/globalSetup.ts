import { execSync } from 'child_process';
import * as mysql from 'mysql2/promise';

// URL base sem o banco, para criar o banco de teste
const BASE_URL = 'mysql://petcare:petcare2026@localhost:3306';
const TEST_DB  = 'petcare_test';

export default async function globalSetup() {
  // Cria o banco de teste se não existir
  const conn = await mysql.createConnection(BASE_URL);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.end();

  // Seta a DATABASE_URL para o banco de teste
  process.env.DATABASE_URL = `${BASE_URL}/${TEST_DB}`;

  // Roda as migrations no banco de teste
  execSync('npx prisma migrate deploy', {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: `${BASE_URL}/${TEST_DB}` },
    stdio: 'inherit',
  });

  console.log('\n✅ Banco petcare_test pronto.\n');
}
