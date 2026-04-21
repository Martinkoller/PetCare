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
});

export const getBoardings = async (req: AuthRequest, res: Response) => {
  try {
    const boardings = await prisma.boardingStay.findMany({
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

    const appointment = await prisma.appointment.create({
      data: {
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
  const { id } = req.params;
  try {
    const data = pickBoardingData(req.body) as any;

    const boarding = await prisma.boardingStay.update({
      where: { id: id as string },
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

    res.json(boarding);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update boarding' });
  }
};


export const deleteBoarding = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const stay = await prisma.boardingStay.findUnique({ where: { id: id as string } });
    if (stay?.appointmentId) {
       await prisma.appointment.delete({ where: { id: stay.appointmentId } });
    }
    
    await prisma.boardingService.deleteMany({ where: { boardingId: id as string } });
    await prisma.boardingStay.delete({ where: { id: id as string } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete boarding' });
  }
};

export const addBoardingService = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const item = await prisma.boardingService.create({
      data: {
        boardingId: id as string,
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

