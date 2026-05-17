import { Router } from 'express';
import { getClients, createClient, updateClient, deleteClient, getClientFinancialSummary } from '../controllers/client.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getClients);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.get('/:id/financial-summary', getClientFinancialSummary);

export default router;
