import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { 
  loginSchema, 
  signupSchema, 
  forgotPasswordSchema,
  resetPasswordSchema,
  LoginFormData, 
  SignupFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
} from '@/lib/validations';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, signup, forgotPassword, resetPassword } = useAuth();
  const { toast } = useToast();

  // Check for reset password mode from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'reset-password') {
      setMode('reset-password');
    }
  }, []);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const isLoading = loginForm.formState.isSubmitting || 
                    signupForm.formState.isSubmitting ||
                    forgotPasswordForm.formState.isSubmitting ||
                    resetPasswordForm.formState.isSubmitting;

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

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    const result = await forgotPassword(data.email);
    if (result.success) {
      toast({
        title: 'E-mail enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setMode('login');
      forgotPasswordForm.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar e-mail',
        description: result.error,
      });
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    const result = await resetPassword(data.password);
    if (result.success) {
      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi redefinida com sucesso.',
      });
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      setMode('login');
      resetPasswordForm.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao redefinir senha',
        description: result.error,
      });
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    loginForm.reset();
    signupForm.reset();
    forgotPasswordForm.reset();
    resetPasswordForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Entrar';
      case 'signup': return 'Criar conta';
      case 'forgot-password': return 'Recuperar senha';
      case 'reset-password': return 'Redefinir senha';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'login': return 'Acesse sua conta para continuar';
      case 'signup': return 'Preencha os dados para se cadastrar';
      case 'forgot-password': return 'Digite seu e-mail para receber o link de recuperação';
      case 'reset-password': return 'Digite sua nova senha';
    }
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

          {/* Back button for forgot/reset password */}
          {(mode === 'forgot-password' || mode === 'reset-password') && (
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => switchMode('login')}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para login
            </Button>
          )}

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">{getTitle()}</h2>
            <p className="mt-2 text-muted-foreground">{getDescription()}</p>
          </div>

          {/* Login Form */}
          {mode === 'login' && (
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

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('forgot-password')}
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
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
          )}

          {/* Signup Form */}
          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-5">
              <p className="text-sm text-muted-foreground -mt-2">
                Apenas atletas cadastrados podem criar conta. Se você não está cadastrado, entre em contato com o administrador.
              </p>

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

          {/* Forgot Password Form */}
          {mode === 'forgot-password' && (
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...forgotPasswordForm.register('email')}
                  className="h-12"
                  disabled={isLoading}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Enviar link de recuperação'
                )}
              </Button>
            </form>
          )}

          {/* Reset Password Form */}
          {mode === 'reset-password' && (
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reset-password">Nova senha</Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    {...resetPasswordForm.register('password')}
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
                {resetPasswordForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {resetPasswordForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm">Confirmar nova senha</Label>
                <div className="relative">
                  <Input
                    id="reset-confirm"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita a senha"
                    {...resetPasswordForm.register('confirmPassword')}
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
                {resetPasswordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {resetPasswordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" variant="gradient" size="xl" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Redefinir senha'
                )}
              </Button>
            </form>
          )}

          {/* Switch mode */}
          {mode === 'login' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Não tem conta? Cadastre-se
              </button>
            </div>
          )}
          {mode === 'signup' && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Já tem conta? Faça login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
