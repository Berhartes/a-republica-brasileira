import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClientSave } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { logger } from '@/app/monitoring';

// Create the queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 60, // 1 hora
      retry: 1,
      refetchOnWindowFocus: import.meta.env.PROD
    
    },
    mutations: {
      retry: 1
    }
  }
});

// Configurar persistência de cache se estiver em produção
if (import.meta.env.PROD) {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'REPUBLICA_QUERY_CACHE',
    throttleTime: 1000,
  });

  persistQueryClientSave({
    queryClient,
    persister: localStoragePersister,
    // A propriedade maxAge não está disponível no tipo PersistedQueryClientSaveOptions
    // Removendo para evitar erro de tipo
  });
}

interface QueryProviderProps {
  children: ReactNode;
  showDevtools?: boolean;
}

export function QueryProvider({ 
  children, 
  showDevtools = import.meta.env.DEV
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {showDevtools && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
