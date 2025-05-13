/**
 * @file Schema de validação para petições
 */

import { z } from 'zod';

// Categorias de petição
export const categoriaPeticaoEnum = z.enum([
  'educacao',
  'saude',
  'seguranca',
  'meio_ambiente',
  'direitos_humanos',
  'economia',
  'infraestrutura',
  'outros'
]);

// Schema para criação de petição
export const criarPeticaoSchema = z.object({
  titulo: z.string()
    .min(10, { message: 'O título deve ter no mínimo 10 caracteres' })
    .max(120, { message: 'O título deve ter no máximo 120 caracteres' }),
  
  descricao: z.string()
    .min(50, { message: 'A descrição deve ter no mínimo 50 caracteres' })
    .max(2000, { message: 'A descrição deve ter no máximo 2000 caracteres' }),
  
  categoria: categoriaPeticaoEnum,
  
  proposta: z.string()
    .min(100, { message: 'A proposta deve ter no mínimo 100 caracteres' })
    .max(5000, { message: 'A proposta deve ter no máximo 5000 caracteres' }),
  
  referencias: z.array(z.string().url({ message: 'URL inválida' }))
    .optional()
    .default([]),
  
  estadoAlvo: z.string().optional(),
  
  abrangenciaNacional: z.boolean().default(true),
  
  permitirComentarios: z.boolean().default(true),
  
  permitirCompartilhamento: z.boolean().default(true),
  
  tags: z.array(z.string()).max(5).optional()
});

// Schema para assinatura de petição
export const assinarPeticaoSchema = z.object({
  peticaoId: z.string(),
  comentario: z.string().max(500).optional(),
  anonimo: z.boolean().default(false)
});

// Schema para comentário em petição
export const comentarioPeticaoSchema = z.object({
  peticaoId: z.string(),
  conteudo: z.string()
    .min(5, { message: 'O comentário deve ter no mínimo 5 caracteres' })
    .max(1000, { message: 'O comentário deve ter no máximo 1000 caracteres' }),
  anonimo: z.boolean().default(false)
});

// Schema para pesquisa de petições
export const pesquisaPeticaoSchema = z.object({
  termo: z.string().optional(),
  categoria: categoriaPeticaoEnum.optional(),
  estado: z.string().optional(),
  ordem: z.enum(['recentes', 'populares', 'ativas']).default('recentes'),
  pagina: z.number().int().positive().default(1),
  limite: z.number().int().positive().max(50).default(20)
});

// Tipos inferidos
export type CategoriaPeticao = z.infer<typeof categoriaPeticaoEnum>;
export type CriarPeticao = z.infer<typeof criarPeticaoSchema>;
export type AssinarPeticao = z.infer<typeof assinarPeticaoSchema>;
export type ComentarioPeticao = z.infer<typeof comentarioPeticaoSchema>;
export type PesquisaPeticao = z.infer<typeof pesquisaPeticaoSchema>;
