import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useNavigate } from 'react-router-dom'
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
import { Loader2, Scissors } from 'lucide-react'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const loginSchema = z.object({
  email: z.string().email('Insira um email válido'),
  password: z.string().min(1, 'Informe a senha'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@petcare.local', password: 'admin123' },
  { label: 'Veterinário', email: 'andre@petcare.local', password: 'admin123' },
]

export default function Login() {
  const { signIn } = useAuthStore()
  const navigate = useNavigate()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoggingIn(true)
    try {
      const { error } = await signIn(values.email, values.password)
      if (error) {
        toast.error('Erro ao fazer login', {
          description: error.message || 'Credenciais inválidas',
        })
        return
      }
      toast.success('Login realizado com sucesso!')
      navigate('/dashboard', { replace: true })
    } catch {
      toast.error('Erro inesperado', { description: 'Tente novamente mais tarde' })
    } finally {
      setIsLoggingIn(false)
    }
  }

  const fillDemo = (email: string, password: string) => {
    form.setValue('email', email)
    form.setValue('password', password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-3 pb-6">
          <div className="flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg">
              <Scissors className="h-7 w-7" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold"> · PetCare</CardTitle>
            <CardDescription className="mt-1">
              Faça login para acessar o sistema
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-0">
          <div className="w-full border-t pt-3">
            <p className="text-xs text-center text-muted-foreground mb-2">Acesso rápido (demo)</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <Button
                  key={acc.email}
                  variant="outline"
                  size="sm"
                  onClick={() => fillDemo(acc.email, acc.password)}
                >
                  {acc.label}
                </Button>
              ))}
            </div>
          </div>
        </CardFooter>
      </Card>

      <Toaster />
    </div>
  )
}
