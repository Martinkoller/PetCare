import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Production seed starting...');

    const passwordHash = await bcrypt.hash('admin123', 10);

    // SAAS Admin — sem organizationId
    const existing = await prisma.user.findUnique({ where: { email: 'marcelokoller@gmail.com' } });
    if (!existing) {
        await prisma.user.create({
            data: {
                email: 'marcelokoller@gmail.com',
                passwordHash,
                name: 'Marcelo Koller',
                role: 'saas_admin',
                organizationId: null,
            },
        });
        console.log('✅ SAAS admin criado: marcelokoller@gmail.com / admin123');
    } else {
        console.log('ℹ️  SAAS admin já existe.');
    }

    console.log('✅ Production seed concluído.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
