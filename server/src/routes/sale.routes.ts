import { Router } from 'express';
import { authenticate } from '@/middlewares/auth.middleware';
import { getSales, createSale, cancelSale } from '@/controllers/sale.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.post('/', createSale);
router.patch('/:id/cancel', cancelSale);

export default router;
