import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getHospitalizationStays = async (req: AuthRequest, res: Response) => {
  try {
    const stays = await prisma.hospitalizationStay.findMany({
      where: {
        status: { in: ['admitted', 'treatment'] }
      },
      include: {
        pet: {
          include: { client: true }
        },
        appointment: true,
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
      orderBy: { checkIn: 'desc' }
    });
    res.json(stays);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hospitalization stays' });
  }
};

export const createHospitalizationStay = async (req: AuthRequest, res: Response) => {
  try {
    const { petId, reasonForAdmission, kennelNumber, veterinarianId, expectedDischargeDate } = req.body;
    
    const stay = await prisma.hospitalizationStay.create({
      data: {
        petId,
        reasonForAdmission,
        kennelNumber: kennelNumber || 'TBD',
        status: 'admitted',
        veterinarianId: veterinarianId || req.user?.id,
        expectedDischargeDate: expectedDischargeDate ? new Date(expectedDischargeDate) : null,
      },
      include: {
        pet: { include: { client: true } }
      }
    });

    // Create a linked appointment to satisfy Rule 14 (Agenda-first)
    try {
      const appointment = await prisma.appointment.create({
        data: {
          petId: stay.petId,
          serviceType: 'hospitalization',
          date: stay.checkIn,
          status: 'checked_in', // Already admitted
          notes: `[INTERNAÇÃO] ${stay.reasonForAdmission || ''}`,
          professionalId: stay.veterinarianId,
        }
      });

      // Update stay with appointmentId
      await prisma.hospitalizationStay.update({
        where: { id: stay.id },
        data: { appointmentId: appointment.id }
      });
    } catch (err) {
      console.error('Failed to create linked appointment for manual hospitalization', err);
    }

    res.status(201).json(stay);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create hospitalization stay' });
  }
};

export const addHospitalizationLog = async (req: AuthRequest, res: Response) => {
  try {
    const stayId = req.params.stayId as string;
    const { vitals, notes } = req.body;

    const log = await prisma.hospitalizationLog.create({
      data: {
        hospitalizationId: stayId,
        heartRate: vitals?.heartRate ? parseInt(vitals.heartRate) : null,
        temperature: vitals?.temperature ? parseFloat(vitals.temperature) : null,
        doctorNotes: notes || '',
        type: 'vitals'
      }
    });

    // Update stay status to 'treatment' if it was just 'admitted'
    await prisma.hospitalizationStay.update({
      where: { id: stayId },
      data: { status: 'treatment' }
    });

    res.status(201).json(log);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add hospitalization log' });
  }
};

export const dischargeHospitalizationStay = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, finalObservations, petId } = req.body; 

    const stay = await prisma.hospitalizationStay.update({
      where: { id },
      data: {
        status,
        checkOut: new Date()
      }
    });

    if (stay.appointmentId) {
      const aStatusMap: Record<string, string> = {
        'discharged': 'completed',
        'deceased': 'cancelled'
      };

      await prisma.appointment.update({
        where: { id: stay.appointmentId },
        data: {
          status: aStatusMap[status] || 'completed'
        }
      });
    }

    // Create a MedicalRecord summary as requested by user
    await prisma.medicalRecord.create({
      data: {
        petId,
        date: new Date(),
        description: `[ALTA HOSPITALAR] Motivo: ${stay.reasonForAdmission || 'Não informado'}\nObservações: ${finalObservations || 'Sem observações'}`,
        treatment: `Internação encerrada com status: ${status}`,
        veterinarianId: req.user?.id || 'unknown',
      }
    });

    res.json(stay);
  } catch (error) {
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
};
