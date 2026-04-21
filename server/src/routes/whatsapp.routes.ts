import { Router } from 'express'
import { whatsappController } from '@/controllers/whatsapp.controller'
import { sendConfirmation, webhook } from '@/controllers/whatsapp-appointment.controller'

const router = Router()

router.get('/connection', whatsappController.getConnection)
router.put('/connection', whatsappController.updateConnection)

router.post('/session/start', whatsappController.startSession)
router.get('/session/status', whatsappController.getSessionStatus)
router.post('/session/disconnect', whatsappController.disconnectSession)

router.post('/send', whatsappController.send)
router.get('/logs', whatsappController.getLogs)

router.post('/appointments/:id/send-confirmation', sendConfirmation)
router.post('/webhook', webhook)

router.get('/templates', whatsappController.getTemplates)
router.post('/templates', whatsappController.createTemplate)
router.put('/templates/:id', whatsappController.updateTemplate)
router.delete('/templates/:id', whatsappController.deleteTemplate)

export default router