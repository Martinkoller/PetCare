import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
const subMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() - n, 1);
const fmtMonth = (d: Date) => d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

const rangeOf = (monthsAgo: number) => {
  const base = subMonths(new Date(), monthsAgo);
  return { gte: startOfMonth(base), lte: endOfMonth(base) };
};

export const getDashboardMetrics = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) return res.status(400).json({ error: 'No organization' });

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = new Date(todayStart.getTime() + 86_400_000);
    const monthStart = startOfMonth(now);
    const lastMonthRange = rangeOf(1);

    const [appointments, sales] = await Promise.all([
      prisma.appointment.findMany({
        where: { organizationId: orgId, status: { notIn: ['cancelled', 'archived'] } },
        select: { id: true, date: true, price: true, serviceType: true, petId: true },
      }),
      prisma.sale.findMany({
        where: { organizationId: orgId },
        select: { id: true, date: true, total: true, clientId: true },
      }),
    ]);

    // ── Revenue ──────────────────────────────────────────────────────────────

    const aptRevenue = (from: Date, to: Date) =>
      appointments
        .filter((a) => a.date >= from && a.date < to)
        .reduce((s, a) => s + (a.price ?? 0), 0);

    const saleRevenue = (from: Date, to: Date) =>
      sales
        .filter((s) => new Date(s.date) >= from && new Date(s.date) < to)
        .reduce((s, a) => s + (a.total ?? 0), 0);

    const lmEnd = new Date(lastMonthRange.lte.getTime() + 86_400_000);
    const revenue = {
      today: aptRevenue(todayStart, todayEnd) + saleRevenue(todayStart, todayEnd),
      thisMonth: aptRevenue(monthStart, now) + saleRevenue(monthStart, now),
      lastMonth: aptRevenue(lastMonthRange.gte, lmEnd) + saleRevenue(lastMonthRange.gte, lmEnd),
    };

    // ── Appointments by period ────────────────────────────────────────────────

    const week = new Date(now.getTime() - 7 * 86_400_000);
    const month30 = new Date(now.getTime() - 30 * 86_400_000);

    const appointmentsByPeriod = {
      today: appointments.filter((a) => a.date >= todayStart && a.date < todayEnd).length,
      thisWeek: appointments.filter((a) => a.date >= week).length,
      thisMonth: appointments.filter((a) => a.date >= month30).length,
    };

    // ── Popular services (top 5) ──────────────────────────────────────────────

    const serviceCounts: Record<string, { count: number; revenue: number }> = {};
    for (const a of appointments) {
      const key = a.serviceType;
      if (!serviceCounts[key]) serviceCounts[key] = { count: 0, revenue: 0 };
      serviceCounts[key].count++;
      serviceCounts[key].revenue += a.price ?? 0;
    }
    const serviceLabels: Record<string, string> = {
      grooming: 'Banho e Tosa',
      consultation: 'Consulta',
      boarding: 'Hospedagem',
      hospitalization: 'Internação',
    };
    const popularServices = Object.entries(serviceCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([type, data]) => ({ service: serviceLabels[type] ?? type, ...data }));

    // ── Appointments by weekday ───────────────────────────────────────────────

    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const weekdayCounts = Array(7).fill(0);
    for (const a of appointments) weekdayCounts[a.date.getDay()]++;
    const appointmentsByWeekday = dayNames.map((day, i) => ({ day, count: weekdayCounts[i] }));

    // ── Monthly growth (last 6 months) ───────────────────────────────────────

    const monthlyGrowth = Array.from({ length: 6 }, (_, i) => {
      const r = rangeOf(5 - i);
      const rEnd = new Date(r.lte.getTime() + 86_400_000);
      return {
        month: fmtMonth(r.gte),
        appointments: appointments.filter((a) => a.date >= r.gte && a.date <= r.lte).length,
        revenue: aptRevenue(r.gte, rEnd) + saleRevenue(r.gte, rEnd),
      };
    });

    // ── Active clients (top 5 by appointment count) ───────────────────────────

    const petClientMap = await prisma.pet.findMany({
      where: { organizationId: orgId },
      select: { id: true, clientId: true, client: { select: { name: true } } },
    });
    const petToClient: Record<string, { clientId: string; name: string }> = {};
    for (const p of petClientMap) petToClient[p.id] = { clientId: p.clientId, name: p.client.name };

    const clientCounts: Record<string, number> = {};
    for (const a of appointments) {
      const c = petToClient[a.petId];
      if (!c) continue;
      clientCounts[c.clientId] = (clientCounts[c.clientId] ?? 0) + 1;
    }
    const activeClients = Object.entries(clientCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([clientId, count]) => ({
        clientId,
        name: petToClient[Object.keys(petToClient).find((k) => petToClient[k].clientId === clientId) ?? '']?.name ?? '—',
        count,
      }));

    res.json({
      revenue,
      appointmentsByPeriod,
      popularServices,
      appointmentsByWeekday,
      monthlyGrowth,
      activeClients,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
};
