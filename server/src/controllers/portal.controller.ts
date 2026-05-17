import { Request, Response } from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middlewares/auth.middleware';

// ── Registro self-service do tutor ────────────────────────────────────────────

export const portalRegister = async (req: Request, res: Response) => {
  const { email, password, clientId, organizationId } = req.body;

  if (!email || !password || !clientId || !organizationId) {
    return res.status(400).json({ error: 'email, password, clientId e organizationId são obrigatórios.' });
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id: clientId, organizationId },
    });
    if (!client) return res.status(404).json({ error: 'Cliente não encontrado nessa organização.' });

    const emailInUse = await prisma.clientPortalAccess.findUnique({ where: { email } });
    if (emailInUse) return res.status(409).json({ error: 'E-mail já cadastrado no portal.' });

    const alreadyRegistered = await prisma.clientPortalAccess.findUnique({ where: { clientId } });
    if (alreadyRegistered) return res.status(409).json({ error: 'Tutor já possui acesso cadastrado.' });

    const passwordHash = await hashPassword(password);
    await prisma.clientPortalAccess.create({
      data: { organizationId, clientId, email, passwordHash, status: 'pending' },
    });

    res.status(201).json({ message: 'Cadastro realizado. Aguarde aprovação da clínica para acessar o portal.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Login do tutor ────────────────────────────────────────────────────────────

export const portalLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const access = await prisma.clientPortalAccess.findUnique({
      where: { email },
      include: { client: { select: { id: true, name: true, organizationId: true } } },
    });

    if (!access) return res.status(401).json({ error: 'Credenciais inválidas.' });

    const isValid = await comparePassword(password, access.passwordHash);
    if (!isValid) return res.status(401).json({ error: 'Credenciais inválidas.' });

    if (access.status === 'pending') {
      return res.status(403).json({ error: 'Acesso pendente de aprovação pela clínica.' });
    }
    if (access.status === 'rejected') {
      return res.status(403).json({ error: 'Acesso negado pela clínica. Entre em contato.' });
    }

    const token = generateToken(access.id, 'client_portal', access.organizationId, null, { clientId: access.clientId });

    res.json({
      token,
      user: {
        id: access.id,
        email: access.email,
        name: access.client.name,
        role: 'client_portal',
        clientId: access.clientId,
        organizationId: access.organizationId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Admin: listar solicitações de acesso ──────────────────────────────────────

export const listPortalRequests = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  try {
    const requests = await prisma.clientPortalAccess.findMany({
      where: { organizationId: orgId },
      include: { client: { select: { id: true, name: true, email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Admin: aprovar ou rejeitar acesso ────────────────────────────────────────

export const reviewPortalRequest = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { action } = req.body; // 'approved' | 'rejected'
  const orgId = req.user?.organizationId;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'action deve ser "approved" ou "rejected".' });
  }

  try {
    const access = await prisma.clientPortalAccess.findFirst({ where: { id, organizationId: orgId! } });
    if (!access) return res.status(404).json({ error: 'Solicitação não encontrada.' });

    const updated = await prisma.clientPortalAccess.update({
      where: { id },
      data: {
        status: action,
        approvedAt: action === 'approved' ? new Date() : null,
        approvedBy: action === 'approved' ? req.user!.id : null,
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Portal: criar pedido ──────────────────────────────────────────────────────

export const createClientOrder = async (req: AuthRequest, res: Response) => {
  const { items, total, notes } = req.body;
  const orgId = req.user?.organizationId;
  const clientId = (req.user as any)?.clientId;

  if (!items || !total || !orgId || !clientId) {
    return res.status(400).json({ error: 'Dados incompletos.' });
  }

  try {
    const order = await prisma.clientOrder.create({
      data: {
        organizationId: orgId,
        clientId,
        items: JSON.stringify(items),
        total,
        notes: notes ?? null,
        status: 'pending',
      },
    });

    res.status(201).json({ ...order, items: JSON.parse(order.items) });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Portal: listar pedidos do tutor ──────────────────────────────────────────

export const listMyOrders = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const clientId = (req.user as any)?.clientId;

  if (!orgId || !clientId) return res.status(400).json({ error: 'Não autenticado como tutor.' });

  try {
    const orders = await prisma.clientOrder.findMany({
      where: { organizationId: orgId, clientId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => ({ ...o, items: JSON.parse(o.items) })));
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Admin: listar todos os pedidos do portal ─────────────────────────────────

export const listAllClientOrders = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(400).json({ error: 'No organization' });

  try {
    const orders = await prisma.clientOrder.findMany({
      where: { organizationId: orgId },
      include: { client: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders.map((o) => ({ ...o, items: JSON.parse(o.items) })));
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Admin: atualizar status do pedido ────────────────────────────────────────

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const orgId = req.user?.organizationId;

  if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido.' });
  }

  try {
    const order = await prisma.clientOrder.findFirst({ where: { id, organizationId: orgId! } });
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });

    const updated = await prisma.clientOrder.update({ where: { id }, data: { status } });
    res.json({ ...updated, items: JSON.parse(updated.items) });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Portal: agendar horário (tutor autenticado) ───────────────────────────────

export const portalCreateAppointment = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const clientId = (req.user as any)?.clientId;

  if (!orgId || !clientId) return res.status(400).json({ error: 'Não autenticado como tutor.' });

  const { petId, serviceType, date, notes } = req.body;

  if (!petId || !serviceType || !date) {
    return res.status(400).json({ error: 'petId, serviceType e date são obrigatórios.' });
  }

  try {
    // Validar que o pet pertence ao cliente
    const pet = await prisma.pet.findFirst({ where: { id: petId, clientId, organizationId: orgId } });
    if (!pet) return res.status(404).json({ error: 'Pet não encontrado.' });

    const appointment = await prisma.appointment.create({
      data: {
        organizationId: orgId,
        petId,
        serviceType,
        date: new Date(date),
        duration: 60,
        status: 'scheduled',
        appointmentType: 'scheduled',
        notes: notes ? `[portal] ${notes}` : '[portal] Agendado pelo tutor via portal',
      },
      include: { pet: { select: { name: true } } },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Portal: listar agendamentos do tutor ──────────────────────────────────────

export const portalListAppointments = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const clientId = (req.user as any)?.clientId;

  if (!orgId || !clientId) return res.status(400).json({ error: 'Não autenticado como tutor.' });

  try {
    const pets = await prisma.pet.findMany({ where: { clientId, organizationId: orgId }, select: { id: true } });
    const petIds = pets.map((p) => p.id);

    const appointments = await prisma.appointment.findMany({
      where: { organizationId: orgId, petId: { in: petIds } },
      orderBy: { date: 'desc' },
      include: { pet: { select: { id: true, name: true } } },
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};

// ── Portal: cancelar agendamento do tutor ────────────────────────────────────

export const portalCancelAppointment = async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  const clientId = (req.user as any)?.clientId;
  const { id } = req.params;

  if (!orgId || !clientId) return res.status(400).json({ error: 'Não autenticado como tutor.' });

  try {
    const pets = await prisma.pet.findMany({ where: { clientId, organizationId: orgId }, select: { id: true } });
    const petIds = pets.map((p) => p.id);

    const appointment = await prisma.appointment.findFirst({
      where: { id, organizationId: orgId, petId: { in: petIds } },
    });

    if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado.' });
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ error: 'Agendamento não pode ser cancelado.' });
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno.' });
  }
};
