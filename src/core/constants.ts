/**
 * Constantes compartilhadas entre todos os domínios
 */

// Tempos para cache e timeouts
export const TIMEOUTS = {
  API_REQUEST: 30000, // 30 segundos
  RETRY_DELAY: 2000,  // 2 segundos
};

export const CACHE = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutos
  SHORT_TTL: 60 * 1000,       // 1 minuto
  LONG_TTL: 60 * 60 * 1000,   // 1 hora
};

// Códigos de erro compartilhados
export const ERROR_CODES = {
  NOT_FOUND: 'ENTITY_NOT_FOUND',
  FORBIDDEN: 'ACCESS_FORBIDDEN',
  VALIDATION: 'VALIDATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'REQUEST_TIMEOUT',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

// Limites de paginação
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Estados brasileiros
export const ESTADOS = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

// Regiões do Brasil
export const REGIOES = {
  NORTE: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  NORDESTE: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  CENTRO_OESTE: ['DF', 'GO', 'MT', 'MS'],
  SUDESTE: ['ES', 'MG', 'RJ', 'SP'],
  SUL: ['PR', 'RS', 'SC'],
};