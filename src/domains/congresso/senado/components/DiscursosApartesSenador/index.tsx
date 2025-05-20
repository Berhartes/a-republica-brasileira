import React, { useState } from 'react';
import { useDiscursosSenador, type Discurso, type Aparte } from '@/domains/congresso/senado/hooks/useDiscursosSenador';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import ScrollableSection from '@/shared/components/ui/scrollable-section';
import './styles.css';

interface DiscursosApartesSenadorProps {
  senadorId: string;
  ano?: number | null;
}

/**
 * Componente para exibir discursos e apartes de um senador com sistema de abas
 */
const DiscursosApartesSenador: React.FC<DiscursosApartesSenadorProps> = ({ senadorId, ano }) => {
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'discursos' | 'apartes'>('discursos');

  // Buscar dados de discursos e apartes
  const { data, isLoading, error } = useDiscursosSenador(senadorId);

  // Verificar se há dados reais
  const temDiscursosReais = data?.discursos?.some(discurso => discurso?.dadoReal);
  const temApartesReais = data?.apartes?.some(aparte => aparte?.dadoReal);

  // Filtrar discursos e apartes pelo ano selecionado, se fornecido
  const filtrarPorAno = (item: { data?: string }) => {
    if (!ano || !item.data) return true;
    const itemAno = new Date(item.data).getFullYear();
    return itemAno === ano;
  };

  // Garantir que discursos e apartes existam e filtrar por ano se necessário
  const discursos = data?.discursos?.filter(filtrarPorAno) || [];
  const apartes = data?.apartes?.filter(filtrarPorAno) || [];

  // Renderizar item de discurso
  const renderDiscurso = (discurso: Discurso, index: number) => {
    // Verificar se o discurso é válido
    if (!discurso) {
      return (
        <div key={index} className="bg-gray-100 p-4 rounded-xl">
          <p className="text-gray-500">Dados do discurso indisponíveis</p>
        </div>
      );
    }

    // Garantir que todas as propriedades existam
    const sessao = discurso.sessao || { data: '', tipo: '' };

    return (
      <div key={index} className="bg-gray-100 p-4 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{discurso.assunto || 'Sem assunto'}</h3>
                <p className="text-sm text-gray-600">
                  {discurso.tipo || 'Discurso'} • {discurso.fase || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  {sessao.data || 'Data não informada'} • {sessao.tipo || 'Sessão não especificada'}
                </p>
              </div>
              {!discurso.dadoReal && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Genérico
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pl-12 border-l-2 border-blue-200 ml-5 mb-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{discurso.texto || 'Texto não disponível'}</p>
        </div>

        {discurso.url && (
          <div className="flex justify-end gap-3">
            <a
              href={discurso.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver completo
            </a>
            {discurso.urlVideo && (
              <a
                href={discurso.urlVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Vídeo
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar item de aparte
  const renderAparte = (aparte: Aparte, index: number) => {
    // Verificar se o aparte é válido
    if (!aparte) {
      return (
        <div key={index} className="bg-gray-100 p-4 rounded-xl">
          <p className="text-gray-500">Dados do aparte indisponíveis</p>
        </div>
      );
    }

    // Garantir que todas as propriedades existam
    const sessao = aparte.sessao || { data: '', tipo: '' };
    const orador = aparte.orador || { nome: 'Não informado', partido: '', uf: '' };

    return (
      <div key={index} className="bg-gray-100 p-4 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">{aparte.assunto || 'Sem assunto'}</h3>
                <p className="text-sm text-gray-600">
                  Aparte ao discurso de {orador.nome}
                  {orador.partido && orador.uf ? ` (${orador.partido}-${orador.uf})` : ''}
                </p>
                <p className="text-xs text-gray-500">
                  {sessao.data || 'Data não informada'} • {sessao.tipo || 'Sessão não especificada'}
                </p>
              </div>
              {!aparte.dadoReal && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Genérico
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pl-12 border-l-2 border-indigo-200 ml-5 mb-3">
          <p className="text-sm text-gray-700 italic whitespace-pre-wrap">"{aparte.texto || 'Texto não disponível'}"</p>
        </div>

        {aparte.url && (
          <div className="flex justify-end">
            <a
              href={aparte.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver completo
            </a>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-xl text-red-800">
        <p>Erro ao carregar dados: {error instanceof Error ? error.message : 'Erro desconhecido'}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-100 p-6 rounded-xl text-center">
        <p className="text-gray-500">Nenhum dado encontrado para este senador</p>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Pronunciamentos</h2>
        <div className="flex items-center">
          {activeTab === 'discursos' && discursos.length > 0 && !temDiscursosReais && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center mr-3">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Todos genéricos
            </span>
          )}
          {activeTab === 'apartes' && apartes.length > 0 && !temApartesReais && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center mr-3">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Todos genéricos
            </span>
          )}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'discursos' ? 'active' : ''}`}
              onClick={() => setActiveTab('discursos')}
            >
              Discursos ({discursos.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'apartes' ? 'active' : ''}`}
              onClick={() => setActiveTab('apartes')}
            >
              Apartes ({apartes.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'discursos' && (
        <>
          {discursos.length > 0 ? (
            <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
              {discursos.map(renderDiscurso)}
            </ScrollableSection>
          ) : (
            <div className="bg-gray-100 p-6 rounded-xl text-center">
              <p className="text-gray-500">Nenhum discurso registrado</p>
            </div>
          )}
        </>
      )}

      {activeTab === 'apartes' && (
        <>
          {apartes.length > 0 ? (
            <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
              {apartes.map(renderAparte)}
            </ScrollableSection>
          ) : (
            <div className="bg-gray-100 p-6 rounded-xl text-center">
              <p className="text-gray-500">Nenhum aparte registrado</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscursosApartesSenador;
