import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/organization.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);

export default router;
