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
  portalCreateAppointment,
  portalListAppointments,
  portalCancelAppointment,
} from '../controllers/portal.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Públicas (tutor ainda não logado)
router.post('/register', portalRegister);
router.post('/login', portalLogin);

// Tutor logado — pedidos
router.post('/orders', authenticate, createClientOrder);
router.get('/orders/my', authenticate, listMyOrders);

// Tutor logado — agendamentos
router.get('/appointments', authenticate, portalListAppointments);
router.post('/appointments', authenticate, portalCreateAppointment);
router.patch('/appointments/:id/cancel', authenticate, portalCancelAppointment);

// Admin (funcionários da clínica)
router.get('/access-requests', authenticate, listPortalRequests);
router.patch('/access-requests/:id', authenticate, reviewPortalRequest);
router.get('/orders', authenticate, listAllClientOrders);
router.patch('/orders/:id/status', authenticate, updateOrderStatus);

export default router;
