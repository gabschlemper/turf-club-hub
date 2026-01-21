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

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

// Event validation
export const eventSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório' }).max(200, { message: 'Nome deve ter menos de 200 caracteres' }),
  event_type: z.enum(['championship', 'training', 'social'], { required_error: 'Tipo de evento é obrigatório' }),
  start_datetime: z.string().min(1, { message: 'Data/hora de início é obrigatória' }),
  end_datetime: z.string().min(1, { message: 'Data/hora de fim é obrigatória' }),
  location: z.string().trim().min(1, { message: 'Local é obrigatório' }).max(200, { message: 'Local deve ter menos de 200 caracteres' }),
  gender: z.enum(['male', 'female', 'both'], { required_error: 'Naipe é obrigatório' }),
  description: z.string().max(1000, { message: 'Descrição deve ter menos de 1000 caracteres' }).optional(),
});

// Bulk event validation
export const bulkEventSchema = z.object({
  name: z.string().trim().min(1, { message: 'Nome é obrigatório' }).max(200, { message: 'Nome deve ter menos de 200 caracteres' }),
  event_type: z.enum(['championship', 'training', 'social'], { required_error: 'Tipo de evento é obrigatório' }),
  start_time: z.string().min(1, { message: 'Hora de início é obrigatória' }),
  end_time: z.string().min(1, { message: 'Hora de fim é obrigatória' }),
  location: z.string().trim().min(1, { message: 'Local é obrigatório' }).max(200, { message: 'Local deve ter menos de 200 caracteres' }),
  gender: z.enum(['male', 'female', 'both'], { required_error: 'Naipe é obrigatório' }),
  description: z.string().max(1000, { message: 'Descrição deve ter menos de 1000 caracteres' }).optional(),
  start_date: z.string().min(1, { message: 'Data inicial é obrigatória' }),
  end_date: z.string().min(1, { message: 'Data final é obrigatória' }),
  weekdays: z.array(z.number()).min(1, { message: 'Selecione pelo menos um dia da semana' }),
});

// Athlete validation
export const athleteSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  gender: z.enum(['male', 'female'], { required_error: 'Naipe é obrigatório' }),
  birth_date: z.string().min(1, { message: 'Data de nascimento é obrigatória' }),
  category: z.enum(['GF', 'SC', 'OE'], { required_error: 'Categoria é obrigatória' }),
});

// Event with training type validation
export const eventWithTrainingSchema = eventSchema.extend({
  training_type: z.enum(['principal', 'extra']).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type EventWithTrainingFormData = z.infer<typeof eventWithTrainingSchema>;
export type BulkEventFormData = z.infer<typeof bulkEventSchema>;
export type AthleteFormData = z.infer<typeof athleteSchema>;
