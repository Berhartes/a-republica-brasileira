import { Redis } from '@upstash/redis';
import { logger } from '@/core/monitoring';
import { 
  CacheConfig, 
  CacheOptions, 
  CacheResult, 
  CacheEntry,
  CacheStats,
  cacheConfigSchema
} from './types';

/**
 * Serviço de cache distribuído usando Upstash Redis
 */
export class CacheService {
  private redis: Redis;
  private config: CacheConfig;
  
  constructor(redis: Redis, config: Partial<CacheConfig> = {}) {
    this.redis = redis;
    this.config = cacheConfigSchema.parse(config);
    logger.debug(`CacheService inicializado com namespace: ${this.config.namespace}`);
  }
  
  /**
   * Obtém o nome da chave com namespace e versão
   */
  private getKeyName(key: string): string {
    return `${this.config.namespace}:${this.config.version}:${key}`;
  }
  
  /**
   * Obtém a chave de metadados para uma chave de cache
   */
  private getMetaKeyName(key: string): string {
    return `${this.getKeyName(key)}:meta`;
  }
  
  /**
   * Salva um item no cache
   * 
   * @param key Chave do item
   * @param data Dados a serem armazenados
   * @param options Opções de cache
   * @returns true se salvo com sucesso
   */
  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.getKeyName(key);
      const metaKey = this.getMetaKeyName(key);
      const ttl = options.ttl ?? this.config.defaultTtl;
      
      const entry: CacheEntry<T> = {
        data,
        meta: {
          createdAt: Date.now(),
          tags: options.tags
        }
      };
      
      // Pipeline para executar comandos Redis em batch
      const pipeline = this.redis.pipeline();
      
      // Armazenar dados e metadados
      pipeline.set(fullKey, JSON.stringify(entry.data), { ex: ttl });
      pipeline.set(metaKey, JSON.stringify(entry.meta), { ex: ttl });
      
      // Registrar tags se fornecidas
      if (options.tags?.length) {
        for (const tag of options.tags) {
          const tagKey = `${this.config.namespace}:tag:${tag}`;
          pipeline.sadd(tagKey, fullKey);
          // Definir TTL para a tag, se ainda não existir
          pipeline.expire(tagKey, Math.max(ttl * 2, 86400)); // Maior do que o TTL do item ou 1 dia
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error(`Erro ao salvar item em cache: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Recupera um item do cache
   * 
   * @param key Chave do item
   * @param options Opções de cache
   * @returns Resultado da operação com o valor armazenado
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<CacheResult<T>> {
    try {
      const fullKey = this.getKeyName(key);
      const metaKey = this.getMetaKeyName(key);
      
      // Buscar dados e metadados em paralelo
      const [dataStr, metaStr, ttl] = await Promise.all([
        this.redis.get<string>(fullKey),
        this.redis.get<string>(metaKey),
        this.redis.ttl(fullKey)
      ]);
      
      if (!dataStr) {
        if (!options.silent) {
          logger.debug(`Cache miss: ${key}`);
        }
        return { value: null, hit: false };
      }
      
      try {
        const data = JSON.parse(dataStr) as T;
        const meta = metaStr ? JSON.parse(metaStr) as CacheEntry<T>['meta'] : { createdAt: Date.now() };
        
        logger.debug(`Cache hit: ${key}`);
        return { 
          value: data, 
          hit: true, 
          createdAt: meta.createdAt,
          ttl: ttl > 0 ? ttl : undefined
        };
      } catch (parseError) {
        logger.warn(`Erro ao fazer parse de dados do cache: ${key}`, parseError);
        // Remover dados corrompidos
        void this.remove(key);
        return { value: null, hit: false };
      }
    } catch (error) {
      logger.error(`Erro ao recuperar item do cache: ${key}`, error);
      return { value: null, hit: false };
    }
  }
  
  /**
   * Busca um item do cache ou executa fallback para obter o valor
   * 
   * @param key Chave do item
   * @param fallback Função para obter o valor caso não esteja em cache
   * @param options Opções de cache
   * @returns Valor do cache ou do fallback
   */
  async getOrSet<T>(
    key: string, 
    fallback: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
    const { value, hit } = await this.get<T>(key, { ...options, silent: true });
    
    if (hit && value !== null) {
      return value;
    }
    
    try {
      const data = await fallback();
      
      // Armazenar em cache apenas se o fallback retornar um valor não-nulo
      if (data !== null && data !== undefined) {
        void this.set(key, data, options);
      }
      
      return data;
    } catch (error) {
      logger.error(`Erro ao executar fallback para cache: ${key}`, error);
      throw error;
    }
  }
  
  /**
   * Verifica se um item existe no cache
   * 
   * @param key Chave do item
   * @returns true se o item existe
   */
  async has(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKeyName(key);
      return await this.redis.exists(fullKey) === 1;
    } catch (error) {
      logger.error(`Erro ao verificar item no cache: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Remove um item do cache
   * 
   * @param key Chave do item
   * @returns true se removido com sucesso
   */
  async remove(key: string): Promise<boolean> {
    try {
      const fullKey = this.getKeyName(key);
      const metaKey = this.getMetaKeyName(key);
      
      // Buscar metadados para remover das tags
      const metaStr = await this.redis.get<string>(metaKey);
      
      if (metaStr) {
        try {
          const meta = JSON.parse(metaStr) as CacheEntry<unknown>['meta'];
          
          if (meta.tags?.length) {
            const pipeline = this.redis.pipeline();
            
            for (const tag of meta.tags) {
              pipeline.srem(`${this.config.namespace}:tag:${tag}`, fullKey);
            }
            
            await pipeline.exec();
          }
        } catch (parseError) {
          logger.warn(`Erro ao fazer parse de metadados: ${key}`, parseError);
        }
      }
      
      // Remover dados e metadados
      await this.redis.del(fullKey, metaKey);
      return true;
    } catch (error) {
      logger.error(`Erro ao remover item do cache: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Limpa todos os itens do cache do namespace atual
   * 
   * @returns Número de itens removidos
   */
  async clear(): Promise<number> {
    try {
      const pattern = `${this.config.namespace}:${this.config.version}:*`;
      const keys = await this.scan(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      logger.info(`Cache limpo: ${keys.length} itens removidos`);
      return keys.length;
    } catch (error) {
      logger.error('Erro ao limpar cache', error);
      return 0;
    }
  }
  
  /**
   * Invalida cache por tags
   * 
   * @param tags Tags para invalidar
   * @returns Número de itens invalidados
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let keysToRemove: string[] = [];
      const pipeline = this.redis.pipeline();
      
      for (const tag of tags) {
        const tagKey = `${this.config.namespace}:tag:${tag}`;
        const taggedKeys = await this.redis.smembers(tagKey) as string[];
        
        if (taggedKeys.length) {
          keysToRemove = [...keysToRemove, ...taggedKeys];
          
          // Adicionar metadados
          const metaKeys = taggedKeys.map(key => `${key}:meta`);
          keysToRemove = [...keysToRemove, ...metaKeys];
          
          // Limpar o set de tags
          pipeline.del(tagKey);
        }
      }
      
      // Remover duplicatas
      const uniqueKeys = [...new Set(keysToRemove)];
      
      if (uniqueKeys.length > 0) {
        pipeline.del(...uniqueKeys);
      }
      
      await pipeline.exec();
      
      const itemCount = uniqueKeys.length / 2; // Dividir por 2 porque contamos dados e metadados
      logger.info(`Cache invalidado por tags ${tags.join(', ')}: ${itemCount} itens removidos`);
      return itemCount;
    } catch (error) {
      logger.error('Erro ao invalidar cache por tags', error);
      return 0;
    }
  }
  
  /**
   * Obtém estatísticas do cache
   * 
   * @returns Estatísticas do cache
   */
  async getStats(): Promise<CacheStats> {
    try {
      // Buscar todas as chaves no namespace
      const pattern = `${this.config.namespace}:${this.config.version}:*`;
      const allKeys = await this.scan(pattern);
      
      // Filtrar apenas chaves de dados (excluir metadados)
      const dataKeys = allKeys.filter(key => !key.endsWith(':meta'));
      
      // Buscar todas as tags
      const tagPattern = `${this.config.namespace}:tag:*`;
      const tagKeys = await this.scan(tagPattern);
      
      // Contar itens por tag
      const tagCounts: Record<string, number> = {};
      
      for (const tagKey of tagKeys) {
        const tag = tagKey.replace(`${this.config.namespace}:tag:`, '');
        const count = await this.redis.scard(tagKey);
        tagCounts[tag] = count;
      }
      
      return {
        totalKeys: dataKeys.length,
        tagCounts
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do cache', error);
      return {
        totalKeys: 0,
        tagCounts: {}
      };
    }
  }
  
  /**
   * Atualiza o TTL de uma chave
   * 
   * @param key Chave do item
   * @param ttl Novo TTL em segundos
   * @returns true se atualizado com sucesso
   */
  async updateTtl(key: string, ttl: number): Promise<boolean> {
    try {
      const fullKey = this.getKeyName(key);
      const metaKey = this.getMetaKeyName(key);
      
      const pipeline = this.redis.pipeline();
      pipeline.expire(fullKey, ttl);
      pipeline.expire(metaKey, ttl);
      
      await pipeline.exec();
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar TTL: ${key}`, error);
      return false;
    }
  }
  
  /**
   * Escaneia as chaves que correspondem a um padrão
   * 
   * @param pattern Padrão para busca
   * @returns Lista de chaves encontradas
   */
  private async scan(pattern: string): Promise<string[]> {
    try {
      let cursor = 0;
      const keys: string[] = [];
      
      // Implementação do SCAN do Redis
      do {
        const reply = await this.redis.scan(cursor, { match: pattern, count: 100 });
        cursor = parseInt(reply[0] as string, 10);
        const batch = reply[1] as string[];
        
        keys.push(...batch);
      } while (cursor !== 0);
      
      return keys;
    } catch (error) {
      logger.error(`Erro ao escanear chaves: ${pattern}`, error);
      return [];
    }
  }
}