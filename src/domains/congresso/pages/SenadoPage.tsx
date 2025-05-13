// src/domains/congresso/pages/SenadoPage.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/components/ui/card";
import { senadoApiService } from "@/domains/congresso/senado/services";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { logger } from "@/app/monitoring/logger";
import { Alert, AlertTitle, AlertDescription } from "@/shared/components/ui/alert";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { createId } from '@paralleldrive/cuid2';
import type { Senador } from "@/domains/congresso/senado/types/index";

interface SenadoPageProps {}

type SenadorArray = Senador[] & { _isMocked?: boolean };

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
        logger.info('Buscando senadores da API do Senado');
        const response = await senadoApiService.buscarTodosSenadores();
        
        // Log detalhado da resposta para depuração
        logger.info(`Tipo da resposta: ${typeof response}`);
        logger.info(`É array? ${Array.isArray(response)}`);
        logger.info(`Tamanho: ${Array.isArray(response) ? response.length : 'N/A'}`);
        
        // Verificar se a resposta tem dados válidos
        if (response && Array.isArray(response) && response.length > 0) {
          logger.info(`Carregados ${response.length} senadores da API`);
          
          // Log do primeiro item para verificar a estrutura
          logger.info(`Estrutura do primeiro senador: ${JSON.stringify(response[0])}`);
          
          const senadorArray = Object.assign(response, { _isMocked: false }) as SenadorArray;
          return senadorArray;
        }
        
        // Se não tem dados, gerar mockados
        logger.warn('Nenhum senador encontrado na resposta, tentando gerar dados mockados');
        const mockSenadores = gerarSenadoresMockados();
        
        if (mockSenadores.length > 0) {
          logger.info(`Gerados ${mockSenadores.length} senadores mockados`);
          return mockSenadores;
        }
        
        throw new Error('Não foi possível carregar senadores, nem mesmo dados mockados');
      } catch (error) {
        logger.error('Erro ao carregar senadores:', error);
        
        // Sistema de retry com limite máximo de 3 tentativas
        if (retryCount < 3) {
          logger.info(`Tentando novamente (${retryCount + 1}/3) em 1 segundo...`);
          setRetryCount(prevCount => prevCount + 1);
          
          // Limpar cache antes de tentar novamente
          senadoApiService.limparCache();
          
          throw new Error('Tentando novamente...');
        } else {
          // Após 3 tentativas, usar dados de emergência
          const dadosEmergencia = gerarDadosEmergencia();
          return dadosEmergencia;
        }
      }
    },
    retry: false // Desabilitar retry automático para gerenciar manualmente
  });

  // Flag para indicar se estamos usando dados mockados
  const usandoDadosMock = senadores._isMocked || false;

  // Função de emergência que SEMPRE retorna alguns dados básicos
  function gerarDadosEmergencia(): SenadorArray {
    return Object.assign([
      {
        id: 1001,
        nome: "Senador Exemplo A",
        nomeCivil: "Senador Exemplo A",
        siglaPartido: "Partido A",
        urlFoto: "",
        siglaUf: "SP",
        email: "exemplo@senado.leg.br",
        sexo: "M",
      },
      {
        id: 1002,
        nome: "Senadora Exemplo B",
        nomeCivil: "Senadora Exemplo B",
        siglaPartido: "Partido B",
        urlFoto: "",
        siglaUf: "RJ",
        email: "exemploB@senado.leg.br",
        sexo: "F",
      },
      {
        id: 1003,
        nome: "Senador Exemplo C",
        nomeCivil: "Senador Exemplo C",
        siglaPartido: "Partido C",
        urlFoto: "",
        siglaUf: "MG",
        email: "exemploC@senado.leg.br",
        sexo: "M",
      }
    ], { _isMocked: true }) as SenadorArray;
  }

  // Função de mock independente da API 
  function gerarSenadoresMockados(): SenadorArray {
    const partidos = ['MDB', 'PT', 'PSDB', 'PL', 'UNIÃO', 'PP', 'PSD'];
    const estados = ['SP', 'RJ', 'MG', 'BA', 'RS', 'PR', 'PE', 'CE', 'PA', 'MA'];
    const nomes = [
      'Ana Silva', 'Carlos Oliveira', 'Patrícia Santos', 'Roberto Lima',
      'Fernanda Costa', 'José Pereira', 'Márcia Souza', 'Paulo Rodrigues',
      'Cláudia Ferreira', 'Antônio Almeida'
    ];

    const mockData = Array.from({ length: 10 }, (_, i) => ({
      id: 5000 + i,
      nome: nomes[i],
      nomeCivil: nomes[i],
      siglaPartido: partidos[Math.floor(Math.random() * partidos.length)],
      urlFoto: `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${5000 + i}.jpg`,
      siglaUf: estados[Math.floor(Math.random() * estados.length)],
      email: `senador${5000 + i}@senado.leg.br`,
      sexo: i % 2 === 0 ? 'M' : 'F',
      IdentificacaoParlamentar: {
        CodigoParlamentar: (5000 + i).toString(),
        NomeParlamentar: nomes[i],
        NomeCompletoParlamentar: nomes[i],
        SexoParlamentar: i % 2 === 0 ? 'M' : 'F',
        FormaTratamento: i % 2 === 0 ? 'Senador' : 'Senadora',
        UrlFotoParlamentar: `https://www.senado.leg.br/senadores/img/fotos-oficiais/senador${5000 + i}.jpg`,
        UrlPaginaParlamentar: `https://www.senado.leg.br/senadores/senador/${5000 + i}`,
        EmailParlamentar: `senador${5000 + i}@senado.leg.br`,
        SiglaPartidoParlamentar: partidos[Math.floor(Math.random() * partidos.length)],
        UfParlamentar: estados[Math.floor(Math.random() * estados.length)]
      }
    }));
    return Object.assign(mockData, { _isMocked: true }) as SenadorArray;
  }
  
  function handleReload() {
    setRetryCount(0);
    // Limpar o cache antes de recarregar os dados
    senadoApiService.limparCache();
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

      {usandoDadosMock && (
        <Alert className="mb-4" variant="warning">
          <InfoCircledIcon className="h-4 w-4" />
          <AlertTitle>Dados Simulados</AlertTitle>
          <AlertDescription>
            Exibindo dados simulados devido à indisponibilidade temporária da API do Senado.
          </AlertDescription>
        </Alert>
      )}

      {/* Adicionar informação de depuração */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
        <p>Status: {isLoading ? 'Carregando' : 'Carregado'}</p>
        <p>Senadores carregados: {senadores.length}</p>
        <p>Usando dados mock: {usandoDadosMock ? 'Sim' : 'Não'}</p>
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
                  <CardTitle className="text-lg">{senador.nome || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.NomeParlamentar) || 'Nome não disponível'}</CardTitle>
                  <div className="text-sm text-gray-500">
                    {senador.siglaPartido || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.SiglaPartidoParlamentar) || '?'} - {senador.siglaUf || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.UfParlamentar) || '?'}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    {(senador.urlFoto || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.UrlFotoParlamentar)) ? (
                      <img 
                        src={senador.urlFoto || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.UrlFotoParlamentar)} 
                        alt={senador.nome || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.NomeParlamentar) || 'Senador'} 
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          
                          // Use a div with initials instead of an image
                          const parent = target.parentNode;
                          if (parent) {
                            const div = document.createElement('div');
                            div.className = "w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl";
                            const nome = senador.nome || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.NomeParlamentar) || 'SN';
                            const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('');
                            div.textContent = initials;
                            parent.replaceChild(div, target);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                        {senador.nome ? senador.nome.split(' ').map(n => n[0]).slice(0, 2).join('') : 
                         (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.NomeParlamentar) ? 
                         senador.IdentificacaoParlamentar.NomeParlamentar.split(' ').map(n => n[0]).slice(0, 2).join('') : 'SN'}
                      </div>
                    )}
                    <div>
                      <div>Email: {senador.email || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.EmailParlamentar) || 'Não disponível'}</div>
                      <Link 
                        to={`/senado/senador/${senador.id || (senador.IdentificacaoParlamentar && senador.IdentificacaoParlamentar.CodigoParlamentar)}`}
                        className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors inline-block"
                      >
                        Ver detalhes
                      </Link>
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
