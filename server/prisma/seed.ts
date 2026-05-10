import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedSaasAdmin } from './seed.production';

const prisma = new PrismaClient();

// ── helpers ───────────────────────────────────────────────────────────────────
const d = (n: number) => new Date(Date.now() + n * 86_400_000);
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const META = (obj: object) => `[WF]${JSON.stringify(obj)}`;
const PHONE = '49999715125';

// ── dados aleatórios de clientes ──────────────────────────────────────────────
const FIRST_NAMES_F = ['Ana','Beatriz','Camila','Daniela','Eduarda','Fernanda','Gabriela','Helena','Isabela','Juliana','Kátia','Larissa','Mariana','Natália','Olívia','Patrícia','Renata','Sabrina','Tatiana','Vanessa'];
const FIRST_NAMES_M = ['André','Bruno','Carlos','Diego','Eduardo','Fábio','Gabriel','Hugo','Igor','João','Leonardo','Marcos','Nelson','Otávio','Paulo','Rafael','Samuel','Thiago','Vinícius','William'];
const LAST_NAMES    = ['Silva','Santos','Oliveira','Souza','Rodrigues','Ferreira','Alves','Pereira','Lima','Gomes','Costa','Martins','Araújo','Melo','Barbosa','Ribeiro','Rocha','Carvalho','Correia','Dias'];
const CITIES        = ['Chapecó','Xanxerê','Xaxim','Pinhalzinho','São Lourenço do Oeste','Maravilha','Quilombo','Abelardo Luz','Coronel Freitas','Caxambu do Sul'];
const ORIGINS       = ['indication','google','social_media','walk_in','indication','google'];
const GENDERS       = ['male','female'];

let nameCounter = 0;
function randomClient(index: number) {
  const gender = GENDERS[nameCounter % 2];
  const firstName = gender === 'female'
    ? FIRST_NAMES_F[nameCounter % FIRST_NAMES_F.length]
    : FIRST_NAMES_M[nameCounter % FIRST_NAMES_M.length];
  const lastName = LAST_NAMES[(nameCounter + index) % LAST_NAMES.length];
  nameCounter++;
  const slug = firstName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s/g,'.');
  const slugLast = lastName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s/g,'.');
  return {
    name: `${firstName} ${lastName}`,
    email: `${slug}.${slugLast}${index}@email.com`,
    gender,
    city: CITIES[index % CITIES.length],
    state: 'SC',
    origin: ORIGINS[index % ORIGINS.length],
    whatsapp: index % 4 !== 3,
    cpf: `${String(index + 1).padStart(3,'0')}.${String(index * 3 + 7).padStart(3,'0')}.${String(index * 7 + 11).padStart(3,'0')}-${String((index * 13) % 99).padStart(2,'0')}`,
  };
}

// ── dados de pets ─────────────────────────────────────────────────────────────
const PET_POOL = [
  { name: 'Thor',    species: 'dog', breed: 'Golden Retriever', gender: 'male',   size: 'large',  age: 3, weight: 32,  color: 'Dourado',        notes: 'Muito brincalhão, adora água',         alert: null },
  { name: 'Mel',     species: 'dog', breed: 'Shih Tzu',         gender: 'female', size: 'small',  age: 5, weight: 6,   color: 'Branco',          notes: null,                                   alert: null },
  { name: 'Luna',    species: 'cat', breed: 'SRD',              gender: 'female', size: 'small',  age: 2, weight: 4,   color: 'Preta',           notes: 'Alérgica a frango',                    alert: 'Alergia a frango' },
  { name: 'Bob',     species: 'dog', breed: 'Beagle',           gender: 'male',   size: 'medium', age: 4, weight: 14,  color: 'Tricolor',        notes: null,                                   alert: null },
  { name: 'Nina',    species: 'cat', breed: 'Persa',            gender: 'female', size: 'small',  age: 6, weight: 3,   color: 'Branca',          notes: 'Cardiopatia leve — evitar estresse',   alert: 'Cardiopatia leve' },
  { name: 'Max',     species: 'dog', breed: 'Labrador',         gender: 'male',   size: 'large',  age: 2, weight: 28,  color: 'Preto',           notes: null,                                   alert: null },
  { name: 'Bela',    species: 'dog', breed: 'Poodle',           gender: 'female', size: 'small',  age: 7, weight: 5,   color: 'Branco',          notes: null,                                   alert: null },
  { name: 'Fred',    species: 'dog', breed: 'Bulldog Francês',  gender: 'male',   size: 'small',  age: 3, weight: 10,  color: 'Malhado',         notes: 'Problemas respiratórios leves',        alert: 'Braquicefálico' },
  { name: 'Amora',   species: 'cat', breed: 'Siamês',           gender: 'female', size: 'small',  age: 4, weight: 3.5, color: 'Caramelo',        notes: null,                                   alert: null },
  { name: 'Zeus',    species: 'dog', breed: 'Pastor Alemão',    gender: 'male',   size: 'large',  age: 5, weight: 38,  color: 'Preto/Marrom',    notes: 'Treinado, dócil com donos',            alert: null },
  { name: 'Mia',     species: 'cat', breed: 'Maine Coon',       gender: 'female', size: 'medium', age: 3, weight: 6,   color: 'Rajado',          notes: null,                                   alert: null },
  { name: 'Gaia',    species: 'dog', breed: 'Dachshund',        gender: 'female', size: 'small',  age: 8, weight: 8,   color: 'Marrom',          notes: 'Problema de coluna — não pular',       alert: 'Problema de coluna' },
  { name: 'Dante',   species: 'dog', breed: 'Husky Siberiano',  gender: 'male',   size: 'large',  age: 2, weight: 25,  color: 'Cinza/Branco',    notes: null,                                   alert: null },
  { name: 'Jade',    species: 'cat', breed: 'Bengala',          gender: 'female', size: 'small',  age: 1, weight: 3,   color: 'Dourada',         notes: null,                                   alert: null },
  { name: 'Pipoca',  species: 'dog', breed: 'Lhasa Apso',       gender: 'female', size: 'small',  age: 4, weight: 7,   color: 'Branca',          notes: null,                                   alert: null },
  { name: 'Rex',     species: 'dog', breed: 'Rottweiler',       gender: 'male',   size: 'large',  age: 6, weight: 42,  color: 'Preto/Ferrugem',  notes: 'Usar focinheira',                      alert: 'Usar focinheira' },
  { name: 'Cleo',    species: 'cat', breed: 'Ragdoll',          gender: 'female', size: 'medium', age: 3, weight: 5,   color: 'Colorpoint',      notes: null,                                   alert: null },
  { name: 'Bolinha', species: 'dog', breed: 'Yorkshire',        gender: 'male',   size: 'small',  age: 2, weight: 3,   color: 'Castanho',        notes: null,                                   alert: null },
  { name: 'Nala',    species: 'cat', breed: 'SRD',              gender: 'female', size: 'small',  age: 3, weight: 3.5, color: 'Laranja',         notes: null,                                   alert: null },
  { name: 'Buddy',   species: 'dog', breed: 'Golden Retriever', gender: 'male',   size: 'large',  age: 4, weight: 30,  color: 'Dourado',         notes: null,                                   alert: null },
  { name: 'Mochi',   species: 'cat', breed: 'Angorá',           gender: 'male',   size: 'small',  age: 2, weight: 4,   color: 'Branco',          notes: null,                                   alert: null },
  { name: 'Duke',    species: 'dog', breed: 'Boxer',            gender: 'male',   size: 'large',  age: 3, weight: 28,  color: 'Fulvo',           notes: 'Braquicefálico',                       alert: 'Braquicefálico' },
  { name: 'Lua',     species: 'cat', breed: 'SRD',              gender: 'female', size: 'small',  age: 1, weight: 2.5, color: 'Cinza',           notes: null,                                   alert: null },
  { name: 'Caramelo',species: 'dog', breed: 'SRD',              gender: 'male',   size: 'medium', age: 5, weight: 15,  color: 'Caramelo',        notes: null,                                   alert: null },
];

async function main() {
  console.log('🚀 Iniciando seed...');

  // ── Limpar (ordem FK) ─────────────────────────────────────────────────────
  console.log('🧹 Limpando banco...');
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
  await prisma.clientInteraction.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ── Organization ──────────────────────────────────────────────────────────
  console.log('🏥 Criando organização...');
  const org = await prisma.organization.create({
    data: {
      name: 'AgiliPet — Hospital Veterinário',
      cnpj: '12.345.678/0001-90',
      email: 'contato@agilipet.com.br',
      phone: PHONE,
      street: 'Av. Getúlio Vargas',
      number: '850',
      neighborhood: 'Centro',
      city: 'Chapecó',
      state: 'SC',
      zipCode: '89801-001',
      status: 'active',
      plan: 'clinica',
      trialEndsAt: d(30),
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
  console.log('👥 Criando usuários...');
  const hash = await bcrypt.hash('admin123', 10);

  const [admin, vet1, vet2, vet3, groomer1, groomer2, attendant] = await Promise.all([
    prisma.user.create({ data: { organizationId: org.id, email: 'admin@agilipet.local',    passwordHash: hash, name: 'Admin Principal',       role: 'admin',        color: '#6366f1', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'marcelo@agilipet.local',  passwordHash: hash, name: 'Dr. Marcelo Silva',      role: 'veterinarian', color: '#0ea5e9', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'beatriz@agilipet.local',  passwordHash: hash, name: 'Dra. Beatriz Costa',     role: 'veterinarian', color: '#10b981', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'andre@agilipet.local',    passwordHash: hash, name: 'Dr. André Santos',       role: 'veterinarian', color: '#f59e0b', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'carla@agilipet.local',    passwordHash: hash, name: 'Carla Groomer',          role: 'groomer',      color: '#ec4899', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'juliano@agilipet.local',  passwordHash: hash, name: 'Juliano Esteticista',    role: 'groomer',      color: '#8b5cf6', phone: PHONE } }),
    prisma.user.create({ data: { organizationId: org.id, email: 'fernanda@agilipet.local', passwordHash: hash, name: 'Fernanda Recepcionista', role: 'attendant',    color: '#14b8a6', phone: PHONE } }),
  ]);
  const vets = [vet1, vet2, vet3];
  const profs = [vet1, vet2, vet3, groomer1, groomer2];

  // ── Service Catalog ───────────────────────────────────────────────────────
  console.log('🛠️  Criando catálogo de serviços...');
  await Promise.all([
    { name: 'Consulta Geral',              category: 'consultation', price: 150,  duration: 30,  description: 'Consulta clínica geral' },
    { name: 'Consulta Especialista',       category: 'consultation', price: 280,  duration: 45,  description: 'Consulta com especialista' },
    { name: 'Emergência (Plantão)',        category: 'consultation', price: 350,  duration: 60,  description: 'Atendimento de urgência 24h' },
    { name: 'Retorno',                     category: 'consultation', price: 80,   duration: 20,  description: 'Consulta de retorno' },
    { name: 'Banho Pequeno',               category: 'grooming',     price: 50,   duration: 60,  description: 'Banho para pets até 8kg' },
    { name: 'Banho Médio',                 category: 'grooming',     price: 70,   duration: 75,  description: 'Banho para pets 8–20kg' },
    { name: 'Banho Grande',                category: 'grooming',     price: 100,  duration: 90,  description: 'Banho para pets acima de 20kg' },
    { name: 'Banho e Tosa Pequeno',        category: 'grooming',     price: 90,   duration: 90,  description: 'Banho + tosa máquina/tesoura' },
    { name: 'Banho e Tosa Médio',          category: 'grooming',     price: 130,  duration: 120, description: 'Banho + tosa completa médio porte' },
    { name: 'Tosa na Tesoura',             category: 'grooming',     price: 150,  duration: 120, description: 'Tosa artística na tesoura' },
    { name: 'Hidratação Pelagem',          category: 'grooming',     price: 60,   duration: 30,  description: 'Tratamento hidratante profundo' },
    { name: 'Diária Hotel Standard',       category: 'boarding',     price: 70,   duration: 1440, description: 'Hospedagem padrão' },
    { name: 'Diária Hotel Luxo',           category: 'boarding',     price: 120,  duration: 1440, description: 'Hospedagem suite VIP' },
    { name: 'Internação Clínica (diária)', category: 'other',        price: 200,  duration: 1440, description: 'Diária de internação clínica' },
    { name: 'Hemograma Completo',          category: 'exam',         price: 85,   duration: 30,  description: 'Exame de sangue completo' },
    { name: 'Raio-X Digital',              category: 'exam',         price: 180,  duration: 30,  description: 'Radiografia digital' },
    { name: 'Ultrassom Abdominal',         category: 'exam',         price: 220,  duration: 45,  description: 'Ultrassonografia abdominal' },
    { name: 'Vacina V10',                  category: 'vaccine',      price: 95,   duration: 15,  description: 'Polivalente canina' },
    { name: 'Vacina Antirrábica',          category: 'vaccine',      price: 75,   duration: 15,  description: 'Vacina antirrábica anual' },
    { name: 'Vacina Quádrupla Felina',     category: 'vaccine',      price: 85,   duration: 15,  description: 'Polivalente felina' },
    { name: 'Cirurgia Castração Canino',   category: 'other',        price: 500,  duration: 120, description: 'Orquiectomia / ovariohisterectomia canina' },
    { name: 'Cirurgia Castração Felino',   category: 'other',        price: 400,  duration: 90,  description: 'Orquiectomia / ovariohisterectomia felina' },
  ].map(s => prisma.serviceCatalogItem.create({ data: { ...s, organizationId: org.id } })));

  // ── Clients & Pets ────────────────────────────────────────────────────────
  console.log('🐾 Criando clientes e pets...');

  // 20 clientes aleatórios, todos com PHONE
  const clients: any[] = [];
  const pets: any[] = [];

  for (let ci = 0; ci < 20; ci++) {
    const cd = randomClient(ci);
    const client = await prisma.client.create({
      data: {
        organizationId: org.id,
        name: cd.name,
        email: cd.email,
        phone: PHONE,
        cpf: cd.cpf,
        whatsappEnabled: cd.whatsapp,
        gender: cd.gender,
        origin: cd.origin,
        city: cd.city,
        state: cd.state,
        street: `Rua ${pick(['das Flores','dos Ipês','Marechal Deodoro','Sete de Setembro','Tiradentes'])}, ${100 + ci * 7}`,
        number: `${ci + 1}`,
        neighborhood: pick(['Centro','Jardim América','Vila Nova','Santa Maria','Efapi']),
        zipCode: '89801-001',
        acceptsCampaigns: cd.whatsapp,
        joinedAt: d(-(ci * 12 + 20)),
      },
    });
    clients.push(client);

    // cada cliente tem 1 ou 2 pets, usando o pool circular com sufixo único
    const petCount = ci % 3 === 0 ? 2 : 1;
    for (let pi = 0; pi < petCount; pi++) {
      const pd = PET_POOL[(ci * 2 + pi) % PET_POOL.length];
      // evita nomes duplicados para o mesmo cliente
      const petName = petCount > 1 ? `${pd.name} ${pi + 1}` : pd.name;
      const pet = await prisma.pet.create({
        data: {
          organizationId: org.id,
          clientId: client.id,
          name: petName,
          species: pd.species,
          breed: pd.breed,
          gender: pd.gender,
          size: pd.size,
          age: pd.age,
          weight: pd.weight,
          color: pd.color,
          notes: pd.notes,
          clinicalAlert: pd.alert,
          isCastrated: (ci + pi) % 3 === 0,
          birthDate: d(-(pd.age * 365)),
        },
      });
      pets.push(pet);
    }
  }

  // garante que temos pets suficientes para todos os usos abaixo
  const P = (i: number) => pets[i % pets.length];

  // ── Client Interactions ───────────────────────────────────────────────────
  console.log('💬 Criando interações de clientes...');
  const interactionSubjects = [
    'Agendamento de consulta', 'Dúvida sobre medicamento', 'Retorno pós-cirurgia',
    'Pedido de receita', 'Reclamação — demora atendimento', 'Elogio ao serviço',
    'Cancelamento de banho', 'Orçamento internação', 'Resultado de exame',
    'Solicitação de segunda via', 'Consulta sobre vacina',
  ];
  for (let i = 0; i < 25; i++) {
    const client = clients[i % clients.length];
    const pet    = P(i);
    await prisma.clientInteraction.create({
      data: {
        clientId: client.id,
        type: pick(['call','whatsapp','email','in_person','note']),
        origin: 'manual',
        subject: pick(interactionSubjects),
        body: `Contato realizado com ${client.name} sobre ${pet.name}. Situação tratada e encerrada.`,
        status: pick(['done','done','done','pending']),
        petName: pet.name,
        responsible: pick([admin.name!, vet1.name!, attendant.name!]),
        createdAt: d(-(i * 2)),
      },
    });
  }

  // ── Appointments — TODOS os status ────────────────────────────────────────
  console.log('📅 Criando agendamentos...');

  // ── passados (completed / cancelled) ──────────────────────────────────────
  const pastApts = [
    { pi: 0,  vet: vet1,    days: -42, type: 'consultation', status: 'completed', price: 150, dur: 30,  priority: 'normal', aptType: 'scheduled' },
    { pi: 1,  vet: vet2,    days: -38, type: 'grooming',     status: 'completed', price: 50,  dur: 60,  priority: 'normal', aptType: 'scheduled' },
    { pi: 2,  vet: vet1,    days: -35, type: 'consultation', status: 'cancelled', price: 150, dur: 30,  priority: 'normal', aptType: 'scheduled' },
    { pi: 3,  vet: vet3,    days: -30, type: 'grooming',     status: 'completed', price: 90,  dur: 90,  priority: 'normal', aptType: 'walkin'    },
    { pi: 4,  vet: vet2,    days: -28, type: 'consultation', status: 'completed', price: 280, dur: 45,  priority: 'urgent', aptType: 'walkin'    },
    { pi: 5,  vet: groomer1,days: -25, type: 'grooming',     status: 'completed', price: 130, dur: 120, priority: 'normal', aptType: 'scheduled' },
    { pi: 6,  vet: vet3,    days: -22, type: 'consultation', status: 'completed', price: 150, dur: 30,  priority: 'normal', aptType: 'scheduled' },
    { pi: 7,  vet: vet2,    days: -20, type: 'consultation', status: 'cancelled', price: 280, dur: 45,  priority: 'normal', aptType: 'scheduled' },
    { pi: 8,  vet: groomer2,days: -18, type: 'grooming',     status: 'completed', price: 150, dur: 120, priority: 'normal', aptType: 'scheduled' },
    { pi: 9,  vet: vet3,    days: -15, type: 'consultation', status: 'completed', price: 350, dur: 60,  priority: 'urgent', aptType: 'walkin'    },
    { pi: 10, vet: groomer1,days: -12, type: 'grooming',     status: 'completed', price: 70,  dur: 75,  priority: 'normal', aptType: 'scheduled' },
    { pi: 11, vet: vet1,    days: -10, type: 'consultation', status: 'completed', price: 150, dur: 30,  priority: 'normal', aptType: 'scheduled' },
    { pi: 12, vet: vet3,    days: -8,  type: 'grooming',     status: 'completed', price: 100, dur: 90,  priority: 'normal', aptType: 'scheduled' },
    { pi: 13, vet: vet2,    days: -6,  type: 'consultation', status: 'cancelled', price: 150, dur: 30,  priority: 'normal', aptType: 'scheduled' },
    { pi: 14, vet: groomer2,days: -4,  type: 'grooming',     status: 'completed', price: 90,  dur: 90,  priority: 'normal', aptType: 'walkin'    },
    { pi: 0,  vet: vet2,    days: -3,  type: 'consultation', status: 'completed', price: 280, dur: 45,  priority: 'normal', aptType: 'scheduled' },
    { pi: 2,  vet: vet1,    days: -5,  type: 'grooming',     status: 'completed', price: 50,  dur: 60,  priority: 'normal', aptType: 'scheduled' },
    { pi: 4,  vet: vet3,    days: -7,  type: 'consultation', status: 'completed', price: 150, dur: 30,  priority: 'normal', aptType: 'walkin'    },
  ];

  for (const a of pastApts) {
    const date = d(a.days);
    date.setHours(9, 0, 0, 0);
    const isGrooming = a.type === 'grooming';
    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        petId: P(a.pi).id,
        professionalId: a.vet.id,
        serviceType: a.type,
        date,
        duration: a.dur,
        price: a.price,
        status: a.status,
        priority: a.priority,
        appointmentType: a.aptType,
        completedAt: a.status === 'completed' ? date : null,
        tutorNotified: a.status === 'completed',
        tutorNotifiedAt: a.status === 'completed' ? date : null,
        notes: isGrooming
          ? META({ groomingStatus: a.status === 'completed' ? 'done' : 'cancelled', source: a.type })
          : META({ clinicalStatus: 'done', clinicalMode: 'consultation', source: a.type }),
        stageHistory: isGrooming && a.status === 'completed'
          ? JSON.stringify([
              { stage: 'waiting',  enteredAt: date.toISOString() },
              { stage: 'bathing',  enteredAt: new Date(date.getTime() + 10 * 60000).toISOString() },
              { stage: 'drying',   enteredAt: new Date(date.getTime() + 40 * 60000).toISOString() },
              { stage: 'grooming', enteredAt: new Date(date.getTime() + 60 * 60000).toISOString() },
              { stage: 'done',     enteredAt: new Date(date.getTime() + a.dur * 60000).toISOString() },
            ])
          : null,
      },
    });
  }

  // ── hoje — todos os status e estágios ──────────────────────────────────────
  const todayBase = new Date();
  todayBase.setHours(8, 0, 0, 0);

  type TodayApt = {
    pi: number; vet: any; hour: number; min: number;
    type: string; status: string; priority: string;
    aptType: string; price: number; dur: number;
    groomingStage?: string;
  };

  const todayApts: TodayApt[] = [
    // scheduled
    { pi: 0,  vet: vet1,    hour: 8,  min: 0,  type: 'consultation', status: 'scheduled',   priority: 'normal', aptType: 'scheduled', price: 150, dur: 30 },
    { pi: 2,  vet: groomer1,hour: 8,  min: 30, type: 'grooming',     status: 'scheduled',   priority: 'normal', aptType: 'scheduled', price: 50,  dur: 60 },
    // confirmed
    { pi: 4,  vet: vet1,    hour: 9,  min: 0,  type: 'consultation', status: 'confirmed',   priority: 'normal', aptType: 'scheduled', price: 280, dur: 45 },
    { pi: 6,  vet: vet3,    hour: 9,  min: 30, type: 'grooming',     status: 'confirmed',   priority: 'urgent', aptType: 'walkin',    price: 90,  dur: 90 },
    // checked_in
    { pi: 8,  vet: vet2,    hour: 10, min: 0,  type: 'consultation', status: 'checked_in',  priority: 'normal', aptType: 'scheduled', price: 150, dur: 30 },
    { pi: 10, vet: groomer1,hour: 10, min: 30, type: 'grooming',     status: 'checked_in',  priority: 'urgent', aptType: 'walkin',    price: 150, dur: 120, groomingStage: 'waiting' },
    // in_progress — consulta
    { pi: 1,  vet: vet2,    hour: 11, min: 0,  type: 'consultation', status: 'in_progress', priority: 'normal', aptType: 'scheduled', price: 280, dur: 45 },
    // in_progress — grooming: bathing
    { pi: 3,  vet: groomer1,hour: 11, min: 0,  type: 'grooming',     status: 'in_progress', priority: 'normal', aptType: 'scheduled', price: 90,  dur: 90,  groomingStage: 'bathing' },
    // in_progress — grooming: drying
    { pi: 5,  vet: groomer2,hour: 11, min: 30, type: 'grooming',     status: 'in_progress', priority: 'normal', aptType: 'scheduled', price: 130, dur: 120, groomingStage: 'drying' },
    // in_progress — grooming: grooming
    { pi: 7,  vet: groomer1,hour: 10, min: 0,  type: 'grooming',     status: 'in_progress', priority: 'urgent', aptType: 'walkin',    price: 150, dur: 120, groomingStage: 'grooming' },
    // in_progress — grooming: finishing
    { pi: 9,  vet: groomer2,hour: 9,  min: 30, type: 'grooming',     status: 'in_progress', priority: 'normal', aptType: 'scheduled', price: 100, dur: 90,  groomingStage: 'finishing' },
    // completed hoje
    { pi: 11, vet: vet1,    hour: 8,  min: 0,  type: 'consultation', status: 'completed',   priority: 'normal', aptType: 'scheduled', price: 150, dur: 30 },
    { pi: 12, vet: groomer2,hour: 8,  min: 30, type: 'grooming',     status: 'completed',   priority: 'normal', aptType: 'scheduled', price: 90,  dur: 90,  groomingStage: 'done' },
    // cancelled hoje
    { pi: 13, vet: vet3,    hour: 14, min: 0,  type: 'consultation', status: 'cancelled',   priority: 'normal', aptType: 'scheduled', price: 150, dur: 30 },
    // futuros do dia
    { pi: 14, vet: vet1,    hour: 15, min: 0,  type: 'consultation', status: 'scheduled',   priority: 'normal', aptType: 'scheduled', price: 150, dur: 30 },
    { pi: 15, vet: vet3,    hour: 15, min: 30, type: 'grooming',     status: 'scheduled',   priority: 'normal', aptType: 'scheduled', price: 100, dur: 90 },
    { pi: 16, vet: vet2,    hour: 16, min: 0,  type: 'consultation', status: 'scheduled',   priority: 'urgent', aptType: 'walkin',    price: 350, dur: 60 },
  ];

  for (const a of todayApts) {
    const date = new Date(todayBase);
    date.setHours(a.hour, a.min, 0, 0);
    const isActive   = ['checked_in', 'in_progress'].includes(a.status);
    const isGrooming = a.type === 'grooming';
    const gs         = a.groomingStage ?? 'waiting';
    const groomStages = ['waiting','bathing','drying','grooming','finishing','done'];

    const stageHistory = isGrooming && isActive
      ? JSON.stringify(
          groomStages.slice(0, groomStages.indexOf(gs) + 1).map((s, i) => ({
            stage: s,
            enteredAt: new Date(date.getTime() + i * 15 * 60000).toISOString(),
          }))
        )
      : isGrooming && a.status === 'completed'
        ? JSON.stringify([
            { stage: 'waiting',  enteredAt: date.toISOString() },
            { stage: 'bathing',  enteredAt: new Date(date.getTime() + 10 * 60000).toISOString() },
            { stage: 'drying',   enteredAt: new Date(date.getTime() + 40 * 60000).toISOString() },
            { stage: 'grooming', enteredAt: new Date(date.getTime() + 60 * 60000).toISOString() },
            { stage: 'done',     enteredAt: new Date(date.getTime() + a.dur * 60000).toISOString() },
          ])
        : null;

    await prisma.appointment.create({
      data: {
        organizationId: org.id,
        petId: P(a.pi).id,
        professionalId: a.vet.id,
        serviceType: a.type,
        date,
        duration: a.dur,
        price: a.price,
        status: a.status,
        priority: a.priority,
        appointmentType: a.aptType,
        startedAt:            isActive ? date : null,
        currentStageStartedAt: isActive ? date : null,
        completedAt:   a.status === 'completed' ? date : null,
        tutorNotified: a.status === 'completed',
        tutorNotifiedAt: a.status === 'completed' ? date : null,
        stageHistory,
        checkinMatting:        isGrooming && isActive ? pick(['none','light','moderate']) : null,
        checkinFleas:          isGrooming && isActive ? Math.random() > 0.7 : null,
        checkinBehavior:       isGrooming && isActive ? pick(['calm','agitated','aggressive']) : null,
        checkinExtraAuthorized:isGrooming && isActive ? Math.random() > 0.5 : null,
        groomingPreferences:   isGrooming ? JSON.stringify({ cut: pick(['standard','hygienic','full']), nailTrim: true, earCleaning: true }) : null,
        notes: isGrooming
          ? META({ groomingStatus: gs, source: a.type })
          : META({ clinicalStatus: a.status === 'in_progress' ? 'in_progress' : a.status === 'completed' ? 'done' : 'waiting', clinicalMode: 'consultation', source: a.type }),
        whatsappConfirmationStatus: a.status === 'confirmed' ? 'confirmed' : a.status === 'scheduled' ? pick(['pending','sent',null]) : null,
        whatsappConfirmationSentAt: a.status !== 'scheduled' ? d(-1) : null,
        confirmedVia: a.status === 'confirmed' ? pick(['whatsapp','phone','in_person']) : null,
      },
    });
  }

  // ── agendamentos futuros — próximos 21 dias ────────────────────────────────
  for (let day = 1; day <= 21; day++) {
    const slotsPerDay = day <= 7 ? 4 : 2;
    for (let slot = 0; slot < slotsPerDay; slot++) {
      const date = d(day);
      date.setHours(8 + slot * 2, 0, 0, 0);
      const pet     = P(day * 4 + slot);
      const prof    = profs[(day + slot) % profs.length];
      const isGroom = (day + slot) % 3 === 1;
      const type    = isGroom ? 'grooming' : 'consultation';
      await prisma.appointment.create({
        data: {
          organizationId: org.id,
          petId: pet.id,
          professionalId: prof.id,
          serviceType: type,
          date,
          duration: isGroom ? 90 : 30,
          price:    isGroom ? 90 : 150,
          status:   day === 1 ? 'confirmed' : 'scheduled',
          priority: day === 2 && slot === 0 ? 'urgent' : 'normal',
          appointmentType: slot === 3 ? 'walkin' : 'scheduled',
          groomingPreferences: isGroom ? JSON.stringify({ cut: 'standard', nailTrim: true, earCleaning: false }) : null,
          whatsappConfirmationStatus: day === 1 ? 'confirmed' : day <= 3 ? 'sent' : null,
        },
      });
    }
  }

  // ── Kennels & Boarding ────────────────────────────────────────────────────
  console.log('🏨 Criando canis e hospedagens...');
  const kennels = await Promise.all([
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil P-01',    size: 'small',  status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil P-02',    size: 'small',  status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil P-03',    size: 'small',  status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil M-01',    size: 'medium', status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil M-02',    size: 'medium', status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil G-01',    size: 'large',  status: 'available'   } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Canil G-02',    size: 'large',  status: 'maintenance' } }),
    prisma.kennel.create({ data: { organizationId: org.id, name: 'Suíte VIP 01',  size: 'large',  status: 'available'   } }),
  ]);

  // boarding.status → appointment.status
  const b2a: Record<string,string> = { reserved:'scheduled', active:'checked_in', completed:'completed', cancelled:'cancelled' };

  // status: 'reserved' | 'active' | 'completed' | 'cancelled'
  const boardingCases = [
    // active (3)
    { pi: 0,  kennel: kennels[5], daysIn: -5,  daysOut: 3,   status: 'active',    dailyRate: 120, services: ['Banho extra','Tosa higiênica'] },
    { pi: 5,  kennel: kennels[3], daysIn: -2,  daysOut: 5,   status: 'active',    dailyRate: 70,  services: ['Passeio diário'] },
    { pi: 9,  kennel: kennels[7], daysIn: -1,  daysOut: 7,   status: 'active',    dailyRate: 120, services: ['Banho extra'] },
    // reserved (3)
    { pi: 2,  kennel: kennels[0], daysIn: 2,   daysOut: 9,   status: 'reserved',  dailyRate: 70,  services: [] },
    { pi: 12, kennel: kennels[5], daysIn: 5,   daysOut: 14,  status: 'reserved',  dailyRate: 120, services: [] },
    { pi: 14, kennel: kennels[3], daysIn: 7,   daysOut: 12,  status: 'reserved',  dailyRate: 70,  services: ['Passeio diário'] },
    // completed (3)
    { pi: 3,  kennel: kennels[3], daysIn: -20, daysOut: -13, status: 'completed', dailyRate: 70,  services: ['Banho extra'] },
    { pi: 7,  kennel: kennels[0], daysIn: -30, daysOut: -22, status: 'completed', dailyRate: 70,  services: [] },
    { pi: 10, kennel: kennels[5], daysIn: -15, daysOut: -8,  status: 'completed', dailyRate: 120, services: ['Banho extra','Tosa'] },
    // cancelled (2)
    { pi: 6,  kennel: kennels[1], daysIn: -8,  daysOut: -4,  status: 'cancelled', dailyRate: 70,  services: [] },
    { pi: 4,  kennel: kennels[4], daysIn: -3,  daysOut: 2,   status: 'cancelled', dailyRate: 70,  services: [] },
  ];

  for (const bc of boardingCases) {
    const checkIn  = d(bc.daysIn);
    const checkOut = d(bc.daysOut);
    const days     = bc.daysOut - bc.daysIn;
    const total    = bc.status !== 'cancelled' ? bc.dailyRate * days : 0;

    // Appointment vinculado — necessário para aparecer na agenda
    const apt = await prisma.appointment.create({
      data: {
        organizationId: org.id,
        petId: P(bc.pi).id,
        serviceType: 'boarding',
        date: checkIn,
        returnDate: checkOut,
        duration: days * 1440,
        price: total,
        status: b2a[bc.status] ?? 'scheduled',
        priority: 'normal',
        appointmentType: 'scheduled',
        completedAt: bc.status === 'completed' ? checkOut : null,
        startedAt:   bc.status === 'active'    ? checkIn  : null,
        notes: `Hotel pet — ${bc.kennel.name}. Alimentação 2x ao dia.`,
      },
    });

    const stay = await prisma.boardingStay.create({
      data: {
        organizationId: org.id,
        petId: P(bc.pi).id,
        appointmentId: apt.id,
        kennelNumber: bc.kennel.name,
        checkIn,
        checkOut,
        actualCheckIn:  ['active','completed'].includes(bc.status) ? checkIn  : null,
        actualCheckOut: bc.status === 'completed'                  ? checkOut : null,
        status: bc.status,
        dailyRate: bc.dailyRate,
        totalPrice: total,
        notes: 'Pertences: caminha, brinquedo favorito.',
        specialInstructions: 'Alimentação 2x ao dia. Ração própria.',
        belongings: JSON.stringify(['Caminha','Brinquedo','Ração própria (pacote)']),
      },
    });

    for (const svcName of bc.services) {
      await prisma.boardingService.create({
        data: { boardingId: stay.id, name: svcName, quantity: 1, unitPrice: 50, totalPrice: 50 },
      });
    }
  }

  // ── Hospitalization ───────────────────────────────────────────────────────
  console.log('🏥 Criando internações...');
  // status: 'admitted' | 'treatment' | 'discharged'
  const hospCases = [
    {
      pi: 4, vet: vet1, daysIn: -6, status: 'treatment',
      triage: 'high', origin: 'emergency',
      reason: 'Insuficiência renal aguda. Animal abatido, vômitos frequentes há 2 dias.',
      logCount: 4,
    },
    {
      pi: 8, vet: vet2, daysIn: -3, status: 'admitted',
      triage: 'medium', origin: 'post_surgery',
      reason: 'Pós-operatório castração. Observação de rotina 24h.',
      logCount: 2,
    },
    {
      pi: 2, vet: vet3, daysIn: -1, status: 'admitted',
      triage: 'critical', origin: 'emergency',
      reason: 'Trauma por atropelamento. Suspeita de fratura em membro posterior.',
      logCount: 1,
    },
    {
      pi: 11, vet: vet1, daysIn: -12, daysOut: -5, status: 'discharged',
      triage: 'medium', origin: 'appointment',
      reason: 'Pneumonia bacteriana. Febre alta e dificuldade respiratória.',
      dischargeType: 'discharge', dischargeCondition: 'improved',
      finalDiagnosis: 'Pneumonia bacteriana resolvida.',
      dischargeSummary: 'Alta com antibiótico oral por 7 dias.',
      dischargeInstructions: 'Amoxicilina 250mg/12h por 7 dias. Retorno em 10 dias.',
      dischargeMedications: JSON.stringify([{ name: 'Amoxicilina 250mg', dose: '1 comp/12h', days: 7 }]),
      logCount: 5,
    },
    {
      pi: 1, vet: vet2, daysIn: -35, daysOut: -27, status: 'discharged',
      triage: 'high', origin: 'referral',
      reason: 'Parvovirose. Encaminhado por outra clínica.',
      dischargeType: 'discharge', dischargeCondition: 'stable',
      finalDiagnosis: 'Parvovirose — recuperação completa.',
      dischargeSummary: 'Alta após 8 dias. Boa resposta ao tratamento.',
      dischargeInstructions: 'Dieta bland por 14 dias. Retorno em 7 dias.',
      dischargeMedications: JSON.stringify([{ name: 'Metronidazol 250mg', dose: '1 comp/12h', days: 10 }]),
      logCount: 6,
    },
    {
      pi: 16, vet: vet3, daysIn: -2, status: 'treatment',
      triage: 'medium', origin: 'walk_in',
      reason: 'Obstrução intestinal por corpo estranho (brinquedo).',
      logCount: 2,
    },
  ];

  for (const hc of hospCases) {
    const checkIn  = d(hc.daysIn);
    checkIn.setHours(10, 0, 0, 0);
    const checkOut = (hc as any).daysOut
      ? (() => { const dt = d((hc as any).daysOut); dt.setHours(10,0,0,0); return dt; })()
      : null;

    const stay = await prisma.hospitalizationStay.create({
      data: {
        organizationId: org.id,
        petId: P(hc.pi).id,
        veterinarianId: hc.vet.id,
        origin: hc.origin,
        triageLevel: hc.triage,
        reasonForAdmission: hc.reason,
        status: hc.status,
        checkIn,
        checkOut: checkOut ?? undefined,
        admittedAt: checkIn,
        dailyRate: 200,
        kennelNumber: `INT-0${hospCases.indexOf(hc) + 1}`,
        expectedDischargeDate: checkOut ?? d(hc.daysIn + 7),
        dischargeAt:           checkOut ?? undefined,
        dischargeType:         (hc as any).dischargeType        ?? null,
        dischargeCondition:    (hc as any).dischargeCondition   ?? null,
        finalDiagnosis:        (hc as any).finalDiagnosis       ?? null,
        dischargeSummary:      (hc as any).dischargeSummary     ?? null,
        dischargeInstructions: (hc as any).dischargeInstructions ?? null,
        dischargeMedications:  (hc as any).dischargeMedications  ?? null,
        attendingVetName: hc.vet.name,
        notes: 'Paciente sob observação contínua.',
      },
    });

    for (let l = 0; l < hc.logCount; l++) {
      const ts     = new Date(checkIn.getTime() + l * 24 * 3_600_000);
      const isLast = l === hc.logCount - 1;
      await prisma.hospitalizationLog.create({
        data: {
          hospitalizationId: stay.id,
          timestamp: ts,
          eventAt: ts,
          type: l === 0 ? 'admission' : isLast && hc.status === 'discharged' ? 'discharge' : 'medical_evolution',
          heartRate: 65 + Math.floor(Math.random() * 40),
          respiratoryRate: 16 + Math.floor(Math.random() * 10),
          temperature: parseFloat((38.0 + Math.random() * 1.8).toFixed(1)),
          painScore: Math.floor(Math.random() * 4),
          capillaryRefillTime: pick(['<2s','2s','>2s']),
          mucousMembranes: pick(['róseas','pálidas','ictéricas','cianóticas']),
          hydrationLevel: pick(['normal','leve desidratação','moderada desidratação']),
          consciousness: pick(['alerta','responsivo','deprimido','estuporoso']),
          medicationGiven: l === 0
            ? 'Fluidoterapia IV — Ringer Lactato 500ml/h'
            : l % 2 === 0
              ? 'Manutenção fluidoterapia + Tramadol 2mg/kg IV'
              : 'Amoxicilina 20mg/kg IV + Ondansetrona 0,5mg/kg',
          doctorNotes: isLast && hc.status === 'discharged'
            ? 'Alta médica. Animal em bom estado geral.'
            : l === 0 ? 'Admissão. Iniciando protocolo de estabilização.'
            : 'Evolução satisfatória. Manter protocolo.',
          conduct: isLast && hc.status === 'discharged'
            ? 'Alta hospitalar. Medicação oral prescrita.'
            : 'Manter internação. Monitorar sinais vitais a cada 4h.',
          statusAfter: hc.status,
          clinicalChecks: JSON.stringify({
            hydration: true, feeding: l > 0, urination: l > 0,
            defecation: l > 1, vomiting: l === 0, pain: l < 2,
          }),
        },
      });
    }
  }

  // ── Medical Records & Vaccinations ───────────────────────────────────────
  console.log('🩺 Criando prontuários e vacinas...');
  const diagnoses  = ['Saudável','Otite externa','Dermatite atópica','Gastrite crônica','Artrite leve','Parasitose intestinal','Trauma leve','Sopro Cardíaco G1','Conjuntivite','Cistite'];
  const treatments = [
    'Observação e retorno em 30 dias',
    'Antibiótico 7 dias — Amoxicilina 250mg/12h',
    'Limpeza auricular + Otológico tópico',
    'Dieta leve + Probiótico 14 dias',
    'Anti-inflamatório 5 dias — Meloxicam 0,1mg/kg',
    'Vermifugação — Drontal Plus',
    'Aplicação antipulgas + carrapatos — Bravecto',
    'Monitoramento cardíaco — Retorno em 60 dias',
    'Colírio antibiótico 7 dias',
    'Urocultura + Antibiótico conforme antibiograma',
  ];

  for (let i = 0; i < pets.length; i++) {
    const pet   = pets[i];
    const count = 1 + (i % 3);
    for (let r = 0; r < count; r++) {
      await prisma.medicalRecord.create({
        data: {
          organizationId: org.id,
          petId: pet.id,
          date: d(-(r * 30 + 15)),
          description: 'Consulta de rotina. Animal em bom estado geral, comportamento adequado. Exame físico completo realizado.',
          diagnosis: pick(diagnoses),
          diagnosisType: pick(['definitive','presumptive','differential']),
          treatment: pick(treatments),
          veterinarianId: pick(vets).id,
          bodyConditionScore: pick(['2','3','4']),
          painScore: Math.floor(Math.random() * 3),
          mucousMembranes: pick(['róseas','pálidas','ictéricas']),
          capillaryRefillTime: pick(['<2s','2s']),
          hydrationLevel: pick(['normal','leve desidratação']),
          systemicEvaluation: JSON.stringify({
            cardiovascular: 'normal', respiratory: 'normal',
            digestive: pick(['normal','alterado']), urinary: 'normal', neurological: 'normal',
          }),
        },
      });
    }

    if (pet.species === 'dog') {
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'V10',           date: d(-180), nextDueDate: d(185), batch: 'LOT-2025A' } });
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Antirrábica',   date: d(-90),  nextDueDate: d(275), batch: 'LOT-2025B' } });
      if (i % 2 === 0)
        await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Gripe Canina', date: d(-60),  nextDueDate: d(305), batch: 'LOT-2025C' } });
    } else {
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Quádrupla Felina', date: d(-120), nextDueDate: d(245), batch: 'LOT-2025D' } });
      await prisma.vaccination.create({ data: { organizationId: org.id, petId: pet.id, name: 'Antirrábica',      date: d(-60),  nextDueDate: d(305), batch: 'LOT-2025E' } });
    }
  }

  // ── Products & Stock ──────────────────────────────────────────────────────
  console.log('📦 Criando produtos e estoque...');
  const productsRaw = [
    { name: 'Ração Filhote 10kg',      category: 'food',        price: 180, stock: 20, minStock: 5,  sku: 'ALI-001', unit: 'saco' },
    { name: 'Ração Castrado 15kg',     category: 'food',        price: 240, stock: 15, minStock: 5,  sku: 'ALI-002', unit: 'saco' },
    { name: 'Ração Sênior 12kg',       category: 'food',        price: 210, stock: 3,  minStock: 5,  sku: 'ALI-003', unit: 'saco' },  // estoque baixo
    { name: 'Ração Gato Adulto 3kg',   category: 'food',        price: 95,  stock: 12, minStock: 5,  sku: 'ALI-004', unit: 'saco' },
    { name: 'Shampoo Pelos Curtos',    category: 'grooming',    price: 40,  stock: 30, minStock: 8,  sku: 'GRO-001', unit: 'unid' },
    { name: 'Condicionador Brilho',    category: 'grooming',    price: 45,  stock: 25, minStock: 8,  sku: 'GRO-002', unit: 'unid' },
    { name: 'Shampoo Medicamentoso',   category: 'grooming',    price: 65,  stock: 18, minStock: 5,  sku: 'GRO-003', unit: 'unid' },
    { name: 'Coleira Antipulgas',      category: 'medicines',   price: 120, stock: 10, minStock: 3,  sku: 'MED-001', unit: 'unid' },
    { name: 'Amoxicilina 250mg',       category: 'medicines',   price: 35,  stock: 50, minStock: 10, sku: 'MED-002', unit: 'comprimido' },
    { name: 'Soro Fisiológico 500ml',  category: 'medicines',   price: 12,  stock: 2,  minStock: 10, sku: 'MED-003', unit: 'frasco' },  // estoque baixo
    { name: 'Meloxicam 2mg',           category: 'medicines',   price: 28,  stock: 40, minStock: 10, sku: 'MED-004', unit: 'comprimido' },
    { name: 'Tramadol 50mg',           category: 'medicines',   price: 18,  stock: 60, minStock: 15, sku: 'MED-005', unit: 'comprimido' },
    { name: 'Petisco Biscoito',        category: 'other',       price: 12,  stock: 100,minStock: 20, sku: 'OUT-001', unit: 'pacote' },
    { name: 'Brinquedo Mordedor',      category: 'accessories', price: 35,  stock: 15, minStock: 5,  sku: 'ACS-001', unit: 'unid' },
    { name: 'Cama Ortopédica M',       category: 'accessories', price: 185, stock: 6,  minStock: 3,  sku: 'ACS-002', unit: 'unid' },
    { name: 'Vacina V10',              category: 'vaccine',     price: 95,  stock: 20, minStock: 5,  sku: 'VAC-001', unit: 'dose' },
    { name: 'Vacina Antirrábica',      category: 'vaccine',     price: 75,  stock: 15, minStock: 5,  sku: 'VAC-002', unit: 'dose' },
    { name: 'Vacina Quádrupla Felina', category: 'vaccine',     price: 85,  stock: 12, minStock: 5,  sku: 'VAC-003', unit: 'dose' },
  ];

  const createdProducts: any[] = [];
  for (const p of productsRaw) {
    const prod = await prisma.product.create({
      data: { ...p, organizationId: org.id, description: `${p.name} — uso veterinário` },
    });
    createdProducts.push(prod);
    await prisma.productBatch.create({
      data: { productId: prod.id, code: `BAT-${p.sku}-25A`, quantity: Math.floor(p.stock * 0.6), expirationDate: d(180 + (p.stock * 7) % 180) },
    });
    if (p.stock > 5) {
      await prisma.productBatch.create({
        data: { productId: prod.id, code: `BAT-${p.sku}-25B`, quantity: Math.ceil(p.stock * 0.4), expirationDate: d(360 + (p.stock * 11) % 180) },
      });
    }
  }

  // ── Sales ─────────────────────────────────────────────────────────────────
  console.log('💰 Criando vendas...');
  const salesCases = [
    { ci: 0,  pi: 0,  qty: 2, status: 'completed', daysAgo: -30 },
    { ci: 1,  pi: 4,  qty: 1, status: 'completed', daysAgo: -28 },
    { ci: 2,  pi: 7,  qty: 1, status: 'completed', daysAgo: -25 },
    { ci: 3,  pi: 12, qty: 3, status: 'completed', daysAgo: -22 },
    { ci: 4,  pi: 1,  qty: 1, status: 'completed', daysAgo: -20 },
    { ci: 5,  pi: 13, qty: 2, status: 'completed', daysAgo: -18 },
    { ci: 6,  pi: 8,  qty: 1, status: 'completed', daysAgo: -15 },
    { ci: 7,  pi: 5,  qty: 1, status: 'cancelled', daysAgo: -14 },
    { ci: 8,  pi: 15, qty: 1, status: 'completed', daysAgo: -12 },
    { ci: 9,  pi: 16, qty: 1, status: 'completed', daysAgo: -10 },
    { ci: 10, pi: 3,  qty: 2, status: 'completed', daysAgo: -8  },
    { ci: 11, pi: 6,  qty: 1, status: 'completed', daysAgo: -7  },
    { ci: 0,  pi: 10, qty: 1, status: 'completed', daysAgo: -6  },
    { ci: 1,  pi: 11, qty: 2, status: 'completed', daysAgo: -5  },
    { ci: 2,  pi: 0,  qty: 1, status: 'completed', daysAgo: -4  },
    { ci: 3,  pi: 4,  qty: 2, status: 'cancelled', daysAgo: -3  },
    { ci: 4,  pi: 12, qty: 5, status: 'completed', daysAgo: -2  },
    { ci: 5,  pi: 14, qty: 1, status: 'completed', daysAgo: -1  },
    { ci: 6,  pi: 17, qty: 1, status: 'completed', daysAgo:  0  },
    { ci: 7,  pi: 9,  qty: 3, status: 'completed', daysAgo: -1  },
  ];

  for (const sc of salesCases) {
    const prod  = createdProducts[sc.pi % createdProducts.length];
    const total = prod.price * sc.qty;
    const sale  = await prisma.sale.create({
      data: { organizationId: org.id, clientId: clients[sc.ci % clients.length].id, total, status: sc.status, date: d(sc.daysAgo) },
    });
    await prisma.saleItem.create({
      data: { saleId: sale.id, productId: prod.id, productName: prod.name, quantity: sc.qty, unitPrice: prod.price, total },
    });
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────
  console.log('📋 Criando tarefas...');
  const tasksRaw = [
    // completed
    { title: 'Conferir estoque de vacinas',              category: 'administrative', assignee: attendant.name!, status: 'completed',   priority: 'high',   offset: -3 },
    { title: 'Ligar para retornos de cirurgia',          category: 'other',          assignee: vet1.name!,      status: 'completed',   priority: 'high',   offset: -2 },
    { title: 'Limpar setor de banho após turno',         category: 'cleaning',       assignee: groomer1.name!,  status: 'completed',   priority: 'medium', offset: -1 },
    { title: 'Desinfecção das baias de internação',      category: 'cleaning',       assignee: attendant.name!, status: 'completed',   priority: 'high',   offset: -1 },
    { title: 'Enviar lembretes de vacinação',            category: 'other',          assignee: attendant.name!, status: 'completed',   priority: 'medium', offset: -2 },
    // in_progress
    { title: 'Revisar prontuários pendentes',            category: 'administrative', assignee: vet2.name!,      status: 'in_progress', priority: 'high',   offset: 0 },
    { title: 'Fazer pedido de rações e insumos',         category: 'administrative', assignee: admin.name!,     status: 'in_progress', priority: 'high',   offset: 1 },
    { title: 'Manutenção das gaiolas de internação',     category: 'maintenance',    assignee: attendant.name!, status: 'in_progress', priority: 'medium', offset: 1 },
    { title: 'Campanha vacina antirrábica — contatos',   category: 'other',          assignee: attendant.name!, status: 'in_progress', priority: 'medium', offset: 2 },
    // pending — low
    { title: 'Organizar recepção para abertura',         category: 'cleaning',       assignee: attendant.name!, status: 'pending',     priority: 'low',    offset: 1 },
    { title: 'Repor material de escritório',             category: 'administrative', assignee: admin.name!,     status: 'pending',     priority: 'low',    offset: 3 },
    // pending — medium
    { title: 'Renovar contrato fornecedor ração',        category: 'administrative', assignee: admin.name!,     status: 'pending',     priority: 'medium', offset: 4 },
    { title: 'Verificar equipamento de ultrassom',       category: 'maintenance',    assignee: vet3.name!,      status: 'pending',     priority: 'medium', offset: 5 },
    { title: 'Limpar e desinfetar canis após saídas',    category: 'cleaning',       assignee: groomer2.name!,  status: 'pending',     priority: 'medium', offset: 2 },
    { title: 'Calibrar balança da recepção',             category: 'maintenance',    assignee: attendant.name!, status: 'pending',     priority: 'medium', offset: 3 },
    // pending — high
    { title: 'Treinar nova atendente — sistema',         category: 'administrative', assignee: admin.name!,     status: 'pending',     priority: 'high',   offset: 5 },
    { title: 'Comprar soro fisiológico (estoque baixo)', category: 'administrative', assignee: admin.name!,     status: 'pending',     priority: 'high',   offset: 1 },
    { title: 'Revisar protocolo anestésico',             category: 'administrative', assignee: vet1.name!,      status: 'pending',     priority: 'high',   offset: 7 },
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
        dueDate: d(t.offset),
        description: `Tarefa de ${t.category}. Responsável: ${t.assignee}.`,
      },
    });
  }

  // ── Portal do Tutor ───────────────────────────────────────────────────────
  // status: 'pending' | 'approved' | 'rejected'
  console.log('🐾 Criando acessos ao portal do tutor...');
  const portalHash = await bcrypt.hash('portal123', 10);
  const portalCases = [
    { ci: 0, status: 'approved', daysAgo: -10 },
    { ci: 1, status: 'approved', daysAgo: -8  },
    { ci: 4, status: 'approved', daysAgo: -5  },
    { ci: 2, status: 'pending',  daysAgo: -2  },
    { ci: 3, status: 'pending',  daysAgo: -1  },
    { ci: 7, status: 'pending',  daysAgo: 0   },
    { ci: 5, status: 'rejected', daysAgo: -20 },
    { ci: 6, status: 'rejected', daysAgo: -15 },
  ];

  for (const pc of portalCases) {
    const client = clients[pc.ci];
    await prisma.clientPortalAccess.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        email: client.email,
        passwordHash: portalHash,
        status: pc.status,
        approvedAt: pc.status === 'approved' ? d(pc.daysAgo + 1) : null,
        approvedBy: pc.status === 'approved' ? admin.id : null,
        createdAt: d(pc.daysAgo),
      },
    });
  }

  // ── Client Orders ─────────────────────────────────────────────────────────
  // status: 'pending' | 'confirmed' | 'cancelled'
  console.log('🛒 Criando pedidos do portal...');
  const orderCases = [
    { ci: 0, status: 'confirmed', daysAgo: -9,  items: [{ id: createdProducts[0].id,  name: createdProducts[0].name,  price: createdProducts[0].price,  qty: 1, type: 'product' }], total: createdProducts[0].price },
    { ci: 1, status: 'confirmed', daysAgo: -6,  items: [{ id: createdProducts[4].id,  name: createdProducts[4].name,  price: createdProducts[4].price,  qty: 2, type: 'product' }, { id: createdProducts[13].id, name: createdProducts[13].name, price: createdProducts[13].price, qty: 1, type: 'product' }], total: createdProducts[4].price * 2 + createdProducts[13].price },
    { ci: 4, status: 'confirmed', daysAgo: -3,  items: [{ id: createdProducts[15].id, name: createdProducts[15].name, price: createdProducts[15].price, qty: 1, type: 'product' }], total: createdProducts[15].price },
    { ci: 0, status: 'pending',   daysAgo: -1,  items: [{ id: createdProducts[1].id,  name: createdProducts[1].name,  price: createdProducts[1].price,  qty: 1, type: 'product' }], total: createdProducts[1].price },
    { ci: 1, status: 'pending',   daysAgo: 0,   items: [{ id: createdProducts[12].id, name: createdProducts[12].name, price: createdProducts[12].price, qty: 5, type: 'product' }], total: createdProducts[12].price * 5 },
    { ci: 4, status: 'pending',   daysAgo: 0,   items: [{ id: createdProducts[6].id,  name: createdProducts[6].name,  price: createdProducts[6].price,  qty: 1, type: 'product' }], total: createdProducts[6].price },
    { ci: 5, status: 'cancelled', daysAgo: -14, items: [{ id: createdProducts[7].id,  name: createdProducts[7].name,  price: createdProducts[7].price,  qty: 1, type: 'product' }], total: createdProducts[7].price },
    { ci: 6, status: 'cancelled', daysAgo: -8,  items: [{ id: createdProducts[14].id, name: createdProducts[14].name, price: createdProducts[14].price, qty: 1, type: 'product' }], total: createdProducts[14].price },
  ];

  for (const oc of orderCases) {
    await prisma.clientOrder.create({
      data: {
        organizationId: org.id,
        clientId: clients[oc.ci].id,
        items: JSON.stringify(oc.items),
        total: oc.total,
        status: oc.status,
        createdAt: d(oc.daysAgo),
      },
    });
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  console.log('📝 Criando templates...');
  await prisma.appointmentTemplate.createMany({
    data: [
      { organizationId: org.id, name: 'Protocolo Vacinação Filhote', description: 'Sequência completa para filhotes', services: JSON.stringify([{ name: 'V10 Dose 1', day: 0 }, { name: 'V10 Dose 2', day: 21 }, { name: 'V10 Dose 3 + Raiva', day: 42 }]), defaultDurationDays: 45 },
      { organizationId: org.id, name: 'Pós-Op Castração Canino',    description: 'Acompanhamento pós-cirúrgico cão',  services: JSON.stringify([{ name: 'Revisão + Limpeza', day: 3 }, { name: 'Retirada de Pontos', day: 10 }]), defaultDurationDays: 14 },
      { organizationId: org.id, name: 'Pós-Op Castração Felino',    description: 'Acompanhamento pós-cirúrgico gato', services: JSON.stringify([{ name: 'Revisão', day: 5 }, { name: 'Retirada de Pontos', day: 10 }]), defaultDurationDays: 12 },
      { organizationId: org.id, name: 'Check-up Anual Cão Adulto',  description: 'Hemograma + vacinas anuais',        services: JSON.stringify([{ name: 'Consulta Geral', day: 0 }, { name: 'Hemograma', day: 0 }, { name: 'V10', day: 0 }, { name: 'Antirrábica', day: 0 }]), defaultDurationDays: 1 },
    ],
  });

  await prisma.messageTemplate.createMany({
    data: [
      { organizationId: org.id, title: 'Lembrete de Consulta',      type: 'appointment_confirmation', content: 'Olá [NOME]! Lembramos que amanhã temos consulta do [PET] às [HORA]. Confirma? Responda SIM ou NÃO.', active: true },
      { organizationId: org.id, title: 'Confirmação de Agendamento',type: 'appointment_confirmation', content: 'Olá [NOME]! Seu agendamento para [PET] foi confirmado para [DATA] às [HORA]. Até logo!',           active: true },
      { organizationId: org.id, title: 'Pet Pronto — Banho e Tosa', type: 'grooming_finished',        content: 'Oi [NOME]! O [PET] ficou lindo e cheiroso! Pode vir buscar quando quiser! 🐾',                    active: true },
      { organizationId: org.id, title: 'Alerta de Vacina',          type: 'manual_message',           content: 'Atenção! A vacina [VACINA] do [PET] vence em breve. Vamos agendar o reforço?',                    active: true },
      { organizationId: org.id, title: 'Alta Hospitalar',           type: 'manual_message',           content: 'Boa notícia! O [PET] recebeu alta e está pronto para ir para casa! ❤️',                          active: true },
      { organizationId: org.id, title: 'Retorno Pós-Cirurgia',      type: 'manual_message',           content: 'Olá [NOME]! Passaram [DIAS] dias da cirurgia do [PET]. Está tudo bem? Tem alguma dúvida?',        active: true },
    ],
  });

  // ── Notification Logs ─────────────────────────────────────────────────────
  console.log('📬 Criando histórico de notificações...');
  for (let i = 0; i < 30; i++) {
    const client = clients[i % clients.length];
    const pet    = P(i);
    await prisma.notificationLog.create({
      data: {
        organizationId: org.id,
        clientId: client.id,
        clientName: client.name,
        petName: pet.name,
        type: pick(['appointment_confirmation','grooming_finished','manual_message']),
        message: `Mensagem enviada para ${client.name} sobre ${pet.name}.`,
        sentAt: d(-Math.floor(i / 2)),
        status: i % 5 === 0 ? 'failed' : 'sent',
        manual: i % 4 === 0,
      },
    });
  }

  // ── SAAS Admin ────────────────────────────────────────────────────────────
  await seedSaasAdmin(prisma);

  // ── Resumo ────────────────────────────────────────────────────────────────
  console.log('');
  console.log('✅ Seed concluído com sucesso!');
  console.log(`   Clientes: ${clients.length}  |  Pets: ${pets.length}`);
  console.log('');
  console.log('🔑 Credenciais de acesso:');
  console.log('   admin@agilipet.local     / admin123  (admin)');
  console.log('   marcelo@agilipet.local   / admin123  (veterinário)');
  console.log('   beatriz@agilipet.local   / admin123  (veterinária)');
  console.log('   andre@agilipet.local     / admin123  (veterinário)');
  console.log('   carla@agilipet.local     / admin123  (groomer)');
  console.log('   juliano@agilipet.local   / admin123  (groomer)');
  console.log('   fernanda@agilipet.local  / admin123  (atendente)');
  console.log('   marcelokoller@gmail.com  / admin123  (saas_admin)');
  console.log('');
  console.log('🐾 Portal do Tutor: <email do cliente> / portal123');
  console.log('   approved (3) | pending (3) | rejected (2)');
  console.log('');
  console.log('📊 Cobertura:');
  console.log('   Agendamentos:  scheduled, confirmed, checked_in, in_progress (5 estágios grooming), completed, cancelled');
  console.log('   Hospedagem:    reserved (3), active (3), completed (3), cancelled (2) — todos com appointment vinculado');
  console.log('   Internação:    admitted (2), treatment (2), discharged (2) — com logs de evolução');
  console.log('   Tarefas:       pending low/medium/high, in_progress, completed');
  console.log('   Pedidos:       pending (3), confirmed (3), cancelled (2)');
  console.log('   Vendas:        completed (18), cancelled (2)');
  console.log(`   Fone universal: ${PHONE}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
