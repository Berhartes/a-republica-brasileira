// src/domains/congresso/camara/hooks/useDeputado.ts
import { useQuery } from '@tanstack/react-query';
import { camaraApiService } from '../services';
import { DeputadoDetalhado } from '../schemas';

export function useDeputado(deputadoId: number) {
  return useQuery<DeputadoDetalhado, Error>({
    queryKey: ['deputado', deputadoId],
    queryFn: () => camaraApiService.getDeputado(deputadoId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!deputadoId && deputadoId > 0,
  });
}