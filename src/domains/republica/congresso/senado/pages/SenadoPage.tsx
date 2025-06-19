// src/domains/congresso/pages/SenadoPage.tsx
import React, { useState, useEffect } from 'react';
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
import type { Senador } from "@domains/republica/congresso/senado/types/index";

interface SenadoPageProps {}

type SenadorArray = Senador[];

const SenadoPage: React.FC<SenadoPageProps> = () => {
  const [retryCount, setRetryCount] = useState<number>(0);
  const [filtroEmExercicio, setFiltroEmExercicio] = useState<boolean>(true); // Default para mostrar em exercício
  const [filtroPartido, setFiltroPartido] = useState<string>('Todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('Todos');
  const [favoriteSenadores, setFavoriteSenadores] = useState<any>({});

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteSenadores') || '{}');
    setFavoriteSenadores(favorites);
  }, []);

  // Usar TanStack Query para gerenciamento de estado e cache
  const {
    data: senadores = [] as SenadorArray,
    isLoading,
    error: queryError, // Renomeado para queryError
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

  const partidosUnicos = React.useMemo(() => {
    if (!senadores) return [];
    const partidos = new Set(senadores.map(s => s.siglaPartido).filter(Boolean));
    return Array.from(partidos).sort();
  }, [senadores]);

  const estadosUnicos = React.useMemo(() => {
    if (!senadores) return [];
    const ufs = new Set(senadores.map(s => s.siglaUf).filter(Boolean));
    return Array.from(ufs).sort();
  }, [senadores]);

  const senadoresFiltrados = React.useMemo(() => {
    return senadores.filter(senador => {
      // TODO: Implementar filtro "Em exercício" quando o dado estiver disponível
      // if (filtroEmExercicio && !senador.emExercicio) return false; 
      if (filtroPartido !== 'Todos' && senador.siglaPartido !== filtroPartido) return false;
      if (filtroEstado !== 'Todos' && senador.siglaUf !== filtroEstado) return false;
      return true;
    });
  }, [senadores, filtroEmExercicio, filtroPartido, filtroEstado]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Senado Federal</h1>
        {/* Botões Visualizar Dados ETL e Atualizar Dados removidos */}
      </div>

      {queryError && (
        <Alert className="mb-4" variant="destructive">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{queryError.message}</AlertDescription>
        </Alert>
      )}

      {/* Painel de status removido */}

      {/* Painel de Filtros */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-3">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filtro-exercicio-senado" className="flex items-center space-x-2 cursor-pointer">
              <input 
                type="checkbox" 
                id="filtro-exercicio-senado" 
                className="form-checkbox h-5 w-5 text-emerald-600 rounded" 
                checked={filtroEmExercicio}
                onChange={(e) => setFiltroEmExercicio(e.target.checked)}
              />
              <span>Em exercício</span>
            </label>
          </div>
          <div>
            <label htmlFor="filtro-partido-senado" className="block text-sm font-medium text-gray-700">Partido</label>
            <select 
              id="filtro-partido-senado" 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              value={filtroPartido}
              onChange={(e) => setFiltroPartido(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {partidosUnicos.map(partido => (
                <option key={partido} value={partido}>{partido}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filtro-estado-senado" className="block text-sm font-medium text-gray-700">Estado (UF)</label>
            <select 
              id="filtro-estado-senado" 
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {senadoresFiltrados.length > 0 ? (
            senadoresFiltrados
              .sort((a, b) => {
                const aIsFavorite = !!favoriteSenadores[a.id];
                const bIsFavorite = !!favoriteSenadores[b.id];
                if (aIsFavorite && !bIsFavorite) return -1;
                if (!aIsFavorite && bIsFavorite) return 1;
                return 0;
              })
              .map((senador: Senador) => (
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
                            const initials = nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('');
                            div.textContent = initials;
                            parent.replaceChild(div, target);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                        {senador.nome ? senador.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'SN'}
                      </div>
                    )}
                    <div>
                      <div>Email: {senador.email || 'Não disponível'}</div>
                      <div className="flex space-x-2 mt-2">
                        {/* Botão "Ver detalhes" removido */}
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
