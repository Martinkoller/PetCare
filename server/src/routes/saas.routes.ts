import { Router } from 'express';
import { listOrganizations, toggleOrganizationStatus } from '../controllers/saas.controller';
import { authenticate, requireSaasAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireSaasAdmin);

router.get('/organizations', listOrganizations);
router.patch('/organizations/:id/status', toggleOrganizationStatus);

export default router;
