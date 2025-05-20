import React, { useState, useEffect } from 'react';
import { logger } from '@/app/monitoring/logger';
import ScrollableSection from '@/shared/components/ui/scrollable-section';

interface TipoLicenca {
  sigla: string;
  descricao: string;
}

interface Licenca {
  codigo: string;
  tipo: TipoLicenca;
  dataInicio: string;
  dataFim: string;
  atual: boolean;
  dadoReal?: boolean;
}

interface LicencasSenadorProps {
  licencas: Licenca[];
  senadorId: string;
}

const LicencasSenador: React.FC<LicencasSenadorProps> = ({ licencas, senadorId }) => {
  const [filtroLicencas, setFiltroLicencas] = useState<string>("todas");
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [licencasFiltradas, setLicencasFiltradas] = useState<Licenca[]>(licencas);
  const [temDadosReais, setTemDadosReais] = useState<boolean>(false);
  const [anosDisponiveis, setAnosDisponiveis] = useState<string[]>([]);

  useEffect(() => {
    // Verificar se existem dados reais
    const existemDadosReais = licencas.some(licenca => licenca.dadoReal);
    setTemDadosReais(existemDadosReais);

    // Extrair anos únicos das licenças
    const anos = new Set<string>();
    licencas.forEach(licenca => {
      const anoInicio = new Date(licenca.dataInicio).getFullYear().toString();
      anos.add(anoInicio);
    });
    setAnosDisponiveis(Array.from(anos).sort((a, b) => b.localeCompare(a))); // Ordenar do mais recente para o mais antigo

    // Aplicar filtros
    aplicarFiltros();
  }, [licencas]);

  useEffect(() => {
    aplicarFiltros();
  }, [filtroLicencas, filtroAno, licencas]);

  const aplicarFiltros = () => {
    let licencasFiltradas = [...licencas];

    // Filtrar por status (atual/histórica)
    if (filtroLicencas === "atuais") {
      const dataAtual = new Date();
      licencasFiltradas = licencas.filter(licenca => {
        if (licenca.atual) return true;

        // Verificar se a licença está em andamento com base nas datas
        const dataInicio = new Date(licenca.dataInicio);
        const dataFim = licenca.dataFim ? new Date(licenca.dataFim) : dataInicio;

        return dataInicio <= dataAtual && dataFim >= dataAtual;
      });
    } else if (filtroLicencas === "historicas") {
      const dataAtual = new Date();
      licencasFiltradas = licencas.filter(licenca => {
        if (licenca.atual) return false;

        // Verificar se a licença já terminou
        const dataFim = licenca.dataFim ? new Date(licenca.dataFim) : new Date(licenca.dataInicio);
        return dataFim < dataAtual;
      });
    }

    // Filtrar por ano
    if (filtroAno !== "todos") {
      licencasFiltradas = licencasFiltradas.filter(licenca => {
        const anoInicio = new Date(licenca.dataInicio).getFullYear().toString();
        return anoInicio === filtroAno;
      });
    }

    setLicencasFiltradas(licencasFiltradas);
  };

  const handleFiltroClick = (filtro: string) => {
    setFiltroLicencas(filtro);
  };

  const handleAnoChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroAno(event.target.value);
  };

  // Verificar se uma licença está em andamento
  const isLicencaAtual = (licenca: Licenca): boolean => {
    const dataAtual = new Date();
    const dataInicio = new Date(licenca.dataInicio);
    const dataFim = licenca.dataFim ? new Date(licenca.dataFim) : dataInicio;

    return dataInicio <= dataAtual && dataFim >= dataAtual;
  };

  // Formatar data para exibição
  const formatarData = (data: string): string => {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
  };

  // Calcular duração da licença
  const calcularDuracao = (dataInicio: string, dataFim: string | null): string => {
    if (!dataFim || dataInicio === dataFim) return "1 dia";

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays === 1 ? "1 dia" : `${diffDays} dias`;
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Licenças</h2>
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
        <div className="flex flex-wrap gap-2 mb-4 justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              className={`px-3 py-1 ${filtroLicencas === "todas" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
              onClick={() => handleFiltroClick("todas")}
            >
              Todas
            </button>
            <button
              className={`px-3 py-1 ${filtroLicencas === "atuais" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
              onClick={() => handleFiltroClick("atuais")}
            >
              Em andamento
            </button>
            <button
              className={`px-3 py-1 ${filtroLicencas === "historicas" ? "bg-emerald-500 text-white" : "bg-gray-200"} rounded-full`}
              onClick={() => handleFiltroClick("historicas")}
            >
              Históricas
            </button>
          </div>

          {anosDisponiveis.length > 0 && (
            <select
              className="px-3 py-1 bg-gray-200 rounded-full"
              value={filtroAno}
              onChange={handleAnoChange}
            >
              <option value="todos">Todos os anos</option>
              {anosDisponiveis.map(ano => (
                <option key={ano} value={ano}>{ano}</option>
              ))}
            </select>
          )}
        </div>

        {licencasFiltradas.length > 0 ? (
          <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
            {licencasFiltradas.map((licenca, index) => {
              const licencaAtual = isLicencaAtual(licenca);
              const ano = new Date(licenca.dataInicio).getFullYear();

              return (
                <div key={index} className={`${licencaAtual ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-100'} p-4 rounded-xl`}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-gray-800">{licenca.tipo.descricao}</h3>
                          <p className="text-sm text-gray-600">
                            {formatarData(licenca.dataInicio)} {licenca.dataFim && licenca.dataInicio !== licenca.dataFim ? `a ${formatarData(licenca.dataFim)}` : ''}
                            <span className="ml-2 text-gray-500">({calcularDuracao(licenca.dataInicio, licenca.dataFim)})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            {ano}
                          </span>
                          {licencaAtual && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Em andamento
                            </span>
                          )}
                          {!licenca.dadoReal && (
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
              );
            })}
          </ScrollableSection>
        ) : (
          <div className="bg-gray-100 p-6 rounded-xl text-center">
            <p className="text-gray-500">Nenhuma licença encontrada com os filtros selecionados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicencasSenador;
