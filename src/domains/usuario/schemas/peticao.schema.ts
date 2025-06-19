/**
 * Schemas para formulários de Petição
 * Fornece validação e inferência de tipos para formulários relacionados a petições
 */

import { z } from 'zod';

// Schema para criação de nova petição
export const peticaoFormSchema = z.object({
  titulo: z
    .string()
    .min(10, { message: 'Título deve ter pelo menos 10 caracteres' })
    .max(100, { message: 'Título deve ter no máximo 100 caracteres' }),
  descricao: z
    .string()
    .min(50, { message: 'Descrição deve ter pelo menos 50 caracteres' })
    .max(2000, { message: 'Descrição deve ter no máximo 2000 caracteres' }),
  categoria: z
    .enum([
      'educacao', 
      'saude', 
      'seguranca', 
      'meio_ambiente', 
      'direitos_humanos',
      'economia',
      'infraestrutura',
      'outros'
    ], {
      errorMap: () => ({ message: 'Selecione uma categoria válida' })
    }),
  tags: z
    .array(z.string())
    .max(5, { message: 'Selecione no máximo 5 tags' })
    .optional(),
  materiaRelacionada: z.object({
    id: z.string().optional(),
    tipo: z.string().optional(),
    numero: z.number().optional(),
    ano: z.number().optional()
  }).optional(),
  anexos: z
    .array(z.object({
      nome: z.string(),
      tipo: z.string(),
      tamanho: z.number(),
      url: z.string().url()
    }))
    .max(3, { message: 'Máximo de 3 anexos permitidos' })
    .optional(),
  termos: z
    .boolean()
    .refine(val => val === true, {
      message: 'Você deve concordar com os termos'
    })
});

// Schema para assinar uma petição
export const assinaturaPeticaoSchema = z.object({
  nome: z
    .string()
    .min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z
    .string()
    .email({ message: 'Email inválido' }),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { 
      message: 'CPF inválido. Use o formato 000.000.000-00' 
    }),
  cidade: z
    .string()
    .min(2, { message: 'Cidade é obrigatória' }),
  estado: z
    .string()
    .length(2, { message: 'Use a sigla do estado com 2 letras' }),
  anonimo: z
    .boolean()
    .default(false),
  receberAtualizacoes: z
    .boolean()
    .default(true),
  termos: z
    .boolean()
    .refine(val => val === true, {
      message: 'Você deve concordar com os termos'
    })
});

// Schema para comentários em petições
export const comentarioPeticaoSchema = z.object({
  texto: z
    .string()
    .min(5, { message: 'Comentário deve ter pelo menos 5 caracteres' })
    .max(500, { message: 'Comentário deve ter no máximo 500 caracteres' }),
  anonimo: z
    .boolean()
    .default(false)
});

// Tipos inferidos dos schemas
export type PeticaoFormValues = z.infer<typeof peticaoFormSchema>;
export type AssinaturaPeticaoValues = z.infer<typeof assinaturaPeticaoSchema>;
export type ComentarioPeticaoValues = z.infer<typeof comentarioPeticaoSchema>;