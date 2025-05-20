import React, { useState, useEffect } from 'react';
import { logger } from '@/app/monitoring/logger';
import ScrollableSection from '@/shared/components/ui/scrollable-section';

interface Comissao {
  codigo: string;
  sigla: string;
  nome: string;
  casa: string;
  dataInicio: string;
  dataFim: string | null;
  participacao: string;
  atual: boolean;
  dadoReal?: boolean;
}

interface ComissoesSenadorProps {
  comissoes: Comissao[];
  senadorId: string;
}

const ComissoesSenador: React.FC<ComissoesSenadorProps> = ({ comissoes, senadorId }) => {
  const [filtroComissoes, setFiltroComissoes] = useState<string>("todas");
  const [comissoesFiltradas, setComissoesFiltradas] = useState<Comissao[]>(comissoes);
  const [temDadosReais, setTemDadosReais] = useState<boolean>(false);

  useEffect(() => {
    // Verificar se existem dados reais
    const existemDadosReais = comissoes.some(comissao => comissao.dadoReal);
    setTemDadosReais(existemDadosReais);

    // Obter a data atual para comparar com dataFim
    const dataAtual = new Date();

    // Aplicar filtro
    let comissoesFiltradas = [...comissoes];

    if (filtroComissoes === "atuais") {
      comissoesFiltradas = comissoes.filter(comissao => comissao.atual);
    } else if (filtroComissoes === "titulares") {
      comissoesFiltradas = comissoes.filter(comissao => comissao.participacao === "Titular");
    } else if (filtroComissoes === "suplentes") {
      comissoesFiltradas = comissoes.filter(comissao => comissao.participacao === "Suplente");
    } else if (filtroComissoes === "ex-membro") {
      comissoesFiltradas = comissoes.filter(comissao => {
        // Verificar se não é atual e tem dataFim
        if (!comissao.atual && comissao.dataFim) {
          const dataFim = new Date(comissao.dataFim);
          return dataFim < dataAtual;
        }
        return false;
      });
    }

    setComissoesFiltradas(comissoesFiltradas);
  }, [comissoes, filtroComissoes]);

  const handleFiltroClick = (filtro: string) => {
    setFiltroComissoes(filtro);
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Comissões</h2>
        {!temDadosReais && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dados genéricos
          </span>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            className={`px-3 py-1 ${filtroComissoes === "todas" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
            onClick={() => handleFiltroClick("todas")}
          >
            Todas
          </button>
          <button
            className={`px-3 py-1 ${filtroComissoes === "atuais" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
            onClick={() => handleFiltroClick("atuais")}
          >
            Atuais
          </button>
          <button
            className={`px-3 py-1 ${filtroComissoes === "titulares" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
            onClick={() => handleFiltroClick("titulares")}
          >
            Titulares
          </button>
          <button
            className={`px-3 py-1 ${filtroComissoes === "suplentes" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
            onClick={() => handleFiltroClick("suplentes")}
          >
            Suplentes
          </button>
          <button
            className={`px-3 py-1 ${filtroComissoes === "ex-membro" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
            onClick={() => handleFiltroClick("ex-membro")}
          >
            Ex-membro
          </button>
        </div>

        {comissoesFiltradas.length > 0 ? (
          <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
            {comissoesFiltradas.map((comissao, index) => (
              <div key={index} className="bg-gray-100 p-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${comissao.participacao === 'Titular' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    {comissao.sigla.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-800">{comissao.sigla} - {comissao.nome}</h3>
                        <p className="text-sm text-gray-600">
                          {comissao.dataInicio} {comissao.dataFim ? `a ${comissao.dataFim}` : '(atual)'} • {comissao.casa}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${comissao.participacao === 'Titular' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {comissao.participacao}
                        </span>
                        {comissao.atual && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            Atual
                          </span>
                        )}
                        {!comissao.atual && comissao.dataFim && new Date(comissao.dataFim) < new Date() && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                            Ex-membro
                          </span>
                        )}
                        {!comissao.dadoReal && (
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
                </div>
              </div>
            ))}
          </ScrollableSection>
        ) : (
          <div className="bg-gray-100 p-6 rounded-xl text-center">
            <p className="text-gray-500">Nenhuma comissão encontrada com os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComissoesSenador;
