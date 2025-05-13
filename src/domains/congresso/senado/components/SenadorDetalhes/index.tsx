import React from 'react';
import { useSenadorDetalhado } from '@/domains/congresso/senado/hooks';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';

interface SenadorDetalhesProps {
  id: number;
  ano: number;
}

const SenadorDetalhes: React.FC<SenadorDetalhesProps> = ({ id, ano }) => {
  const {
    senador,
    proposicoes,
    votacoes,
    despesas,
    comissoes,
    stats,
    loading,
    error
  } = useSenadorDetalhado(id, ano);

  if (loading) {
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
          <CardTitle className="text-red-600">Erro ao carregar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!senador) {
    return (
      <Card className="bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-600">Senador não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">Não foi possível encontrar os dados do senador.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Senador</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-4">
            {senador.urlFoto ? (
              <img 
                src={senador.urlFoto} 
                alt={senador.nome}
                className="w-32 h-32 rounded-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">
                  {senador.nome.split(' ').map((n: string) => n[0]).join('')}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{senador.nome}</h2>
              <p className="text-gray-600">{senador.nomeCivil}</p>
              <p className="mt-2">
                <span className="font-semibold">{senador.siglaPartido}</span> - {senador.siglaUf}
              </p>
              {senador.email && (
                <p className="mt-1 text-sm text-gray-600">{senador.email}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas {ano}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Proposições */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-700">Proposições</h3>
                <p className="text-2xl font-bold text-blue-900">{stats.proposicoes.total}</p>
                <div className="text-sm text-blue-600 mt-2">
                  <p>Em tramitação: {stats.proposicoes.emTramitacao}</p>
                  <p>Aprovadas: {stats.proposicoes.aprovadas}</p>
                  <p>Arquivadas: {stats.proposicoes.arquivadas}</p>
                </div>
              </div>

              {/* Votações */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-700">Votações</h3>
                <p className="text-2xl font-bold text-green-900">{stats.votacoes.total}</p>
                <div className="text-sm text-green-600 mt-2">
                  <p>Participação: {stats.votacoes.participacao}%</p>
                  <p>Votos Sim: {stats.votacoes.percentualSim}%</p>
                  <p>Votos Não: {stats.votacoes.percentualNao}%</p>
                </div>
              </div>

              {/* Despesas */}
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-700">Despesas</h3>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {stats.despesas.total.toLocaleString('pt-BR')}
                </p>
                <div className="text-sm text-purple-600 mt-2">
                  <p>Média Mensal: R$ {stats.despesas.media.toLocaleString('pt-BR')}</p>
                  <p>Maior Despesa: R$ {stats.despesas.maiorDespesa.toLocaleString('pt-BR')}</p>
                </div>
              </div>

              {/* Comissões */}
              <div className="p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-700">Comissões</h3>
                <p className="text-2xl font-bold text-orange-900">{stats.comissoes.total}</p>
                <div className="text-sm text-orange-600 mt-2">
                  <p>Ativas: {stats.comissoes.ativas}</p>
                  <p>Presidências: {stats.comissoes.presidencias}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Biografia e Informações Adicionais */}
      {senador.biografia && (
        <Card>
          <CardHeader>
            <CardTitle>Biografia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-line">{senador.biografia}</p>
            {senador.profissao && (
              <p className="mt-4">
                <span className="font-semibold">Profissão:</span> {senador.profissao}
              </p>
            )}
            {senador.dataNascimento && (
              <p>
                <span className="font-semibold">Data de Nascimento:</span>{' '}
                {new Date(senador.dataNascimento).toLocaleDateString('pt-BR')}
              </p>
            )}
            {senador.naturalidade && (
              <p>
                <span className="font-semibold">Naturalidade:</span>{' '}
                {senador.naturalidade} - {senador.ufNascimento}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Redes Sociais */}
      {senador.redes && Object.values(senador.redes).some(Boolean) && (
        <Card>
          <CardHeader>
            <CardTitle>Redes Sociais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              {senador.redes.twitter && (
                <a 
                  href={senador.redes.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  Twitter
                </a>
              )}
              {senador.redes.facebook && (
                <a 
                  href={senador.redes.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Facebook
                </a>
              )}
              {senador.redes.instagram && (
                <a 
                  href={senador.redes.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800"
                >
                  Instagram
                </a>
              )}
              {senador.redes.site && (
                <a 
                  href={senador.redes.site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800"
                >
                  Site Oficial
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SenadorDetalhes;
