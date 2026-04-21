import { Router } from 'express'
import {
  getProfessionals,
  createProfessional,
  updateProfessional,
  deleteProfessional,
} from '../controllers/professional.controller'

const router = Router()

router.get('/', getProfessionals)
router.post('/', createProfessional)
router.put('/:id', updateProfessional)
router.delete('/:id', deleteProfessional)

export default router
