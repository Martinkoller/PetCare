import { Response } from 'express';
import { prisma } from '../index';
import { AuthRequest } from '../middlewares/auth.middleware';

const pickBoardingData = (body: any) => ({
  ...(body.petId !== undefined ? { petId: body.petId } : {}),
  ...(body.checkIn !== undefined ? { checkIn: new Date(body.checkIn) } : {}),
  ...(body.checkOut !== undefined ? { checkOut: new Date(body.checkOut) } : {}),
  ...(body.actualCheckIn !== undefined
    ? { actualCheckIn: body.actualCheckIn ? new Date(body.actualCheckIn) : null }
    : {}),
  ...(body.actualCheckOut !== undefined
    ? { actualCheckOut: body.actualCheckOut ? new Date(body.actualCheckOut) : null }
    : {}),
  ...(body.kennelNumber !== undefined ? { kennelNumber: String(body.kennelNumber) } : {}),
  ...(body.status !== undefined ? { status: body.status } : {}),
  ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
  ...(body.dailyRate !== undefined ? { dailyRate: Number(body.dailyRate) } : {}),
  ...(body.totalPrice !== undefined ? { totalPrice: Number(body.totalPrice) } : {}),
  ...(body.specialInstructions !== undefined
    ? { specialInstructions: body.specialInstructions || null }
    : {}),
  ...(body.belongings !== undefined ? { belongings: body.belongings || null } : {}),
  ...(body.observations !== undefined ? { observations: body.observations || null } : {}),
  // Campos de admissão
  ...(body.vaccinationStatus !== undefined ? { vaccinationStatus: body.vaccinationStatus || null } : {}),
  ...(body.feedingInstructions !== undefined ? { feedingInstructions: body.feedingInstructions || null } : {}),
  ...(body.behaviorNotes !== undefined ? { behaviorNotes: body.behaviorNotes || null } : {}),
  ...(body.emergencyVetContact !== undefined ? { emergencyVetContact: body.emergencyVetContact || null } : {}),
  ...(body.paymentMethod !== undefined ? { paymentMethod: body.paymentMethod || null } : {}),
});

export const getBoardings = async (req: AuthRequest, res: Response) => {
  try {
    const boardings = await prisma.boardingStay.findMany({
      where: { organizationId: req.user!.organizationId! },
      orderBy: { checkIn: 'desc' },
      include: { services: true },
    });
    res.json(boardings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch boardings' });
  }
};

export const createBoarding = async (req: AuthRequest, res: Response) => {
  try {
    const data = pickBoardingData(req.body) as any;

    const orgId = req.user!.organizationId!;
    const appointment = await prisma.appointment.create({
      data: {
        organizationId: orgId,
        petId: data.petId,
        serviceType: 'boarding',
        status: data.status === 'active' ? 'checked_in' : 'scheduled',
        date: data.checkIn || new Date(),
        returnDate: data.checkOut || null,
        duration: 0,
        price: 0,
        notes: data.notes
      }
    });

    data.appointmentId = appointment.id;
    data.organizationId = orgId;

    const boarding = await prisma.boardingStay.create({
      data,
      include: { services: true },
    });
    res.status(201).json(boarding);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create boarding' });
  }
};

export const updateBoarding = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const data = pickBoardingData(req.body) as any;

    const boarding = await prisma.boardingStay.update({
      where: { id },
      data,
      include: { services: true }
    });

    if (boarding.appointmentId) {
      const aStatusMap: Record<string, string> = {
        'reserved': 'confirmed',
        'active': 'in_progress',
        'completed': 'completed',
        'cancelled': 'cancelled'
      };

      try {
        await prisma.appointment.update({
          where: { id: boarding.appointmentId },
          data: {
            status: aStatusMap[boarding.status] || 'scheduled',
            date: boarding.checkIn,
            returnDate: boarding.checkOut,
            notes: boarding.notes
          }
        });
      } catch (err) {
        console.error('Failed to sync appointment status', err);
      }
    }

    if (boarding.status === 'completed' && (boarding as any).totalPrice) {
      try {
        const [pet, boardingServices] = await Promise.all([
          prisma.pet.findUnique({ where: { id: boarding.petId }, select: { clientId: true } }),
          prisma.boardingService.findMany({ where: { boardingId: boarding.id } }),
        ]);

        const servicesTotal = boardingServices.reduce((s: number, i: any) => s + i.totalPrice, 0);
        const stayTotal = Math.max(0, (boarding as any).totalPrice - servicesTotal);

        const saleItems = [
          { productName: 'Hospedagem', quantity: 1, unitPrice: stayTotal, total: stayTotal },
          ...boardingServices.map((s: any) => ({
            serviceId: s.serviceId || null,
            productId: s.productId || null,
            productName: s.name,
            quantity: s.quantity,
            unitPrice: s.unitPrice,
            total: s.totalPrice,
            batchId: s.batchId || null,
          })),
        ];

        await prisma.sale.create({
          data: {
            organizationId: req.user!.organizationId!,
            clientId: pet?.clientId || null,
            petId: boarding.petId,
            total: (boarding as any).totalPrice,
            status: 'completed',
            paymentMethod: (boarding as any).paymentMethod || null,
            notes: `Hospedagem #${boarding.id.slice(0, 8)}`,
            items: { create: saleItems },
          },
        });
      } catch (err) {
        console.error('[boarding] Failed to create sale on checkout:', err);
      }
    }

    res.json(boarding);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update boarding' });
  }
};


export const deleteBoarding = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const stay = await prisma.boardingStay.findUnique({ where: { id } });
    if (stay?.appointmentId) {
      await prisma.appointment.delete({ where: { id: stay.appointmentId } });
    }
    // BoardingService e BoardingDailyLog têm onDelete: Cascade — deletados automaticamente
    await prisma.boardingStay.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete boarding' });
  }
};

export const addBoardingService = async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  try {
    const item = await prisma.boardingService.create({
      data: {
        boardingId: id,
        serviceId: req.body.serviceId || null,
        productId: req.body.productId || null,
        batchId: req.body.batchId || null,
        name: req.body.name,
        quantity: Number(req.body.quantity || 0),
        unitPrice: Number(req.body.unitPrice || 0),
        totalPrice: Number(req.body.totalPrice || 0),
      }
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add service to boarding' });
  }
}

