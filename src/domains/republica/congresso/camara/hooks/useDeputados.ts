// src/domains/congresso/camara/hooks/useDeputados.ts
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { getDeputadosFromFirestore, UseDeputadosFirestoreParams } from '../services/firestore.service';
import { Deputado } from '../schemas';

export function useDeputados(
  params?: UseDeputadosFirestoreParams,
  options?: Omit<UseQueryOptions<Deputado[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Deputado[], Error>({
    queryKey: ['deputados', params],
    queryFn: () => getDeputadosFromFirestore(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
}
