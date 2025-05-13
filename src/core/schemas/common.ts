/**
 * @file Schemas comuns utilizados em todo o sistema
 */
import { z } from 'zod';

// Schema para paginação
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional()
});

export type Pagination = z.infer<typeof paginationSchema>;

// Schema para filtros genéricos
export const filterSchema = z.record(z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number())
]));

export type Filters = z.infer<typeof filterSchema>;

// Schema para ordenação
export const sortSchema = z.object({
  field: z.string(),
  direction: z.enum(['asc', 'desc'])
});

export type Sort = z.infer<typeof sortSchema>;

// Schema para erro da API
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.any().optional()
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// Schema para timestamp unificado
export const timestampSchema = z.union([
  z.string().datetime(),
  z.date(),
  z.number() // Unix timestamp
]);

export type Timestamp = z.infer<typeof timestampSchema>;