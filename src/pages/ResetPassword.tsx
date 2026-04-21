import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Toaster, toast } from 'sonner'
import { Loader2, Lock, ArrowLeft } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const resetSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
    confirmPassword: z
      .string()
      .min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })

type ResetFormValues = z.infer<typeof resetSchema>

export default function ResetPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updatePassword, signOut, loading, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // If not authenticated and not loading, session verification failed
    if (!loading && !isAuthenticated) {
      // Logic to handle invalid session can be placed here if needed
    }
  }, [loading, isAuthenticated, navigate])

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (values: ResetFormValues) => {
    setIsSubmitting(true)
    try {
      const { error } = await updatePassword(values.password)
      if (error) {
        console.error('Update password error:', error)
        toast.error('Erro ao atualizar a senha. Tente novamente.')
      } else {
        toast.success('Senha atualizada com sucesso!')
        // Sign out to force re-login with new password
        await signOut()
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 2000)
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md text-center p-6 shadow-lg border-t-4 border-t-red-500">
          <CardTitle className="text-xl mb-2 text-red-600">
            Link Inválido ou Expirado
          </CardTitle>
          <CardDescription className="mb-6">
            Não foi possível verificar sua sessão. O link de recuperação pode
            ter expirado ou já foi utilizado.
          </CardDescription>
          <Button asChild>
            <Link to="/forgot-password">Solicitar Novo Link</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Redefinir Senha
          </CardTitle>
          <CardDescription>
            Crie uma nova senha segura para sua conta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="******"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="******"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4">
          <Link
            to="/login"
            className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Login
          </Link>
        </CardFooter>
      </Card>
      <Toaster />
    </div>
  )
}
