import * as mysql from 'mysql2/promise';

const BASE_URL = 'mysql://petcare:petcare2026@localhost:3306';
const TEST_DB  = 'petcare_test';

export default async function globalTeardown() {
  const conn = await mysql.createConnection(BASE_URL);
  await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
  await conn.end();
  console.log('\n🧹 Banco petcare_test removido.\n');
}
