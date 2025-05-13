/**
 * @file Schema de validação para o perfil de usuário
 */

import { z } from 'zod';

// Schema de acessibilidade
export const accessibilitySchema = z.object({
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  highContrast: z.boolean().default(false),
  reducedMotion: z.boolean().default(false),
  screenReader: z.boolean().default(false)
});

// Schema de privacidade
export const privacySchema = z.object({
  showEmail: z.boolean().default(false),
  showLocation: z.boolean().default(true),
  showInterests: z.boolean().default(true)
});

// Schema completo de perfil
export const profileSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  language: z.enum(['pt-BR', 'en-US']).default('pt-BR'),
  estadoEleitoral: z.string().default(''),
  privacy: privacySchema.default({}),
  accessibility: accessibilitySchema.optional()
});

// Tipos inferidos
export type Accessibility = z.infer<typeof accessibilitySchema>;
export type Privacy = z.infer<typeof privacySchema>;
export type Profile = z.infer<typeof profileSchema>;
