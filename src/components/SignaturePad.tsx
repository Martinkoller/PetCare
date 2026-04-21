import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
  onEnd: (signature: string | null) => void
  width?: number
  height?: number
  className?: string
}

export function SignaturePad({
  onEnd,
  width = 500,
  height = 200,
  className,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }, [])

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    let clientX, clientY

    if ('touches' in event) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else {
      clientX = (event as MouseEvent).clientX
      clientY = (event as MouseEvent).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const { x, y } = getCoordinates(event.nativeEvent)
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      const { x, y } = getCoordinates(event.nativeEvent)
      ctx.lineTo(x, y)
      ctx.stroke()
      if (!hasSignature) setHasSignature(true)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      onEnd(canvas.toDataURL())
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHasSignature(false)
      onEnd(null)
    }
  }

  return (
    <div className={className}>
      <div className="border rounded-md overflow-hidden bg-white touch-none relative group">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {hasSignature && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
            onClick={clear}
          >
            <Eraser className="w-4 h-4 mr-1" /> Limpar
          </Button>
        )}
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/30 text-xl font-medium select-none">
            Assine Aqui
          </div>
        )}
      </div>
    </div>
  )
}
