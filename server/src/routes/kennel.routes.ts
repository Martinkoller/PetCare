import { Router } from 'express';
import { getKennels, createKennel, updateKennel, deleteKennel } from '../controllers/kennel.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getKennels);
router.post('/', createKennel);
router.put('/:id', updateKennel as any);
router.delete('/:id', deleteKennel as any);

export default router;
