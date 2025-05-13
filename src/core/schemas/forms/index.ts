/**
 * @file Exportações centralizadas dos schemas de formulários
 */

// Tipos de formulários específicos do domínio
export * from './profile.schema';
export * from './peticao.schema';
export * from './filtros.schema';

// Schema genérico de formulário com validações comuns
import { z } from 'zod';

// Schema base para formulários com validação
export const formValidationSchema = z.object({
  touched: z.record(z.boolean()).optional(),
  errors: z.record(z.string()).optional(),
  isValid: z.boolean().optional(),
  isDirty: z.boolean().optional()
});

export type FormValidation = z.infer<typeof formValidationSchema>;

// Tipos de campos de formulário suportados
export const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'number',
  'email',
  'password',
  'checkbox',
  'radio',
  'select',
  'multiselect',
  'date',
  'file',
  'hidden'
]);

export type FieldType = z.infer<typeof fieldTypeSchema>;

// Schema para opções de campos
export const fieldOptionSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  disabled: z.boolean().optional()
});

export type FieldOption = z.infer<typeof fieldOptionSchema>;

// Schema para configuração de campo
export const fieldConfigSchema = z.object({
  type: fieldTypeSchema,
  label: z.string(),
  placeholder: z.string().optional(),
  helperText: z.string().optional(),
  required: z.boolean().optional(),
  disabled: z.boolean().optional(),
  hidden: z.boolean().optional(),
  options: z.array(fieldOptionSchema).optional(),
  validation: z.function()
    .args(z.any())
    .returns(z.any())
    .optional(),
  transformValue: z.function()
    .args(z.any())
    .returns(z.any())
    .optional(),
  dependsOn: z.string().optional()
});

export type FieldConfig = z.infer<typeof fieldConfigSchema>;

// Schema para definição de formulário
export const formConfigSchema = z.object({
  id: z.string(),
  fields: z.record(fieldConfigSchema),
  onSubmit: z.function()
    .args(z.record(z.any()))
    .returns(z.promise(z.any()))
    .optional(),
  validationSchema: z.any().optional()
});

export type FormConfig = z.infer<typeof formConfigSchema>;