// src/domains/congresso/components/ParlamentarLists/DeputadosListUF.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { logger } from "@/app/monitoring/logger";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { db } from "@/shared/services/firebase";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { createId } from '@paralleldrive/cuid2';
import type { Deputado } from "@domains/republica/congresso/camara/schemas";

interface DeputadosListUFProps {
  uf: string;
}

type DeputadoArray = Deputado[];

const DeputadosListUF: React.FC<DeputadosListUFProps> = ({ uf }) => {
  const [retryCount, setRetryCount] = useState<number>(0);

  const {
    data: deputados = [] as DeputadoArray,
    isLoading,
    error: queryError,
    refetch
  } = useQuery<DeputadoArray, Error>({
    queryKey: ['deputados', uf], // Adiciona UF à queryKey para cache específico por estado
    queryFn: async () => {
      try {
        logger.info(`Buscando deputados do Firestore para UF: ${uf}`);
        
        const deputadosCollectionRef = collection(db, 'congressoNacional/camaraDeputados/legislatura/57/deputados');
        const q = query(deputadosCollectionRef, where("siglaUf", "==", uf.toUpperCase()));
        
        const deputadosSnapshot = await getDocs(q);

        if (deputadosSnapshot.empty) {
          logger.warn(`Nenhum deputado encontrado no Firestore para UF: ${uf}`);
          return []; 
        }

        const deputadosList = deputadosSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.nome || data.nomeParlamentar || data.NomeParlamentar,
            nomeCivil: data.nomeCivil || data.NomeCivilParlamentar,
            siglaPartido: data.siglaPartido || data.partido?.sigla || data.SiglaPartidoParlamentar,
            siglaUf: data.siglaUf || data.uf || data.UfParlamentar,
            urlFoto: data.urlFoto || data.foto || data.UrlFotoParlamentar,
            email: data.email || data.EmailParlamentar
          } as Deputado;
        });

        logger.info(`Carregados ${deputadosList.length} deputados do Firestore para UF: ${uf}`);
        return deputadosList;

      } catch (error) {
        logger.error(`Erro ao carregar deputados do Firestore para UF ${uf}:`, error);
        if (retryCount < 3) {
          logger.info(`Tentando novamente (${retryCount + 1}/3) em 1 segundo...`);
          setRetryCount(prevCount => prevCount + 1);
          throw new Error('Tentando novamente...');
        }
        throw new Error(`Não foi possível carregar os deputados para ${uf}`);
      }
    },
    retry: false,
    enabled: !!uf 
  });

  function handleReload() {
    setRetryCount(0);
    refetch();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner />
      </div>
    );
  }

  if (queryError) {
    return (
      <Alert variant="destructive" className="my-4">
        <InfoCircledIcon className="h-4 w-4" />
        <AlertTitle>Erro ao carregar Deputados</AlertTitle>
        <AlertDescription>
          {queryError.message}
          <button onClick={handleReload} className="ml-2 underline">Tentar novamente</button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="py-4">
      {deputados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deputados.map((deputado) => (
            <Card key={deputado.id || createId()} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{deputado.nome || 'Nome não disponível'}</CardTitle>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {deputado.siglaPartido || '?'} - {deputado.siglaUf || '?'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  {deputado.urlFoto ? (
                    <img
                      src={deputado.urlFoto}
                      alt={deputado.nome || 'Deputado'}
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        const parent = target.parentNode;
                        if (parent) {
                          const div = document.createElement('div');
                          div.className = "w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl dark:bg-gray-700 dark:text-blue-300";
                          const nome = deputado.nome || 'DP';
                          const initials = nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                          div.textContent = initials;
                          parent.replaceChild(div, target);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl dark:bg-gray-700 dark:text-blue-300">
                      {deputado.nome ? deputado.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DP'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Email: {deputado.email || 'Não disponível'}</div>
                    <div className="flex space-x-2 mt-2">
                      <Link
                        to="/deputado/$id" params={{ id: String(deputado.id) }}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors inline-block dark:bg-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-600"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum deputado encontrado para esta UF.</p>
        </div>
      )}
    </div>
  );
};

export default DeputadosListUF;
