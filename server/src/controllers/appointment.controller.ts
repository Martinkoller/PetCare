import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const META_PREFIX = '[WF]';

type WorkflowMeta = {
  clinicalStatus?: string;
  groomingStatus?: string;
  source?: string;
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
  const cleanMeta: WorkflowMeta = {
    ...(meta?.clinicalStatus ? { clinicalStatus: meta.clinicalStatus } : {}),
    ...(meta?.groomingStatus ? { groomingStatus: meta.groomingStatus } : {}),
    ...(meta?.source ? { source: meta.source } : {}),
  };

  const hasMeta = Object.keys(cleanMeta).length > 0;
  const cleanNote = noteText ?? '';

  if (!hasMeta) return cleanNote || null;
  return cleanNote ? `${META_PREFIX}${JSON.stringify(cleanMeta)}\n${cleanNote}` : `${META_PREFIX}${JSON.stringify(cleanMeta)}`;
};

const normalizeAppointmentResponse = (appointment: any) => {
  const { noteText, meta } = extractWorkflowMeta(appointment.notes);
  return {
    ...appointment,
    notes: noteText,
    clinicalStatus: meta.clinicalStatus,
    groomingStatus: meta.groomingStatus,
    source: meta.source,
    serviceItems: appointment.serviceItems ? JSON.parse(appointment.serviceItems) : [],
    returnDate: appointment.returnDate ? appointment.returnDate.toISOString() : undefined,
    startedAt: appointment.startedAt ? appointment.startedAt.toISOString() : undefined,
    currentStageStartedAt: appointment.currentStageStartedAt ? appointment.currentStageStartedAt.toISOString() : undefined,
    priority: appointment.priority ?? 'normal',
    appointmentType: appointment.appointmentType ?? 'scheduled',
    tutorNotified: appointment.tutorNotified ?? false,
  };
};

const pickAppointmentData = (body: any, currentNotes?: string | null) => {
  const parsedCurrent = extractWorkflowMeta(currentNotes ?? null);
  const noteText = body.notes !== undefined ? body.notes : parsedCurrent.noteText;
  const meta: WorkflowMeta = {
    clinicalStatus:
      body.clinicalStatus !== undefined
        ? body.clinicalStatus
        : parsedCurrent.meta.clinicalStatus,
    groomingStatus:
      body.groomingStatus !== undefined
        ? body.groomingStatus
        : parsedCurrent.meta.groomingStatus,
    source: body.source !== undefined ? body.source : parsedCurrent.meta.source,
  };

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
    notes: buildNotesWithMeta(noteText, meta),
  };

  if (body.notes === undefined && !meta.clinicalStatus && !meta.groomingStatus && !meta.source) {
    delete data.notes;
  }

  return data;
};

export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { not: 'archived' }
      },
      orderBy: { date: 'asc' },
      include: {
        pet: {
          include: { client: true }
        }
      },
    });

    res.json(appointments.map(normalizeAppointmentResponse));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const data = pickAppointmentData(req.body);

    const appointment = await prisma.appointment.create({
      data,
    });

    if (appointment.serviceType === 'boarding') {
      try {
        await prisma.boardingStay.create({
          data: {
            petId: appointment.petId,
            appointmentId: appointment.id,
            checkIn: appointment.date,
            checkOut: appointment.returnDate || new Date(appointment.date.getTime() + 24 * 60 * 60 * 1000),
            kennelNumber: 'TBD',
            status: 'reserved',
            dailyRate: 0,
            totalPrice: 0,
          }
        });
      } catch (err) {
        console.error('Failed to create linked boarding stay', err);
      }
    }

    res.status(201).json(normalizeAppointmentResponse(appointment));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const existing = await prisma.appointment.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const data = pickAppointmentData(req.body, existing.notes);

    const appointment = await prisma.appointment.update({
      where: { id: id as string },
      data,
    });

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
        }
      } catch (err) {
        console.error('Failed to update boarding stay', err);
      }
    }

    res.json(normalizeAppointmentResponse(appointment));
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const stay = await prisma.boardingStay.findUnique({ where: { appointmentId: id as string } });
    if (stay) {
      await prisma.boardingStay.update({ 
        where: { id: stay.id },
        data: { status: 'archived' }
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
