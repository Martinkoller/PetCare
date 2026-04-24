import { Router } from 'express';
import { listOrganizations, toggleOrganizationStatus, updateOrganizationPlan } from '../controllers/saas.controller';
import { authenticate, requireSaasAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireSaasAdmin);

router.get('/organizations', listOrganizations);
router.patch('/organizations/:id/status', toggleOrganizationStatus);
router.patch('/organizations/:id/plan', updateOrganizationPlan);

export default router;
