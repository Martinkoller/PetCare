import { Router } from 'express';
import { getBoardings, createBoarding, updateBoarding, deleteBoarding, addBoardingService } from '../controllers/boarding.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBoardings);
router.post('/', createBoarding);
router.put('/:id', updateBoarding);
router.delete('/:id', deleteBoarding);
router.post('/:id/services', addBoardingService as any);

export default router;

