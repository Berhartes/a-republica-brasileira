// src/domains/congresso/camara/hooks/useDeputados.ts
import { useQuery } from '@tanstack/react-query';
import { camaraApiService } from '../services';
import { Deputado } from '../types';

export interface UseDeputadosParams {
  ordem?: 'asc' | 'desc';
  ordenarPor?: string;
  siglaUf?: string;
  siglaPartido?: string;
  nome?: string;
  pagina?: number;
  itens?: number;
}

export function useDeputados(params?: UseDeputadosParams) {
  return useQuery<Deputado[], Error>({
    queryKey: ['deputados', params],
    queryFn: () => camaraApiService.getDeputados(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}