import { Router } from 'express';
import { getSettings, updateSettings, getMyOrganization, updateMyOrganization } from '../controllers/organization.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/me', getMyOrganization);
router.patch('/me', updateMyOrganization);

export default router;
