/**
 * Schemas para formulários de Perfil
 * Fornece validação e inferência de tipos para formulários relacionados ao perfil
 */

import { z } from 'zod';

// Schema para formulário de perfil de usuário
export const perfilFormSchema = z.object({
  displayName: z
    .string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
    .max(50, { message: 'Nome deve ter no máximo 50 caracteres' }),
  email: z
    .string()
    .email({ message: 'Email inválido' }),
  bio: z
    .string()
    .max(500, { message: 'Biografia deve ter no máximo 500 caracteres' })
    .optional(),
  location: z
    .string()
    .max(100, { message: 'Localização deve ter no máximo 100 caracteres' })
    .optional(),
  interests: z
    .array(z.string())
    .max(10, { message: 'Selecione no máximo 10 interesses' })
    .optional(),
  notifications: z
    .object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean()
    })
    .default({
      email: true,
      push: true,
      sms: false
    })
});

// Schema para configurações de perfil
export const perfilConfigSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
  estadoEleitoral: z.string().default('rj'),
  privacy: z.object({
    showEmail: z.boolean().default(false),
    showLocation: z.boolean().default(true),
    showInterests: z.boolean().default(true)
  }),
  accessibility: z.object({
    fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
    highContrast: z.boolean().default(false),
    reduceMotion: z.boolean().default(false)
  }).optional()
});

// Schema para alteração de senha
export const senhaAlteracaoSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: 'Senha atual é obrigatória' }),
    newPassword: z
      .string()
      .min(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
      .regex(/[A-Z]/, { message: 'Senha deve conter pelo menos uma letra maiúscula' })
      .regex(/[a-z]/, { message: 'Senha deve conter pelo menos uma letra minúscula' })
      .regex(/[0-9]/, { message: 'Senha deve conter pelo menos um número' }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Confirmação de senha é obrigatória' })
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword']
  });

// Tipos inferidos dos schemas
export type PerfilFormValues = z.infer<typeof perfilFormSchema>;
export type PerfilConfigValues = z.infer<typeof perfilConfigSchema>;
export type SenhaAlteracaoValues = z.infer<typeof senhaAlteracaoSchema>;
