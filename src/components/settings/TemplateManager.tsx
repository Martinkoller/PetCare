import { useState, useRef } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { MessageTemplate, TemplateModule, TemplateTrigger } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Plus, Pencil, Trash2, Smile } from 'lucide-react'
import { toast } from 'sonner'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

const MODULE_LABELS: Record<TemplateModule, string> = {
  agendamento: 'Agendamentos',
  consulta: 'Consultas',
  banho_tosa: 'Banho e Tosa',
  hospedagem: 'Hospedagem',
  geral: 'Geral',
}

type TriggerMeta = { label: string; icon: string; description: string }

const TRIGGER_META: Record<TemplateTrigger, TriggerMeta> = {
  solicitacao:  { label: 'Solicitação',    icon: '📋', description: 'Cliente solicitou o serviço' },
  confirmacao:  { label: 'Confirmação',    icon: '✅', description: 'Serviço confirmado' },
  confirmacao_pendente: { label: 'Pedido de Confirmação', icon: '📲', description: 'Aguardando confirmação do cliente' },
  cancelamento: { label: 'Cancelamento',   icon: '❌', description: 'Serviço cancelado' },
  checkin:      { label: 'Check-in',       icon: '🚪', description: 'Pet chegou / entrada registrada' },
  checkout:     { label: 'Check-out',      icon: '🏠', description: 'Pet saiu / saída registrada' },
  pronto:       { label: 'Pronto / Aviso', icon: '🔔', description: 'Pet pronto para retirada' },
  finalizacao:  { label: 'Finalização',    icon: '🎉', description: 'Serviço concluído' },
  entrega:      { label: 'Entrega',        icon: '📦', description: 'Pet entregue ao tutor' },
  lembrete:     { label: 'Lembrete',       icon: '⏰', description: 'Lembrete antecipado' },
  cobranca:     { label: 'Cobrança',       icon: '💰', description: 'Pagamento pendente ou realizado' },
  personalizado:{ label: 'Personalizado',  icon: '✏️', description: 'Mensagem de uso livre' },
}

const TRIGGER_LABELS: Record<TemplateTrigger, string> = Object.fromEntries(
  Object.entries(TRIGGER_META).map(([k, v]) => [k, v.label])
) as Record<TemplateTrigger, string>

const TRIGGER_COLORS: Record<TemplateTrigger, string> = {
  solicitacao:  'bg-sky-100 text-sky-700',
  confirmacao:  'bg-green-100 text-green-700',
  confirmacao_pendente: 'bg-amber-100 text-amber-700',
  cancelamento: 'bg-red-100 text-red-700',
  checkin:      'bg-blue-100 text-blue-700',
  checkout:     'bg-indigo-100 text-indigo-700',
  pronto:       'bg-teal-100 text-teal-700',
  finalizacao:  'bg-violet-100 text-violet-700',
  entrega:      'bg-purple-100 text-purple-700',
  lembrete:     'bg-yellow-100 text-yellow-700',
  cobranca:     'bg-orange-100 text-orange-700',
  personalizado:'bg-gray-100 text-gray-700',
}

// Triggers disponíveis por módulo
const MODULE_TRIGGERS: Record<TemplateModule, TemplateTrigger[]> = {
  agendamento: ['solicitacao', 'confirmacao', 'confirmacao_pendente', 'cancelamento', 'lembrete'],
  consulta:    ['confirmacao', 'confirmacao_pendente', 'cancelamento', 'lembrete', 'finalizacao'],
  banho_tosa:  ['confirmacao', 'confirmacao_pendente', 'cancelamento', 'lembrete', 'checkin', 'pronto', 'entrega'],
  hospedagem:  ['confirmacao', 'confirmacao_pendente', 'cancelamento', 'lembrete', 'checkin', 'checkout'],
  geral:       ['personalizado', 'cobranca'],
}

// Labels específicos por módulo para o mesmo trigger
const MODULE_TRIGGER_LABELS: Partial<Record<TemplateModule, Partial<Record<TemplateTrigger, string>>>> = {
  banho_tosa: {
    checkin: 'Início do Serviço',
    pronto:  'Pronto / Aviso',
    entrega: 'Entrega',
  },
}

function getTriggerLabel(module: TemplateModule, trigger: TemplateTrigger): string {
  return MODULE_TRIGGER_LABELS[module]?.[trigger] ?? TRIGGER_META[trigger].label
}

function getTriggerIcon(trigger: TemplateTrigger): string {
  return TRIGGER_META[trigger].icon
}

const VARIABLES = [
  '{{client_name}}',
  '{{pet_name}}',
  '{{date}}',
  '{{time}}',
  '{{service_type}}',
  '{{clinic_name}}',
]

const MODULES: TemplateModule[] = ['agendamento', 'consulta', 'banho_tosa', 'hospedagem', 'geral']

const emptyForm = (): Omit<MessageTemplate, 'id'> => ({
  type: '',
  module: 'agendamento',
  trigger: 'confirmacao',
  title: '',
  content: '',
  active: true,
  sendMode: 'auto',
  sendDelay: 0,
})

export default function TemplateManager() {
  const { notificationSettings, createTemplate, updateTemplate, deleteTemplate } = useConfigStore()
  const templates = notificationSettings.templates

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<MessageTemplate | null>(null)
  const [form, setForm] = useState<Omit<MessageTemplate, 'id'>>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const grouped = MODULES.reduce<Record<TemplateModule, MessageTemplate[]>>(
    (acc, mod) => {
      acc[mod] = templates.filter((t) => t.module === mod)
      return acc
    },
    { agendamento: [], banho_tosa: [], hospedagem: [], geral: [] },
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (t: MessageTemplate) => {
    setEditing(t)
    setForm({
      type: t.type,
      module: t.module,
      trigger: t.trigger,
      title: t.title,
      content: t.content,
      active: t.active,
      sendMode: t.sendMode ?? 'auto',
      sendDelay: t.sendDelay ?? 0,
      minutesBefore: t.minutesBefore ?? ((t as any).hoursBefore ? (t as any).hoursBefore * 60 : (t.trigger === 'lembrete' ? 1440 : undefined))
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Preencha título e conteúdo')
      return
    }
    setSaving(true)
    try {
      const type = form.type || `${form.module}_${form.trigger}_${Date.now()}`
      if (editing) {
        await updateTemplate({ ...editing, ...form, type: editing.type })
      } else {
        await createTemplate({ ...form, type })
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (t: MessageTemplate) => {
    if (!confirm(`Excluir template "${t.title}"?`)) return
    await deleteTemplate(t.id)
  }

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current
    if (el) {
      const start = el.selectionStart ?? el.value.length
      const end = el.selectionEnd ?? el.value.length
      const newContent = el.value.slice(0, start) + text + el.value.slice(end)
      setForm((prev) => ({ ...prev, content: newContent }))
      requestAnimationFrame(() => {
        el.focus()
        el.setSelectionRange(start + text.length, start + text.length)
      })
    } else {
      setForm((prev) => ({ ...prev, content: prev.content + text }))
    }
  }

  const insertVar = (v: string) => insertAtCursor(v)

  const handleEmojiClick = (data: EmojiClickData) => {
    insertAtCursor(data.emoji)
    setEmojiOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Modelos de Mensagem</h3>
          <p className="text-sm text-muted-foreground">Organize por módulo e função.</p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Novo Modelo
        </Button>
      </div>

      {MODULES.map((mod) => (
        <div key={mod}>
          <h4 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {MODULE_LABELS[mod]}
          </h4>

          {grouped[mod].length === 0 && (
            <p className="text-sm text-muted-foreground mb-4">Nenhum modelo neste módulo.</p>
          )}

          <div className="grid gap-3 md:grid-cols-2 mb-4">
            {grouped[mod].map((t) => (
              <Card key={t.id} className={t.active ? '' : 'opacity-50'}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-sm leading-tight">{t.title}</CardTitle>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TRIGGER_COLORS[t.trigger]}`}>
                          {getTriggerLabel(t.module, t.trigger)}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.sendMode === 'auto' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {t.sendMode === 'auto' ? '🤖 Auto' : '✋ Manual'}
                        </span>
                      </div>
                    </div>
                    <Switch
                      checked={t.active}
                      onCheckedChange={(checked) => updateTemplate({ ...t, active: checked })}
                    />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="rounded bg-muted px-3 py-2 text-xs italic text-muted-foreground leading-relaxed line-clamp-3">
                    "{t.content}"
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(t)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(t)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Modelo' : 'Novo Modelo'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Módulo</Label>
                <Select
                  value={form.module}
                  onValueChange={(v) => {
                    const mod = v as TemplateModule
                    const allowed = MODULE_TRIGGERS[mod]
                    setForm((p) => ({
                      ...p,
                      module: mod,
                      trigger: allowed.includes(p.trigger) ? p.trigger : allowed[0],
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((m) => (
                      <SelectItem key={m} value={m}>{MODULE_LABELS[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Função</Label>
                <Select
                  value={form.trigger}
                  onValueChange={(v) => setForm((p) => ({ ...p, trigger: v as TemplateTrigger }))}
                >
                  <SelectTrigger>
                    <span className="flex items-center gap-2">
                      <span>{getTriggerIcon(form.trigger)}</span>
                      <span>{getTriggerLabel(form.module, form.trigger)}</span>
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {MODULE_TRIGGERS[form.module].map((tr) => (
                      <SelectItem key={tr} value={tr}>
                        <span className="flex items-center gap-2">
                          <span>{getTriggerIcon(tr)}</span>
                          <span className="font-medium">{getTriggerLabel(form.module, tr)}</span>
                          <span className="text-xs text-muted-foreground">— {TRIGGER_META[tr].description}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Lembrete de Consulta"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {form.sendMode === 'auto' ? '🤖 Envio automático' : '✋ Envio manual'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {form.sendMode === 'auto'
                    ? 'Mensagem disparada automaticamente pelo sistema'
                    : 'Mensagem enviada apenas quando solicitado manualmente'}
                </p>
              </div>
              <Switch
                checked={form.sendMode === 'auto'}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, sendMode: checked ? 'auto' : 'manual' }))
                }
              />
            </div>

            {form.sendMode === 'auto' && !['lembrete', 'confirmacao_pendente'].includes(form.trigger) && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">⏱ Atraso no envio</p>
                  <p className="text-xs text-muted-foreground">
                    {form.sendDelay === 0
                      ? 'Mensagem enviada imediatamente ao atingir o status'
                      : `Mensagem enviada ${form.sendDelay} min após atingir o status`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={form.sendDelay > 0}
                    onCheckedChange={(checked) =>
                      setForm((p) => ({ ...p, sendDelay: checked ? 30 : 0 }))
                    }
                  />
                  {form.sendDelay > 0 && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={1}
                        max={1440}
                        className="w-16 h-8 text-center"
                        value={form.sendDelay}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, sendDelay: Math.max(1, Number(e.target.value)) }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {form.sendMode === 'auto' && ['lembrete', 'confirmacao_pendente'].includes(form.trigger) && (
              <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-yellow-50/30 border-yellow-100">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-yellow-800">⏰ Tempo de Antecedência</p>
                  <p className="text-xs text-muted-foreground">
                    Enviar mensagem {form.minutesBefore || 1440} minutos antes do horário agendado.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={10080}
                    className="w-24 h-8 text-center bg-white"
                    value={form.minutesBefore || 1440}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, minutesBefore: Math.max(1, Number(e.target.value)) }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">minutos</span>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>Mensagem</Label>
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-foreground">
                      <Smile className="h-4 w-4 mr-1" /> Emoji
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-none shadow-xl" align="end">
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme={Theme.AUTO}
                      lazyLoadEmojis
                      searchPlaceholder="Buscar emoji..."
                      height={380}
                      width={320}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Textarea
                ref={textareaRef}
                className="h-32 resize-none"
                value={form.content}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                placeholder="Olá {{client_name}}! ..."
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {VARIABLES.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVar(v)}
                    className="rounded bg-muted px-1.5 py-0.5 text-xs hover:bg-muted/80 font-mono"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
