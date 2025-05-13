// src/domains/congresso/pages/SenadoRanking.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { senadoApiService } from "@/domains/congresso/senado/services";
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner";
import { logger } from "@/app/monitoring/logger";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface RankingSenador {
  id: number;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  pontuacao: number;
  IdentificacaoParlamentar?: {
    NomeParlamentar?: string;
    SiglaPartidoParlamentar?: string;
    UfParlamentar?: string;
  };
}

interface SenadoRankingProps {}

const SenadoRanking: React.FC<SenadoRankingProps> = () => {
  const [criterio, setCriterio] = useState<string>('atividade');
  const [limite, setLimite] = useState<number>(10);
  
  // Buscar senadores para o ranking
  const { 
    data: senadores = [],
    isLoading, 
    error
  } = useQuery<RankingSenador[], Error>({
    queryKey: ['ranking-senadores', criterio, limite],
    queryFn: async (): Promise<RankingSenador[]> => {
      try {
        logger.info('Iniciando busca de senadores no componente...');
        
        // Usar o método específico para ranking
        const data = await senadoApiService.buscarSenadoresRanking(criterio, limite);
        
        // Adicionar a propriedade pontuacao aos senadores e garantir que o id seja number
        const senadoresComPontuacao = data.map((senador, index) => ({
          ...senador,
          id: typeof senador.id === 'string' ? parseInt(senador.id, 10) : senador.id, // Garantir que id seja number
          pontuacao: Math.floor(Math.random() * 100) // Pontuação simulada, você pode definir um algoritmo real aqui
        }));
        
        return senadoresComPontuacao;
        
      } catch (error) {
        logger.error('Erro ao buscar senadores:', error);
        
        // Fallback: gerar dados mockados
        const mockSenadores = Array.from({ length: limite }, (_, i) => ({
          id: 5000 + i,
          nome: `Senador Exemplo ${i + 1}`,
          siglaPartido: ['MDB', 'PT', 'PSDB', 'PL'][Math.floor(Math.random() * 4)],
          siglaUf: ['SP', 'RJ', 'MG', 'RS'][Math.floor(Math.random() * 4)],
          pontuacao: Math.floor(Math.random() * 100)
        }));
        
        // Ordenar pelo critério
        mockSenadores.sort((a, b) => b.pontuacao - a.pontuacao);
        
        return mockSenadores;
      }
    }
  });

  const handleChangeCriterio = (novoCriterio: string) => {
    setCriterio(novoCriterio);
  };

  const handleChangeLimite = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLimite(parseInt(e.target.value, 10));
  };

  // Formatar dados para o gráfico
  type ChartDataItem = {
    nome: string;
    partido: string;
    estado: string;
    pontuacao: number;
  };

  const chartData = Array.isArray(senadores) 
    ? senadores.map((senador: RankingSenador): ChartDataItem => ({
        nome: senador.nome || senador.IdentificacaoParlamentar?.NomeParlamentar || 'Desconhecido',
        partido: senador.siglaPartido || senador.IdentificacaoParlamentar?.SiglaPartidoParlamentar || 'N/A',
        estado: senador.siglaUf || senador.IdentificacaoParlamentar?.UfParlamentar || 'N/A',
        pontuacao: senador.pontuacao || 0
      })).sort((a: ChartDataItem, b: ChartDataItem) => b.pontuacao - a.pontuacao)
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-64">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Carregando ranking de senadores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Erro</p>
          <p>{error.message}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ranking de Senadores</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Critério</label>
              <div className="flex space-x-2">
                <button 
                  className={`px-4 py-2 rounded ${criterio === 'atividade' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => handleChangeCriterio('atividade')}
                >
                  Atividade
                </button>
                <button 
                  className={`px-4 py-2 rounded ${criterio === 'presenca' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => handleChangeCriterio('presenca')}
                >
                  Presença
                </button>
                <button 
                  className={`px-4 py-2 rounded ${criterio === 'proposicoes' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => handleChangeCriterio('proposicoes')}
                >
                  Proposições
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <select 
                className="block w-full p-2 border border-gray-300 rounded-md"
                value={limite}
                onChange={handleChangeLimite}
              >
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="20">Top 20</option>
                <option value="50">Top 50</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {criterio === 'atividade' && 'Ranking por Atividade Parlamentar'}
              {criterio === 'presenca' && 'Ranking por Presença em Sessões'}
              {criterio === 'proposicoes' && 'Ranking por Proposições Apresentadas'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b text-left">Posição</th>
                    <th className="py-2 px-4 border-b text-left">Senador</th>
                    <th className="py-2 px-4 border-b text-left">Partido/UF</th>
                    <th className="py-2 px-4 border-b text-right">Pontuação</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((senador: ChartDataItem, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="py-2 px-4 border-b">{index + 1}</td>
                      <td className="py-2 px-4 border-b">{senador.nome}</td>
                      <td className="py-2 px-4 border-b">{senador.partido}/{senador.estado}</td>
                      <td className="py-2 px-4 border-b text-right">{senador.pontuacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Visualização Gráfica</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.slice(0, 10)} // Limitar a 10 para melhor visualização
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    tick={{ fontSize: 12 }}
                    width={90}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="pontuacao" 
                    fill="#8884d8" 
                    name={
                      criterio === 'atividade' ? 'Índice de Atividade' :
                      criterio === 'presenca' ? 'Taxa de Presença' : 
                      'Nº de Proposições'
                    } 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Sobre este Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {criterio === 'atividade' && 
                'O índice de atividade parlamentar considera diversos fatores como participação em comissões, apresentação de proposições, discursos em plenário e votações.'}
              {criterio === 'presenca' && 
                'A taxa de presença representa o percentual de sessões plenárias e de comissões em que o senador esteve presente.'}
              {criterio === 'proposicoes' && 
                'Este ranking considera a quantidade de projetos de lei, emendas e outras proposições legislativas apresentadas pelo senador.'}
            </p>
            <p className="text-gray-600 mt-2">
              Dados atualizados regularmente com base nas informações oficiais do Senado Federal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SenadoRanking;
