import React, { useState } from 'react';
import { useMateriasLegislativasSenador, type Materia, type RelatoriaInfo } from '@/domains/congresso/senado/hooks/useMateriasLegislativasSenador';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import ScrollableSection from '@/shared/components/ui/scrollable-section';
import './styles.css';

interface MateriasLegislativasSenadorProps {
  senadorId: string;
  ano?: number | null;
}

/**
 * Componente para exibir matérias legislativas de um senador com sistema de abas
 */
const MateriasLegislativasSenador: React.FC<MateriasLegislativasSenadorProps> = ({ senadorId, ano }) => {
  // Estado para controlar a aba ativa
  const [activeTab, setActiveTab] = useState<'autorias' | 'relatorias'>('autorias');

  // Estado para controlar a subaba de autorias
  const [autoriaSubTab, setAutoriaSubTab] = useState<'individual' | 'coautoria' | 'coletiva'>('individual');

  // Buscar dados de matérias legislativas
  const { data, isLoading, error } = useMateriasLegislativasSenador(senadorId);

  // Log para depuração
  console.log('MateriasLegislativasSenador - data:', data);

  // Filtrar matérias pelo ano selecionado, se fornecido
  const filtrarPorAno = (item: { ano?: number }) => {
    if (!ano || !item.ano) return true;
    return item.ano === ano;
  };

  // Garantir que matérias existam e filtrar por ano se necessário
  const autoriasIndividuais = data?.autorias.individual.filter(filtrarPorAno) || [];
  const autoriasCoautoria = data?.autorias.coautoria.filter(filtrarPorAno) || [];
  const autoriasColetivas = data?.autorias.coletiva.filter(filtrarPorAno) || [];

  // Log para depuração
  console.log('Contagem de autorias:', {
    individual: autoriasIndividuais.length,
    coautoria: autoriasCoautoria.length,
    coletiva: autoriasColetivas.length
  });
  const relatorias = data?.relatorias.filter(filtrarPorAno) || [];

  // Verificar se há dados reais
  const temAutoriasReais =
    autoriasIndividuais.some(m => m.dadoReal) ||
    autoriasCoautoria.some(m => m.dadoReal) ||
    autoriasColetivas.some(m => m.dadoReal);

  const temRelatoriasReais = relatorias.some(r => r.dadoReal);

  // Renderizar item de matéria
  const renderMateria = (materia: Materia, index: number) => {
    // Verificar se a matéria é válida
    if (!materia) {
      return (
        <div key={index} className="bg-gray-100 p-4 rounded-xl">
          <p className="text-gray-500">Dados da matéria indisponíveis</p>
        </div>
      );
    }

    // Log para depuração
    if (index === 0) {
      console.log('Exemplo de matéria:', materia);
    }

    return (
      <div key={index} className="bg-gray-100 p-4 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">
                  {materia.tipo} {materia.numero}/{materia.ano}
                </h3>
                <p className="text-sm text-gray-600">
                  {materia.situacao} • {new Date(materia.dataApresentacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {!materia.dadoReal && (
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

        <div className="pl-12 border-l-2 border-emerald-200 ml-5 mb-3">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{materia.ementa || 'Ementa não disponível'}</p>
        </div>

        {materia.autores && materia.autores.length > 1 && (
          <div className="pl-12 ml-5 mb-3">
            <p className="text-xs text-gray-600 font-medium">Autores:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {materia.autores.map((autor, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs">
                  {autor.nome}
                </span>
              ))}
            </div>
          </div>
        )}

        {materia.url && (
          <div className="flex justify-end">
            <a
              href={materia.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver no Senado
            </a>
          </div>
        )}
      </div>
    );
  };

  // Renderizar item de relatoria
  const renderRelatoria = (relatoria: RelatoriaInfo, index: number) => {
    // Verificar se a relatoria é válida
    if (!relatoria) {
      return (
        <div key={index} className="bg-gray-100 p-4 rounded-xl">
          <p className="text-gray-500">Dados da relatoria indisponíveis</p>
        </div>
      );
    }

    return (
      <div key={index} className="bg-gray-100 p-4 rounded-xl">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-800">
                  {relatoria.tipo} {relatoria.numero}/{relatoria.ano}
                </h3>
                <p className="text-sm text-gray-600">
                  {relatoria.situacao} • Designado em {new Date(relatoria.dataDesignacao).toLocaleDateString('pt-BR')}
                </p>
                {relatoria.comissao && (
                  <p className="text-xs text-gray-500">
                    Comissão: {relatoria.comissao.sigla} - {relatoria.comissao.nome}
                  </p>
                )}
              </div>
              {!relatoria.dadoReal && (
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
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{relatoria.ementa || 'Ementa não disponível'}</p>
        </div>

        {relatoria.url && (
          <div className="flex justify-end">
            <a
              href={relatoria.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver no Senado
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
        <h2 className="text-2xl font-bold text-gray-800">Matérias Legislativas</h2>
        <div className="flex items-center">
          {activeTab === 'autorias' && !temAutoriasReais && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center mr-3">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dados genéricos
            </span>
          )}
          {activeTab === 'relatorias' && !temRelatoriasReais && (
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center mr-3">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dados genéricos
            </span>
          )}
          <div className="tabs-container">
            <button
              className={`tab-button ${activeTab === 'autorias' ? 'active' : ''}`}
              onClick={() => setActiveTab('autorias')}
            >
              Autorias ({autoriasIndividuais.length + autoriasCoautoria.length + autoriasColetivas.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'relatorias' ? 'active' : ''}`}
              onClick={() => setActiveTab('relatorias')}
            >
              Relatorias ({relatorias.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'autorias' && (
        <>
          <div className="flex justify-start mb-4">
            <div className="subtabs-container">
              <button
                className={`subtab-button ${autoriaSubTab === 'individual' ? 'active' : ''}`}
                onClick={() => setAutoriaSubTab('individual')}
              >
                Individual ({autoriasIndividuais.length})
              </button>
              <button
                className={`subtab-button ${autoriaSubTab === 'coautoria' ? 'active' : ''}`}
                onClick={() => setAutoriaSubTab('coautoria')}
              >
                Coautoria ({autoriasCoautoria.length})
              </button>
              <button
                className={`subtab-button ${autoriaSubTab === 'coletiva' ? 'active' : ''}`}
                onClick={() => setAutoriaSubTab('coletiva')}
              >
                Coletiva ({autoriasColetivas.length})
              </button>
            </div>
          </div>

          {autoriaSubTab === 'individual' && (
            <>
              {autoriasIndividuais.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {autoriasIndividuais[0].codigo === 'placeholder' ? (
                    <div className="bg-gray-100 p-6 rounded-xl text-center">
                      <p className="text-gray-500">Carregando {autoriasIndividuais.length} autorias individuais...</p>
                    </div>
                  ) : (
                    autoriasIndividuais.map(renderMateria)
                  )}
                </ScrollableSection>
              ) : (
                <div className="bg-gray-100 p-6 rounded-xl text-center">
                  <p className="text-gray-500">Nenhuma autoria individual registrada</p>
                </div>
              )}
            </>
          )}

          {autoriaSubTab === 'coautoria' && (
            <>
              {autoriasCoautoria.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {autoriasCoautoria[0].codigo === 'placeholder' ? (
                    <div className="bg-gray-100 p-6 rounded-xl text-center">
                      <p className="text-gray-500">Carregando {autoriasCoautoria.length} coautorias...</p>
                    </div>
                  ) : (
                    autoriasCoautoria.map(renderMateria)
                  )}
                </ScrollableSection>
              ) : (
                <div className="bg-gray-100 p-6 rounded-xl text-center">
                  <p className="text-gray-500">Nenhuma coautoria registrada</p>
                </div>
              )}
            </>
          )}

          {autoriaSubTab === 'coletiva' && (
            <>
              {autoriasColetivas.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {autoriasColetivas[0].codigo === 'placeholder' ? (
                    <div className="bg-gray-100 p-6 rounded-xl text-center">
                      <p className="text-gray-500">Carregando {autoriasColetivas.length} autorias coletivas...</p>
                    </div>
                  ) : (
                    autoriasColetivas.map(renderMateria)
                  )}
                </ScrollableSection>
              ) : (
                <div className="bg-gray-100 p-6 rounded-xl text-center">
                  <p className="text-gray-500">Nenhuma autoria coletiva registrada</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {activeTab === 'relatorias' && (
        <>
          {relatorias.length > 0 ? (
            <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
              {relatorias[0].codigo === 'placeholder' ? (
                <div className="bg-gray-100 p-6 rounded-xl text-center">
                  <p className="text-gray-500">Carregando {relatorias.length} relatorias...</p>
                </div>
              ) : (
                relatorias.map(renderRelatoria)
              )}
            </ScrollableSection>
          ) : (
            <div className="bg-gray-100 p-6 rounded-xl text-center">
              <p className="text-gray-500">Nenhuma relatoria registrada</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MateriasLegislativasSenador;
