import { useState } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import { Link } from 'react-router-dom'
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
import { Toaster } from 'sonner'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Insira um email válido' }),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { resetPassword } = useAuthStore()

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true)
    try {
      const { error } = await resetPassword(values.email)
      if (error) {
        console.error('Reset password error:', error)
        toast.error('Erro ao enviar email. Tente novamente.')
      } else {
        setIsSuccess(true)
        toast.success('Link enviado com sucesso!')
      }
    } catch (err) {
      console.error(err)
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Recuperar Senha
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Verifique sua caixa de entrada.'
              : 'Informe seu email para receber o link de redefinição.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200">
                <p className="text-sm">
                  Um email foi enviado para{' '}
                  <strong>{form.getValues('email')}</strong>.
                  <br />
                  Clique no link para redefinir sua senha.
                </p>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link to="/login">Voltar para Login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="seunome@petshop.com"
                          type="email"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        {!isSuccess && (
          <CardFooter className="flex justify-center border-t pt-4">
            <Link
              to="/login"
              className="text-sm text-muted-foreground hover:text-primary flex items-center transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Login
            </Link>
          </CardFooter>
        )}
      </Card>
      <Toaster />
    </div>
  )
}
