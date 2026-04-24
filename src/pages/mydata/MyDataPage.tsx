import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, Phone, Mail, Hash, Users, PawPrint, CalendarDays } from 'lucide-react'

interface OrgData {
  id: string
  name: string
  cnpj: string
  email: string
  phone?: string
  zipCode?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  status: string
  trialEndsAt: string
  confirmedAt?: string
  createdAt: string
  _count?: { users: number; clients: number; pets: number }
}

const statusLabel: Record<string, { label: string; class: string }> = {
  active: { label: 'Ativo', class: 'bg-green-100 text-green-700' },
  trial: { label: 'Trial', class: 'bg-yellow-100 text-yellow-700' },
  inactive: { label: 'Inativo', class: 'bg-red-100 text-red-700' },
}

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function MyDataPage() {
  const [org, setOrg] = useState<OrgData | null>(null)
  const [form, setForm] = useState<Partial<OrgData>>({})
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [zipLoading, setZipLoading] = useState(false)

  useEffect(() => {
    api.get('/organization/me')
      .then(r => { setOrg(r.data); setForm(r.data) })
      .catch(() => toast.error('Erro ao carregar dados da empresa.'))
      .finally(() => setLoading(false))
  }, [])

  const set = (field: keyof OrgData, value: string) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleZipBlur = async () => {
    const zip = form.zipCode?.replace(/\D/g, '')
    if (!zip || zip.length !== 8) return
    setZipLoading(true)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${zip}/json/`)
      const data = await r.json()
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }))
      }
    } catch { /* silently ignore */ }
    finally { setZipLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await api.patch('/organization/me', {
        name: form.name,
        phone: form.phone,
        zipCode: form.zipCode,
        street: form.street,
        number: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
      })
      setOrg(r.data)
      setForm(r.data)
      setEditing(false)
      toast.success('Dados atualizados com sucesso.')
    } catch {
      toast.error('Erro ao salvar dados.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setForm(org ?? {})
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!org) return null

  const status = statusLabel[org.status] ?? { label: org.status, class: '' }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus Dados</h1>
          <p className="text-sm text-slate-500 mt-0.5">Informações cadastrais da sua empresa</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} variant="outline">
            Editar
          </Button>
        )}
      </div>

      {/* Cartão de resumo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span><strong>{org._count?.users ?? 0}</strong> usuários</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              <span><strong>{org._count?.clients ?? 0}</strong> clientes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <PawPrint className="w-4 h-4 text-slate-400" />
              <span><strong>{org._count?.pets ?? 0}</strong> pets</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="w-4 h-4 text-slate-400" />
              <span>Desde {formatDate(org.createdAt)}</span>
            </div>
            <Badge className={`${status.class} border-0`}>{status.label}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Dados da empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-4 h-4" /> Empresa
          </CardTitle>
          <CardDescription>Nome e identificação fiscal</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Razão Social</Label>
              {editing ? (
                <Input value={form.name ?? ''} onChange={e => set('name', e.target.value)} />
              ) : (
                <p className="text-sm font-medium text-slate-900">{org.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Hash className="w-3 h-3" /> CNPJ
              </Label>
              <p className="text-sm text-slate-700">{formatCNPJ(org.cnpj)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="w-4 h-4" /> Contato
          </CardTitle>
          <CardDescription>Telefone e e-mail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Telefone</Label>
              {editing ? (
                <Input value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
              ) : (
                <p className="text-sm text-slate-700">{org.phone || '—'}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <Mail className="w-3 h-3" /> E-mail
              </Label>
              <p className="text-sm text-slate-700">{org.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" /> Endereço
          </CardTitle>
          <CardDescription>Localização da empresa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="col-span-2 sm:col-span-1 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">CEP</Label>
                  <Input
                    value={form.zipCode ?? ''}
                    onChange={e => set('zipCode', e.target.value)}
                    onBlur={handleZipBlur}
                    placeholder="00000-000"
                    disabled={zipLoading}
                  />
                </div>
                <div className="col-span-2 sm:col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Logradouro</Label>
                  <Input value={form.street ?? ''} onChange={e => set('street', e.target.value)} placeholder="Rua, Avenida..." />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Número</Label>
                  <Input value={form.number ?? ''} onChange={e => set('number', e.target.value)} />
                </div>
                <div className="col-span-2 sm:col-span-3 space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Complemento</Label>
                  <Input value={form.complement ?? ''} onChange={e => set('complement', e.target.value)} placeholder="Sala, Andar..." />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bairro</Label>
                  <Input value={form.neighborhood ?? ''} onChange={e => set('neighborhood', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cidade</Label>
                  <Input value={form.city ?? ''} onChange={e => set('city', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</Label>
                  <Input value={form.state ?? ''} onChange={e => set('state', e.target.value)} maxLength={2} placeholder="SC" />
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-1 text-sm text-slate-700">
              {org.street ? (
                <>
                  <p>{org.street}{org.number ? `, ${org.number}` : ''}{org.complement ? ` — ${org.complement}` : ''}</p>
                  <p>{[org.neighborhood, org.city, org.state].filter(Boolean).join(' · ')}</p>
                  {org.zipCode && <p className="text-slate-400">CEP {org.zipCode}</p>}
                </>
              ) : (
                <p className="text-slate-400">Endereço não informado</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <>
          <Separator />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
