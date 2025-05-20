// src/domains/congresso/pages/SenadoPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { logger } from "@/app/monitoring/logger";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { db } from "@/shared/services/firebase";
import { collection, getDocs } from 'firebase/firestore';
import { createId } from '@paralleldrive/cuid2';
import type { Senador } from "@/domains/congresso/senado/types/index";

interface SenadoPageProps {}

type SenadorArray = Senador[];

const SenadoPage: React.FC<SenadoPageProps> = () => {
  const [retryCount, setRetryCount] = useState<number>(0);

  // Usar TanStack Query para gerenciamento de estado e cache
  const {
    data: senadores = [] as SenadorArray,
    isLoading,
    error,
    refetch
  } = useQuery<SenadorArray, Error>({
    queryKey: ['senadores'],
    queryFn: async () => {
      try {
        logger.info('Buscando senadores do Firestore');

        // Acessar a coleção de senadores atuais no Firestore
        const senadoresRef = collection(db, 'congressoNacional/senadoFederal/atual/senadores/itens');
        const senadoresSnapshot = await getDocs(senadoresRef);

        if (senadoresSnapshot.empty) {
          logger.warn('Nenhum senador encontrado no Firestore');
          throw new Error('Nenhum senador encontrado');
        }

        // Converter os documentos do Firestore em objetos Senador
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
          };
        }) as Senador[];

        logger.info(`Carregados ${senadoresList.length} senadores do Firestore`);
        return senadoresList;

      } catch (error) {
        logger.error('Erro ao carregar senadores do Firestore:', error);

        // Sistema de retry com limite máximo de 3 tentativas
        if (retryCount < 3) {
          logger.info(`Tentando novamente (${retryCount + 1}/3) em 1 segundo...`);
          setRetryCount(prevCount => prevCount + 1);
          throw new Error('Tentando novamente...');
        }

        throw new Error('Não foi possível carregar os senadores');
      }
    },
    retry: false // Desabilitar retry automático para gerenciar manualmente
  });

  function handleReload() {
    setRetryCount(0);
    refetch();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Senado Federal</h1>
        <div className="flex space-x-2">
          <Link
            to="/senado/dados-etl"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Visualizar Dados ETL
          </Link>
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Atualizar Dados'}
          </button>
        </div>
      </div>

      {error && (
        <Alert className="mb-4" variant="destructive">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Adicionar informação de depuração */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
        <p>Status: {isLoading ? 'Carregando' : 'Carregado'}</p>
        <p>Senadores carregados: {senadores.length}</p>
        <p>Tentativas: {retryCount}/3</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {senadores.length > 0 ? (
            senadores.map((senador) => (
              <Card key={senador.id || createId()} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{senador.nome || 'Nome não disponível'}</CardTitle>
                  <div className="text-sm text-gray-500">
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

                          // Use a div with initials instead of an image
                          const parent = target.parentNode;
                          if (parent) {
                            const div = document.createElement('div');
                            div.className = "w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl";
                            const nome = senador.nome || 'SN';
                            const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('');
                            div.textContent = initials;
                            parent.replaceChild(div, target);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                        {senador.nome ? senador.nome.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SN'}
                      </div>
                    )}
                    <div>
                      <div>Email: {senador.email || 'Não disponível'}</div>
                      <div className="flex space-x-2 mt-2">
                        <Link
                          to="/senador/$id" params={{ id: String(senador.id) }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors inline-block"
                        >
                          Ver detalhes
                        </Link>
                        <Link
                          to="/senador/$id" params={{ id: String(senador.id) }}
                          className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition-colors inline-block"
                        >
                          Ver perfil
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600">Nenhum senador encontrado.</p>
              <p className="mt-2 text-sm text-gray-500">Tente atualizar os dados ou verificar a conexão com a API.</p>
              <button
                onClick={handleReload}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SenadoPage;
