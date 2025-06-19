// src/shared/hooks/usePagination/index.ts
import { useState, useCallback, useMemo } from 'react';
import { logger } from '@/shared/utils/logger';

/**
 * Interface para configuração de paginação
 * @template T - Tipo dos dados paginados
 */
export interface PaginationParams<T> {
  /** Dados iniciais para paginação (opcional) */
  initialData?: T[];
  /** Tamanho da página (padrão: 10) */
  pageSize?: number;
  /** Página inicial (padrão: 1) */
  initialPage?: number;
  /** Total de itens (se conhecido previamente) */
  totalItems?: number;
}

/**
 * Interface para resultados da paginação
 * @template T - Tipo dos dados paginados
 */
export interface PaginationResult<T> {
  /** Página atual */
  page: number;
  /** Tamanho da página */
  pageSize: number;
  /** Total de páginas */
  totalPages: number;
  /** Total de itens */
  totalItems: number;
  /** Dados paginados para a página atual */
  paginatedData: T[];
  /** Se existe página anterior */
  hasPrevPage: boolean;
  /** Se existe próxima página */
  hasNextPage: boolean;
  /** Função para paginar dados */
  paginate: (data: T[], page?: number) => {
    data: T[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  /** Função para obter itens de uma página específica */
  pageItems: (data: T[]) => T[];
  /** Função para ir para próxima página */
  nextPage: () => void;
  /** Função para voltar para página anterior */
  prevPage: () => void;
  /** Função para ir para página específica */
  setCurrentPage: (page: number) => void;
  /** Função para alterar tamanho da página */
  setPageSize: (size: number) => void;
  /** Função para ir para primeira página */
  firstPage: () => void;
  /** Função para ir para última página */
  lastPage: () => void;
}

/**
 * Hook genérico para gerenciamento de paginação
 * @template T - Tipo dos dados a serem paginados
 * @param {PaginationParams<T>} params - Parâmetros de configuração
 * @returns {PaginationResult<T>} Objeto com estado e métodos de paginação
 */
export function usePagination<T>({
  initialData = [],
  pageSize = 10,
  initialPage = 1,
  totalItems: externalTotalItems
}: PaginationParams<T> = {}): PaginationResult<T> {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);
  const [paginatedData, setPaginatedData] = useState<T[]>(initialData.slice(0, pageSize));
  const [internalTotalItems, setInternalTotalItems] = useState<number>(initialData.length);

  // Determinar o total de itens - externo ou calculado internamente
  const totalItems = useMemo(() => {
    return externalTotalItems !== undefined ? externalTotalItems : internalTotalItems;
  }, [externalTotalItems, internalTotalItems]);

  // Calcular total de páginas
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / currentPageSize));
  }, [totalItems, currentPageSize]);

  // Verificar se há página anterior/próxima
  const hasPrevPage = useMemo(() => currentPage > 1, [currentPage]);
  const hasNextPage = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  /**
   * Função principal para paginar dados
   * @param data Array de dados a paginar
   * @param page Página específica (opcional)
   * @returns Objeto com dados paginados e metadados
   */
  const paginate = useCallback((data: T[], page: number = currentPage) => {
    try {
      const totalItems = data.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / currentPageSize));
      const validPage = Math.min(Math.max(1, page), totalPages);
      
      if (validPage !== page) {
        logger.warn(`Página ${page} está fora dos limites. Ajustado para ${validPage}.`);
      }

      const startIndex = (validPage - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      const paginatedItems = data.slice(startIndex, endIndex);
      
      setCurrentPage(validPage);
      setPaginatedData(paginatedItems);
      setInternalTotalItems(totalItems);
      
      return {
        data: paginatedItems,
        page: validPage,
        pageSize: currentPageSize,
        totalItems,
        totalPages
      };
    } catch (error) {
      logger.error('Erro ao paginar dados:', error);
      return {
        data: [],
        page: 1,
        pageSize: currentPageSize,
        totalItems: 0,
        totalPages: 1
      };
    }
  }, [currentPage, currentPageSize]);

  /**
   * Função para obter itens da página atual
   * @param data Array completo de dados
   * @returns Itens correspondentes à página atual
   */
  const pageItems = useCallback((data: T[]): T[] => {
    const startIndex = (currentPage - 1) * currentPageSize;
    const endIndex = startIndex + currentPageSize;
    return data.slice(startIndex, endIndex);
  }, [currentPage, currentPageSize]);

  /**
   * Avança para próxima página
   */
  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  /**
   * Volta para página anterior
   */
  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  /**
   * Vai para primeira página
   */
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  /**
   * Vai para última página
   */
  const lastPage = useCallback(() => {
    setCurrentPage(totalPages);
  }, [totalPages]);

  /**
   * Altera o tamanho da página
   */
  const setPageSize = useCallback((size: number) => {
    if (size < 1) {
      logger.warn(`Tamanho de página inválido: ${size}. Deve ser maior que 0.`);
      return;
    }
    setCurrentPageSize(size);
    // Ajustar página atual se necessário
    const newTotalPages = Math.ceil(totalItems / size);
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, totalItems]);

  return {
    page: currentPage,
    pageSize: currentPageSize,
    totalPages,
    totalItems,
    paginatedData,
    hasPrevPage,
    hasNextPage,
    paginate,
    pageItems,
    nextPage,
    prevPage,
    setCurrentPage,
    setPageSize,
    firstPage,
    lastPage
  };
}