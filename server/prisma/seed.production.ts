import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedSaasAdmin(client: PrismaClient = prisma) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    const existing = await client.user.findUnique({ where: { email: 'marcelokoller@gmail.com' } });
    if (!existing) {
        await client.user.create({
            data: {
                email: 'marcelokoller@gmail.com',
                passwordHash,
                name: 'Marcelo Koller',
                role: 'saas_admin',
                organizationId: null,
            },
        });
        console.log('   marcelokoller@gmail.com / admin123  (saas_admin)');
    }
}

async function main() {
    console.log('🚀 Production seed starting...');
    await seedSaasAdmin();
    console.log('✅ Production seed concluído.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
