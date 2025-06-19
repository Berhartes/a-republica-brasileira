import { useState, useEffect } from 'react';
import { db } from '@/shared/services/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { CardData, DashboardConfig } from '../dashboardConfig'; // Pode ser necessário ajustar/passar props

// Interface para as classes de texto esperadas
interface TextColorClasses {
  title: string;
  description: string;
  value: string;
  label: string;
  section: string;
  item: string;
  button: string;
  icon: string;
  // Adicione outras chaves se forem usadas e retornadas pela função original getTextColors de CardDetailView
  subtitle?: string;
  badge?: string;
  detailsColor?: string; // Renomeado de details para evitar conflito com a tag HTML
  baseColor?: string; // Se textColors também puder ter essas chaves diretamente
  baseColorHover?: string;
  descriptionColor?: string;
  lightColor?: string;
  bgColor?: string;
  borderColor?: string;
}

// Definir uma interface para os dados de despesa
interface DespesaDeputado {
  id: string;
  nomeDeputado: string;
  partido: string;
  uf: string;
  valorTotal: number;
  fotoUrl?: string;
}

interface BoardRankingCongressoProps {
  config: DashboardConfig; // Usado para cores, etc., se necessário diretamente
  cardData: CardData; // Dados do card específico de ranking
  onClose: () => void;
  dashboardKey: string;
  isDarkMode?: boolean;
  ufEstado: string; // UF principal do dashboard, vindo do CardDetailView
  style: string; // 'colorido' ou 'transparente', vindo do useDashboardStyle
  // Funções de estilo do CardDetailView para manter consistência, se necessário para elementos internos
  // ou o componente pode definir seus próprios estilos baseados na prop 'style'
  textColors: TextColorClasses;
}

export const BoardRankingCongresso = ({
  cardData,
  onClose,
  isDarkMode,
  ufEstado,
  style, // Prop 'style' recebida
  textColors // Prop 'textColors' recebida
}: BoardRankingCongressoProps) => {
  const [allRankingData, setAllRankingData] = useState<DespesaDeputado[]>([]);
  const [rankingDespesas, setRankingDespesas] = useState<DespesaDeputado[]>([]);
  const [loadingRanking, setLoadingRanking] = useState<boolean>(false);
  const [errorRanking, setErrorRanking] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  const [selectedAno, setSelectedAno] = useState<number>(new Date().getFullYear()); // Ano atual como padrão
  const [selectedMes, setSelectedMes] = useState<number | string>(new Date().getMonth() + 1); // Mês atual como padrão
  const [selectedTipoDespesa, setSelectedTipoDespesa] = useState<string>('');
  const [escopoGeografico, setEscopoGeografico] = useState<string>('todosEstados');
  const [estadoComparacao, setEstadoComparacao] = useState<string>('');
  const [regiaoComparacao, setRegiaoComparacao] = useState<string>('');

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i); // Últimos 5 anos
  const mesesOptions = [
    { value: 'todos', label: 'Todos os Meses (Anual)' },
    ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: new Date(2000, i, 1).toLocaleString('pt-BR', { month: 'long' }) }))
  ];
  const [tiposDeDespesa, setTiposDeDespesa] = useState<string[]>([]);

  const ufsBrasil = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
  const regioesBrasil = {
    Norte: ['AM', 'RR', 'AP', 'PA', 'TO', 'RO', 'AC'],
    Nordeste: ['MA', 'PI', 'CE', 'RN', 'PB', 'PE', 'AL', 'SE', 'BA'],
    CentroOeste: ['MT', 'MS', 'GO', 'DF'],
    Sudeste: ['SP', 'RJ', 'ES', 'MG'],
    Sul: ['PR', 'SC', 'RS']
  };

  useEffect(() => {
    if (ufEstado) {
      setEscopoGeografico('bandeiraAtiva');
    } else {
      setEscopoGeografico('todosEstados'); // Fallback se ufEstado não estiver disponível
    }
  }, [ufEstado]);

  useEffect(() => {
    const fetchTiposDeDespesa = async () => {
      const exemplosTipos = [
        "COMBUSTÍVEIS E LUBRIFICANTES.",
        "PASSAGEM AÉREA - SIGEPA",
        "DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.",
        "LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES",
        "MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR",
        "SERVIÇOS POSTAIS",
        "TELEFONIA",
        "SERVIÇOS DE SEGURANÇA PRIVADA"
      ];
      setTiposDeDespesa([...new Set(exemplosTipos)].sort());
    };
    fetchTiposDeDespesa();
  }, []);

  useEffect(() => {
    const fetchRankingDespesas = async (
      ano: number,
      mesParam: number | string,
      tipoDespesaFiltro: string,
      escopoGeo: string,
      ufAtivaParam: string,
      outroEstado?: string,
      regiao?: keyof typeof regioesBrasil
    ) => {
      setLoadingRanking(true);
      setErrorRanking(null);
      setRankingDespesas([]); // Limpa o ranking atual antes de buscar novos dados

      try {
        console.log(`Buscando ranking para Ano: ${ano}, Mês/Período: ${mesParam}, Tipo Despesa: ${tipoDespesaFiltro}, Escopo: ${escopoGeo}, UF Ativa: ${ufAtivaParam}, Outro Estado: ${outroEstado}, Região: ${regiao}`);
        setCurrentPage(1); // Resetar a página ao aplicar novos filtros

        const deputadosCollectionRef = collection(db, 'congressoNacional/camaraDeputados/legislatura/57/deputados');
        let deputadosQueryConstraint;

        switch (escopoGeo) {
          case 'bandeiraAtiva':
            console.log(`[BoardRankingCongresso] fetchRankingDespesas - Case 'bandeiraAtiva' - ufAtivaParam: '${ufAtivaParam}'`); // Log adicionado
            if (ufAtivaParam) {
              deputadosQueryConstraint = query(deputadosCollectionRef, where('siglaUf', '==', ufAtivaParam));
            } else {
              console.warn("[BoardRankingCongresso] UF da bandeira ativa não disponível (ufAtivaParam é falsy), buscando todos os estados.");
              deputadosQueryConstraint = query(deputadosCollectionRef);
            }
            break;
          case 'outroEstado':
            if (outroEstado && ufAtivaParam) {
              deputadosQueryConstraint = query(deputadosCollectionRef, where('siglaUf', 'in', [ufAtivaParam, outroEstado]));
            } else if (outroEstado) {
              deputadosQueryConstraint = query(deputadosCollectionRef, where('siglaUf', '==', outroEstado));
            } else {
              setErrorRanking("Selecione um estado para comparação.");
              setLoadingRanking(false);
              return;
            }
            break;
          case 'regiao':
            if (regiao && regioesBrasil[regiao]) {
              const ufsDaRegiao = regioesBrasil[regiao];
              if (ufsDaRegiao.length > 0) {
                 deputadosQueryConstraint = query(deputadosCollectionRef, where('siglaUf', 'in', ufsDaRegiao));
              } else {
                 deputadosQueryConstraint = query(deputadosCollectionRef, where('siglaUf', '==', 'IMPOSSIVEL_REGIAO_VAZIA'));
              }
            } else {
              setErrorRanking("Por favor, selecione uma região válida.");
              setLoadingRanking(false);
              return;
            }
            break;
          case 'todosEstados':
          default:
            deputadosQueryConstraint = query(deputadosCollectionRef);
            break;
        }

        const deputadosSnapshot = await getDocs(deputadosQueryConstraint);

        if (deputadosSnapshot.empty) {
          setErrorRanking("Nenhum deputado encontrado para os filtros aplicados.");
          setAllRankingData([]);
          setRankingDespesas([]);
          setLoadingRanking(false);
          return;
        }

        const despesasPromises = deputadosSnapshot.docs.map(async (depDoc) => {
          const deputadoData = depDoc.data() as { nome?: string; nomeCivil?: string; siglaPartido?: string; siglaUf?: string; urlFoto?: string; [key: string]: any };
          const deputadoId = depDoc.id;
          let valorTotalPeriodo = 0;

          const mesesParaIterar = mesParam === 'todos' ? Array.from({ length: 12 }, (_, i) => i + 1) : [mesParam as number];

          for (const mesAtual of mesesParaIterar) {
            const mesFormatado = mesAtual.toString().padStart(2, '0');
            const despesasPath = `congressoNacional/camaraDeputados/perfilComplementar/despesas/${deputadoId}/ano/${ano}/mes/${mesFormatado}/all_despesas`;
            const despesaDocRef = doc(db, despesasPath);
            const despesaDocSnap = await getDoc(despesaDocRef);

            if (despesaDocSnap.exists()) {
              const despesasDataDocumento = despesaDocSnap.data();
              if (despesasDataDocumento && Array.isArray(despesasDataDocumento.despesas)) {
                const despesasFiltradas = tipoDespesaFiltro
                  ? despesasDataDocumento.despesas.filter((d: any) => d.tipoDespesa === tipoDespesaFiltro)
                  : despesasDataDocumento.despesas;

                valorTotalPeriodo += despesasFiltradas.reduce((sum: number, item: any) => {
                  const valor = parseFloat(item.valorLiquido);
                  return sum + (isNaN(valor) ? 0 : valor);
                }, 0);
              }
            }
          }
          return {
            id: deputadoId,
            nomeDeputado: deputadoData.nome || deputadoData.nomeCivil || 'Nome não encontrado',
            partido: deputadoData.siglaPartido || 'N/A',
            uf: deputadoData.siglaUf || 'N/A',
            valorTotal: valorTotalPeriodo,
            fotoUrl: deputadoData.urlFoto || `https://ui-avatars.com/api/?name=${(deputadoData.nome || 'Deputado').replace(/\s+/g, '+')}&background=random`,
          };
        });

        const deputadosComDespesas = await Promise.all(despesasPromises);
        const rankingFiltrado = deputadosComDespesas
          .filter(d => d.valorTotal > 0)
          .sort((a, b) => b.valorTotal - a.valorTotal);

        setAllRankingData(rankingFiltrado);
        setRankingDespesas(rankingFiltrado.slice(0, itemsPerPage));

        if (rankingFiltrado.length === 0) {
          setErrorRanking("Nenhuma despesa encontrada para os filtros selecionados.");
        }

      } catch (err: any) {
        console.error("Erro ao buscar ranking de despesas:", err);
        setErrorRanking(`Erro ao carregar ranking: ${err.message}`);
      } finally {
        setLoadingRanking(false);
      }
    };

    fetchRankingDespesas(selectedAno, selectedMes, selectedTipoDespesa, escopoGeografico, ufEstado, estadoComparacao, regiaoComparacao as keyof typeof regioesBrasil);
  }, [selectedAno, selectedMes, selectedTipoDespesa, escopoGeografico, ufEstado, estadoComparacao, regiaoComparacao]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const nextItems = allRankingData.slice(0, nextPage * itemsPerPage);
    setRankingDespesas(nextItems);
    setCurrentPage(nextPage);
  };

  // Determina as classes de texto com base no estilo do dashboard (claro/escuro ou colorido)
  // Esta lógica é simplificada e pode precisar de ajustes para corresponder exatamente ao `getDashboardTextColors`
  // A prop `textColors` já vem pré-calculada do `CardDetailView`
  const rankingTextColors = {
    title: style === 'colorido' && isDarkMode ? 'text-gray-100' : 'text-gray-800',
    label: style === 'colorido' && isDarkMode ? 'text-gray-300' : 'text-gray-700',
    value: style === 'colorido' && isDarkMode ? 'text-green-400' : 'text-green-700',
    filterLabel: 'text-sm font-medium text-gray-700 mb-1', // Estilo fixo para filtros por enquanto
    input: 'w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900',
    button: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors',
    infoText: style === 'colorido' && isDarkMode ? 'text-gray-400' : 'text-gray-600',
    errorText: 'text-red-600',
    deputadoNome: style === 'colorido' && isDarkMode ? 'text-blue-300 group-hover:text-blue-200' : 'text-gray-800 group-hover:text-blue-600',
    deputadoDetalhe: style === 'colorido' && isDarkMode ? 'text-gray-400' : 'text-gray-500',
  };


  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <h3 className={`${textColors.title} flex items-center gap-2 cursor-pointer hover:underline`}>
          <i className={`${cardData.icon} ${textColors.icon}`}></i>
          {cardData.title}
        </h3>
        <button
          onClick={onClose}
          className={`${style === 'colorido' ? "text-white hover:text-white/80" : textColors.icon} p-1 rounded-full hover:bg-black/10`}
          aria-label="Fechar detalhes"
        >
          <i className={`fas fa-times text-lg`}></i>
        </button>
      </div>

      <div className={style === 'colorido' && !isDarkMode ? "bg-gray-50 p-4 rounded-lg" : style === 'colorido' && isDarkMode ? "bg-slate-700 p-4 rounded-lg" : "bg-white/10 p-4 rounded-lg"}>
        <p className={`${style === 'colorido' && isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
          Ranking das despesas parlamentares (cota parlamentar) dos deputados federais.
        </p>
        <div className="flex flex-col gap-4">
          <div className={`${style === 'colorido' && !isDarkMode ? 'bg-white' : style === 'colorido' && isDarkMode ? 'bg-slate-800' : 'bg-white/20'} p-4 rounded-lg shadow`}>
            <h4 className={`font-medium mb-2 ${rankingTextColors.title}`}>Filtros</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label htmlFor="filtro-ano" className={rankingTextColors.filterLabel}>Ano</label>
                <select id="filtro-ano" value={selectedAno} onChange={(e) => setSelectedAno(Number(e.target.value))}
                  className={rankingTextColors.input}>
                  {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filtro-mes" className={rankingTextColors.filterLabel}>Mês</label>
                <select id="filtro-mes" value={selectedMes} onChange={(e) => setSelectedMes(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                  className={rankingTextColors.input}>
                  {mesesOptions.map(opt => <option key={String(opt.value)} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filtro-tipo-despesa" className={rankingTextColors.filterLabel}>Tipo de Despesa</label>
                <select id="filtro-tipo-despesa" value={selectedTipoDespesa} onChange={(e) => setSelectedTipoDespesa(e.target.value)}
                  className={rankingTextColors.input}>
                  <option value="">Todos os Tipos</option>
                  {tiposDeDespesa.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="filtro-escopo-geo" className={rankingTextColors.filterLabel}>Escopo Geográfico</label>
                <select id="filtro-escopo-geo" value={escopoGeografico} onChange={(e) => { setEscopoGeografico(e.target.value); setEstadoComparacao(''); setRegiaoComparacao('');}}
                  className={rankingTextColors.input}>
                  {ufEstado && <option value="bandeiraAtiva">Bandeira Ativa ({ufEstado})</option>}
                  <option value="todosEstados">Todos os Estados (Brasil)</option>
                  <option value="outroEstado">Comparar com Estado</option>
                  <option value="regiao">Comparar com Região</option>
                </select>
              </div>
            </div>
            {escopoGeografico === 'outroEstado' && (
              <div className="mt-2">
                <label htmlFor="filtro-estado-comparacao" className={rankingTextColors.filterLabel}>Selecione o Estado para Comparação</label>
                <select id="filtro-estado-comparacao" value={estadoComparacao} onChange={(e) => setEstadoComparacao(e.target.value)}
                  className={`${rankingTextColors.input} md:w-1/2 lg:w-1/3`}>
                  <option value="">Selecione...</option>
                  {ufsBrasil.filter(uf => uf !== ufEstado).map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            )}
            {escopoGeografico === 'regiao' && (
               <div className="mt-2">
                <label htmlFor="filtro-regiao-comparacao" className={rankingTextColors.filterLabel}>Selecione a Região para Comparação</label>
                <select id="filtro-regiao-comparacao" value={regiaoComparacao} onChange={(e) => setRegiaoComparacao(e.target.value)}
                  className={`${rankingTextColors.input} md:w-1/2 lg:w-1/3`}>
                  <option value="">Selecione...</option>
                  {Object.keys(regioesBrasil).map(regiaoNome => <option key={regiaoNome} value={regiaoNome}>{regiaoNome}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className={`${style === 'colorido' && !isDarkMode ? 'bg-white' : style === 'colorido' && isDarkMode ? 'bg-slate-800' : 'bg-white/20'} p-4 rounded-lg shadow`}>
            <h4 className={`font-medium mb-3 ${rankingTextColors.title}`}>
              Ranking de Deputados por Despesas ({selectedMes === 'todos' ? `Ano ${selectedAno}` : `${mesesOptions.find(m => m.value === selectedMes)?.label || ''} de ${selectedAno}`})
              {escopoGeografico === 'bandeiraAtiva' && ufEstado && ` - ${ufEstado}`}
              {escopoGeografico === 'outroEstado' && estadoComparacao && ` - ${ufEstado} vs ${estadoComparacao}`}
              {escopoGeografico === 'regiao' && regiaoComparacao && ` - Região ${regiaoComparacao}`}
              {selectedTipoDespesa && ` (${selectedTipoDespesa})`}
            </h4>
            {loadingRanking && <p className={rankingTextColors.infoText}>Carregando ranking...</p>}
            {errorRanking && <p className={rankingTextColors.errorText}>{errorRanking}</p>}
            {!loadingRanking && !errorRanking && allRankingData.length === 0 && (
              <p className={rankingTextColors.infoText}>Nenhum dado de despesa encontrado para os filtros selecionados.</p>
            )}
            {!loadingRanking && !errorRanking && rankingDespesas.length > 0 && (
              <>
                <div className="space-y-3">
                  {rankingDespesas.map((deputado) => {
                    const perfilUrl = `/parlamentares/camara/${deputado.id}`;
                    const bandeiraImgUrl = `/assets/bandeiras/${deputado.uf}.svg`;
                    return (
                      <div key={deputado.id} className={`flex justify-between items-center p-3 ${style === 'colorido' && !isDarkMode ? 'bg-gray-50 hover:bg-gray-100' : style === 'colorido' && isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-white/10 hover:bg-white/20'} rounded-lg transition-colors`}>
                        <div className="flex items-center gap-3 flex-grow">
                          <a href={perfilUrl} target="_blank" rel="noopener noreferrer" className="contents">
                            <img
                              src={deputado.fotoUrl || `https://ui-avatars.com/api/?name=${deputado.nomeDeputado.replace(/\s+/g, '+')}&background=random`}
                              alt={`Foto de ${deputado.nomeDeputado}`}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500"
                            />
                          </a>
                          <img
                            src={bandeiraImgUrl}
                            alt={`Bandeira ${deputado.uf}`}
                            className="w-6 h-6 rounded-full object-contain border border-gray-400 dark:border-gray-600"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <a href={perfilUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer group">
                            <div className={`font-semibold ${rankingTextColors.deputadoNome} group-hover:underline`}>{deputado.nomeDeputado}</div>
                            <div className={`text-xs ${rankingTextColors.deputadoDetalhe}`}>{deputado.partido}-{deputado.uf}</div>
                          </a>
                        </div>
                        <div className={`font-bold ${rankingTextColors.value} text-sm ml-2 flex-shrink-0`}>
                          {`R$ ${deputado.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {allRankingData.length > rankingDespesas.length && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={handleLoadMore}
                      className={rankingTextColors.button}
                      disabled={loadingRanking}
                    >
                      {loadingRanking ? 'Carregando...' : 'Carregar Mais'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
