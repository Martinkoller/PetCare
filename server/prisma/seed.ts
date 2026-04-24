import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── helpers ─────────────────────────────────────────────────────────────────

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Starting seed...');

  // ── Limpar na ordem correta (FK) ──────────────────────────────────────────
  console.log('🧹 Cleaning database...');
  await prisma.hospitalizationLog.deleteMany();
  await prisma.hospitalizationStay.deleteMany();
  await prisma.clientOrder.deleteMany();
  await prisma.clientPortalAccess.deleteMany();
  await prisma.notificationLog.deleteMany();
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
  await prisma.clientInteraction.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ── Organization ──────────────────────────────────────────────────────────
  console.log('🏥 Creating organization...');
  const org = await prisma.organization.create({
    data: {
      name: 'AgiliPet — Hospital Veterinário',
      cnpj: '12.345.678/0001-90',
      email: 'contato@agilipet.com.br',
      phone: '(11) 3456-7890',
      street: 'Av. Paulista',
      number: '1234',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      status: 'active',
      trialEndsAt: daysFromNow(30),
      confirmedAt: new Date(),
      settings: JSON.stringify({
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
        language: 'pt-BR',
        businessHours: { openHour: 8, closeHour: 18 },
      }),
    },
  });

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log('👥 Creating users...');
  const hash = await bcrypt.hash('admin123', 10);

  const [admin, vet1, vet2, vet3, groomer1, groomer2, attendant] = await Promise.all([
    prisma.user.create({ data: { organizationId: org.id, email: 'admin@agilipet.local',    passwordHash: hash, name: 'Admin Principal',       role: 'admin' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'marcelo@agilipet.local',  passwordHash: hash, name: 'Dr. Marcelo Silva',      role: 'veterinarian' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'beatriz@agilipet.local',  passwordHash: hash, name: 'Dra. Beatriz Costa',     role: 'veterinarian' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'andre@agilipet.local',    passwordHash: hash, name: 'Dr. André Santos',       role: 'veterinarian' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'carla@agilipet.local',    passwordHash: hash, name: 'Carla Groomer',          role: 'groomer' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'juliano@agilipet.local',  passwordHash: hash, name: 'Juliano Esteticista',    role: 'groomer' } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'fernanda@agilipet.local', passwordHash: hash, name: 'Fernanda Recepcionista', role: 'attendant' } }),
  ]);
  const vets = [vet1, vet2, vet3];

  // ── Service Catalog ───────────────────────────────────────────────────────
  console.log('🛠️  Creating service catalog...');
  const servicesRaw = [
    { name: 'Consulta Geral',             category: 'consultation', price: 150,  duration: 30 },
    { name: 'Consulta Especialista',      category: 'consultation', price: 280,  duration: 45 },
    { name: 'Emergência (Plantão)',        category: 'consultation', price: 350,  duration: 60 },
    { name: 'Retorno',                    category: 'consultation', price: 80,   duration: 20 },
    { name: 'Banho Pequeno',              category: 'grooming',     price: 50,   duration: 60 },
    { name: 'Banho e Tosa Médio',         category: 'grooming',     price: 90,   duration: 90 },
    { name: 'Tosa na Tesoura',            category: 'grooming',     price: 150,  duration: 120 },
    { name: 'Hidratação Pelagem',         category: 'grooming',     price: 60,   duration: 30 },
    { name: 'Diária Hotel Standard',      category: 'boarding',     price: 70,   duration: 1440 },
    { name: 'Diária Hotel Luxo',          category: 'boarding',     price: 120,  duration: 1440 },
    { name: 'Internação Clínica (diária)',category: 'other',        price: 200,  duration: 1440 },
    { name: 'Hemograma Completo',         category: 'exam',         price: 85,   duration: 30 },
    { name: 'Raio-X Digital',             category: 'exam',         price: 180,  duration: 30 },
    { name: 'Ultrassom Abdominal',        category: 'exam',         price: 220,  duration: 45 },
    { name: 'Vacina V10',                 category: 'vaccine',      price: 95,   duration: 15 },
    { name: 'Vacina Antirrábica',         category: 'vaccine',      price: 75,   duration: 15 },
    { name: 'Vacina Quádrupla Felina',    category: 'vaccine',      price: 85,   duration: 15 },
    { name: 'Cirurgia Castração Canino',  category: 'other',        price: 500,  duration: 120 },
    { name: 'Cirurgia Castração Felino',  category: 'other',        price: 400,  duration: 90 },
  ];
  await Promise.all(servicesRaw.map(s =>
    prisma.serviceCatalogItem.create({ data: { ...s, organizationId: org.id } })
  ));

  // ── Clients & Pets ────────────────────────────────────────────────────────
  console.log('🐾 Creating clients and pets...');
  const clientData = [
    { name: 'Ana Silva',      phone: '(11) 91234-5678', email: 'ana.silva@email.com',      whatsapp: true  },
    { name: 'Bruno Santos',   phone: '(11) 92345-6789', email: 'bruno.santos@email.com',   whatsapp: true  },
    { name: 'Carla Oliveira', phone: '(11) 93456-7890', email: 'carla.oliveira@email.com', whatsapp: true  },
    { name: 'Diego Souza',    phone: '(11) 94567-8901', email: 'diego.souza@email.com',    whatsapp: false },
    { name: 'Elena Rodrigues',phone: '(11) 95678-9012', email: 'elena.rodrigues@email.com',whatsapp: true  },
    { name: 'Fábio Ferreira', phone: '(11) 96789-0123', email: 'fabio.ferreira@email.com', whatsapp: true  },
    { name: 'Gabriela Alves', phone: '(11) 97890-1234', email: 'gabi.alves@email.com',     whatsapp: false },
    { name: 'Hugo Pereira',   phone: '(11) 98901-2345', email: 'hugo.pereira@email.com',   whatsapp: true  },
    { name: 'Íris Lima',      phone: '(11) 99012-3456', email: 'iris.lima@email.com',      whatsapp: true  },
    { name: 'João Gomes',     phone: '(11) 90123-4567', email: 'joao.gomes@email.com',     whatsapp: true  },
    { name: 'Kátia Pinto',    phone: '(21) 91111-2222', email: 'katia.pinto@email.com',    whatsapp: true  },
    { name: 'Luan Correia',   phone: '(21) 92222-3333', email: 'luan.correia@email.com',   whatsapp: false },
  ];

  const petData = [
    { name: 'Thor',   species: 'dog', breed: 'Golden Retriever', gender: 'male',   size: 'large',  age: 3,  weight: 32, color: 'Dourado',    notes: 'Muito brincalhão, adora água' },
    { name: 'Mel',    species: 'dog', breed: 'Shih Tzu',         gender: 'female', size: 'small',  age: 5,  weight: 6,  color: 'Branco',     notes: null },
    { name: 'Luna',   species: 'cat', breed: 'SRD',              gender: 'female', size: 'small',  age: 2,  weight: 4,  color: 'Preta',      notes: 'Alérgica a frango' },
    { name: 'Bob',    species: 'dog', breed: 'Beagle',           gender: 'male',   size: 'medium', age: 4,  weight: 14, color: 'Tricolor',   notes: null },
    { name: 'Nina',   species: 'cat', breed: 'Persa',            gender: 'female', size: 'small',  age: 6,  weight: 3,  color: 'Branca',     notes: 'Cardiopatia leve — evitar estresse' },
    { name: 'Max',    species: 'dog', breed: 'Labrador',         gender: 'male',   size: 'large',  age: 2,  weight: 28, color: 'Preto',      notes: null },
    { name: 'Bela',   species: 'dog', breed: 'Poodle',           gender: 'female', size: 'small',  age: 7,  weight: 5,  color: 'Branco',     notes: null },
    { name: 'Fred',   species: 'dog', breed: 'Bulldog Francês',  gender: 'male',   size: 'small',  age: 3,  weight: 10, color: 'Malhado',    notes: 'Problemas respiratórios leves' },
    { name: 'Amora',  species: 'cat', breed: 'Siamês',           gender: 'female', size: 'small',  age: 4,  weight: 3.5,color: 'Caramelo',   notes: null },
    { name: 'Zeus',   species: 'dog', breed: 'Pastor Alemão',    gender: 'male',   size: 'large',  age: 5,  weight: 38, color: 'Preto/Marrom', notes: 'Treinado, dócil com donos' },
    { name: 'Mia',    species: 'cat', breed: 'Maine Coon',       gender: 'female', size: 'medium', age: 3,  weight: 6,  color: 'Rajado',     notes: null },
    { name: 'Gaia',   species: 'dog', breed: 'Dachshund',        gender: 'female', size: 'small',  age: 8,  weight: 8,  color: 'Marrom',     notes: 'Problema de coluna — não pular' },
    { name: 'Dante',  species: 'dog', breed: 'Husky Siberiano',  gender: 'male',   size: 'large',  age: 2,  weight: 25, color: 'Cinza/Branco', notes: null },
    { name: 'Jade',   species: 'cat', breed: 'Bengala',          gender: 'female', size: 'small',  age: 1,  weight: 3,  color: 'Dourada',    notes: null },
    { name: 'Pipoca', species: 'dog', breed: 'Lhasa Apso',       gender: 'female', size: 'small',  age: 4,  weight: 7,  color: 'Branca',     notes: null },
  ];

  // Mapeia cliente → pets (índice do petData)
  const clientPetMap: number[][] = [
    [0, 2],   // Ana → Thor + Luna
    [1],      // Bruno → Mel
    [3, 4],   // Carla → Bob + Nina
    [5],      // Diego → Max
    [6, 7],   // Elena → Bela + Fred
    [8],      // Fábio → Amora
    [9, 10],  // Gabriela → Zeus + Mia
    [11],     // Hugo → Gaia
    [12, 13], // Íris → Dante + Jade
    [14],     // João → Pipoca
    [2, 6],   // Kátia → cópia de Luna/Bela mas criamos novos
    [0],      // Luan → cópia de Thor mas criamos novo
  ];

  const clients: any[] = [];
  const pets: any[] = [];

  for (let ci = 0; ci < clientData.length; ci++) {
    const cd = clientData[ci];
    const client = await prisma.client.create({
      data: {
        organizationId: org.id,
        name: cd.name,
        email: cd.email,
        phone: cd.phone,
        whatsappEnabled: cd.whatsapp,
        address: `Rua das Flores, ${100 + ci * 10}`,
        city: 'São Paulo',
        state: 'SP',
        joinedAt: daysFromNow(-(ci * 15 + 30)),
      },
    });
    clients.push(client);

    for (const pi of clientPetMap[ci]) {
      const pd = petData[pi % petData.length];
      const pet = await prisma.pet.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          name: pd.name + (ci > 9 ? ' II' : ''),
          species: pd.species,
          breed: pd.breed,
          gender: pd.gender,
          size: pd.size,
          age: pd.age,
          weight: pd.weight,
          color: pd.color,
          notes: pd.notes,
          isCastrated: Math.random() > 0.6,
          birthDate: daysFromNow(-(pd.age * 365)),
        },
      });
      pets.push(pet);
    }
  }

  // ── Appointments — todos os status ───────────────────────────────────────
  // status: 'scheduled'|'confirmed'|'checked_in'|'in_progress'|'completed'|'cancelled'|'archived'
  // serviceType: 'consultation'|'grooming'|'boarding'|'hospitalization'
  // appointmentType: 'scheduled'|'walkin'
  // priority: 'normal'|'urgent'
  console.log('📅 Creating appointments (all statuses)...');

  const META = (obj: object) => `[WF]${JSON.stringify(obj)}`;

  // Agendamentos históricos (passados) — completed/cancelled/archived
  const pastApts = [
    { pet: pets[0],  vet: vet1, days: -30, type: 'consultation', status: 'completed',  price: 150, duration: 30 },
    { pet: pets[1],  vet: vet2, days: -25, type: 'consultation', status: 'completed',  price: 280, duration: 45 },
    { pet: pets[2],  vet: vet1, days: -20, type: 'grooming',     status: 'completed',  price: 50,  duration: 60 },
    { pet: pets[3],  vet: vet3, days: -18, type: 'consultation', status: 'cancelled',  price: 150, duration: 30 },
    { pet: pets[4],  vet: vet2, days: -15, type: 'grooming',     status: 'completed',  price: 90,  duration: 90 },
    { pet: pets[5],  vet: vet1, days: -12, type: 'consultation', status: 'completed',  price: 350, duration: 60 },
    { pet: pets[6],  vet: vet3, days: -10, type: 'consultation', status: 'cancelled',  price: 150, duration: 30 },
    { pet: pets[7],  vet: vet2, days: -8,  type: 'grooming',     status: 'completed',  price: 150, duration: 120 },
    { pet: pets[8],  vet: vet1, days: -5,  type: 'consultation', status: 'completed',  price: 280, duration: 45 },
    { pet: pets[9],  vet: vet3, days: -3,  type: 'grooming',     status: 'completed',  price: 90,  duration: 90 },
    { pet: pets[10], vet: vet2, days: -2,  type: 'consultation', status: 'cancelled',  price: 150, duration: 30 },
    { pet: pets[11], vet: vet1, days: -1,  type: 'grooming',     status: 'completed',  price: 50,  duration: 60 },
  ];

  for (const a of pastApts) {
    const date = daysFromNow(a.days);
    date.setHours(9, 0, 0, 0);
    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        petId: a.pet.id,
        professionalId: a.vet.id,
        serviceType: a.type,
        date,
        duration: a.duration,
        price: a.price,
        status: a.status,
        priority: 'normal',
        appointmentType: 'scheduled',
        completedAt: a.status === 'completed' ? date : null,
        notes: a.type === 'consultation'
          ? META({ clinicalStatus: 'Saudável', clinicalMode: 'consultation', source: a.type })
          : META({ groomingStatus: a.status === 'completed' ? 'done' : 'cancelled', source: a.type }),
      },
    });
  }

  // Agendamentos de HOJE — todos os status ativos do dia
  const todayBase = new Date();
  todayBase.setHours(8, 0, 0, 0);

  const todayApts = [
    // scheduled
    { pet: pets[0],  vet: vet1, hour: 8,  min: 0,  type: 'consultation', status: 'scheduled',  priority: 'normal',  aptType: 'scheduled', price: 150, duration: 30 },
    { pet: pets[2],  vet: vet2, hour: 8,  min: 30, type: 'grooming',     status: 'scheduled',  priority: 'normal',  aptType: 'scheduled', price: 50,  duration: 60 },
    // confirmed
    { pet: pets[4],  vet: vet1, hour: 9,  min: 0,  type: 'consultation', status: 'confirmed',  priority: 'normal',  aptType: 'scheduled', price: 280, duration: 45 },
    { pet: pets[6],  vet: vet3, hour: 9,  min: 30, type: 'grooming',     status: 'confirmed',  priority: 'urgent',  aptType: 'walkin',    price: 90,  duration: 90 },
    // checked_in
    { pet: pets[8],  vet: vet2, hour: 10, min: 0,  type: 'consultation', status: 'checked_in', priority: 'normal',  aptType: 'scheduled', price: 150, duration: 30 },
    { pet: pets[10], vet: vet1, hour: 10, min: 30, type: 'grooming',     status: 'checked_in', priority: 'urgent',  aptType: 'walkin',    price: 150, duration: 120 },
    // in_progress
    { pet: pets[1],  vet: vet2, hour: 11, min: 0,  type: 'consultation', status: 'in_progress',priority: 'normal',  aptType: 'scheduled', price: 280, duration: 45 },
    { pet: pets[3],  vet: vet3, hour: 11, min: 30, type: 'grooming',     status: 'in_progress',priority: 'normal',  aptType: 'scheduled', price: 90,  duration: 90 },
    // completed (já finalizados hoje)
    { pet: pets[5],  vet: vet1, hour: 13, min: 0,  type: 'consultation', status: 'completed',  priority: 'normal',  aptType: 'scheduled', price: 150, duration: 30 },
    { pet: pets[7],  vet: vet2, hour: 13, min: 30, type: 'grooming',     status: 'completed',  priority: 'normal',  aptType: 'scheduled', price: 50,  duration: 60 },
    // cancelled hoje
    { pet: pets[9],  vet: vet3, hour: 14, min: 0,  type: 'consultation', status: 'cancelled',  priority: 'normal',  aptType: 'scheduled', price: 150, duration: 30 },
    // futuros do dia
    { pet: pets[11], vet: vet1, hour: 15, min: 0,  type: 'consultation', status: 'scheduled',  priority: 'normal',  aptType: 'scheduled', price: 150, duration: 30 },
    { pet: pets[12], vet: vet2, hour: 15, min: 30, type: 'grooming',     status: 'scheduled',  priority: 'normal',  aptType: 'scheduled', price: 90,  duration: 90 },
    { pet: pets[13], vet: vet3, hour: 16, min: 0,  type: 'consultation', status: 'scheduled',  priority: 'urgent',  aptType: 'walkin',    price: 350, duration: 60 },
  ];

  for (const a of todayApts) {
    const date = new Date(todayBase);
    date.setHours(a.hour, a.min, 0, 0);
    const isActive = ['checked_in', 'in_progress'].includes(a.status);
    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        petId: a.pet.id,
        professionalId: a.vet.id,
        serviceType: a.type,
        date,
        duration: a.duration,
        price: a.price,
        status: a.status,
        priority: a.priority,
        appointmentType: a.aptType,
        startedAt: isActive ? date : null,
        currentStageStartedAt: isActive ? date : null,
        completedAt: a.status === 'completed' ? date : null,
        tutorNotified: a.status === 'completed',
        notes: a.type === 'consultation'
          ? META({ clinicalStatus: a.status === 'in_progress' ? 'in_progress' : a.status === 'completed' ? 'done' : 'waiting', clinicalMode: 'consultation', source: a.type })
          : META({ groomingStatus: a.status === 'in_progress' ? 'bathing' : a.status === 'completed' ? 'done' : 'waiting', source: a.type }),
      },
    });
  }

  // Agendamentos futuros (próximos 14 dias)
  for (let day = 1; day <= 14; day++) {
    for (let slot = 0; slot < 3; slot++) {
      const date = daysFromNow(day);
      date.setHours(8 + slot * 2, 0, 0, 0);
      const pet = pets[(day * 3 + slot) % pets.length];
      const vet = vets[(day + slot) % vets.length];
      const type = slot % 2 === 0 ? 'consultation' : 'grooming';
      await prisma.appointment.create({
        data: {
          organizationId: org.id,
          petId: pet.id,
          professionalId: vet.id,
          serviceType: type,
          date,
          duration: 30,
          price: type === 'consultation' ? 150 : 90,
          status: 'scheduled',
          priority: day === 3 && slot === 0 ? 'urgent' : 'normal',
          appointmentType: 'scheduled',
        },
      });
    }
  }

  // ── Boarding — todos os status ────────────────────────────────────────────
  // status: 'reserved' | 'active' | 'completed' | 'cancelled'
  console.log('🏨 Creating kennels and boarding stays...');
  const kennels = await Promise.all([
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil P-01', size: 'small',  status: 'available' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil P-02', size: 'small',  status: 'available' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil M-01', size: 'medium', status: 'available' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil M-02', size: 'medium', status: 'available' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil G-01', size: 'large',  status: 'available' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil G-02', size: 'large',  status: 'maintenance' } }),
  ]);

  const boardingCases = [
    { pet: pets[0],  kennel: kennels[4], daysIn: -3,  daysOut: 4,  status: 'active',     dailyRate: 120 },
    { pet: pets[5],  kennel: kennels[2], daysIn: -1,  daysOut: 5,  status: 'active',     dailyRate: 70  },
    { pet: pets[9],  kennel: kennels[0], daysIn: 2,   daysOut: 9,  status: 'reserved',   dailyRate: 70  },
    { pet: pets[12], kennel: kennels[4], daysIn: 5,   daysOut: 14, status: 'reserved',   dailyRate: 120 },
    { pet: pets[3],  kennel: kennels[2], daysIn: -15, daysOut: -8, status: 'completed',  dailyRate: 70  },
    { pet: pets[7],  kennel: kennels[0], daysIn: -20, daysOut: -12,status: 'completed',  dailyRate: 70  },
    { pet: pets[2],  kennel: kennels[1], daysIn: -5,  daysOut: -1, status: 'cancelled',  dailyRate: 70  },
  ];

  for (const bc of boardingCases) {
    const checkIn  = daysFromNow(bc.daysIn);
    const checkOut = daysFromNow(bc.daysOut);
    const days = bc.daysOut - bc.daysIn;
    const stay = await prisma.boardingStay.create({
      data: {
        organizationId: org.id,
        petId: bc.pet.id,
        kennelNumber: bc.kennel.name,
        checkIn,
        checkOut,
        actualCheckIn:  bc.status === 'active'    ? checkIn : bc.status === 'completed' ? checkIn : null,
        actualCheckOut: bc.status === 'completed' ? checkOut : null,
        status: bc.status,
        dailyRate: bc.dailyRate,
        totalPrice: bc.status !== 'cancelled' ? bc.dailyRate * days : 0,
        notes: 'Pertences: caminha, brinquedo favorito.',
        specialInstructions: 'Alimentação 2x ao dia. Ração própria.',
      },
    });
    if (bc.status !== 'cancelled') {
      await prisma.boardingService.create({
        data: { boardingId: stay.id, name: 'Banho extra', quantity: 1, unitPrice: 50, totalPrice: 50 },
      });
    }
  }

  // ── Hospitalization — todos os status ─────────────────────────────────────
  // status: 'admitted' | 'treatment' | 'discharged'
  console.log('🏥 Creating hospitalization stays...');
  const hospCases = [
    { pet: pets[4],  vet: vet1, daysIn: -5,  status: 'treatment',  reason: 'Insuficiência renal aguda. Paciente em fluidoterapia e monitoramento.' },
    { pet: pets[8],  vet: vet2, daysIn: -2,  status: 'admitted',   reason: 'Pós-operatório castração. Observação de rotina.' },
    { pet: pets[11], vet: vet3, daysIn: -10, daysOut: -3, status: 'discharged', reason: 'Pneumonia bacteriana. Tratamento concluído com sucesso.' },
    { pet: pets[1],  vet: vet1, daysIn: -30, daysOut: -22,status: 'discharged', reason: 'Parvovirose. Alta após estabilização.' },
  ];

  for (const hc of hospCases) {
    const checkIn  = daysFromNow(hc.daysIn);
    const checkOut = (hc as any).daysOut ? daysFromNow((hc as any).daysOut) : null;
    const stay = await prisma.hospitalizationStay.create({
      data: {
        organizationId: org.id,
        petId: hc.pet.id,
        veterinarianId: hc.vet.id,
        reasonForAdmission: hc.reason,
        status: hc.status,
        checkIn,
        checkOut,
        dailyRate: 200,
        kennelNumber: `INT-0${hospCases.indexOf(hc) + 1}`,
        expectedDischargeDate: checkOut ?? daysFromNow(hc.daysIn + 7),
        notes: 'Paciente sob observação contínua.',
      },
    });

    // Logs de evolução
    const logCount = hc.status === 'discharged' ? 3 : 2;
    for (let l = 0; l < logCount; l++) {
      const ts = new Date(checkIn.getTime() + l * 24 * 3_600_000);
      await prisma.hospitalizationLog.create({
        data: {
          hospitalizationId: stay.id,
          timestamp: ts,
          type: 'vitals',
          heartRate: 70 + Math.floor(Math.random() * 30),
          temperature: 38 + Math.random() * 1.5,
          medicationGiven: l === 0 ? 'Metronidazol 250mg + Soro Fisiológico 500ml' : 'Manutenção fluidoterapia',
          doctorNotes: l === logCount - 1
            ? (hc.status === 'discharged' ? 'Alta médica. Bom estado geral.' : 'Evolução positiva, manter protocolo.')
            : 'Sem alterações significativas.',
        },
      });
    }
  }

  // ── Medical Records & Vaccinations ───────────────────────────────────────
  console.log('🩺 Creating medical records and vaccinations...');
  const diagnoses = ['Saudável','Otite','Dermatite','Gastrite','Artrite','Parasitose','Trauma Leve','Sopro Cardíaco G1'];
  const treatments = ['Observação e retorno em 30 dias','Antibiótico 7 dias','Limpeza auricular + Otológico','Dieta leve + probiótico','Anti-inflamatório 5 dias','Vermifugação','Aplicação antipulgas','Monitoramento cardíaco'];

  for (let i = 0; i < pets.length; i++) {
    const pet = pets[i];
    const count = 1 + Math.floor(Math.random() * 3);
    for (let r = 0; r < count; r++) {
      await prisma.medicalRecord.create({
        data: {
          organizationId: org.id,
          petId: pet.id,
          date: daysFromNow(-(r * 30 + 15)),
          description: `Consulta de rotina. Animal em bom estado geral, comportamento adequado.`,
          diagnosis: pick(diagnoses),
          treatment: pick(treatments),
          veterinarianId: pick(vets).id,
          bodyConditionScore: pick(['1','2','3','4','5']),
          painScore: Math.floor(Math.random() * 3),
        },
      });
    }

    // Vacinas
    if (pet.species === 'dog') {
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'V10',         date: daysFromNow(-180), nextDueDate: daysFromNow(185), batch: 'LOT-2024A' } });
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Antirrábica', date: daysFromNow(-90),  nextDueDate: daysFromNow(275), batch: 'LOT-2024B' } });
    } else if (pet.species === 'cat') {
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Quádrupla Felina', date: daysFromNow(-120), nextDueDate: daysFromNow(245), batch: 'LOT-2024C' } });
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Antirrábica',      date: daysFromNow(-60),  nextDueDate: daysFromNow(305), batch: 'LOT-2024D' } });
    }
  }

  // ── Products & Stock ──────────────────────────────────────────────────────
  console.log('📦 Creating products...');
  const productsRaw = [
    { name: 'Ração Filhote 10kg',    category: 'food',        price: 180, stock: 20, minStock: 5,  sku: 'ALI-001' },
    { name: 'Ração Castrado 15kg',   category: 'food',        price: 240, stock: 15, minStock: 5,  sku: 'ALI-002' },
    { name: 'Ração Senior 12kg',     category: 'food',        price: 210, stock: 3,  minStock: 5,  sku: 'ALI-003' },  // estoque baixo
    { name: 'Shampoo Pelos Curtos',  category: 'grooming',    price: 40,  stock: 30, minStock: 8,  sku: 'GRO-001' },
    { name: 'Condicionador Brilho',  category: 'grooming',    price: 45,  stock: 25, minStock: 8,  sku: 'GRO-002' },
    { name: 'Coleira Antipulgas',    category: 'medicines',   price: 120, stock: 10, minStock: 3,  sku: 'MED-001' },
    { name: 'Amoxicilina 50mg',      category: 'medicines',   price: 35,  stock: 50, minStock: 10, sku: 'MED-002' },
    { name: 'Soro Fisiológico 500ml',category: 'medicines',   price: 12,  stock: 2,  minStock: 10, sku: 'MED-003' },  // estoque baixo
    { name: 'Petisco Biscoito',      category: 'other',       price: 12,  stock: 100,minStock: 20, sku: 'OUT-001' },
    { name: 'Brinquedo Mordedor',    category: 'accessories', price: 35,  stock: 15, minStock: 5,  sku: 'ACS-001' },
    { name: 'Vacina V10',            category: 'vaccine',     price: 95,  stock: 20, minStock: 5,  sku: 'VAC-001' },
    { name: 'Vacina Antirrábica',    category: 'vaccine',     price: 75,  stock: 15, minStock: 5,  sku: 'VAC-002' },
  ];

  const createdProducts: any[] = [];
  for (const p of productsRaw) {
    const prod = await prisma.product.create({ data: { ...p, organizationId: org.id } });
    createdProducts.push(prod);
    await prisma.productBatch.create({
      data: {
        productId: prod.id,
        code: `BAT-${p.sku}-24`,
        quantity: p.stock,
        expirationDate: daysFromNow(180 + Math.floor(Math.random() * 300)),
      },
    });
  }

  // ── Sales — status: 'completed' | 'cancelled' ────────────────────────────
  console.log('💰 Creating sales...');
  const salesCases = [
    { client: clients[0], product: createdProducts[0], qty: 2, status: 'completed', daysAgo: -25 },
    { client: clients[1], product: createdProducts[3], qty: 1, status: 'completed', daysAgo: -20 },
    { client: clients[2], product: createdProducts[5], qty: 1, status: 'completed', daysAgo: -18 },
    { client: clients[3], product: createdProducts[8], qty: 3, status: 'completed', daysAgo: -15 },
    { client: clients[4], product: createdProducts[1], qty: 1, status: 'completed', daysAgo: -12 },
    { client: clients[5], product: createdProducts[9], qty: 2, status: 'completed', daysAgo: -10 },
    { client: clients[6], product: createdProducts[6], qty: 1, status: 'completed', daysAgo: -7  },
    { client: clients[7], product: createdProducts[4], qty: 1, status: 'cancelled', daysAgo: -6  },
    { client: clients[0], product: createdProducts[10],qty: 1, status: 'completed', daysAgo: -5  },
    { client: clients[1], product: createdProducts[11],qty: 1, status: 'completed', daysAgo: -4  },
    { client: clients[2], product: createdProducts[0], qty: 1, status: 'completed', daysAgo: -3  },
    { client: clients[3], product: createdProducts[3], qty: 2, status: 'completed', daysAgo: -2  },
    { client: clients[4], product: createdProducts[8], qty: 5, status: 'completed', daysAgo: -1  },
    { client: clients[5], product: createdProducts[9], qty: 1, status: 'completed', daysAgo:  0  },
  ];

  for (const sc of salesCases) {
    const total = sc.product.price * sc.qty;
    const sale = await prisma.sale.create({
      data: {
        organizationId: org.id,
        clientId: sc.client.id,
        total,
        status: sc.status,
        date: daysFromNow(sc.daysAgo),
      },
    });
    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        productId: sc.product.id,
        productName: sc.product.name,
        quantity: sc.qty,
        unitPrice: sc.product.price,
        total,
      },
    });
  }

  // ── Tasks — todos os status e prioridades ─────────────────────────────────
  console.log('📋 Creating tasks...');
  const tasksRaw = [
    { title: 'Conferir estoque de vacinas',          category: 'administrative', assignee: attendant.name!,  status: 'completed',   priority: 'high',   daysOffset: -2 },
    { title: 'Ligar para retornos de cirurgia',      category: 'other',          assignee: vet1.name!,       status: 'completed',   priority: 'high',   daysOffset: -1 },
    { title: 'Limpar setor de banho após turno',     category: 'cleaning',       assignee: groomer1.name!,   status: 'completed',   priority: 'medium', daysOffset:  0 },
    { title: 'Revisar prontuários pendentes',        category: 'administrative', assignee: vet2.name!,       status: 'in_progress', priority: 'high',   daysOffset:  0 },
    { title: 'Fazer pedido de rações e insumos',     category: 'administrative', assignee: admin.name!,      status: 'in_progress', priority: 'high',   daysOffset:  1 },
    { title: 'Manutenção das gaiolas de internação', category: 'maintenance',    assignee: attendant.name!,  status: 'in_progress', priority: 'medium', daysOffset:  1 },
    { title: 'Organizar recepção para abertura',     category: 'cleaning',       assignee: attendant.name!,  status: 'pending',     priority: 'low',    daysOffset:  1 },
    { title: 'Renovar contrato fornecedor ração',    category: 'administrative', assignee: admin.name!,      status: 'pending',     priority: 'medium', daysOffset:  3 },
    { title: 'Treinar nova atendente — sistema',     category: 'administrative', assignee: admin.name!,      status: 'pending',     priority: 'high',   daysOffset:  5 },
    { title: 'Verificar equipamento de ultrassom',   category: 'maintenance',    assignee: vet3.name!,       status: 'pending',     priority: 'medium', daysOffset:  7 },
    { title: 'Campanha vacina antirrábica — emails', category: 'other',          assignee: attendant.name!,  status: 'pending',     priority: 'low',    daysOffset: 10 },
    { title: 'Limpar e desinfetar canis após saídas',category: 'cleaning',       assignee: groomer2.name!,   status: 'pending',     priority: 'medium', daysOffset:  2 },
  ];

  for (const t of tasksRaw) {
    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: t.title,
        category: t.category,
        assignee: t.assignee,
        status: t.status,
        priority: t.priority,
        dueDate: daysFromNow(t.daysOffset),
        description: `Tarefa de ${t.category}. Responsável: ${t.assignee}.`,
      },
    });
  }

  // ── Portal do Tutor ───────────────────────────────────────────────────────
  // status: 'pending' | 'approved' | 'rejected'
  console.log('🐾 Creating portal access requests (all statuses)...');
  const portalHash = await bcrypt.hash('portal123', 10);

  const portalCases = [
    { client: clients[0], email: 'ana.portal@email.com',    status: 'approved', daysAgo: -10 },
    { client: clients[1], email: 'bruno.portal@email.com',  status: 'approved', daysAgo: -8  },
    { client: clients[2], email: 'carla.portal@email.com',  status: 'pending',  daysAgo: -2  },
    { client: clients[3], email: 'diego.portal@email.com',  status: 'pending',  daysAgo: -1  },
    { client: clients[4], email: 'elena.portal@email.com',  status: 'rejected', daysAgo: -15 },
  ];

  for (const pc of portalCases) {
    await prisma.clientPortalAccess.create({
      data: {
        organizationId: org.id,
        clientId: pc.client.id,
        email: pc.email,
        passwordHash: portalHash,
        status: pc.status,
        approvedAt: pc.status === 'approved' ? daysFromNow(pc.daysAgo + 1) : null,
        approvedBy: pc.status === 'approved' ? admin.id : null,
        createdAt: daysFromNow(pc.daysAgo),
      },
    });
  }

  // ── Client Orders ─────────────────────────────────────────────────────────
  // status: 'pending' | 'confirmed' | 'cancelled'
  console.log('🛒 Creating portal orders (all statuses)...');
  const orderCases = [
    { client: clients[0], status: 'confirmed', daysAgo: -8,  items: [{ id: createdProducts[0].id, name: 'Ração Filhote 10kg', price: 180, qty: 1, type: 'product' }], total: 180 },
    { client: clients[1], status: 'confirmed', daysAgo: -5,  items: [{ id: createdProducts[3].id, name: 'Shampoo Pelos Curtos', price: 40, qty: 2, type: 'product' }, { id: createdProducts[9].id, name: 'Brinquedo Mordedor', price: 35, qty: 1, type: 'product' }], total: 115 },
    { client: clients[0], status: 'pending',   daysAgo: -1,  items: [{ id: createdProducts[1].id, name: 'Ração Castrado 15kg', price: 240, qty: 1, type: 'product' }], total: 240 },
    { client: clients[1], status: 'pending',   daysAgo:  0,  items: [{ id: createdProducts[8].id, name: 'Petisco Biscoito', price: 12, qty: 5, type: 'product' }], total: 60 },
    { client: clients[4], status: 'cancelled', daysAgo: -12, items: [{ id: createdProducts[5].id, name: 'Coleira Antipulgas', price: 120, qty: 1, type: 'product' }], total: 120 },
  ];

  for (const oc of orderCases) {
    await prisma.clientOrder.create({
      data: {
        organizationId: org.id,
        clientId: oc.client.id,
        items: JSON.stringify(oc.items),
        total: oc.total,
        status: oc.status,
        createdAt: daysFromNow(oc.daysAgo),
      },
    });
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  console.log('📝 Creating templates...');
  await prisma.appointmentTemplate.createMany({
    data: [
      { organizationId: org.id, name: 'Protocolo Vacinação Filhote', description: 'Sequência completa para filhotes', services: JSON.stringify([{ name: 'V10 Dose 1', day: 0 }, { name: 'V10 Dose 2', day: 21 }, { name: 'V10 Dose 3 + Raiva', day: 42 }]), defaultDurationDays: 45 },
      { organizationId: org.id, name: 'Pós-Op Castração',           description: 'Acompanhamento pós-cirúrgico',   services: JSON.stringify([{ name: 'Revisão + Limpeza', day: 3 }, { name: 'Retirada de Pontos', day: 10 }]), defaultDurationDays: 14 },
    ],
  });

  await prisma.messageTemplate.createMany({
    data: [
      { organizationId: org.id, title: 'Lembrete de Consulta',   type: 'appointment_confirmation', content: 'Olá [NOME]! Amanhã temos consulta do [PET] às [HORA]. Confirma? Responda SIM ou NÃO.',  active: true },
      { organizationId: org.id, title: 'Pet Pronto — Banho',     type: 'grooming_finished',        content: 'Oi [NOME]! O [PET] está pronto e cheiroso. Pode vir buscar quando quiser! 🐾',            active: true },
      { organizationId: org.id, title: 'Alerta de Vacina',       type: 'manual_message',           content: 'Atenção! A vacina [VACINA] do [PET] vence em breve. Vamos agendar o reforço?',           active: true },
      { organizationId: org.id, title: 'Alta Hospitalar',        type: 'manual_message',           content: 'Boa notícia! O [PET] recebeu alta e está pronto para ir para casa. Venha buscar! ❤️', active: true },
    ],
  });

  // ── Notification Logs ─────────────────────────────────────────────────────
  console.log('📬 Creating notification logs...');
  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const pet    = pets[i % pets.length];
    await prisma.notificationLog.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        type: pick(['appointment_confirmation','grooming_finished','manual_message']),
        message: `Mensagem de teste #${i + 1} para ${client.name} sobre ${pet.name}.`,
        sentAt: daysFromNow(-i),
        status: pick(['sent','failed']),
        manual: i % 3 === 0,
      },
    });
  }

  console.log('');
  console.log('✅ Seed concluído!');
  console.log('');
  console.log('🔑 Credenciais:');
  console.log('   Admin:       admin@agilipet.local     / admin123');
  console.log('   Veterinário: marcelo@agilipet.local   / admin123');
  console.log('   Veterinária: beatriz@agilipet.local   / admin123');
  console.log('   Veterinário: andre@agilipet.local     / admin123');
  console.log('   Groomer:     carla@agilipet.local     / admin123');
  console.log('   Groomer:     juliano@agilipet.local   / admin123');
  console.log('   Recepção:    fernanda@agilipet.local  / admin123');
  console.log('');
  console.log('🐾 Portal do Tutor:');
  console.log('   Aprovado:  ana.portal@email.com    / portal123');
  console.log('   Aprovado:  bruno.portal@email.com  / portal123');
  console.log('   Pendente:  carla.portal@email.com  / portal123');
  console.log('   Rejeitado: elena.portal@email.com  / portal123');
  console.log('');
  console.log('📊 Status cobertos:');
  console.log('   Agendamentos: scheduled, confirmed, checked_in, in_progress, completed, cancelled');
  console.log('   Hospedagem:   reserved, active, completed, cancelled');
  console.log('   Internação:   admitted, treatment, discharged');
  console.log('   Pedidos:      pending, confirmed, cancelled');
  console.log('   Portal:       pending, approved, rejected');
  console.log('   Tarefas:      pending, in_progress, completed  (prioridades: low, medium, high)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
