import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .min(1, { message: 'E-mail é obrigatório' })
  .email({ message: 'E-mail inválido' })
  .max(255, { message: 'E-mail deve ter menos de 255 caracteres' });

export const passwordSchema = z
  .string()
  .min(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  .max(72, { message: 'Senha deve ter menos de 72 caracteres' });

export const nameSchema = z
  .string()
  .trim()
  .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  .max(100, { message: 'Nome deve ter menos de 100 caracteres' });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
