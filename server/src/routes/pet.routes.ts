import { Router } from 'express';
import {
  getPets,
  createPet,
  updatePet,
  deletePet,
  addMedicalRecord,
  addVaccination,
} from '../controllers/pet.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getPets);
router.post('/', createPet);
router.put('/:id', updatePet);
router.delete('/:id', deletePet);
router.post('/:id/medical-records', addMedicalRecord);
router.post('/:id/vaccinations', addVaccination);

export default router;
