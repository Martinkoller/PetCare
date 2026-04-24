import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller';
import { registerOrganization, confirmEmail } from '../controllers/organization.register.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.post('/register-organization', registerOrganization);
router.get('/confirm-email', confirmEmail);

export default router;
