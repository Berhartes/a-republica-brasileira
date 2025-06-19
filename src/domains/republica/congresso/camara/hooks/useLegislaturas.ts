import { useQuery } from '@tanstack/react-query';
import { getLegislaturas, Legislatura } from '../services/legislatura.service';

export function useLegislaturas() {
  return useQuery<Legislatura[], Error>({
    queryKey: ['legislaturas'],
    queryFn: getLegislaturas,
    staleTime: Infinity, // As legislaturas raramente mudam
  });
}
