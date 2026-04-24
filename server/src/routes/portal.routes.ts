import { Router } from 'express';
import {
  portalRegister,
  portalLogin,
  listPortalRequests,
  reviewPortalRequest,
  createClientOrder,
  listMyOrders,
  listAllClientOrders,
  updateOrderStatus,
} from '../controllers/portal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Públicas (tutor ainda não logado)
router.post('/register', portalRegister);
router.post('/login', portalLogin);

// Tutor logado
router.post('/orders', authenticate, createClientOrder);
router.get('/orders/my', authenticate, listMyOrders);

// Admin (funcionários da clínica)
router.get('/access-requests', authenticate, listPortalRequests);
router.patch('/access-requests/:id', authenticate, reviewPortalRequest);
router.get('/orders', authenticate, listAllClientOrders);
router.patch('/orders/:id/status', authenticate, updateOrderStatus);

export default router;
