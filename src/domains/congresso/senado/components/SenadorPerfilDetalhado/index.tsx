import React, { useState, useEffect } from 'react';
import { useSenadorPerfil, useSenadorDetalhado } from '@/domains/congresso/senado/hooks';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/ui/card';
import { formatarData } from '@/shared/utils/formatters';
import { SenadorDetalhado } from '@/domains/congresso/senado/types/index';
import { SenadorPerfil } from '@/domains/congresso/senado/hooks/useSenadorPerfil';
import { logger } from '@/app/monitoring/logger';

interface SenadorPerfilDetalhadoProps {
  id: number;
  ano: number;
}

const SenadorPerfilDetalhado: React.FC<SenadorPerfilDetalhadoProps> = ({ id, ano }) => {
  // Buscar dados do perfil do senador do Firestore
  const {
    data: perfilSenador,
    isLoading: loadingPerfil,
    error: errorPerfil
  } = useSenadorPerfil(id);

  // Buscar dados complementares (proposições, votações, etc.)
  const {
    senador,
    proposicoes,
    votacoes,
    despesas,
    comissoes,
    stats,
    loading: loadingDetalhes,
    error: errorDetalhes
  } = useSenadorDetalhado(id, ano);

  const [activeTab, setActiveTab] = useState<string>('perfil');
  const [activeYear, setActiveYear] = useState<number>(new Date().getFullYear());

  // Determinar estado de carregamento e erro
  const loading = loadingPerfil || loadingDetalhes;
  const error = errorPerfil || errorDetalhes;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    // Verificar se o erro é relacionado a permissões
    const isPermissionError = error.message && error.message.includes('permission');

    return (
      <Card className="bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Erro ao carregar dados</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">
            {isPermissionError
              ? "Não foi possível acessar os dados do perfil do senador. Os dados podem não estar disponíveis ou o ETL ainda não foi executado."
              : error.message}
          </p>
          {isPermissionError && (
            <div className="mt-4">
              <p className="text-sm text-gray-700">
                Sugestão: Verifique se os dados dos senadores foram carregados no Firestore através do processo ETL.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Verificar se temos dados do senador (seja do perfil ou dos detalhes)
  if (!perfilSenador && !senador) {
    return (
      <Card className="bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-600">Senador não encontrado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-yellow-600">Não foi possível encontrar informações para este senador.</p>
          <p className="mt-4 text-sm text-gray-600">
            Verifique se o ID do senador está correto ou se os dados foram carregados no sistema.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Usar dados do perfil do Firestore se disponíveis, caso contrário usar dados da API
  const senadorDados = perfilSenador || senador;

  // Log para depuração
  logger.info(`Exibindo perfil do senador: ${senadorDados?.nome || (senadorDados as SenadorPerfil)?.codigo || id}`,
    { temPerfilCompleto: !!perfilSenador, temDadosBasicos: !!senador });

  // Calcular estatísticas rápidas
  const anosDeServico = stats?.anosDeServico || 0;
  const presencaPercentual = stats?.presencaPercentual || 0;
  const totalProposicoes = proposicoes?.length || 0;
  const ranking = stats?.ranking || 0;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <img
              src={senador?.urlFoto || `https://via.placeholder.com/200?text=${senador?.nome?.charAt(0) || 'S'}`}
              className="w-24 h-24 rounded-full border-4 border-emerald-500"
              alt={senador?.nome || 'Senador'}
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://via.placeholder.com/200?text=${senador?.nome?.charAt(0) || 'S'}`;
              }}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{senador?.nome || 'Senador'}</h1>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      {senador?.siglaPartido || '?'} - {senador?.siglaUf || '?'}
                    </span>
                    {stats?.processosAtivos && stats.processosAtivos > 0 && (
                      <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                        ⚖️ {stats.processosAtivos} {stats.processosAtivos === 1 ? 'Processo Ativo' : 'Processos Ativos'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex gap-3">
                  <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/>
                    </svg>
                  </button>
                  <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Mandato</p>
                  <p className="text-2xl font-bold text-gray-800">{anosDeServico} {anosDeServico === 1 ? 'Ano' : 'Anos'}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Presença</p>
                  <p className="text-2xl font-bold text-gray-800">{presencaPercentual}%</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Projetos</p>
                  <p className="text-2xl font-bold text-gray-800">{totalProposicoes}</p>
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Ranking</p>
                  <p className="text-2xl font-bold text-gray-800">#{ranking}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="grid lg:grid-cols-3 gap-6 p-6">
          {/* Coluna Esquerda */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trajetória Política */}
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Trajetória Política</h3>
              <div className="space-y-4">
                {senador?.mandatos && senador.mandatos.slice(0, 3).map((mandato, index: number) => (
                  <div key={index} className="relative pl-6 border-l-2 border-emerald-500">
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px]"></div>
                    <p className="font-medium text-gray-800">
                      {mandato.inicio ? formatarData(mandato.inicio.toString()) : '?'}-
                      {mandato.fim ? formatarData(mandato.fim.toString()) : 'Atual'}
                    </p>
                    <p className="text-sm text-gray-600">{mandato.descricao || 'Senador'}</p>
                    {('observacao' in mandato && mandato.observacao) ? (
                      <p className="text-xs text-gray-500 mt-2">{String(mandato.observacao)}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {/* Redes Sociais */}
            <div className="bg-gray-100 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Redes Sociais</h3>
              <div className="space-y-3">
                {senador?.redeSocial && senador.redeSocial.map((rede, index: number) => (
                  <a key={index} href={rede.url}
                     className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700"
                     target="_blank" rel="noopener noreferrer">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                    {rede.nome}
                  </a>
                ))}
                {(!senador?.redeSocial || senador.redeSocial.length === 0) && (
                  <p className="text-gray-500">Nenhuma rede social cadastrada</p>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">
            {/* Atividade no Senado */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Atividade no Senado</h2>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Selecione o ano:</span>
                  <div className="flex gap-2">
                    <button
                      className={`year-pill px-4 py-2 ${activeYear === ano - 1 ? 'bg-gray-100' : 'bg-emerald-500 text-white'} rounded-full`}
                      onClick={() => setActiveYear(ano - 1)}
                    >
                      {ano - 1}
                    </button>
                    <button
                      className={`year-pill px-4 py-2 ${activeYear === ano ? 'bg-emerald-500 text-white' : 'bg-gray-100'} rounded-full`}
                      onClick={() => setActiveYear(ano)}
                    >
                      {ano}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Propostas Legislativas</h3>
                  <p className="text-4xl font-bold text-emerald-600">{totalProposicoes}</p>
                  <span className="text-sm text-gray-600">
                    {stats?.categoriasProposicoes?.principal &&
                     `${stats?.categoriasProposicoes?.percentual}% sobre ${stats?.categoriasProposicoes?.principal}`}
                  </span>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Votações Nominais</h3>
                  <p className="text-4xl font-bold text-blue-600">{votacoes?.length || 0}</p>
                  <span className="text-sm text-gray-600">
                    {stats?.alinhamentoPartido &&
                     `${stats?.alinhamentoPartido}% alinhado ao ${senador?.siglaPartido}`}
                  </span>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Discursos</h3>
                  <p className="text-4xl font-bold text-purple-600">{stats?.totalDiscursos || 0}</p>
                  {stats?.ultimoDiscurso && (
                    <div className="flex gap-3 mt-3">
                      <a href={stats?.ultimoDiscurso?.url} className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                        </svg>
                        Vídeo
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Desempenho Legislativo */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Desempenho Legislativo</h2>
              <div className="bg-gray-100 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="performance-ring w-48 h-48 mx-auto rounded-full flex items-center justify-center"
                       style={{background: `conic-gradient(#10b981 ${presencaPercentual}%, #e2e7eb 0)`}}>
                    <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{stats?.pontuacaoGeral !== undefined ? stats.pontuacaoGeral.toFixed(1) : '?'}</span>
                      <span className="text-sm text-gray-600">Pontuação Geral</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">{presencaPercentual}%</div>
                      <div>
                        <p className="font-medium text-gray-800">Presença</p>
                        <p className="text-sm text-gray-600">Média partidária: {stats?.mediaPresencaPartido !== undefined ? stats.mediaPresencaPartido : '?'}%</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">{stats?.aprovacaoPercentual !== undefined ? stats.aprovacaoPercentual : '?'}%</div>
                      <div>
                        <p className="font-medium text-gray-800">Aprovação</p>
                        <p className="text-sm text-gray-600">Entre pares do {senador?.siglaPartido}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SenadorPerfilDetalhado;
