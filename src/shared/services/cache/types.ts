import { z } from 'zod';

/**
 * Configuração para o serviço de cache
 */
export const cacheConfigSchema = z.object({
  /**
   * Namespace para o cache (prefixo para chaves)
   */
  namespace: z.string().default('rb_cache'),
  
  /**
   * Tempo de expiração padrão em segundos
   */
  defaultTtl: z.number().int().positive().default(30 * 60), // 30 minutos
  
  /**
   * Versão do cache (invalidará caches de versões anteriores)
   */
  version: z.string().default('1.0')
});

export type CacheConfig = z.infer<typeof cacheConfigSchema>;

/**
 * Opções para operações de cache
 */
export interface CacheOptions {
  /**
   * Tempo de vida em segundos
   */
  ttl?: number;
  
  /**
   * Tags para categorização (facilita invalidação seletiva)
   */
  tags?: string[];
  
  /**
   * Se true, não emitirá logs em caso de cache miss
   */
  silent?: boolean;
}

/**
 * Resultado de operação de cache
 */
export interface CacheResult<T> {
  /**
   * Valor armazenado no cache
   */
  value: T | null;
  
  /**
   * Se o valor foi encontrado no cache
   */
  hit: boolean;
  
  /**
   * Timestamp de quando o valor foi armazenado
   */
  createdAt?: number;
  
  /**
   * Tempo restante de vida do valor em segundos
   */
  ttl?: number;
}

/**
 * Formato de metadados do cache
 */
export interface CacheMetadata {
  /**
   * Timestamp de quando o valor foi armazenado
   */
  createdAt: number;
  
  /**
   * Tags associadas ao valor
   */
  tags?: string[];
}

/**
 * Valor armazenado no cache com metadados
 */
export interface CacheEntry<T> {
  /**
   * Dados armazenados
   */
  data: T;
  
  /**
   * Metadados do cache
   */
  meta: CacheMetadata;
}

/**
 * Estatísticas do cache
 */
export interface CacheStats {
  /**
   * Número total de chaves no namespace atual
   */
  totalKeys: number;
  
  /**
   * Mapa de contagem por tags
   */
  tagCounts: Record<string, number>;
  
  /**
   * Uso de memória estimado (em bytes)
   */
  memoryUsage?: number;
}