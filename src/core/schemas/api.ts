/**
 * @file Schemas específicos para comunicação com APIs
 */
import { z } from 'zod';
import { apiErrorSchema } from './common';

// Response genérica de API
export const apiResponseSchema = <T extends z.ZodTypeAny>(schema: T) => 
  z.object({
    data: schema,
    success: z.boolean(),
    error: apiErrorSchema.optional()
  });

export type ApiResponse<T> = {
  data: T;
  success: boolean;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

// Cache key para APIs
export const cacheKeySchema = z.object({
  scope: z.string(),
  entity: z.string(),
  id: z.union([z.string(), z.number()]).optional(),
  params: z.record(z.any()).optional()
});

export type CacheKey = z.infer<typeof cacheKeySchema>;

// Configuração de cache
export const cacheConfigSchema = z.object({
  ttl: z.number().int().positive(),
  staleWhileRevalidate: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

// Header HTTP customizado
export const httpHeaderSchema = z.record(z.string());

export type HttpHeader = z.infer<typeof httpHeaderSchema>;

// Configuração de retry
export const retryConfigSchema = z.object({
  maxRetries: z.number().int().nonnegative(),
  initialDelay: z.number().int().positive(),
  maxDelay: z.number().int().positive(),
  backoffFactor: z.number().positive(),
  retryCondition: z.function()
    .args(z.any())
    .returns(z.boolean())
    .optional()
});

export type RetryConfig = z.infer<typeof retryConfigSchema>;