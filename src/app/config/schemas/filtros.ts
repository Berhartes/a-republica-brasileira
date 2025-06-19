import { z } from 'zod';

/**
 * Schema base para filtros de data
 */
export const dateRangeSchema = z.object({
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()).optional()
}).refine(
  data => {
    if (!data.dataFim) return true;
    
    const inicio = new Date(data.dataInicio);
    const fim = new Date(data.dataFim);
    
    return inicio <= fim;
  },
  {
    message: 'Data final deve ser posterior à data inicial',
    path: ['dataFim']
  }
);

/**
 * Schema para filtros de paginação
 */
export const paginationSchema = z.object({
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
});

/**
 * Schema para filtros de senador
 */
export const senadorFilterSchema = z.object({
  nome: z.string().optional(),
  partido: z.string().optional(),
  uf: z.string().optional(),
  emExercicio: z.boolean().optional(),
  genero: z.enum(['M', 'F']).optional(),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()).optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
});

/**
 * Schema para filtros de matéria
 */
export const materiaFilterSchema = z.object({
  tipo: z.string().optional(),
  numero: z.number().int().positive().optional(),
  ano: z.number().int().positive().optional(),
  autor: z.string().optional(),
  situacao: z.string().optional(),
  palavraChave: z.string().optional(),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()).optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
});

/**
 * Schema para filtros de votação
 */
export const votacaoFilterSchema = z.object({
  senadorId: z.number().int().positive().optional(),
  materiaId: z.number().int().positive().optional(),
  resultado: z.string().optional(),
  dataInicio: z.string().or(z.date()),
  dataFim: z.string().or(z.date()).optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
});

/**
 * Schema para filtros de despesa
 */
export const despesaFilterSchema = z.object({
  senadorId: z.number().int().positive().optional(),
  tipo: z.string().optional(),
  fornecedor: z.string().optional(),
  valorMinimo: z.number().nonnegative().optional(),
  valorMaximo: z.number().nonnegative().optional(),
  ano: z.number().int().positive().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  pagina: z.number().int().positive().default(1),
  itensPorPagina: z.number().int().positive().max(100).default(20)
}).refine(
  data => {
    if (!data.valorMinimo || !data.valorMaximo) return true;
    return data.valorMinimo <= data.valorMaximo;
  },
  {
    message: 'Valor máximo deve ser maior ou igual ao valor mínimo',
    path: ['valorMaximo']
  }
);

/**
 * Schema para filtros de busca
 */
export const searchFilterSchema = z.object({
  termo: z.string().min(3, { message: 'Termo de busca deve ter pelo menos 3 caracteres' }),
  tipo: z.enum(['senador', 'materia', 'votacao', 'comissao', 'todos']).default('todos'),
  pagina: paginationSchema.shape.pagina,
  itensPorPagina: paginationSchema.shape.itensPorPagina
});

// Tipos inferidos dos schemas
export type DateRangeFilter = z.infer<typeof dateRangeSchema>;
export type PaginationFilter = z.infer<typeof paginationSchema>;
export type SenadorFilter = z.infer<typeof senadorFilterSchema>;
export type MateriaFilter = z.infer<typeof materiaFilterSchema>;
export type VotacaoFilter = z.infer<typeof votacaoFilterSchema>;
export type DespesaFilter = z.infer<typeof despesaFilterSchema>;
export type SearchFilter = z.infer<typeof searchFilterSchema>;