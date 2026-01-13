import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';
import { loginSchema, signupSchema, LoginFormData, SignupFormData } from '@/lib/validations';

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, signup } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const isLoading = loginForm.formState.isSubmitting || signupForm.formState.isSubmitting;

  const handleLogin = async (data: LoginFormData) => {
    const result = await login(data.email, data.password);

    if (result.success) {
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
    } else {
      toast({
        title: 'Erro no login',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    const result = await signup(data.email, data.password, data.name);

    if (result.success) {
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      });
    } else {
      toast({
        title: 'Erro no cadastro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    loginForm.reset();
    signupForm.reset();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center">
              <span className="text-3xl font-bold">HC</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-4">Hockey Club</h1>
          <p className="text-xl text-white/70 mb-8">Sistema de Gestão</p>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-white/80">Gerencie eventos e treinos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-white/80">Controle de presenças</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-white/80">Finanças transparentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">HC</span>
            </div>
            <span className="text-2xl font-bold">Hockey Club</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {mode === 'login'
                ? 'Acesse sua conta para continuar'
                : 'Preencha os dados para se cadastrar'}
            </p>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...loginForm.register('email')}
                  className="h-12"
                  disabled={isLoading}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...loginForm.register('password')}
                    className="h-12 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome completo</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Seu nome"
                  {...signupForm.register('name')}
                  className="h-12"
                  disabled={isLoading}
                />
                {signupForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...signupForm.register('email')}
                  className="h-12"
                  disabled={isLoading}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    {...signupForm.register('password')}
                    className="h-12 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirmar senha</Label>
                <div className="relative">
                  <Input
                    id="signup-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    {...signupForm.register('confirmPassword')}
                    className="h-12 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === 'login'
                ? 'Não tem conta? Cadastre-se'
                : 'Já tem conta? Faça login'}
            </button>
          </div>

          {/* Test credentials info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm font-medium text-foreground mb-2">Contas de teste:</p>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Admin:</strong> admin@hockeyclub.com</p>
              <p><strong>Atleta:</strong> atleta@hockeyclub.com</p>
              <p className="text-xs mt-2">Senha: 123456</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
