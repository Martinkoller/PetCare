import { Router } from 'express';
import * as hospitalizationController from '../controllers/hospitalization.controller';
import { authenticate as authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/stays', hospitalizationController.getHospitalizationStays);
router.post('/stays', hospitalizationController.createHospitalizationStay);
router.post('/stays/:stayId/logs', hospitalizationController.addHospitalizationLog);
router.patch('/stays/:id/discharge', hospitalizationController.dischargeHospitalizationStay);
router.patch('/stays/:id/status', hospitalizationController.updateHospitalizationStayStatus);

export default router;
