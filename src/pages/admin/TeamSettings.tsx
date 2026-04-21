import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { Profile, Role } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Pencil, Trash2, UserCircle2 } from 'lucide-react'

const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  veterinarian: 'Veterinário(a)',
  groomer: 'Tosador(a)',
  attendant: 'Atendente',
}

const ROLE_COLORS: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-700',
  veterinarian: 'bg-blue-100 text-blue-700',
  groomer: 'bg-orange-100 text-orange-700',
  attendant: 'bg-gray-100 text-gray-700',
}

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

const ROLES: Role[] = ['admin', 'veterinarian', 'groomer', 'attendant']

const emptyForm = (): Omit<Profile, 'id'> => ({
  name: '',
  email: '',
  role: 'attendant',
  phone: '',
  color: PRESET_COLORS[0],
})

export function TeamSettings() {
  const { profiles, createEmployee, updateEmployee, deleteEmployee } = useConfigStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState<Omit<Profile, 'id'>>(emptyForm())
  const [saving, setSaving] = useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setDialogOpen(true)
  }

  const openEdit = (p: Profile) => {
    setEditing(p)
    setForm({ name: p.name, email: p.email, role: p.role, phone: p.phone || '', color: p.color ?? PRESET_COLORS[0] })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await updateEmployee(editing.id, form)
      } else {
        await createEmployee(form)
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Profile) => {
    if (!confirm(`Remover "${p.name}"?`)) return
    await deleteEmployee(p.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Colaboradores</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os funcionários e suas funções no sistema.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Novo Funcionário
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome / E-mail</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Função</TableHead>
            <TableHead>Cor</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                <UserCircle2 className="mx-auto mb-2 h-8 w-8 opacity-30" />
                Nenhum funcionário cadastrado.
              </TableCell>
            </TableRow>
          )}
          {profiles.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </TableCell>
              <TableCell className="text-sm">
                {p.phone || <span className="text-muted-foreground text-xs italic">Não informado</span>}
              </TableCell>
              <TableCell>
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[p.role]}`}>
                  {ROLE_LABELS[p.role]}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className="inline-block h-5 w-5 rounded-full border"
                  style={{ background: p.color ?? '#6366f1' }}
                />
              </TableCell>
              <TableCell>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(p)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nome completo</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex: Ana Paula Silva"
              />
            </div>

            <div className="space-y-1">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="ana@clinica.com"
              />
            </div>

            <div className="space-y-1">
              <Label>WhatsApp / Telefone</Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-1">
              <Label>Função</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as Role }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor de identificação</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: c,
                      borderColor: form.color === c ? '#000' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim() || !form.email.trim()}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
