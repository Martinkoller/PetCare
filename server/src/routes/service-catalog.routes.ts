import { Router } from 'express';
import { getServices, createService, updateService, toggleStatus, deleteService } from '../controllers/service-catalog.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getServices);
router.post('/', createService);
router.put('/:id', updateService);
router.patch('/:id/status', toggleStatus);
router.delete('/:id', deleteService);

export default router;
