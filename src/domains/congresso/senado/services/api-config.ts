/**
 * Configuração de API do Senado
 */

import { Redis } from '@upstash/redis';

/**
 * URL base da API de dados abertos do Senado
 */
export const SENADO_API_BASE_URL = 'https://legis.senado.leg.br/dadosabertos';

/**
 * Configuração do cliente HTTP
 */
export const SENADO_API_CONFIG = {
  // Timeout em milissegundos
  timeout: 30000,
  
  // Número máximo de tentativas
  retries: 3,
  
  // Delay inicial entre tentativas (ms)
  initialRetryDelay: 1000,
  
  // Fator de backoff exponencial
  backoffFactor: 2,
  
  // Status de erro que devem ser retentados
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Headers padrão
  headers: {
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR',
    'User-Agent': 'A-Republica-Brasileira/1.0'
  }
};

/**
 * Configuração de cache
 */
export const SENADO_CACHE_CONFIG = {
  // Tempo de expiração padrão (ms) - 30 minutos
  defaultTTL: 30 * 60 * 1000,
  
  // Tempo de expiração para dados raramente atualizados (ms) - 1 dia
  longTTL: 24 * 60 * 60 * 1000,
  
  // Chave de prefix para cache
  keyPrefix: 'senado:',
  
  // Configuração específica por entidade (ms)
  ttlByEntity: {
    senadores: 12 * 60 * 60 * 1000,       // 12 horas
    senadorDetalhado: 12 * 60 * 60 * 1000, // 12 horas
    votacoes: 6 * 60 * 60 * 1000,         // 6 horas
    votacaoDetalhada: 6 * 60 * 60 * 1000, // 6 horas
    materias: 4 * 60 * 60 * 1000,         // 4 horas
    materiaDetalhada: 4 * 60 * 60 * 1000, // 4 horas
    despesas: 24 * 60 * 60 * 1000,        // 24 horas
    presencas: 12 * 60 * 60 * 1000        // 12 horas
  }
};

/**
 * Cliente Redis para cache
 */
// Criar um mock do Redis para ambiente de desenvolvimento
const createMockRedis = () => {
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
export const redisClient = createMockRedis();

/**
 * Endpoint para endpoints de parlamentares
 */
export const PARLAMENTARES_ENDPOINT = '/senador';

/**
 * Endpoint para endpoints de matérias
 */
export const MATERIAS_ENDPOINT = '/materia';

/**
 * Endpoint para endpoints de votações
 */
export const VOTACOES_ENDPOINT = '/votacao';

/**
 * Endpoint para despesas
 */
export const DESPESAS_ENDPOINT = '/senador/despesas';

/**
 * Endpoint para presença
 */
export const PRESENCAS_ENDPOINT = '/senador/presenca';
