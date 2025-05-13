import React from 'react';
import { useVotacoesSenador } from '@/domains/congresso/senado/hooks';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../shared/components/ui/card';
import { TipoVoto } from '@/domains/congresso/senado/types/index';

interface VotacoesPanelProps {
  senadorId: number;
  ano?: number;
}

const VotacoesPanel: React.FC<VotacoesPanelProps> = ({ senadorId, ano = new Date().getFullYear() }) => {
  const {
    data: votacoes,
    isLoading,
    error,
    stats
  } = useVotacoesSenador({ id: senadorId, ano });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Erro ao carregar votações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!votacoes || votacoes.length === 0) {
    return (
      <Card className="bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-600">Nenhuma votação encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">Não há registros de votações para este período.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo das Votações */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Votações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-700">Total de Votações</h3>
                <p className="text-2xl font-bold text-green-900">{stats.totalVotacoes}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-700">Participação</h3>
                <p className="text-2xl font-bold text-blue-900">{stats.participacao}%</p>
              </div>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h3 className="font-semibold text-indigo-700">Votos "Sim"</h3>
                <p className="text-2xl font-bold text-indigo-900">{stats.percentualSim}%</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-700">Votos "Não"</h3>
                <p className="text-2xl font-bold text-purple-900">{stats.percentualNao}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Votações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Votações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {votacoes.map((votacao) => (
              <div 
                key={votacao.id} 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{votacao.descricao}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(votacao.data).toLocaleDateString('pt-BR')}
                    </p>
                    {votacao.siglaMateria && (
                      <p className="text-sm text-gray-500">
                        {votacao.siglaMateria} {votacao.numeroMateria}/{votacao.anoMateria}
                      </p>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    votacao.votos[0]?.voto === TipoVoto.SIM ? 'bg-green-100 text-green-800' :
                    votacao.votos[0]?.voto === TipoVoto.NAO ? 'bg-red-100 text-red-800' :
                    votacao.votos[0]?.voto === TipoVoto.ABSTENCAO ? 'bg-yellow-100 text-yellow-800' :
                    votacao.votos[0]?.voto === TipoVoto.OBSTRUCAO ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {votacao.votos[0]?.voto || 'AUSENTE'}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  Resultado: {votacao.resultado}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VotacoesPanel;
