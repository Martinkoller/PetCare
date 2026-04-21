import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, List, ListOrdered } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)
  const isInternalUpdate = React.useRef(false)

  React.useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value && !isInternalUpdate.current) {
        editorRef.current.innerHTML = value || ''
      }
    }
    // Reset internal update flag after render cycle
    isInternalUpdate.current = false
  }, [value])

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isInternalUpdate.current = true
    const newValue = e.currentTarget.innerHTML
    onChange(newValue)
  }

  const execCommand = (command: string) => {
    document.execCommand(command, false)
    if (editorRef.current) {
      isInternalUpdate.current = true
      onChange(editorRef.current.innerHTML)
      editorRef.current.focus()
    }
  }

  return (
    <div
      className={cn(
        'border rounded-md overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b bg-muted/50 p-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('bold')}
          type="button"
          title="Negrito"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('italic')}
          type="button"
          title="Itálico"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('insertUnorderedList')}
          type="button"
          title="Lista"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => execCommand('insertOrderedList')}
          type="button"
          title="Lista Numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>
      <div
        ref={editorRef}
        className="min-h-[100px] p-3 focus:outline-none prose prose-sm max-w-none dark:prose-invert [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4"
        contentEditable
        onInput={handleInput}
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          display: block;
        }
      `}</style>
    </div>
  )
}
