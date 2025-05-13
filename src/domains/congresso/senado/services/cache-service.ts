import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logger } from '@/app/monitoring';
import { CacheApiError } from '../errors';
import { SENADO_CACHE_CONFIG, redisClient } from './api-config';

/**
 * Interface para operações de cache
 */
export interface CacheService {
  /**
   * Obtém um valor do cache
   * @param key Chave do cache
   * @param schema Schema para validação (opcional)
   * @returns Valor do cache ou null se não existir
   */
  get<T>(key: string, schema?: z.ZodType<T>): Promise<T | null>;
  
  /**
   * Define um valor no cache
   * @param key Chave do cache
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em ms (opcional)
   * @returns Promise<void>
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  
  /**
   * Remove um valor do cache
   * @param key Chave do cache
   * @returns Promise<void>
   */
  delete(key: string): Promise<void>;
  
  /**
   * Invalida todas as chaves que correspondem a um padrão
   * @param pattern Padrão de chave
   * @returns Promise<number> Número de chaves invalidadas
   */
  invalidatePattern(pattern: string): Promise<number>;
  
  /**
   * Obtém um valor do cache ou executa uma função para obtê-lo
   * @param key Chave do cache
   * @param fn Função para obter o valor caso não exista no cache
   * @param ttl Tempo de vida em ms (opcional)
   * @param schema Schema para validação (opcional)
   * @returns Valor do cache ou resultado da função
   */
  getOrSet<T>(
    key: string, 
    fn: () => Promise<T>,
    ttl?: number,
    schema?: z.ZodType<T>
  ): Promise<T>;
}

/**
 * Implementação do serviço de cache com Redis
 */
export class RedisCacheService implements CacheService {
  private readonly redis: Redis;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;
  
  constructor(
    redis: Redis = redisClient,
    keyPrefix: string = SENADO_CACHE_CONFIG.keyPrefix,
    defaultTTL: number = SENADO_CACHE_CONFIG.defaultTTL
  ) {
    this.redis = redis;
    this.keyPrefix = keyPrefix;
    this.defaultTTL = defaultTTL;
  }
  
  /**
   * Normaliza a chave do cache adicionando o prefixo
   * @param key Chave original
   * @returns Chave normalizada
   */
  private normalizeKey(key: string): string {
    return `${this.keyPrefix}${key}`;
  }
  
  /**
   * Obtém um valor do cache
   * @param key Chave do cache
   * @param schema Schema para validação (opcional)
   * @returns Valor do cache ou null se não existir
   */
  async get<T>(key: string, schema?: z.ZodType<T>): Promise<T | null> {
    try {
      const normalizedKey = this.normalizeKey(key);
      const cachedValue = await this.redis.get(normalizedKey);
      
      if (!cachedValue) {
        return null;
      }
      
      // Parsear o valor
      const value = typeof cachedValue === 'string' 
        ? JSON.parse(cachedValue)
        : cachedValue;
      
      // Validar com schema se fornecido
      if (schema) {
        const result = schema.safeParse(value);
        if (!result.success) {
          logger.warn(`Valor do cache inválido para chave ${key}:`, result.error);
          await this.delete(key);
          return null;
        }
        return result.data;
      }
      
      return value as T;
    } catch (error) {
      logger.error(`Erro ao obter valor do cache para chave ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Define um valor no cache
   * @param key Chave do cache
   * @param value Valor a ser armazenado
   * @param ttl Tempo de vida em ms (opcional)
   * @returns Promise<void>
   */
  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<void> {
    try {
      const normalizedKey = this.normalizeKey(key);
      const serializedValue = JSON.stringify(value);
      const ttlSeconds = Math.floor(ttl / 1000); // Converter ms para segundos
      
      await this.redis.set(normalizedKey, serializedValue, { ex: ttlSeconds });
    } catch (error) {
      logger.error(`Erro ao definir valor no cache para chave ${key}:`, error);
      throw new CacheApiError(
        `Erro ao armazenar dados no cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'set'
      );
    }
  }
  
  /**
   * Remove um valor do cache
   * @param key Chave do cache
   * @returns Promise<void>
   */
  async delete(key: string): Promise<void> {
    try {
      const normalizedKey = this.normalizeKey(key);
      await this.redis.del(normalizedKey);
    } catch (error) {
      logger.error(`Erro ao remover valor do cache para chave ${key}:`, error);
      throw new CacheApiError(
        `Erro ao remover dados do cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'delete'
      );
    }
  }
  
  /**
   * Invalida todas as chaves que correspondem a um padrão
   * @param pattern Padrão de chave
   * @returns Promise<number> Número de chaves invalidadas
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const normalizedPattern = this.normalizeKey(pattern);
      const keys = await this.redis.keys(normalizedPattern);
      
      if (keys.length === 0) {
        return 0;
      }
      
      // Remover cada chave
      for (const key of keys) {
        await this.redis.del(key);
      }
      
      return keys.length;
    } catch (error) {
      logger.error(`Erro ao invalidar chaves com padrão ${pattern}:`, error);
      throw new CacheApiError(
        `Erro ao invalidar dados do cache: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        'invalidatePattern'
      );
    }
  }
  
  /**
   * Obtém um valor do cache ou executa uma função para obtê-lo
   * @param key Chave do cache
   * @param fn Função para obter o valor caso não exista no cache
   * @param ttl Tempo de vida em ms (opcional)
   * @param schema Schema para validação (opcional)
   * @returns Valor do cache ou resultado da função
   */
  async getOrSet<T>(
    key: string, 
    fn: () => Promise<T>,
    ttl: number = this.defaultTTL,
    schema?: z.ZodType<T>
  ): Promise<T> {
    // Tentar obter do cache
    const cachedValue = await this.get<T>(key, schema);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Executar função para obter o valor
    const value = await fn();
    
    // Validar com schema se fornecido
    if (schema) {
      const result = schema.safeParse(value);
      if (!result.success) {
        logger.warn(`Valor da função inválido para chave ${key}:`, result.error);
        throw new CacheApiError(
          `Dados retornados pela função não são válidos: ${result.error.message}`,
          'getOrSet'
        );
      }
    }
    
    // Armazenar no cache
    await this.set(key, value, ttl);
    
    return value;
  }
}

/**
 * Instância do serviço de cache
 */
export const cacheService = new RedisCacheService();
