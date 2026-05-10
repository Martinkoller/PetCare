import { Eye, Pencil, Trash2, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ActionButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function ViewButton({ onClick, disabled }: ActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ver detalhes</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function EditButton({ onClick, disabled }: ActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function DeleteButton({ onClick, disabled }: ActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function AdjustButton({ onClick, disabled }: ActionButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-8 w-8"
          >
            <PackagePlus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Ajustar estoque</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
