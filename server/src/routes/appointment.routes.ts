import { Router } from 'express';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../controllers/appointment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);
router.delete('/:id', deleteAppointment);

export default router;
