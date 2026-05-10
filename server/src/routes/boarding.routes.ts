import { Router } from 'express';
import { getBoardings, createBoarding, updateBoarding, deleteBoarding, addBoardingService } from '../controllers/boarding.controller';
import { getDailyLogs, createDailyLog, updateDailyLog, deleteDailyLog } from '../controllers/boarding-daily-log.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBoardings);
router.post('/', createBoarding);
router.put('/:id', updateBoarding);
router.delete('/:id', deleteBoarding);
router.post('/:id/services', addBoardingService as any);

// Daily logs
router.get('/:boardingId/logs', getDailyLogs as any);
router.post('/:boardingId/logs', createDailyLog as any);
router.put('/logs/:id', updateDailyLog as any);
router.delete('/logs/:id', deleteDailyLog as any);

export default router;

