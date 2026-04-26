import { Router } from 'express'
import {
  getProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
} from '../controllers/professional.controller'
import { authenticate } from '../middlewares/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getProfessionals)
router.post('/', createProfessional)
router.put('/:id', updateProfessional)
router.delete('/:id', deleteProfessional)

export default router
