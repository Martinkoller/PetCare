import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting MEGA seeding...');

  // Clear existing data
  console.log('🧹 Cleaning database...');
  await prisma.messageTemplate.deleteMany();
  await prisma.appointmentTemplate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.boardingService.deleteMany();
  await prisma.boardingStay.deleteMany();
  await prisma.kennel.deleteMany();
  await prisma.productBatch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.serviceCatalogItem.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // Organization
  const org = await prisma.organization.create({
    data: {
      name: 'PetCare Premium - Hospital Veterinário',
      settings: JSON.stringify({
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
      }),
    },
  });

  // Users
  console.log('👥 Seeding users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'admin@petcare.local', passwordHash, name: 'Admin Principal', role: 'admin', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'marcelo@petcare.local', passwordHash, name: 'Dr. Marcelo Silva', role: 'veterinarian', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'beatriz@petcare.local', passwordHash, name: 'Dra. Beatriz Costa', role: 'veterinarian', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'andre@petcare.local', passwordHash, name: 'Dr. André Santos', role: 'veterinarian', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'fernanda@petcare.local', passwordHash, name: 'Fernanda Almeida', role: 'attendant', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'rodrigo@petcare.local', passwordHash, name: 'Rodrigo Lima', role: 'attendant', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'carla@petcare.local', passwordHash, name: 'Carla Groomer', role: 'groomer', organizationId: org.id } }),
    prisma.user.create({ data: { email: 'juliano@petcare.local', passwordHash, name: 'Juliano Esteticista', role: 'groomer', organizationId: org.id } }),
  ]);
  const vets = users.filter(u => u.role === 'veterinarian');

  // Service Catalog — category values must match frontend: 'consultation' | 'grooming' | 'boarding' | 'exam' | 'vaccine' | 'other'
  console.log('🛠️ Seeding service catalog...');
  const servicesData = [
    { name: 'Consulta Geral', category: 'consultation', price: 150.0 },
    { name: 'Consulta Especialista', category: 'consultation', price: 280.0 },
    { name: 'Emergência (Plantão)', category: 'consultation', price: 350.0 },
    { name: 'Cirurgia Castração (Canino P)', category: 'other', price: 500.0 },
    { name: 'Cirurgia Castração (Felino)', category: 'other', price: 400.0 },
    { name: 'Cirurgia Ortopédica', category: 'other', price: 2500.0 },
    { name: 'Banho (P)', category: 'grooming', price: 50.0 },
    { name: 'Banho e Tosa (M)', category: 'grooming', price: 90.0 },
    { name: 'Tosa na Tesoura', category: 'grooming', price: 150.0 },
    { name: 'Diária Hotel Standard', category: 'boarding', price: 70.0 },
    { name: 'Diária Hotel Luxo', category: 'boarding', price: 120.0 },
    { name: 'Hemograma Completo', category: 'exam', price: 85.0 },
    { name: 'Raio-X Digital', category: 'exam', price: 180.0 },
    { name: 'Ultrassom Abdominal', category: 'exam', price: 220.0 },
    { name: 'Vacina V10', category: 'vaccine', price: 95.0 },
    { name: 'Vacina Antirrábica', category: 'vaccine', price: 75.0 },
  ];
  await Promise.all(servicesData.map(s => prisma.serviceCatalogItem.create({ data: s })));

  // Clients & Pets
  console.log('🐾 Seeding massive number of clients and pets...');
  const firstNames = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elena', 'Fábio', 'Gabriela', 'Hugo', 'Íris', 'João', 'Kátia', 'Luan', 'Márcia', 'Nilo', 'Olga', 'Paulo', 'Quiteria', 'Renato', 'Sônia', 'Tiago'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes'];
  const speciesData = [
    { species: 'dog', breeds: ['Golden Retriever', 'Shih Tzu', 'Labrador', 'Poodle', 'Beagle', 'Pastor Alemão', 'Bulldog', 'Dachshund'] },
    { species: 'cat', breeds: ['SRD', 'Persa', 'Siamês', 'Maine Coon', 'Bengala', 'Ragdoll'] },
    { species: 'bird', breeds: ['Calopsita', 'Papagaio', 'Canário', 'Periquito'] },
    { species: 'other', breeds: ['Mini Lion', 'Rex', 'Holandês'] },
  ];

  const createdPets: any[] = [];
  for (let i = 0; i < 30; i++) {
    const clientName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const client = await prisma.client.create({
      data: {
        name: clientName,
        email: `${clientName.toLowerCase().replace(' ', '.')}@example.com`,
        phone: `(11) 9${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        whatsappEnabled: Math.random() > 0.3,
        address: `Rua ${lastNames[i % lastNames.length]}, ${100 + i}`,
      },
    });

    const numPets = 1 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numPets; j++) {
      const sp = speciesData[Math.floor(Math.random() * speciesData.length)];
      const petName = ['Thor', 'Mel', 'Luna', 'Bob', 'Nina', 'Max', 'Bela', 'Fred', 'Amora', 'Zeus', 'Mia', 'Billy', 'Jade', 'Dante', 'Gaia'][Math.floor(Math.random() * 15)] + (j > 0 ? ` ${j + 1}` : '');
      const pet = await prisma.pet.create({
        data: {
          clientId: client.id,
          name: petName,
          species: sp.species,
          breed: sp.breeds[Math.floor(Math.random() * sp.breeds.length)],
          age: 1 + Math.floor(Math.random() * 12),
          gender: Math.random() > 0.5 ? 'male' : 'female',
          weight: 1 + Math.random() * 40,
          color: ['Preto', 'Branco', 'Marrom', 'Cinza', 'Dourado', 'Malhado'][Math.floor(Math.random() * 6)],
          birthDate: new Date(Date.now() - (1 + Math.floor(Math.random() * 10)) * 365 * 24 * 60 * 60 * 1000),
        },
      });
      createdPets.push(pet);
    }
  }

  // Medical Records
  console.log('🩺 Seeding 100+ medical records...');
  const diagnoses = ['Saudável', 'Otite', 'Dermatite', 'Gastrite', 'Gengivite', 'Artrite', 'Verme', 'Pulgas', 'Trauma Leve', 'Sopro Cardíaco'];
  const treatments = ['Observação', 'Antibiótico por 7 dias', 'Limpeza local', 'Dieta leve', 'Anti-inflamatório', 'Retorno em 15 dias', 'Vermifugação', 'Aplicação de antipulgas'];
  for (let i = 0; i < 110; i++) {
    const pet = createdPets[Math.floor(Math.random() * createdPets.length)];
    await prisma.medicalRecord.create({
      data: {
        petId: pet.id,
        date: new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000),
        description: `Visita de rotina ${i + 1}. Animal apresenta comportamento normal.`,
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        treatment: treatments[Math.floor(Math.random() * treatments.length)],
        veterinarianId: vets[i % vets.length].id,
      },
    });
  }

  // Vaccinations
  console.log('💉 Seeding vaccinations...');
  for (const pet of createdPets) {
    const numVaccines = Math.floor(Math.random() * 3);
    for (let v = 0; v < numVaccines; v++) {
      await prisma.vaccination.create({
        data: {
          petId: pet.id,
          name: pet.species === 'dog' ? ['V10', 'Antirrábica', 'Gripe'][v % 3] : ['Quádrupla Felina', 'Antirrábica'][v % 2],
          date: new Date(Date.now() - Math.floor(Math.random() * 300) * 24 * 60 * 60 * 1000),
          nextDueDate: new Date(Date.now() + Math.floor(Math.random() * 200) * 24 * 60 * 60 * 1000),
          batch: 'LOT-' + Math.floor(Math.random() * 10000),
        },
      });
    }
  }

  // Appointments — serviceType: 'consultation' | 'grooming' | 'boarding'; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  console.log('📅 Seeding complex appointment schedule...');
  const baseDate = new Date();
  baseDate.setHours(8, 0, 0, 0);
  for (let i = -15; i < 20; i++) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(dayDate.getDate() + i);
    const perDay = 4 + Math.floor(Math.random() * 3);
    for (let j = 0; j < perDay; j++) {
      const pet = createdPets[Math.floor(Math.random() * createdPets.length)];
      const appDate = new Date(dayDate);
      appDate.setHours(8 + j * 2, (j % 2) * 30, 0, 0);

      await prisma.appointment.create({
        data: {
          petId: pet.id,
          professionalId: vets[j % vets.length].id,
          serviceType: j % 2 === 0 ? 'consultation' : 'grooming',
          date: appDate,
          duration: 30 + (j % 2) * 30,
          price: 150.0 + (j * 20),
          status: i < 0 ? 'completed' : (i === 0 ? (j < 2 ? 'completed' : 'scheduled') : 'scheduled'),
          notes: j === 2 ? 'Remarcado do mês passado.' : null,
        },
      });
    }
  }

  // Kennels & Boarding — BoardingStay status: 'active' | 'completed' | 'reserved' | 'cancelled'
  console.log('🏨 Seeding boarding and filling kennels...');
  const kennels = await Promise.all(
    Array.from({ length: 8 }).map((_, i) =>
      prisma.kennel.create({
        data: {
          name: `Canil ${String(i + 1).padStart(2, '0')}`,
          size: i < 3 ? 'small' : (i < 6 ? 'medium' : 'large'),
          status: i === 7 ? 'maintenance' : 'available',
        }
      })
    ),
  );

  const stayConfigs = [
    { daysIn: -3, daysOut: 4, status: 'active' },
    { daysIn: -1, daysOut: 6, status: 'active' },
    { daysIn: 2, daysOut: 10, status: 'reserved' },
    { daysIn: 5, daysOut: 12, status: 'reserved' },
    { daysIn: -10, daysOut: -2, status: 'completed' },
    { daysIn: -15, daysOut: -8, status: 'completed' },
  ];

  for (let i = 0; i < stayConfigs.length; i++) {
    const config = stayConfigs[i];
    const pet = createdPets[i % createdPets.length];
    const stay = await prisma.boardingStay.create({
      data: {
        petId: pet.id,
        checkIn: new Date(Date.now() + config.daysIn * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() + config.daysOut * 24 * 60 * 60 * 1000),
        kennelNumber: kennels[i % kennels.length].name,
        status: config.status,
        dailyRate: 80.0,
        notes: 'Pertences: Caminha e brinquedo predileto.',
      },
    });
    await prisma.boardingService.create({
      data: {
        boardingId: stay.id,
        name: 'Escovação Extra',
        quantity: 2,
        unitPrice: 20,
        totalPrice: 40,
      }
    });
  }

  // Products — category values must match frontend: 'food' | 'accessories' | 'medicines' | 'grooming' | 'vaccine' | 'surgical' | 'other'
  console.log('🛒 Seeding products and sales volume...');
  const productData = [
    { name: 'Ração Filhote 10kg', category: 'food', price: 180, stock: 20, minStock: 5 },
    { name: 'Ração Castrado 15kg', category: 'food', price: 240, stock: 15, minStock: 5 },
    { name: 'Shampoo Pelos Curtos', category: 'grooming', price: 40, stock: 30, minStock: 8 },
    { name: 'Condicionador Brilho', category: 'grooming', price: 45, stock: 25, minStock: 8 },
    { name: 'Coleira Antipulgas', category: 'medicines', price: 120, stock: 10, minStock: 3 },
    { name: 'Amoxicilina 50mg', category: 'medicines', price: 35, stock: 50, minStock: 10 },
    { name: 'Petisco Biscoito Canino', category: 'other', price: 12, stock: 100, minStock: 20 },
    { name: 'Brinquedo Mordedor', category: 'accessories', price: 35, stock: 15, minStock: 5 },
  ];
  for (const p of productData) {
    const prod = await prisma.product.create({
      data: { ...p, sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000) },
    });
    await prisma.productBatch.create({
      data: { productId: prod.id, code: 'BAT-' + Math.floor(Math.random() * 1000), quantity: p.stock, expirationDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000) },
    });
    for (let s = 0; s < 5; s++) {
      const sale = await prisma.sale.create({
        data: {
          total: p.price,
          status: 'completed',
          date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        }
      });
      await prisma.saleItem.create({
        data: { saleId: sale.id, productId: prod.id, productName: prod.name, quantity: 1, unitPrice: p.price, total: p.price },
      });
    }
  }

  // Tasks — category: 'cleaning' | 'maintenance' | 'administrative' | 'other'; status: 'pending' | 'in_progress' | 'completed'
  console.log('📋 Seeding role-specific tasks...');
  const taskTemplates = [
    { title: 'Conferir estoque de vacinas', cat: 'administrative', role: 'attendant' },
    { title: 'Ligar para retornos de cirurgia', cat: 'other', role: 'veterinarian' },
    { title: 'Limpar setor de banho', cat: 'cleaning', role: 'groomer' },
    { title: 'Organizar recepção', cat: 'cleaning', role: 'attendant' },
    { title: 'Revisar prontuários pendentes', cat: 'administrative', role: 'veterinarian' },
    { title: 'Fazer pedido de rações', cat: 'administrative', role: 'admin' },
    { title: 'Manutenção das gaiolas', cat: 'maintenance', role: 'groomer' },
  ];
  for (let i = 0; i < 25; i++) {
    const template = taskTemplates[i % taskTemplates.length];
    const assignee = users.find(u => u.role === template.role) || users[0];
    await prisma.task.create({
      data: {
        title: `${template.title} #${i + 1}`,
        category: template.cat,
        assignee: assignee.name || 'Admin',
        dueDate: new Date(Date.now() + (i - 10) * 24 * 60 * 60 * 1000),
        status: i < 12 ? 'completed' : (i < 18 ? 'in_progress' : 'pending'),
        priority: i % 3 === 0 ? 'high' : (i % 3 === 1 ? 'medium' : 'low'),
      },
    });
  }

  // Templates
  console.log('📝 Seeding templates...');
  await prisma.appointmentTemplate.createMany({
    data: [
      { name: 'Protocolo Vacinação Inicial', description: 'Sequência de vacinas para filhotes', services: JSON.stringify([{ name: 'V10 (Dose 1)', day: 0 }, { name: 'V10 (Dose 2)', day: 21 }, { name: 'V10 (Dose 3) + Raiva', day: 42 }]), defaultDurationDays: 45 },
      { name: 'Pós-Operatório Castração', description: 'Acompanhamento pós-cirúrgico', services: JSON.stringify([{ name: 'Revisão e Limpeza', day: 3 }, { name: 'Retirada de Pontos', day: 10 }]), defaultDurationDays: 14 },
    ]
  });

  await prisma.messageTemplate.createMany({
    data: [
      { title: 'Lembrete Consulta', type: 'appointment_confirmation', content: 'Olá [NOME]! Amanhã temos consulta marcada para o [PET] às [HORA]. Podemos confirmar?', active: true },
      { title: 'Aviso Pet Pronto', type: 'grooming_finished', content: 'Oi! O [PET] já está pronto e cheiroso! Pode vir buscar quando quiser.', active: true },
      { title: 'Alerta Vacina', type: 'manual_message', content: 'Atenção! A vacina [VACINA] do [PET] vence nos próximos dias. Vamos agendar?', active: true },
    ]
  });

  console.log('✅ MEGA seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
