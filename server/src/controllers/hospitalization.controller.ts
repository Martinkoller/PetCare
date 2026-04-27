import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const ACTIVE_STATUSES = ['admitted', 'under_observation', 'treatment', 'critical', 'ready_for_discharge'];

const DISCHARGE_TYPE_TO_STATUS: Record<string, string> = {
  discharge: 'discharged',
  transfer: 'transferred',
  death: 'deceased',
  cancelled: 'cancelled',
};

function mapStay(stay: any) {
  return {
    ...stay,
    admittedAt: stay.admittedAt ?? stay.checkIn,
    pet: stay.pet
      ? {
          id: stay.pet.id,
          name: stay.pet.name,
          species: stay.pet.species,
          breed: stay.pet.breed,
          clientId: stay.pet.clientId,
        }
      : undefined,
    logs: (stay.logs ?? []).map(mapLog),
  };
}

function mapLog(log: any) {
  let clinical: Record<string, any> | undefined;
  if (log.clinicalChecks) {
    try { clinical = JSON.parse(log.clinicalChecks); } catch {}
  }
  return {
    id: log.id,
    stayId: log.hospitalizationId,
    petId: log.petId,
    type: log.type,
    createdAt: log.createdAt,
    eventAt: log.eventAt,
    createdById: log.createdById,
    createdByName: log.createdByName,
    createdByRole: log.createdByRole,
    vitals: {
      heartRate: log.heartRate ?? undefined,
      respiratoryRate: log.respiratoryRate ?? undefined,
      temperature: log.temperature ?? undefined,
      mucousMembranes: log.mucousMembranes ?? undefined,
      capillaryRefillTime: log.capillaryRefillTime ?? undefined,
      hydrationLevel: log.hydrationLevel ?? undefined,
      consciousness: log.consciousness ?? undefined,
      painScore: log.painScore ?? undefined,
    },
    clinical,
    notes: log.doctorNotes ?? log.notes,
    conduct: log.conduct ?? undefined,
    statusAfter: log.statusAfter ?? undefined,
  };
}

export const getHospitalizationStays = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId!;
    const stays = await prisma.hospitalizationStay.findMany({
      where: {
        organizationId: orgId,
        status: { in: ACTIVE_STATUSES },
      },
      include: {
        pet: true,
        logs: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { checkIn: 'desc' },
    });
    res.json(stays.map(mapStay));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch hospitalization stays' });
  }
};

export const createHospitalizationStay = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId!;
    const {
      petId,
      reasonForAdmission,
      kennelNumber,
      origin,
      attendingVetName,
      weightAtAdmission,
      triageLevel,
      presumptiveDiagnosis,
      initialNotes,
      admittedAt,
      status,
      appointmentId,
    } = req.body;

    const admissionDate = admittedAt ? new Date(admittedAt) : new Date();

    const stay = await prisma.hospitalizationStay.create({
      data: {
        organizationId: orgId,
        petId,
        reasonForAdmission,
        kennelNumber: kennelNumber || 'TBD',
        status: status || 'admitted',
        origin: origin || null,
        attendingVetName: attendingVetName || null,
        weightAtAdmission: weightAtAdmission ? parseFloat(weightAtAdmission) : null,
        triageLevel: triageLevel || null,
        presumptiveDiagnosis: presumptiveDiagnosis || null,
        initialNotes: initialNotes || null,
        admittedAt: admissionDate,
        checkIn: admissionDate,
        appointmentId: appointmentId || null,
        veterinarianId: req.user?.id,
      } as any,
      include: { pet: true, logs: true },
    });

    // Create linked appointment if not provided
    if (!appointmentId) {
      try {
        const appointment = await prisma.appointment.create({
          data: {
            organizationId: orgId,
            petId,
            serviceType: 'hospitalization',
            date: admissionDate,
            status: 'checked_in',
            notes: `[INTERNAÇÃO] ${reasonForAdmission || ''}`,
            professionalId: req.user?.id,
          },
        });
        await prisma.hospitalizationStay.update({
          where: { id: stay.id },
          data: { appointmentId: appointment.id },
        });
        (stay as any).appointmentId = appointment.id;
      } catch (err) {
        console.error('Failed to create linked appointment', err);
      }
    }

    res.status(201).json(mapStay(stay));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create hospitalization stay' });
  }
};

export const addHospitalizationLog = async (req: AuthRequest, res: Response) => {
  try {
    const stayId = req.params.stayId as string;
    const { petId, type, eventAt, vitals, clinical, notes, conduct, statusAfter } = req.body;

    const log = await prisma.hospitalizationLog.create({
      data: {
        hospitalizationId: stayId,
        petId: petId || '',
        type: type || 'medical_evolution',
        eventAt: eventAt ? new Date(eventAt) : new Date(),
        heartRate: vitals?.heartRate ? parseInt(vitals.heartRate) : null,
        temperature: vitals?.temperature ? parseFloat(vitals.temperature) : null,
        respiratoryRate: vitals?.respiratoryRate ? parseInt(vitals.respiratoryRate) : null,
        painScore: vitals?.painScore != null ? parseInt(vitals.painScore) : null,
        mucousMembranes: vitals?.mucousMembranes || null,
        capillaryRefillTime: vitals?.capillaryRefillTime || null,
        hydrationLevel: vitals?.hydrationLevel || null,
        consciousness: vitals?.consciousness || null,
        clinicalChecks: clinical ? JSON.stringify(clinical) : null,
        doctorNotes: notes || '',
        conduct: conduct || null,
        statusAfter: statusAfter || null,
        createdById: req.user?.id,
        createdByName: (req.user as any)?.name || null,
      } as any,
    });

    if (statusAfter) {
      await prisma.hospitalizationStay.update({
        where: { id: stayId },
        data: { status: statusAfter },
      });
    }

    const updatedStay = await prisma.hospitalizationStay.findUnique({
      where: { id: stayId },
      include: { pet: true, logs: { orderBy: { createdAt: 'desc' } } },
    });

    res.status(201).json(mapStay(updatedStay));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add hospitalization log' });
  }
};

export const dischargeHospitalizationStay = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      dischargeType,
      finalDiagnosis,
      dischargeSummary,
      dischargeCondition,
      dischargeInstructions,
      dischargeMedications,
      returnRecommendation,
      administrativeNotes,
      dischargeAt,
    } = req.body;

    const newStatus = DISCHARGE_TYPE_TO_STATUS[dischargeType] || 'discharged';
    const dischargeDate = dischargeAt ? new Date(dischargeAt) : new Date();

    const stay = await prisma.hospitalizationStay.update({
      where: { id },
      data: {
        status: newStatus,
        dischargeType: dischargeType || null,
        dischargeCondition: dischargeCondition || null,
        finalDiagnosis: finalDiagnosis || null,
        dischargeSummary: dischargeSummary || null,
        dischargeInstructions: dischargeInstructions || null,
        dischargeMedications: dischargeMedications || null,
        returnRecommendation: returnRecommendation || null,
        administrativeNotes: administrativeNotes || null,
        dischargeAt: dischargeDate,
        checkOut: dischargeDate,
      } as any,
      include: { pet: true, logs: true },
    });

    if (stay.appointmentId) {
      const appointmentStatusMap: Record<string, string> = {
        discharged: 'completed',
        transferred: 'completed',
        deceased: 'cancelled',
        cancelled: 'cancelled',
      };
      await prisma.appointment.update({
        where: { id: stay.appointmentId },
        data: { status: appointmentStatusMap[newStatus] || 'completed' },
      });
    }

    try {
      await prisma.medicalRecord.create({
        data: {
          organizationId: req.user!.organizationId!,
          petId: stay.petId,
          date: dischargeDate,
          description: `[ALTA HOSPITALAR] ${dischargeSummary || ''}`,
          treatment: finalDiagnosis || stay.reasonForAdmission || '',
          veterinarianId: req.user?.id || 'unknown',
        },
      });
    } catch (err) {
      console.error('Failed to create medical record on discharge', err);
    }

    res.json(mapStay(stay));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
};

export const updateHospitalizationStayStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!ACTIVE_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const stay = await prisma.hospitalizationStay.update({
      where: { id },
      data: { status },
      include: { pet: true, logs: true },
    });

    res.json(mapStay(stay));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update stay status' });
  }
};
