import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import {
  NotificationSettings,
  NotificationLog,
  GroomingStage,
  CustomStatus,
  UserPreferences,
  Task,
  Profile,
  AppointmentTemplate,
  MessageTemplate,
  WhatsAppConnection,
  BusinessHours,
} from '@/lib/types'
import { organizationService } from '@/services/organization-service'
import { templateService } from '@/services/template-service'
import { taskService } from '@/services/task-service'
import { whatsappService } from '@/services/whatsapp-service'
import { employeeService } from '@/services/employee-service'
import { registerNotificationTrigger } from '@/services/notification-trigger'
import { toast } from 'sonner'

interface ConfigContextType {
  notificationSettings: NotificationSettings
  notificationLogs: NotificationLog[]
  whatsappConnection: WhatsAppConnection
  groomingStages: GroomingStage[]
  generalStatuses: CustomStatus[]
  userPreferences: UserPreferences
  tasks: Task[]
  profiles: Profile[]
  templates: AppointmentTemplate[]

  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void
  createTemplate: (template: Omit<MessageTemplate, 'id'>) => Promise<void>
  updateTemplate: (template: MessageTemplate) => Promise<void>
  deleteTemplate: (id: string) => Promise<void>
  saveWhatsappConnection: (conn: WhatsAppConnection) => Promise<void>

  // NOVOS MÉTODOS
  startWhatsappSession: () => Promise<void>
  refreshWhatsappStatus: () => Promise<void>
  disconnectWhatsappSession: () => Promise<void>

  sendManualNotification: (
    clientId: string,
    clientName: string,
    message: string,
    type: string,
    petName?: string,
    phone?: string,
  ) => Promise<void>

  sendAutoNotification: (payload: {
    clientId: string
    clientName: string
    petName?: string
    type: string
    phone?: string
    vars: Record<string, string>
  }) => Promise<void>

  createEmployee: (data: Omit<Profile, 'id'>) => Promise<void>
  updateEmployee: (id: string, data: Partial<Omit<Profile, 'id'>>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>

  businessHours: BusinessHours | undefined
  updateBusinessHours: (hours: BusinessHours) => Promise<void>

  requireChecklistOnFinish: boolean
  updateRequireChecklistOnFinish: (value: boolean) => Promise<void>
  addGroomingStage: (stage: GroomingStage) => void
  updateGroomingStages: (stages: GroomingStage[]) => Promise<void>
  updateGeneralStatuses: (statuses: CustomStatus[]) => Promise<void>
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  deleteTask: (id: string) => void
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void
  addAppointmentTemplate: (template: AppointmentTemplate) => Promise<void>
  updateAppointmentTemplate: (template: AppointmentTemplate) => Promise<void>
  deleteAppointmentTemplate: (id: string) => Promise<void>

  setNotificationLogs: React.Dispatch<React.SetStateAction<NotificationLog[]>>
  setWhatsappConnection: React.Dispatch<React.SetStateAction<WhatsAppConnection>>
  setGroomingStages: React.Dispatch<React.SetStateAction<GroomingStage[]>>
  setGeneralStatuses: React.Dispatch<React.SetStateAction<CustomStatus[]>>
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  setProfiles: React.Dispatch<React.SetStateAction<Profile[]>>
  setTemplates: React.Dispatch<React.SetStateAction<AppointmentTemplate[]>>
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const DEFAULT_GROOMING_STAGES: GroomingStage[] = [
  { id: 'waiting', title: 'Em Espera', color: 'bg-gray-100 text-gray-700' },
  {
    id: 'in_bath',
    title: 'No Banho',
    color: 'bg-blue-100 text-blue-700',
    isInitial: true,
  },
  { id: 'drying', title: 'Secagem', color: 'bg-orange-100 text-orange-700' },
  {
    id: 'finished',
    title: 'Pronto',
    color: 'bg-green-100 text-green-700',
    isFinal: true,
  },
  {
    id: 'delivered',
    title: 'Entregue',
    color: 'bg-purple-100 text-purple-700',
    isDelivery: true,
  },
]

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      enabled: true,
      templates: [],
    })

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([])

  const [whatsappConnection, setWhatsappConnection] =
    useState<WhatsAppConnection>({
      enabled: false,
      phone: '',
      apiUrl: '',
      apiKey: '',
      instance: 'petcare',
      status: 'DISCONNECTED',
      qrCode: '',
      pairedNumber: '',
      pairedName: '',
      errorMessage: '',
    })

  const [groomingStages, setGroomingStages] = useState<GroomingStage[]>(
    DEFAULT_GROOMING_STAGES,
  )
  const [generalStatuses, setGeneralStatuses] = useState<CustomStatus[]>([])
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    dashboardAlerts: {
      lowStock: true,
      onlineAppointments: true,
      birthdays: true,
    },
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [templates, setTemplates] = useState<AppointmentTemplate[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours | undefined>(undefined)
  const [requireChecklistOnFinish, setRequireChecklistOnFinish] = useState(false)

  const loadInitialConfig = useCallback(async () => {
    try {
      const [settings, loadedTemplates, loadedTasks, msgTemplates, conn, employees] =
        await Promise.all([
          organizationService.getSettings(),
          templateService.getTemplates(),
          taskService.getTasks(),
          whatsappService.getTemplates(),
          whatsappService.getConnection(),
          employeeService.getAll(),
        ])

      if (settings?.groomingStages?.length) {
        setGroomingStages(settings.groomingStages)
      }

      if (settings?.customStatuses) {
        setGeneralStatuses(settings.customStatuses)
      }

      if (settings?.businessHours) {
        setBusinessHours(settings.businessHours)
      }

      if (settings?.requireChecklistOnFinish != null) {
        setRequireChecklistOnFinish(settings.requireChecklistOnFinish)
      }

      setTemplates(loadedTemplates || [])
      setTasks(loadedTasks || [])
      setProfiles(employees || [])

      const templates = msgTemplates || []
      setNotificationSettings((prev) => ({ ...prev, templates }))

      if (conn) {
        setWhatsappConnection((prev) => ({
          ...prev,
          ...conn,
          status: conn.status || 'DISCONNECTED',
        }))
      }
    } catch (error) {
      console.error('Failed to load config', error)
    }
  }, [])

  const updateNotificationSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      setNotificationSettings((prev) => ({ ...prev, ...settings }))
    },
    [],
  )

  const createTemplate = useCallback(async (template: Omit<MessageTemplate, 'id'>) => {
    try {
      const created = await whatsappService.createTemplate(template)
      setNotificationSettings((prev) => ({
        ...prev,
        templates: [...prev.templates, created],
      }))
      toast.success('Template criado!')
    } catch {
      toast.error('Erro ao criar template')
    }
  }, [])

  const updateTemplate = useCallback(async (template: MessageTemplate) => {
    try {
      const updated = await whatsappService.updateTemplate(template)
      setNotificationSettings((prev) => ({
        ...prev,
        templates: prev.templates.map((t) => (t.id === updated.id ? updated : t)),
      }))
    } catch {
      toast.error('Erro ao salvar template')
    }
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await whatsappService.deleteTemplate(id)
      setNotificationSettings((prev) => ({
        ...prev,
        templates: prev.templates.filter((t) => t.id !== id),
      }))
      toast.success('Template excluído!')
    } catch {
      toast.error('Erro ao excluir template')
    }
  }, [])

  const saveWhatsappConnection = useCallback(async (conn: WhatsAppConnection) => {
    try {
      const saved = await whatsappService.updateConnection(conn)

      setWhatsappConnection((prev) => ({
        ...prev,
        ...saved,
      }))

      toast.success('Configurações de WhatsApp salvas!')
    } catch {
      toast.error('Erro ao salvar configurações de WhatsApp')
    }
  }, [])

  // NOVO: inicia sessão e tenta obter QR Code
  const startWhatsappSession = useCallback(async () => {
    try {
      if (!whatsappConnection.apiUrl || !whatsappConnection.apiKey || !whatsappConnection.instance) {
        toast.error('Preencha URL, API Key e nome da instância antes de conectar')
        return
      }

      setWhatsappConnection((prev) => ({
        ...prev,
        status: 'CONNECTING',
        errorMessage: '',
      }))

      const started = await whatsappService.startSession({
        apiUrl: whatsappConnection.apiUrl,
        apiKey: whatsappConnection.apiKey,
        instance: whatsappConnection.instance,
      })

      setWhatsappConnection((prev) => ({
        ...prev,
        ...started,
        status: started.status || 'QRCODE',
      }))

      if (started.status === 'CONNECTED') {
        toast.success('WhatsApp conectado com sucesso!')
      } else if (started.status === 'QRCODE') {
        toast.success('QR Code gerado. Faça o pareamento no celular.')
      }
    } catch (error: any) {
      setWhatsappConnection((prev) => ({
        ...prev,
        status: 'ERROR',
        errorMessage:
          error?.response?.data?.message || 'Erro ao iniciar sessão do WhatsApp',
      }))
      toast.error('Erro ao iniciar sessão do WhatsApp')
    }
  }, [whatsappConnection.apiUrl, whatsappConnection.apiKey, whatsappConnection.instance])

  // NOVO: atualiza status da sessão
  const refreshWhatsappStatus = useCallback(async () => {
    try {
      const status = await whatsappService.getConnectionStatus(
        whatsappConnection.instance,
      )

      setWhatsappConnection((prev) => ({
        ...prev,
        status: status.status,
        qrCode: status.status === 'CONNECTED' ? '' : status.qrCode || prev.qrCode,
        pairedNumber: status.pairedNumber || '',
        pairedName: status.pairedName || '',
        errorMessage: status.errorMessage || '',
        lastConnectionAt: status.lastConnectionAt || prev.lastConnectionAt,
        enabled: status.status === 'CONNECTED' ? true : prev.enabled,
      }))
    } catch (error: any) {
      setWhatsappConnection((prev) => ({
        ...prev,
        status: 'ERROR',
        errorMessage:
          error?.response?.data?.message || 'Erro ao consultar status do WhatsApp',
      }))
    }
  }, [whatsappConnection.instance])

  // NOVO: desconecta sessão
  const disconnectWhatsappSession = useCallback(async () => {
    try {
      const disconnected = await whatsappService.disconnectSession(
        whatsappConnection.instance,
      )

      setWhatsappConnection((prev) => ({
        ...prev,
        ...disconnected,
        status: 'DISCONNECTED',
        qrCode: '',
        pairedNumber: '',
        pairedName: '',
      }))

      toast.success('WhatsApp desconectado com sucesso!')
    } catch {
      toast.error('Erro ao desconectar WhatsApp')
    }
  }, [whatsappConnection.instance])

  const sendManualNotification = useCallback(
    async (
      clientId: string,
      clientName: string,
      message: string,
      type: string,
      petName?: string,
      phone?: string,
    ) => {
      try {
        const log = await whatsappService.send({
          clientId,
          clientName,
          petName,
          type,
          message,
          phone,
          manual: true,
        })

        setNotificationLogs((prev) => [log, ...prev])
        toast.success('Mensagem enviada!')

        // fallback: se não estiver conectado à API, abre wa.me
        if (phone && whatsappConnection.status !== 'CONNECTED') {
          const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
          window.open(url, '_blank')
        }
      } catch {
        toast.error('Erro ao enviar mensagem')
      }
    },
    [whatsappConnection.status],
  )

  const sendAutoNotification = useCallback(
    async (payload: {
      clientId: string
      clientName: string
      petName?: string
      type: string
      phone?: string
      vars: Record<string, string>
    }) => {
      // IMPORTANTE: só envia automático se realmente estiver conectado
      if (!notificationSettings.enabled) return
      if (!whatsappConnection.enabled) return
      if (whatsappConnection.status !== 'CONNECTED') return

      const template = notificationSettings.templates.find(
        (t) => t.type === payload.type && t.active && t.sendMode !== 'manual',
      )

      if (!template) return

      const message = whatsappService.interpolate(template.content, payload.vars)

      try {
        const log = await whatsappService.send({
          ...payload,
          message,
          manual: false,
        })

        setNotificationLogs((prev) => [log, ...prev])
      } catch {
        // silent
      }
    },
    [notificationSettings, whatsappConnection.enabled, whatsappConnection.status],
  )

  const updateBusinessHours = useCallback(async (hours: BusinessHours) => {
    try {
      await organizationService.updateSettings({ businessHours: hours })
      setBusinessHours(hours)
      toast.success('Horários salvos!')
    } catch {
      toast.error('Erro ao salvar horários')
    }
  }, [])

  const createEmployee = useCallback(async (data: Omit<Profile, 'id'>) => {
    try {
      const created = await employeeService.create(data)
      setProfiles((prev) => [...prev, created])
      toast.success('Funcionário cadastrado!')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao cadastrar funcionário')
    }
  }, [])

  const updateEmployee = useCallback(async (id: string, data: Partial<Omit<Profile, 'id'>>) => {
    try {
      const updated = await employeeService.update(id, data)
      setProfiles((prev) => prev.map((p) => (p.id === id ? updated : p)))
      toast.success('Funcionário atualizado!')
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Erro ao atualizar funcionário')
    }
  }, [])

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      await employeeService.remove(id)
      setProfiles((prev) => prev.filter((p) => p.id !== id))
      toast.success('Funcionário removido!')
    } catch {
      toast.error('Erro ao remover funcionário')
    }
  }, [])

  const addGroomingStage = useCallback(
    (stage: GroomingStage) => {
      const newStages = [...groomingStages, stage]
      setGroomingStages(newStages)
      organizationService.updateSettings({ groomingStages: newStages })
    },
    [groomingStages],
  )

  const updateGroomingStages = useCallback(async (stages: GroomingStage[]) => {
    try {
      await organizationService.updateSettings({ groomingStages: stages })
      setGroomingStages(stages)
      toast.success('Etapas atualizadas com sucesso!')
    } catch (_e) {
      toast.error('Erro ao atualizar etapas')
    }
  }, [])

  const updateRequireChecklistOnFinish = useCallback(async (value: boolean) => {
    try {
      await organizationService.updateSettings({ requireChecklistOnFinish: value })
      setRequireChecklistOnFinish(value)
    } catch {
      toast.error('Erro ao salvar configuração')
    }
  }, [])

  const updateGeneralStatuses = useCallback(async (statuses: CustomStatus[]) => {
    try {
      await organizationService.updateSettings({ customStatuses: statuses })
      setGeneralStatuses(statuses)
      toast.success('Status globais atualizados!')
    } catch (_e) {
      toast.error('Erro ao atualizar status')
    }
  }, [])

  const addTask = useCallback((task: Task) => {
    taskService
      .createTask(task)
      .then((created) => {
        setTasks((prev) => [created, ...prev])
      })
      .catch(() => {
        toast.error('Erro ao criar tarefa')
      })
  }, [])

  const updateTask = useCallback((task: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))

    taskService
      .updateTask(task)
      .then((updated) => {
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      })
      .catch(() => {
        toast.error('Erro ao atualizar tarefa')
      })
  }, [])

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))

    taskService.deleteTask(id).catch(() => {
      toast.error('Erro ao excluir tarefa')
    })
  }, [])

  const updateUserPreferences = useCallback(
    (prefs: Partial<UserPreferences>) => {
      setUserPreferences((prev) => ({
        ...prev,
        dashboardAlerts: {
          ...prev.dashboardAlerts,
          ...prefs.dashboardAlerts,
        },
      }))
    },
    [],
  )

  const addAppointmentTemplate = useCallback(
    async (template: AppointmentTemplate) => {
      try {
        const newTemplate = await templateService.createTemplate(template)
        setTemplates((prev) => [...prev, newTemplate])
        toast.success('Modelo criado com sucesso!')
      } catch (_e) {
        toast.error('Erro ao criar modelo')
      }
    },
    [],
  )

  const updateAppointmentTemplate = useCallback(
    async (template: AppointmentTemplate) => {
      try {
        const updated = await templateService.updateTemplate(template)

        setTemplates((prev) =>
          prev.map((t) => (t.id === template.id ? updated : t)),
        )

        toast.success('Modelo atualizado!')
      } catch (_e) {
        toast.error('Erro ao atualizar modelo')
      }
    },
    [],
  )

  const deleteAppointmentTemplate = useCallback(async (id: string) => {
    try {
      await templateService.deleteTemplate(id)
      setTemplates((prev) => prev.filter((t) => t.id !== id))
      toast.success('Modelo excluído')
    } catch (_e) {
      toast.error('Erro ao excluir modelo')
    }
  }, [])

  useEffect(() => {
    loadInitialConfig()
  }, [loadInitialConfig])

  // Trigger global para outros stores
useEffect(() => {
  const unregister = registerNotificationTrigger((payload) => {
    sendAutoNotification(payload)
  })

  return unregister
}, [sendAutoNotification])

  // NOVO: polling automático enquanto estiver aguardando QR / conectando
  useEffect(() => {
    if (
      whatsappConnection.status !== 'QRCODE' &&
      whatsappConnection.status !== 'CONNECTING'
    ) {
      return
    }

    const interval = setInterval(() => {
      refreshWhatsappStatus()
    }, 4000)

    return () => clearInterval(interval)
  }, [whatsappConnection.status, refreshWhatsappStatus])

  const value = useMemo(
    () => ({
      notificationSettings,
      notificationLogs,
      whatsappConnection,
      groomingStages,
      generalStatuses,
      userPreferences,
      tasks,
      profiles,
      templates,

      updateNotificationSettings,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      saveWhatsappConnection,

      startWhatsappSession,
      refreshWhatsappStatus,
      disconnectWhatsappSession,

      sendManualNotification,
      sendAutoNotification,

      businessHours,
      updateBusinessHours,

      createEmployee,
      updateEmployee,
      deleteEmployee,

      requireChecklistOnFinish,
      updateRequireChecklistOnFinish,
      addGroomingStage,
      updateGroomingStages,
      updateGeneralStatuses,
      addTask,
      updateTask,
      deleteTask,
      updateUserPreferences,
      addAppointmentTemplate,
      updateAppointmentTemplate,
      deleteAppointmentTemplate,

      setNotificationLogs,
      setWhatsappConnection,
      setGroomingStages,
      setGeneralStatuses,
      setTasks,
      setProfiles,
      setTemplates,
    }),
    [
      notificationSettings,
      notificationLogs,
      whatsappConnection,
      groomingStages,
      generalStatuses,
      userPreferences,
      tasks,
      profiles,
      templates,
      updateNotificationSettings,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      saveWhatsappConnection,
      startWhatsappSession,
      refreshWhatsappStatus,
      disconnectWhatsappSession,
      sendManualNotification,
      sendAutoNotification,
      businessHours,
      updateBusinessHours,
      createEmployee,
      updateEmployee,
      deleteEmployee,
      requireChecklistOnFinish,
      updateRequireChecklistOnFinish,
      addGroomingStage,
      updateGroomingStages,
      updateGeneralStatuses,
      addTask,
      updateTask,
      deleteTask,
      updateUserPreferences,
      addAppointmentTemplate,
      updateAppointmentTemplate,
      deleteAppointmentTemplate,
    ],
  )

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  )
}

export function useConfigStore() {
  const context = useContext(ConfigContext)

  if (context === undefined) {
    throw new Error('useConfigStore must be used within an ConfigProvider')
  }

  return context
}