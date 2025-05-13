import React from 'react';
import { useProposicoesSenador } from '../../hooks';
import { LoadingSpinner } from '../../../../../shared/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../shared/components/ui/card';

interface ProposicoesCardProps {
  senadorId: number;
  ano?: number;
  limite?: number;
}

const ProposicoesCard: React.FC<ProposicoesCardProps> = ({ 
  senadorId, 
  ano = new Date().getFullYear(),
  limite 
}) => {
  const {
    data: proposicoes,
    isLoading,
    error
  } = useProposicoesSenador({ id: senadorId, ano });

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
          <CardTitle className="text-red-600">Erro ao carregar proposições</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!proposicoes || proposicoes.length === 0) {
    return (
      <Card className="bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-600">Nenhuma proposição encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">Não há registros de proposições para este período.</p>
        </CardContent>
      </Card>
    );
  }

  const proposicoesExibidas = limite ? proposicoes.slice(0, limite) : proposicoes;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Proposições {ano}
          {limite && proposicoes.length > limite && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              (Mostrando {limite} de {proposicoes.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proposicoesExibidas.map((proposicao) => (
            <div 
              key={proposicao.id} 
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">
                    {proposicao.sigla} {proposicao.numero}/{proposicao.ano}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {proposicao.ementa}
                  </p>
                  {proposicao.autor && (
                    <p className="text-sm text-gray-500 mt-1">
                      Autor: {proposicao.autor}
                    </p>
                  )}
                  {proposicao.dataApresentacao && (
                    <p className="text-sm text-gray-500">
                      Apresentação: {new Date(proposicao.dataApresentacao).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                {proposicao.situacao && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    proposicao.situacao.toLowerCase().includes('aprovad') ? 'bg-green-100 text-green-800' :
                    proposicao.situacao.toLowerCase().includes('arquivad') ? 'bg-red-100 text-red-800' :
                    proposicao.situacao.toLowerCase().includes('tramitação') ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {proposicao.situacao}
                  </div>
                )}
              </div>
              {proposicao.explicacao && (
                <p className="mt-2 text-sm text-gray-700">
                  {proposicao.explicacao}
                </p>
              )}
              {proposicao.tramitacoes && proposicao.tramitacoes.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">
                    Última Tramitação
                  </h5>
                  <div className="text-sm text-gray-600">
                    <p>{proposicao.tramitacoes[0].descricao}</p>
                    <p className="mt-1">
                      {new Date(proposicao.tramitacoes[0].data).toLocaleDateString('pt-BR')} - {proposicao.tramitacoes[0].local}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposicoesCard;
