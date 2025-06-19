// src/domains/congresso/components/ParlamentarLists/SenadoresListUF.tsx
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
import type { Senador } from "@domains/republica/congresso/senado/types/index";

interface SenadoresListUFProps {
  uf: string;
}

type SenadorArray = Senador[];

const SenadoresListUF: React.FC<SenadoresListUFProps> = ({ uf }) => {
  const [retryCount, setRetryCount] = useState<number>(0);

  const {
    data: senadores = [] as SenadorArray,
    isLoading,
    error: queryError,
    refetch
  } = useQuery<SenadorArray, Error>({
    queryKey: ['senadores', uf], // Adiciona UF à queryKey para cache específico por estado
    queryFn: async () => {
      try {
        logger.info(`Buscando senadores do Firestore para UF: ${uf}`);
        
        // Acessar a coleção de senadores e filtrar pela UF
        // Assumindo que os documentos de senadores têm um campo 'siglaUf' ou 'UfParlamentar'
        const senadoresCollectionRef = collection(db, 'congressoNacional/senadoFederal/atual/senadores/itens');
        const q = query(senadoresCollectionRef, where("siglaUf", "==", uf.toUpperCase())); // Ajustar campo e valor conforme necessário
        
        const senadoresSnapshot = await getDocs(q);

        if (senadoresSnapshot.empty) {
          logger.warn(`Nenhum senador encontrado no Firestore para UF: ${uf}`);
          // Não lançar erro aqui, apenas retornar array vazio se for o comportamento esperado
          return []; 
        }

        const senadoresList = senadoresSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            nome: data.nome || data.NomeParlamentar,
            nomeCivil: data.nomeCivil || data.NomeCivilParlamentar,
            siglaPartido: data.partido?.sigla || data.siglaPartido || data.SiglaPartidoParlamentar,
            siglaUf: data.uf || data.siglaUf || data.UfParlamentar,
            urlFoto: data.foto || data.urlFoto || data.UrlFotoParlamentar,
            email: data.email || data.EmailParlamentar
          } as Senador;
        });

        logger.info(`Carregados ${senadoresList.length} senadores do Firestore para UF: ${uf}`);
        return senadoresList;

      } catch (error) {
        logger.error(`Erro ao carregar senadores do Firestore para UF ${uf}:`, error);
        if (retryCount < 3) {
          logger.info(`Tentando novamente (${retryCount + 1}/3) em 1 segundo...`);
          setRetryCount(prevCount => prevCount + 1);
          throw new Error('Tentando novamente...');
        }
        throw new Error(`Não foi possível carregar os senadores para ${uf}`);
      }
    },
    retry: false,
    enabled: !!uf // A query só será executada se UF estiver definida
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
        <AlertTitle>Erro ao carregar Senadores</AlertTitle>
        <AlertDescription>
          {queryError.message}
          <button onClick={handleReload} className="ml-2 underline">Tentar novamente</button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="py-4">
      {senadores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {senadores.map((senador) => (
            <Card key={senador.id || createId()} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{senador.nome || 'Nome não disponível'}</CardTitle>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {senador.siglaPartido || '?'} - {senador.siglaUf || '?'}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  {senador.urlFoto ? (
                    <img
                      src={senador.urlFoto}
                      alt={senador.nome || 'Senador'}
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        const parent = target.parentNode;
                        if (parent) {
                          const div = document.createElement('div');
                          div.className = "w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl dark:bg-gray-700 dark:text-blue-300";
                          const nome = senador.nome || 'SN';
                          const initials = nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                          div.textContent = initials;
                          parent.replaceChild(div, target);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl dark:bg-gray-700 dark:text-blue-300">
                      {senador.nome ? senador.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'SN'}
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Email: {senador.email || 'Não disponível'}</div>
                    <div className="flex space-x-2 mt-2">
                      <Link
                        to="/senador/$id" params={{ id: String(senador.id) }}
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
          <p className="text-lg text-gray-600 dark:text-gray-400">Nenhum senador encontrado para esta UF.</p>
        </div>
      )}
    </div>
  );
};

export default SenadoresListUF;
