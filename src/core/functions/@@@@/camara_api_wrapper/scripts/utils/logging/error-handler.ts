/**
 * Sistema de tratamento de erros para o ETL de dados do Senado Federal
 */
import { logger } from './logger';

export class WrapperError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(message);
    this.name = 'WrapperError';
    Object.setPrototypeOf(this, WrapperError.prototype);
  }
}

export class ApiError extends WrapperError {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    cause?: any
  ) {
    super(message, cause);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class NotFoundError extends ApiError {
  constructor(endpoint: string, message: string = 'Recurso não encontrado') {
    super(message, 404, endpoint);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Registra um erro no sistema de log e opcionalmente no armazenamento
 */
export function handleError(error: any, context: string): void {
  if (error instanceof WrapperError) {
    logger.error(`[${context}] ${error.message}`, error.cause);
  } else if (error instanceof Error) {
    logger.error(`[${context}] ${error.message}`, error);
  } else {
    logger.error(`[${context}] Erro desconhecido`, error);
  }

  // Aqui poderíamos adicionar código para salvar o erro no Firestore
  // quando estiver configurado
}

/**
 * Função para tentar executar uma operação com retentativas
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 2000,
  context: string = 'unknown'
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const isNotFound = error instanceof NotFoundError || 
                          (error instanceof ApiError && error.statusCode === 404);
                          
        // Não tentar novamente se for um erro de "não encontrado" ou um erro 400 (Bad Request)
        // pois provavelmente é um problema de configuração, não de conectividade
        if (isNotFound || (error instanceof ApiError && error.statusCode === 400)) {
          logger.warn(`[${context}] Erro ${isNotFound ? '404 (Not Found)' : '400 (Bad Request)'}, não tentando novamente.`);
          if (error instanceof ApiError && error.statusCode === 400) {
            logger.warn(`Possível problema de configuração de API ou parâmetros inválidos para ${context}`);
          }
          throw error;
        }
        
        logger.warn(`[${context}] Tentativa ${attempt} falhou, tentando novamente em ${retryDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      } else {
        logger.error(`[${context}] Todas as ${maxRetries} tentativas falharam`, error);
      }
    }
  }
  
  throw lastError;
}
