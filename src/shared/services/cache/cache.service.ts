export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
}

export class CacheService {
  private static instance: CacheService;
  private redis: any; // Mock for Redis

  constructor() {
    // Este é um mock básico do Redis para o serviço de cache
    this.redis = {
      get: async <T>(key: string): Promise<T | null> => null,
      set: async (key: string, value: any, options?: { ttl?: number }): Promise<void> => {},
      del: async (key: string): Promise<void> => {},
      smembers: async <T>(key: string): Promise<T[]> => [],
      scan: async () => [0, []],
      sadd: async (key: string, ...members: string[]): Promise<void> => {},
      srem: async (key: string, ...members: string[]): Promise<void> => {},
      mget: async <T>(...keys: string[]): Promise<(T | null)[]> => [],
      expire: async (key: string, ttl: number): Promise<void> => {},
    };
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.redis.get(key) as T | null;
    } catch (error) {
      console.error(`Erro ao obter cache para ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 3600; // 1 hora padrão
      await this.redis.set(key, value, { ttl });

      // Adiciona tags para rastreamento
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          const tagKey = `tag:${tag}`;
          await this.redis.sadd(tagKey, key);
        }
      }
    } catch (error) {
      console.error(`Erro ao definir cache para ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Erro ao deletar cache para ${key}:`, error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tag:${tag}`;
      const taggedKeys = await this.redis.smembers(tagKey) as string[];
      
      if (taggedKeys && taggedKeys.length > 0) {
        // Remover as chaves de dados
        for (const key of taggedKeys) {
          await this.redis.del(key);
        }
        
        // Remover as chaves de metadados associadas
        const metaKeys = taggedKeys.map(key => `${key}:meta`);
        for (const metaKey of metaKeys) {
          await this.redis.del(metaKey);
        }
      }
      
      // Limpar a entrada da tag
      await this.redis.del(tagKey);
    } catch (error) {
      console.error(`Erro ao invalidar cache por tag ${tag}:`, error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      let cursor = 0;
      const pattern = '*';
      
      do {
        const reply = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = reply[0] as number;
        const keys = reply[1];
        
        if (keys.length > 0) {
          for (const key of keys) {
            await this.redis.del(key);
          }
        }
      } while (cursor !== 0);
      
    } catch (error) {
      console.error('Erro ao limpar todos os caches:', error);
    }
  }
}

export const cacheService = CacheService.getInstance();
