import { useState } from 'react'
import { useConfigStore } from '@/stores/ConfigStore'
import { Task } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash,
  LayoutGrid,
  List as ListIcon,
  GripVertical,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TaskDialog } from './TaskDialog'
import { toast } from 'sonner'
import { format, isPast, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

type ViewMode = 'list' | 'kanban'

export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, profiles, sendManualNotification } = useConfigStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [draggedTaskId, setDragTaskId] = useState<string | null>(null)

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesAssignee =
      assigneeFilter === 'all' || task.assignee === assigneeFilter

    return matchesSearch && matchesStatus && matchesAssignee
  })

  const assignees = Array.from(new Set(tasks.map((t) => t.assignee)))

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      deleteTask(id)
      toast.success('Tarefa removida')
    }
  }

  const notifyEmployee = (t: Task) => {
    const profile = profiles.find(p => p.name === t.assignee)
    if (profile && profile.phone) {
      const timeStr = format(new Date(t.dueDate), 'dd/MM HH:mm', { locale: ptBR })
      const msg = `📌 *Nova Tarefa Atribuída*\n\nOlá ${profile.name},\nUma nova tarefa foi atribuída a você: *${t.title}*.\nPrazo: ${timeStr}.\n\nAcesse o sistema para mais detalhes.`
      sendManualNotification(profile.id, profile.name, msg, 'internal_task', '', profile.phone)
    }
  }

  const handleSave = (task: Task | Task[]) => {
    if (Array.isArray(task)) {
      task.forEach((t) => {
        addTask(t)
        notifyEmployee(t)
      })
      toast.success(`${task.length} tarefas criadas com sucesso!`)
    } else if (editingTask) {
      updateTask(task)
      toast.success('Tarefa atualizada')
    } else {
      addTask(task)
      notifyEmployee(task)
      toast.success('Tarefa criada')
    }
  }

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    updateTask({ ...task, status: newStatus })
    toast.success('Status atualizado')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  // Kanban Logic
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId)
    e.dataTransfer.setData('taskId', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== status) {
        updateTask({ ...task, status })
        toast.success(`Tarefa movida para ${getStatusLabel(status)}`)
      }
    }
    setDragTaskId(null)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluída'
      default:
        return status
    }
  }

  const columns: { id: Task['status']; label: string; color: string }[] = [
    { id: 'pending', label: 'A Fazer', color: 'bg-gray-100 border-gray-200' },
    {
      id: 'in_progress',
      label: 'Em Progresso',
      color: 'bg-blue-50 border-blue-200',
    },
    {
      id: 'completed',
      label: 'Concluído',
      color: 'bg-green-50 border-green-200',
    },
  ]

  const TaskCard = ({ task }: { task: Task }) => {
    const isLate =
      task.status !== 'completed' &&
      isPast(new Date(task.dueDate)) &&
      !isToday(new Date(task.dueDate))

    return (
      <Card
        className={cn(
          'flex flex-col transition-all hover:shadow-md cursor-grab active:cursor-grabbing',
          task.status === 'completed' && 'opacity-75 bg-muted/30',
          draggedTaskId === task.id &&
            'opacity-50 border-dashed border-primary',
        )}
        draggable
        onDragStart={(e) => handleDragStart(e, task.id)}
      >
        <CardHeader className="p-3 pb-2 flex-row items-start justify-between space-y-0">
          <div className="space-y-1 w-full pr-2">
            <div className="flex justify-between items-center">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] uppercase font-bold px-1.5 py-0',
                  getPriorityColor(task.priority),
                )}
              >
                {task.priority === 'high'
                  ? 'Alta'
                  : task.priority === 'medium'
                    ? 'Média'
                    : 'Baixa'}
              </Badge>
              {viewMode === 'kanban' && (
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
            <CardTitle className="text-sm font-semibold line-clamp-2 leading-tight">
              {task.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2 -mt-1"
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(task)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => handleDelete(task.id)}
              >
                <Trash className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-3 pt-1 flex-1">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {task.description || 'Sem descrição.'}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]" title={task.assignee}>
                {task.assignee.split(' ')[0]}
              </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 text-xs',
                isLate ? 'text-red-600 font-medium' : 'text-muted-foreground',
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(new Date(task.dueDate), 'dd/MM HH:mm', { locale: ptBR })}
            </div>
          </div>
        </CardContent>
        {viewMode === 'list' && (
          <CardFooter className="p-3 pt-0 border-t bg-muted/10 mt-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              {getStatusIcon(task.status)}
              <span className="capitalize text-xs">
                {getStatusLabel(task.status)}
              </span>
            </div>
            {task.status !== 'completed' && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs h-6 px-2 ml-auto hover:bg-green-50 hover:text-green-700"
                onClick={() => handleStatusChange(task, 'completed')}
              >
                Concluir
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex gap-2">
          <div className="flex bg-muted rounded-lg p-1 border">
            <Button
              variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="h-4 w-4 mr-1" /> Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <ListIcon className="h-4 w-4 mr-1" /> Lista
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm shrink-0">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {viewMode === 'list' && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="completed">Concluída</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {assignees.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-h-0">
        {viewMode === 'list' ? (
          <ScrollArea className="h-full pr-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-4">
              {filteredTasks.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhuma tarefa encontrada.
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-full gap-4 overflow-x-auto pb-2">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.status === col.id)
              return (
                <div
                  key={col.id}
                  className={cn(
                    'flex-1 min-w-[280px] max-w-[350px] flex flex-col rounded-xl border bg-muted/30 h-full',
                    draggedTaskId && 'border-dashed border-primary/20',
                  )}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >
                  <div
                    className={cn(
                      'p-3 font-semibold text-sm border-b flex justify-between items-center bg-background/50 rounded-t-xl',
                      col.color,
                    )}
                  >
                    {col.label}
                    <Badge variant="secondary" className="ml-2 bg-white">
                      {colTasks.length}
                    </Badge>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    <div className="flex flex-col gap-3 pb-4">
                      {colTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      {colTasks.length === 0 && (
                        <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed rounded-lg opacity-50">
                          Arraste tarefas aqui
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <TaskDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) setEditingTask(null)
        }}
        onSave={handleSave}
        task={editingTask}
      />

      <button
        type="button"
        onClick={() => { setEditingTask(null); setIsDialogOpen(true) }}
        title="Nova Tarefa"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-orange-600 hover:shadow-xl active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  )
}
