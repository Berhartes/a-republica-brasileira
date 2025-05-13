/**
 * Tipos compartilhados entre todos os domínios
 * Interfaces e tipos que são utilizados em mais de um domínio
 */

// Interfaces base
export interface EntityBase {
    id: string | number;
    createdAt?: Date;
    updatedAt?: Date;
  }
  
  export interface ResponseBase<T> {
    data: T;
    success: boolean;
    error?: ErrorResponse;
  }
  
  export interface ErrorResponse {
    code: string;
    message: string;
    details?: unknown;
  }
  
  export interface PaginatedResponse<T> extends ResponseBase<T[]> {
    pagination: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  }
  
  // Tipos para opções de query
  export interface QueryOptions {
    page?: number;
    pageSize?: number;
    filter?: Record<string, unknown>;
    sort?: {
      field: string;
      direction: 'asc' | 'desc';
    };
  }
  
  // Tipos para opções de cache
  export interface CacheOptions {
    enabled?: boolean;
    ttl?: number; // em ms
  }
  
  // União discriminada para estados de carregamento
  export type LoadingState = 
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: unknown }
    | { status: 'error'; error: ErrorResponse };