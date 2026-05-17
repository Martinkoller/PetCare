import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  return [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\r\n');
};

// ── GET /reports/sales.csv ────────────────────────────────────────────────────

router.get('/sales.csv', async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const { from, to } = req.query as Record<string, string>;

  try {
    const sales = await prisma.sale.findMany({
      where: {
        organizationId: orgId,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      include: { items: true },
      orderBy: { date: 'desc' },
    });

    const rows = sales.flatMap((s) =>
      s.items.map((i) => ({
        data: s.date.toISOString().split('T')[0],
        venda_id: s.id,
        status: s.status,
        metodo_pagamento: s.paymentMethod ?? '',
        produto: i.productName,
        quantidade: i.quantity,
        valor_unitario: i.unitPrice.toFixed(2),
        total_item: i.total.toFixed(2),
        total_venda: s.total.toFixed(2),
      }))
    );

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-vendas.csv"');
    res.send('﻿' + csv); // BOM para Excel reconhecer UTF-8
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

// ── GET /reports/clients.csv ──────────────────────────────────────────────────

router.get('/clients.csv', async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const clients = await prisma.client.findMany({
      where: { organizationId: orgId },
      include: { pets: { select: { name: true, species: true } } },
      orderBy: { name: 'asc' },
    });

    const rows = clients.map((c) => ({
      nome: c.name,
      email: c.email ?? '',
      telefone: c.phone ?? '',
      cpf: c.cpf ?? '',
      cidade: c.city ?? '',
      estado: c.state ?? '',
      pets: c.pets.map((p) => p.name).join('; '),
      espécies: c.pets.map((p) => p.species ?? '').join('; '),
      cadastrado_em: c.joinedAt.toISOString().split('T')[0],
    }));

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="lista-clientes.csv"');
    res.send('﻿' + csv);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

// ── GET /reports/financial-summary.csv ───────────────────────────────────────

router.get('/financial-summary.csv', async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const { from, to } = req.query as Record<string, string>;

  try {
    const [sales, appointments] = await Promise.all([
      prisma.sale.findMany({
        where: {
          organizationId: orgId,
          status: 'completed',
          ...(from || to
            ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
            : {}),
        },
        select: { date: true, total: true, paymentMethod: true },
        orderBy: { date: 'asc' },
      }),
      prisma.appointment.findMany({
        where: {
          organizationId: orgId,
          status: 'completed',
          price: { gt: 0 },
          ...(from || to
            ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
            : {}),
        },
        select: { date: true, price: true, serviceType: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    const rows = [
      ...sales.map((s) => ({
        data: s.date.toISOString().split('T')[0],
        tipo: 'Venda',
        descricao: `Venda de produtos`,
        metodo_pagamento: s.paymentMethod ?? '',
        valor: s.total.toFixed(2),
      })),
      ...appointments.map((a) => ({
        data: a.date.toISOString().split('T')[0],
        tipo: 'Consulta/Serviço',
        descricao: a.serviceType,
        metodo_pagamento: '',
        valor: (a.price ?? 0).toFixed(2),
      })),
    ].sort((a, b) => a.data.localeCompare(b.data));

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="resumo-financeiro.csv"');
    res.send('﻿' + csv);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório.' });
  }
});

// ── GET /reports/commissions.csv ──────────────────────────────────────────────

router.get('/commissions.csv', async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const { from, to } = req.query as Record<string, string>;

  try {
    const professionals = await prisma.user.findMany({
      where: { organizationId: orgId, commissionRate: { gt: 0 } },
      select: { id: true, name: true, role: true, commissionRate: true },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId: orgId,
        status: 'completed',
        professionalId: { in: professionals.map((p) => p.id) },
        price: { gt: 0 },
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      select: { id: true, date: true, price: true, serviceType: true, professionalId: true },
    });

    const rows = appointments.map((a) => {
      const prof = professionals.find((p) => p.id === a.professionalId);
      const rate = prof?.commissionRate ?? 0;
      const commission = ((a.price ?? 0) * rate) / 100;
      return {
        data: a.date.toISOString().split('T')[0],
        profissional: prof?.name ?? '—',
        funcao: prof?.role ?? '—',
        servico: a.serviceType,
        valor_servico: (a.price ?? 0).toFixed(2),
        percentual_comissao: `${rate}%`,
        comissao: commission.toFixed(2),
      };
    });

    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-comissoes.csv"');
    res.send('﻿' + csv);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar relatório de comissões.' });
  }
});

// ── GET /reports/commissions (JSON summary) ───────────────────────────────────

router.get('/commissions', async (req: AuthRequest, res: Response) => {
  const orgId = req.user?.organizationId;
  if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

  const { from, to } = req.query as Record<string, string>;

  try {
    const professionals = await prisma.user.findMany({
      where: { organizationId: orgId, commissionRate: { not: null } },
      select: { id: true, name: true, role: true, commissionRate: true },
    });

    const appointments = await prisma.appointment.findMany({
      where: {
        organizationId: orgId,
        status: 'completed',
        professionalId: { in: professionals.map((p) => p.id) },
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      select: { price: true, professionalId: true, serviceType: true, date: true },
    });

    const summary = professionals.map((prof) => {
      const profApts = appointments.filter((a) => a.professionalId === prof.id);
      const totalServices = profApts.reduce((s, a) => s + (a.price ?? 0), 0);
      const rate = prof.commissionRate ?? 0;
      const totalCommission = (totalServices * rate) / 100;
      return {
        professionalId: prof.id,
        name: prof.name,
        role: prof.role,
        commissionRate: rate,
        appointmentsCount: profApts.length,
        totalServices: +totalServices.toFixed(2),
        totalCommission: +totalCommission.toFixed(2),
      };
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular comissões.' });
  }
});

export default router;
