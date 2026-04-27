import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const normalizePet = (pet: any) => {
    const vaccinations = (pet.vaccinations || []).map((v: any) => ({
        id: v.id,
        name: v.name,
        batch: v.batch,
        dateAdministered: v.date,
        nextDoseDate: v.nextDueDate,
        veterinarianId: 'unknown',
    }));

    const medicalHistory = (pet.medicalHistory || []).map((m: any) => ({
        id: m.id,
        date: m.date,
        veterinarianId: m.veterinarianId || 'unknown',
        complaint: m.description || '',
        history: '',
        subjective: '',
        objective: '',
        assessment: m.diagnosis || '',
        plan: m.treatment || '',
        prescriptions: [],
        exams: [],
        vaccines: [],
    }));

    return {
        id: pet.id,
        clientId: pet.clientId,
        name: pet.name,
        species: (pet.species || 'other').toLowerCase(),
        breed: pet.breed || '',
        age: pet.age || 0,
        weight: pet.weight || 0,
        gender: (pet.gender || 'male').toLowerCase(),
        birthDate: pet.birthDate,
        avatar: pet.avatar || undefined,
        notes: pet.notes || undefined,
        isCastrated: pet.isCastrated ?? false,
        clinicalAlert: pet.clinicalAlert || '',
        vaccinations,
        medicalHistory,
    };
};

const pickPetData = (body: any) => ({
    ...(body.clientId !== undefined ? { clientId: body.clientId } : {}),
    ...(body.name !== undefined ? { name: body.name } : {}),
    ...(body.species !== undefined ? { species: body.species } : {}),
    ...(body.breed !== undefined ? { breed: body.breed || null } : {}),
    ...(body.age !== undefined ? { age: Number(body.age) } : {}),
    ...(body.gender !== undefined ? { gender: body.gender || null } : {}),
    ...(body.birthDate !== undefined ? { birthDate: body.birthDate ? new Date(body.birthDate) : null } : {}),
    ...(body.weight !== undefined ? { weight: Number(body.weight) } : {}),
    ...(body.avatar !== undefined ? { avatar: body.avatar || null } : {}),
    ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    ...(body.size !== undefined ? { size: body.size || null } : {}),
    ...(body.isCastrated !== undefined ? { isCastrated: !!body.isCastrated } : {}),
    ...(body.clinicalAlert !== undefined ? { clinicalAlert: body.clinicalAlert || null } : {}),
});

export const getPets = async (req: AuthRequest, res: Response) => {
    try {
        const pets = await prisma.pet.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                client: true,
                vaccinations: { orderBy: { date: 'desc' } },
                medicalHistory: { orderBy: { date: 'desc' } },
            },
        });
        res.json(pets.map(normalizePet));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pets' });
    }
};

export const createPet = async (req: AuthRequest, res: Response) => {
    try {
        const data = pickPetData(req.body) as any;

        const pet = await prisma.pet.create({
            data,
            include: {
                client: true,
                vaccinations: true,
                medicalHistory: true,
            },
        });
        res.status(201).json(normalizePet(pet));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create pet' });
    }
};

export const updatePet = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        const data = pickPetData(req.body) as any;

        const pet = await prisma.pet.update({
            where: { id: id as string },
            data,
            include: {
                client: true,
                vaccinations: true,
                medicalHistory: true,
            },
        });
        res.json(normalizePet(pet));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update pet' });
    }
};

export const deletePet = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    try {
        await prisma.pet.delete({ where: { id: id as string } });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete pet' });
    }
};

export const addMedicalRecord = async (req: AuthRequest, res: Response) => {
    const petId = req.params.id as string;

    try {
        const record = await prisma.medicalRecord.create({
            data: {
                organizationId: req.user!.organizationId!,
                petId,
                date: req.body.date ? new Date(req.body.date) : new Date(),
                description:
                    req.body.complaint ||
                    req.body.subjective ||
                    req.body.description ||
                    'Registro clinico',
                diagnosis: req.body.assessment || req.body.diagnosis || null,
                treatment: req.body.plan || req.body.treatment || null,
                veterinarianId: req.body.veterinarianId || null,
            },
        });

        res.status(201).json({
            id: record.id,
            date: record.date,
            veterinarianId: record.veterinarianId || 'unknown',
            complaint: record.description,
            history: '',
            subjective: '',
            objective: '',
            assessment: record.diagnosis || '',
            plan: record.treatment || '',
            prescriptions: [],
            exams: [],
            vaccines: [],
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add medical record' });
    }
};

export const getPetHistory = async (req: AuthRequest, res: Response) => {
    const petId = req.params.id as string;
    try {
        const [appointments, boardings, hospitalizations, medicalRecords, vaccinations] = await Promise.all([
            prisma.appointment.findMany({
                where: { petId, status: { not: 'archived' } },
                orderBy: { date: 'desc' },
            }),
            prisma.boardingStay.findMany({
                where: { petId },
                include: { services: true },
                orderBy: { checkIn: 'desc' },
            }),
            prisma.hospitalizationStay.findMany({
                where: { petId },
                orderBy: { checkIn: 'desc' },
            }),
            prisma.medicalRecord.findMany({
                where: { petId },
                orderBy: { date: 'desc' },
            }),
            prisma.vaccination.findMany({
                where: { petId },
                orderBy: { date: 'desc' },
            }),
        ]);

        res.json({
            appointments: appointments.map((a) => ({
                id: a.id,
                date: a.date,
                serviceType: a.serviceType,
                status: a.status,
                notes: a.notes,
                price: a.price,
            })),
            boardings: boardings.map((b) => ({
                id: b.id,
                checkIn: b.checkIn,
                checkOut: b.checkOut,
                status: b.status,
                kennelNumber: b.kennelNumber,
                totalPrice: b.totalPrice,
                notes: b.notes,
                services: (b.services || []).map((s: any) => ({ name: s.name, totalPrice: s.totalPrice })),
            })),
            hospitalizations: hospitalizations.map((h) => ({
                id: h.id,
                admittedAt: (h as any).admittedAt ?? h.checkIn,
                dischargeAt: (h as any).dischargeAt ?? h.checkOut,
                status: h.status,
                kennelNumber: h.kennelNumber,
                reasonForAdmission: h.reasonForAdmission,
                finalDiagnosis: (h as any).finalDiagnosis,
                dischargeType: (h as any).dischargeType,
            })),
            medicalRecords: medicalRecords.map((m) => ({
                id: m.id,
                date: m.date,
                description: m.description,
                diagnosis: m.diagnosis,
                treatment: m.treatment,
            })),
            vaccinations: vaccinations.map((v) => ({
                id: v.id,
                name: v.name,
                date: v.date,
                nextDueDate: v.nextDueDate,
                batch: v.batch,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch pet history' });
    }
};

export const addVaccination = async (req: AuthRequest, res: Response) => {
    const petId = req.params.id as string;

    try {
        const vaccination = await prisma.vaccination.create({
            data: {
                organizationId: req.user!.organizationId!,
                petId,
                name: req.body.name,
                batch: req.body.batch || null,
                date: req.body.dateAdministered
                    ? new Date(req.body.dateAdministered)
                    : new Date(),
                nextDueDate: req.body.nextDoseDate
                    ? new Date(req.body.nextDoseDate)
                    : null,
            },
        });

        res.status(201).json({
            id: vaccination.id,
            name: vaccination.name,
            batch: vaccination.batch,
            dateAdministered: vaccination.date,
            nextDoseDate: vaccination.nextDueDate,
            veterinarianId: req.body.veterinarianId || 'unknown',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add vaccination' });
    }
};
