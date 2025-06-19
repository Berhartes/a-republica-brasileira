// Exportações do domínio Senado

// Schemas
export * from './schemas';

// Services
export * from './services';

// Re-exportar apenas o que não foi definido em types/index
import { Comissao as ComissaoSimples } from './schemas'; // Alterado de './types' para './schemas'
export type { ComissaoSimples };

// Errors - export without ApiError (which is also in types)
import {
  ValidationApiError,
  NotFoundApiError,
  ServerApiError,
  NetworkApiError,
  RateLimitApiError,
  CacheApiError
} from './errors';

export {
  ValidationApiError,
  NotFoundApiError,
  ServerApiError,
  NetworkApiError,
  RateLimitApiError,
  CacheApiError
};

// Transformers
export * from './transformers';

// Hooks
export * from './hooks';


// Hooks serão exportados posteriormente
