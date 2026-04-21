import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getInteractions,
  createInteraction,
  updateInteraction,
  deleteInteraction,
} from '../controllers/client-interaction.controller';

const router = Router();

router.use(authenticate);

router.get('/clients/:clientId/interactions', getInteractions);
router.post('/clients/:clientId/interactions', createInteraction);
router.put('/interactions/:id', updateInteraction);
router.delete('/interactions/:id', deleteInteraction);

export default router;
