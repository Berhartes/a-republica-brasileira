import { Redis } from '@upstash/redis';
import { CacheService } from './cache.service';
import { logger } from '@/core/monitoring';

// Exportar tipos
export * from './types';
// Re-exportar apenas tipos não presentes em './types'
export type { CacheService } from './cache.service';

// Criar e exportar instância do Redis
let redis: Redis;

// Criar um mock do Redis para ambiente de desenvolvimento
const createMockRedis = () => {
  logger.warn('Usando mock do Redis para ambiente de desenvolvimento');
  const mockStore = new Map<string, { value: string; expiry?: number }>();
  
  return {
    get: async (key: string) => {
      const item = mockStore.get(key);
      if (!item) return null;
      if (item.expiry && item.expiry < Date.now()) {
        mockStore.delete(key);
        return null;
      }
      return item.value;
    },
    set: async (key: string, value: string, options?: { ex?: number }) => {
      const expiry = options?.ex ? Date.now() + (options.ex * 1000) : undefined;
      mockStore.set(key, { value, expiry });
      return 'OK';
    },
    del: async (...keys: string[]) => keys.length,
    exists: async (key: string) => mockStore.has(key) ? 1 : 0,
    ttl: async (key: string) => {
      const item = mockStore.get(key);
      if (!item || !item.expiry) return -1;
      return Math.ceil((item.expiry - Date.now()) / 1000);
    },
    sadd: async () => 1,
    srem: async () => 1,
    smembers: async () => [],
    scard: async () => 0,
    expire: async () => true,
    scan: async () => [0, []],
    pipeline: () => ({
      set: () => ({}),
      del: () => ({}),
      sadd: () => ({}),
      srem: () => ({}),
      expire: () => ({}),
      exec: async () => []
    }),
    ping: async () => 'PONG'
  } as unknown as Redis;
};

// Usar mock do Redis para evitar erros no navegador
redis = createMockRedis();

// Criar e exportar instância do serviço de cache
export const cacheService = new CacheService();

export default cacheService;
