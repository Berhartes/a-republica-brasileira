// src/domains/congresso/camara/hooks/useDespesasDeputado.ts
import { useQuery } from '@tanstack/react-query';
import { camaraApiService } from '../services';
import { Despesa } from '../schemas';

export interface UseDespesasDeputadoParams {
  ano?: number;
  mes?: number;
  cnpjCpf?: string;
  itens?: number;
  pagina?: number;
  ordenarPor?: string;
  ordem?: 'asc' | 'desc';
}

export function useDespesasDeputado(
  deputadoId: number, 
  params?: UseDespesasDeputadoParams
) {
  return useQuery<Despesa[], Error>({
    queryKey: ['deputado', deputadoId, 'despesas', params],
    queryFn: () => camaraApiService.getDeputadoDespesas(deputadoId, params),
    staleTime: 1000 * 60 * 30, // 30 minutes
    enabled: !!deputadoId && deputadoId > 0,
  });
}