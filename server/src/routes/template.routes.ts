import { Router } from 'express';
import { getAppointmentTemplates, createAppointmentTemplate, updateAppointmentTemplate, deleteAppointmentTemplate } from '../controllers/template.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getAppointmentTemplates);
router.post('/', createAppointmentTemplate);
router.put('/:id', updateAppointmentTemplate);
router.delete('/:id', deleteAppointmentTemplate);

export default router;
