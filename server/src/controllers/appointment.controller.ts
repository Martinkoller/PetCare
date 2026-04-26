import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const META_PREFIX = '[WF]';

type WorkflowMeta = {
  clinicalStatus?: string;
  groomingStatus?: string;
  source?: string;
  clinicalMode?: string;
  anamnesis?: string;
  boardingMode?: string;
  criticismLevel?: string;
};

const extractWorkflowMeta = (notes?: string | null): { noteText: string | null; meta: WorkflowMeta } => {
  if (!notes) return { noteText: notes ?? null, meta: {} };

  if (!notes.startsWith(META_PREFIX)) {
    return { noteText: notes, meta: {} };
  }

  const firstLineBreak = notes.indexOf('\n');
  const firstLine = firstLineBreak >= 0 ? notes.slice(0, firstLineBreak) : notes;
  const remaining = firstLineBreak >= 0 ? notes.slice(firstLineBreak + 1) : '';

  try {
    const meta = JSON.parse(firstLine.replace(META_PREFIX, ''));
    return { noteText: remaining || null, meta };
  } catch {
    return { noteText: notes, meta: {} };
  }
};

const buildNotesWithMeta = (noteText?: string | null, meta?: WorkflowMeta): string | null => {
  const cleanMeta: WorkflowMeta = {};
  if (meta?.clinicalStatus) cleanMeta.clinicalStatus = meta.clinicalStatus;
  if (meta?.groomingStatus) cleanMeta.groomingStatus = meta.groomingStatus;
  if (meta?.source) cleanMeta.source = meta.source;
  if (meta?.clinicalMode) cleanMeta.clinicalMode = meta.clinicalMode;
  if (meta?.anamnesis) cleanMeta.anamnesis = meta.anamnesis;
  if (meta?.boardingMode) cleanMeta.boardingMode = meta.boardingMode;
  if (meta?.criticismLevel) cleanMeta.criticismLevel = meta.criticismLevel;

  const hasMeta = Object.keys(cleanMeta).length > 0;
  const cleanNote = (noteText ?? '').trim();

  if (!hasMeta) return cleanNote || null;
  return cleanNote ? `${META_PREFIX}${JSON.stringify(cleanMeta)}\n${cleanNote}` : `${META_PREFIX}${JSON.stringify(cleanMeta)}`;
};

// Serializa Date para string local sem offset (yyyy-MM-ddTHH:mm:ss)
// O frontend grava sem Z e espera receber sem Z para evitar conversão de timezone
const toLocalISO = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const normalizeAppointmentResponse = (appointment: any) => {
  const { noteText, meta } = extractWorkflowMeta(appointment.notes);
  return {
    ...appointment,
    date: appointment.date ? toLocalISO(appointment.date) : appointment.date,
    notes: noteText,
    clinicalStatus: meta.clinicalStatus,
    groomingStatus: meta.groomingStatus,
    source: meta.source,
    clinicalMode: meta.clinicalMode,
    anamnesis: meta.anamnesis,
    boardingMode: meta.boardingMode,
    criticismLevel: meta.criticismLevel,
    serviceItems: appointment.serviceItems ? JSON.parse(appointment.serviceItems) : [],
    returnDate: appointment.returnDate ? toLocalISO(appointment.returnDate) : undefined,
    startedAt: appointment.startedAt ? toLocalISO(appointment.startedAt) : undefined,
    currentStageStartedAt: appointment.currentStageStartedAt ? toLocalISO(appointment.currentStageStartedAt) : undefined,
    priority: appointment.priority ?? 'normal',
    appointmentType: appointment.appointmentType ?? 'scheduled',
    tutorNotified: appointment.tutorNotified ?? false,
    tutorNotifiedAt: appointment.tutorNotifiedAt ? toLocalISO(appointment.tutorNotifiedAt) : undefined,
    tutorNotifiedMessage: appointment.tutorNotifiedMessage ?? undefined,
    groomingPreferences: appointment.groomingPreferences ? JSON.parse(appointment.groomingPreferences) : [],
    priceAdjustment: appointment.priceAdjustment ?? 0,
    priceAdjustmentReason: appointment.priceAdjustmentReason ?? undefined,
    checkinArrivalTime: appointment.checkinArrivalTime ? toLocalISO(appointment.checkinArrivalTime) : undefined,
    checkinMatting: appointment.checkinMatting ?? undefined,
    checkinFleas: appointment.checkinFleas ?? undefined,
    checkinBehavior: appointment.checkinBehavior ?? undefined,
    checkinExtraAuthorized: appointment.checkinExtraAuthorized ?? undefined,
    checkinNotes: appointment.checkinNotes ?? undefined,
    stageHistory: appointment.stageHistory ? JSON.parse(appointment.stageHistory) : [],
  };
};

const pickAppointmentData = (body: any, currentNotes?: string | null) => {
  const parsedCurrent = extractWorkflowMeta(currentNotes ?? null);
  
  // Rule 10: Metadata preservation
  const meta: WorkflowMeta = {
    clinicalStatus: body.clinicalStatus ?? parsedCurrent.meta.clinicalStatus,
    groomingStatus: body.groomingStatus ?? parsedCurrent.meta.groomingStatus,
    source: body.source ?? parsedCurrent.meta.source,
    clinicalMode: body.clinicalMode ?? parsedCurrent.meta.clinicalMode,
    anamnesis: body.anamnesis ?? parsedCurrent.meta.anamnesis,
    boardingMode: body.boardingMode ?? parsedCurrent.meta.boardingMode,
    criticismLevel: body.criticismLevel ?? parsedCurrent.meta.criticismLevel,
  };

  // If service type changes, we might need to reset sub-statuses
  if (body.serviceType && body.serviceType !== parsedCurrent.meta.source) {
      // Logic for status reset if needed could go here
  }

  const noteText = body.notes !== undefined ? body.notes : parsedCurrent.noteText;

  const data: any = {
    ...(body.petId !== undefined ? { petId: body.petId } : {}),
    ...(body.professionalId !== undefined ? { professionalId: body.professionalId || null } : {}),
    ...(body.serviceType !== undefined ? { serviceType: body.serviceType } : {}),
    ...(body.duration !== undefined ? { duration: Number(body.duration) } : {}),
    ...(body.price !== undefined ? { price: Number(body.price) } : {}),
    ...(body.status !== undefined ? { status: body.status } : {}),
    ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
    ...(body.serviceItems !== undefined ? { serviceItems: JSON.stringify(body.serviceItems) } : {}),
    ...(body.returnDate !== undefined ? { returnDate: body.returnDate ? new Date(body.returnDate) : null } : {}),
    ...(body.startedAt !== undefined ? { startedAt: body.startedAt ? new Date(body.startedAt) : null } : {}),
    ...(body.currentStageStartedAt !== undefined ? { currentStageStartedAt: body.currentStageStartedAt ? new Date(body.currentStageStartedAt) : null } : {}),
    ...(body.priority !== undefined ? { priority: body.priority } : {}),
    ...(body.appointmentType !== undefined ? { appointmentType: body.appointmentType } : {}),
    ...(body.tutorNotified !== undefined ? { tutorNotified: Boolean(body.tutorNotified) } : {}),
    ...(body.tutorNotifiedAt !== undefined ? { tutorNotifiedAt: body.tutorNotifiedAt ? new Date(body.tutorNotifiedAt) : null } : {}),
    ...(body.tutorNotifiedMessage !== undefined ? { tutorNotifiedMessage: body.tutorNotifiedMessage || null } : {}),
    ...(body.groomingPreferences !== undefined ? { groomingPreferences: JSON.stringify(body.groomingPreferences) } : {}),
    ...(body.priceAdjustment !== undefined ? { priceAdjustment: Number(body.priceAdjustment) } : {}),
    ...(body.priceAdjustmentReason !== undefined ? { priceAdjustmentReason: body.priceAdjustmentReason || null } : {}),
    ...(body.checkinArrivalTime !== undefined ? { checkinArrivalTime: body.checkinArrivalTime ? new Date(body.checkinArrivalTime) : null } : {}),
    ...(body.checkinMatting !== undefined ? { checkinMatting: body.checkinMatting || null } : {}),
    ...(body.checkinFleas !== undefined ? { checkinFleas: Boolean(body.checkinFleas) } : {}),
    ...(body.checkinBehavior !== undefined ? { checkinBehavior: body.checkinBehavior || null } : {}),
    ...(body.checkinExtraAuthorized !== undefined ? { checkinExtraAuthorized: Boolean(body.checkinExtraAuthorized) } : {}),
    ...(body.checkinNotes !== undefined ? { checkinNotes: body.checkinNotes || null } : {}),
    ...(body.stageHistory !== undefined ? { stageHistory: JSON.stringify(body.stageHistory) } : {}),
    notes: buildNotesWithMeta(noteText, meta),
  };

  return data;
};

// --- Sync Helpers ---

const syncRelatedStays = async (appointment: any) => {
    // Boarding Sync
    if (appointment.serviceType === 'boarding') {
      const bStatusMap: Record<string, string> = {
        'scheduled': 'reserved',
        'confirmed': 'reserved',
        'checked_in': 'active',
        'in_progress': 'active',
        'checked_out': 'completed',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };

      try {
        const stay = await prisma.boardingStay.findUnique({ where: { appointmentId: appointment.id } });
        if (stay) {
           await prisma.boardingStay.update({
             where: { id: stay.id },
             data: {
               checkIn: appointment.date,
               checkOut: appointment.returnDate || stay.checkOut,
               status: bStatusMap[appointment.status] || stay.status
             }
           });
        } else {
            // Create if missing
            await prisma.boardingStay.create({
                data: {
                  organizationId: appointment.organizationId,
                  petId: appointment.petId,
                  appointmentId: appointment.id,
                  checkIn: appointment.date,
                  checkOut: appointment.returnDate || new Date(appointment.date.getTime() + 24 * 60 * 60 * 1000),
                  kennelNumber: 'TBD',
                  status: bStatusMap[appointment.status] || 'reserved',
                  dailyRate: 0,
                  totalPrice: 0,
                }
            });
        }
      } catch (err) {
        console.error('Failed to sync boarding stay', err);
      }
    }

    // Hospitalization Sync
    if (appointment.serviceType === 'hospitalization') {
      const hStatusMap: Record<string, string> = {
        'scheduled': 'admitted',
        'confirmed': 'admitted',
        'checked_in': 'treatment',
        'in_progress': 'treatment',
        'checked_out': 'discharged',
        'completed': 'discharged',
        'cancelled': 'discharged'
      };

      try {
        const stay = await prisma.hospitalizationStay.findUnique({ where: { appointmentId: appointment.id } });
        if (stay) {
           await prisma.hospitalizationStay.update({
             where: { id: stay.id },
             data: {
               checkIn: appointment.date,
               status: hStatusMap[appointment.status] || stay.status
             }
           });
        } else {
            // Create if missing
            await prisma.hospitalizationStay.create({
                data: {
                  organizationId: appointment.organizationId,
                  petId: appointment.petId,
                  appointmentId: appointment.id,
                  checkIn: appointment.date,
                  status: hStatusMap[appointment.status] || 'admitted',
                  reasonForAdmission: 'Sincronizado via Agenda',
                }
            });
        }
      } catch (err) {
        console.error('Failed to sync hospitalization stay', err);
      }
    }
};

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const { start, end, overlap } = req.query;

    const where: any = {
      status: { not: 'archived' }
    };

    const startDate = start && start !== 'undefined' && start !== 'null' ? new Date(start as string) : null;
    const endDate = end && end !== 'undefined' && end !== 'null' ? new Date(end as string) : null;

    if (overlap === 'true' && startDate && endDate) {
      // For boarding: fetch appointments whose date <= end AND (returnDate >= start OR returnDate is null)
      where.date = { lte: endDate };
      where.OR = [
        { returnDate: { gte: startDate } },
        { returnDate: null },
      ];
    } else if (startDate || endDate) {
      where.date = {};
      if (startDate && !isNaN(startDate.getTime())) where.date.gte = startDate;
      if (endDate && !isNaN(endDate.getTime())) where.date.lte = endDate;
      if (Object.keys(where.date).length === 0) delete where.date;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        pet: {
          include: { client: true }
        },
        boardingStay: true,
        hospitalizationStay: true,
      },
    });

    res.json(appointments.map(normalizeAppointmentResponse));
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

// --- Conflict Validation ---

type ConflictCheckParams = {
  organizationId: string;
  professionalId?: string | null;
  startAt: Date;
  durationMinutes: number;
  excludeId?: string;
};

type DaySchedule = {
  open: boolean
  start: string  // "HH:mm"
  end: string    // "HH:mm"
  breakStart?: string
  breakEnd?: string
  end2?: string
}

const WEEK_DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// Extrai hora e minuto de uma string ISO local sem sofrer conversão de timezone
// "2026-04-26T19:30:00" ou "2026-04-26T19:30:00.000Z" → { h: 19, m: 30, weekday: 0-6 }
const parseLocalDateTime = (isoStr: string) => {
  // Remove Z para tratar como local; o frontend sempre grava sem Z
  const s = isoStr.replace('Z', '')
  const [datePart, timePart] = s.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [h, m] = (timePart ?? '00:00').split(':').map(Number)
  // weekday sem timezone: usar Date.UTC para obter o dia correto
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return { h, m, weekday }
}

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

const getOrgBusinessHours = async (organizationId: string): Promise<Record<string, DaySchedule> | null> => {
  try {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    const settings = org?.settings ? JSON.parse(org.settings) : {};
    return settings.businessHours ?? null;
  } catch {
    return null;
  }
};

const validateConflict = async (params: ConflictCheckParams & { checkBusinessHours?: boolean; rawDateStr?: string }): Promise<string | null> => {
  const { organizationId, professionalId, startAt, durationMinutes, excludeId, checkBusinessHours = true, rawDateStr } = params;
  const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);

  if (checkBusinessHours) {
    const businessHours = await getOrgBusinessHours(organizationId);

    if (businessHours) {
      // Usa a string ISO original para extrair hora local sem conversão de timezone
      const isoStr = rawDateStr ?? startAt.toISOString()
      const { h, m, weekday } = parseLocalDateTime(isoStr)
      const dayKey = WEEK_DAYS[weekday]
      const day: DaySchedule | undefined = businessHours[dayKey]

      if (!day || !day.open) {
        return `Estabelecimento fechado neste dia da semana.`
      }

      const startMin = h * 60 + m
      const endMin = startMin + durationMinutes

      const periodStart = toMinutes(day.start)
      const periodEnd = toMinutes(day.end2 ?? day.end)

      if (startMin < periodStart || endMin > periodEnd) {
        return `Horário fora do expediente (${day.start}–${day.end2 ?? day.end}).`
      }
    }
    // Se não há businessHours configurado, não bloqueia
  }

  // Only check conflict by professional when one is assigned
  if (!professionalId) return null;

  const conflicting = await prisma.appointment.findFirst({
    where: {
      organizationId,
      professionalId,
      status: { notIn: ['cancelled', 'archived'] },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      AND: [
        { date: { lt: endAt } },
        // date + duration > startAt — computed via raw or JS post-filter below
      ],
    },
  });

  if (!conflicting) return null;

  // Fine-grained overlap check (date + duration overlap)
  const conflictEnd = new Date(conflicting.date.getTime() + (conflicting.duration ?? 30) * 60_000);
  const overlaps = conflicting.date < endAt && conflictEnd > startAt;

  if (overlaps) {
    return `Profissional já tem agendamento das ${conflicting.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às ${conflictEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`;
  }

  return null;
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.query.notes ? req.query : req.body;
    const data = pickAppointmentData(body);

    const organizationId = req.user?.organizationId;
    if (!organizationId) return res.status(400).json({ error: 'No organization' });

    data.organizationId = organizationId;

    if (data.date) {
      const conflict = await validateConflict({
        organizationId,
        professionalId: data.professionalId,
        startAt: new Date(data.date),
        durationMinutes: data.duration ?? 30,
        rawDateStr: body.date,
      });
      if (conflict) return res.status(409).json({ error: conflict });
    }

    const appointment = await prisma.appointment.create({ data });
    await syncRelatedStays(appointment);

    res.status(201).json(normalizeAppointmentResponse(appointment));
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Appointment not found' });

    const data = pickAppointmentData(req.body, existing.notes);

    // Only validate scheduling conflicts when date, duration or professional actually differ from existing
    const newDate = data.date ? new Date(data.date) : null;
    const newDuration = data.duration ?? existing.duration ?? 30;
    const newProfessionalId = 'professionalId' in data ? data.professionalId : existing.professionalId;

    const dateChanged = newDate && Math.abs(newDate.getTime() - existing.date.getTime()) > 60_000;
    const durationChanged = newDuration !== (existing.duration ?? 30);
    const professionalChanged = newProfessionalId !== existing.professionalId;

    if (dateChanged || durationChanged || professionalChanged) {
      const conflict = await validateConflict({
        organizationId: existing.organizationId,
        professionalId: newProfessionalId,
        startAt: newDate ?? existing.date,
        durationMinutes: newDuration,
        excludeId: id,
        checkBusinessHours: false,
      });
      if (conflict) return res.status(409).json({ error: conflict });
    }

    const appointment = await prisma.appointment.update({ where: { id }, data });
    await syncRelatedStays(appointment);

    res.json(normalizeAppointmentResponse(appointment));
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const bStay = await prisma.boardingStay.findUnique({ where: { appointmentId: id as string } });
    if (bStay) {
      await prisma.boardingStay.update({ 
        where: { id: bStay.id },
        data: { status: 'archived' }
      });
    }

    const hStay = await prisma.hospitalizationStay.findUnique({ where: { appointmentId: id as string } });
    if (hStay) {
      await prisma.hospitalizationStay.update({
        where: { id: hStay.id },
        data: { status: 'discharged' } // Or another archived status if exists
      });
    }
    
    await prisma.appointment.update({ 
      where: { id: id as string },
      data: { status: 'archived' }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
};
