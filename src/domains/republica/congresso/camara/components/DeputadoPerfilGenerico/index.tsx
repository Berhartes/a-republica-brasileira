import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { useDeputadoPerfil } from '@/domains/republica/congresso/camara/hooks/useDeputadoPerfil'; // Atualizado, DeputadoPerfil removido
import { useDiscursosSenador as useDiscursosDeputado } from '@/domains/republica/congresso/senado/hooks/useDiscursosSenador'; // Mantido por enquanto, idealmente seria useDiscursosDeputado
import { logger } from '@/app/monitoring/logger';
// TODO: Criar componentes específicos para Deputados ou adaptar os de Senador se a estrutura de dados for compatível
import ComissoesSenador from '@/domains/republica/congresso/senado/components/ComissoesSenador'; 
import LicencasSenador from '@/domains/republica/congresso/senado/components/LicencasSenador';
import DiscursosApartesSenador from '@/domains/republica/congresso/senado/components/DiscursosApartesSenador';
import MateriasLegislativasSenador from '@/domains/republica/congresso/senado/components/MateriasLegislativasSenador';
import ScrollableSection from '@/shared/components/ui/scrollable-section';
import YearSelector from '@/shared/components/ui/year-selector';
import './styles.css';

/**
 * Props para o componente DiscursosCount
 */
interface DiscursosCountProps {
  deputadoId: string;
  ano: number | null;
}

/**
 * Interface para os dados de exibição do deputado no componente.
 */
interface DeputadoDisplayData {
  codigo: string;
  nome: string;
  nomeCompleto: string;
  genero: string;
  partido: { sigla: string; nome: string | null };
  uf: string;
  foto: string;
  paginaOficial: string;
  paginaParticular: string | null;
  email: string;
  telefones: Array<{ numero: string; tipo: string; ordem: number }>;
  situacao: {
    emExercicio: boolean;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa: boolean;
    cargoLideranca: boolean;
  };
  dadosPessoais: {
    dataNascimento: string;
    naturalidade: string;
    ufNaturalidade: string;
    enderecoParlamentar: string;
  };
  formacao: {
    historicoAcademico: Array<{ curso: string; grau: string; instituicao: string; local: string; dadoReal?: boolean }>;
    profissao: Array<{ nome: string; principal: boolean; dadoReal?: boolean }>;
  };
  bloco: { codigo: string; nome: string; apelido: string; dataCriacao: string } | null;
  presenca: number;
  projetos: number;
  ranking: number;
  pontuacao: number;
  aprovacao: number;
  processos: number;
}


/**
 * Componente para exibir a contagem de discursos de um deputado filtrados por ano
 */
const DiscursosCount: React.FC<DiscursosCountProps> = ({ deputadoId, ano }: DiscursosCountProps) => {
  const { data, isLoading, error } = useDiscursosDeputado(deputadoId);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div>;
  }

  if (error || !data) {
    return <>0</>;
  }

  const discursosFiltrados = data.discursos?.filter((discurso: { data?: string }) => { 
    if (!discurso.data) return false;
    if (ano === null) return true;
    const discursoAno = new Date(discurso.data).getFullYear();
    return discursoAno === ano;
  });

  return <>{discursosFiltrados?.length || 0}</>;
};

interface DeputadoPerfilGenericoProps { 
  id?: string;
}

const DeputadoPerfilGenerico: React.FC<DeputadoPerfilGenericoProps> = ({ id: propId }: DeputadoPerfilGenericoProps) => { 
  const params = useParams({ from: '/deputado/$id' }); 
  const id = propId || params.id as string;
  const [isFavorited, setIsFavorited] = useState(false);
  const [activeYear, setActiveYear] = useState<number | null>(new Date().getFullYear());
  const currentYear = new Date().getFullYear();
  const mandatoInicio = 2023; 

  const availableYears = Array.from(
    { length: currentYear - mandatoInicio + 1 },
    (_, i) => mandatoInicio + i
  ).reverse(); 

  const isLegislaturaAtual = (dataInicio?: string, dataFim?: string | null): boolean => {
    const hoje = new Date();
    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;
    if (!inicio) return false;
    return inicio <= hoje && (!fim || fim >= hoje);
  };

  const {
    data: perfilDeputadoReal, // Renomeado para evitar conflito com o estado 'deputado'
    isLoading: loadingPerfil,
    error: errorPerfil
  } = useDeputadoPerfil(id);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDeputados') || '{}');
    if (favorites[id]) {
      setIsFavorited(true);
    }
  }, [id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favoriteDeputados') || '{}');
    if (favorites[id]) {
      delete favorites[id];
      setIsFavorited(false);
    } else {
      favorites[id] = true;
      setIsFavorited(true);
    }
    localStorage.setItem('favoriteDeputados', JSON.stringify(favorites));
  };

  const [loading, setLoading] = useState<boolean>(true);

  // Estados para os dados do deputado, inicializados com valores genéricos/fallback
  const [filiacoes, setFiliacoes] = useState<Array<any>>([]);
  const [comissoes, setComissoes] = useState<Array<any>>([]);
  const [licencas, setLicencas] = useState<Array<any>>([]);
  const [cargos, setCargos] = useState<Array<any>>([]);
  const [mandatos, setMandatos] = useState<Array<any>>([]);
  const [_frentesParlamentares, setFrentesParlamentares] = useState<Array<{ id: number; titulo: string; uri: string }>>([]);
  const [redesSociaisState, setRedesSociaisState] = useState<Array<{ nome: string; url: string; tipo: string }>>([]);


  const [deputado, setDeputado] = useState<DeputadoDisplayData>({
    codigo: id || "0",
    nome: "Carregando...",
    nomeCompleto: "Carregando nome completo...",
    genero: "Não informado",
    partido: { sigla: "N/A", nome: null },
    uf: "BR",
    foto: `https://www.camara.leg.br/internet/deputado/bandep/${id || "0"}.jpg`,
    paginaOficial: `https://www.camara.leg.br/deputados/${id || "0"}`,
    paginaParticular: null,
    email: "Não informado",
    telefones: [],
    situacao: { emExercicio: false, afastado: false, titular: false, suplente: false, cargoMesa: false, cargoLideranca: false },
    dadosPessoais: { dataNascimento: "Não informado", naturalidade: "Não informada", ufNaturalidade: "BR", enderecoParlamentar: "Não informado" },
    formacao: { historicoAcademico: [], profissao: [] },
    bloco: null,
    presenca: 0, projetos: 0, ranking: 0, pontuacao: 0, aprovacao: 0, processos: 0
  });

  useEffect(() => {
    if (!loadingPerfil) {
      if (perfilDeputadoReal) {
        logger.info(`Perfil do deputado ${id} carregado do Firestore:`, perfilDeputadoReal);

        const { ultimoStatus, nomeCivil, sexo, urlWebsite, redeSocial, dataNascimento, ufNascimento, municipioNascimento, escolaridade, orgaos, frentes, mandatosExternos, historico, profissoes: profissoesApi } = perfilDeputadoReal;

        setDeputado(prevState => {
          const newState: DeputadoDisplayData = {
            ...prevState,
            codigo: perfilDeputadoReal.id.toString(),
            nome: ultimoStatus.nomeEleitoral || ultimoStatus.nome,
            nomeCompleto: nomeCivil,
            genero: sexo === 'M' ? 'Masculino' : sexo === 'F' ? 'Feminino' : 'Não informado',
            partido: { sigla: ultimoStatus.siglaPartido, nome: ultimoStatus.siglaPartido }, // Nome completo do partido não está no JSON
            uf: ultimoStatus.siglaUf,
            foto: ultimoStatus.urlFoto,
            paginaOficial: `https://www.camara.leg.br/deputados/${perfilDeputadoReal.id}`,
            paginaParticular: urlWebsite || null,
            email: ultimoStatus.email || ultimoStatus.gabinete?.email || "Não informado",
            telefones: ultimoStatus.gabinete?.telefone ? [{ numero: ultimoStatus.gabinete.telefone, tipo: "Gabinete", ordem: 1 }] : [],
            situacao: {
              ...prevState.situacao,
              emExercicio: ultimoStatus.situacao === "Exercício",
              titular: ultimoStatus.condicaoEleitoral === "Titular",
            },
            dadosPessoais: {
              dataNascimento: dataNascimento || "Não informado",
              naturalidade: municipioNascimento || "Não informada",
              ufNaturalidade: ufNascimento || "BR",
              enderecoParlamentar: ultimoStatus.gabinete ? `Gabinete ${ultimoStatus.gabinete.nome}, Prédio ${ultimoStatus.gabinete.predio}, Sala ${ultimoStatus.gabinete.sala}, Andar ${ultimoStatus.gabinete.andar}` : "Não informado",
            },
            formacao: {
              historicoAcademico: escolaridade ? [{ curso: escolaridade, grau: "Não informado", instituicao: "Não informada", local: "Não informado", dadoReal: true }] : [],
              profissao: profissoesApi?.map(p => ({ nome: p.titulo || "Não informada", principal: false, dadoReal: true })) || [],
            },
            // Bloco e analytics precisam de outras fontes ou lógica
            bloco: prevState.bloco, 
          };
          return newState;
        });

        // Mapear redes sociais
        if (redeSocial && redeSocial.length > 0) {
          const mappedRedes = redeSocial.map(url => {
            let tipo = "website";
            let nome = "Website";
            try {
              const domain = new URL(url).hostname.toLowerCase();
              if (domain.includes("twitter.com") || domain.includes("x.com")) {
                tipo = "twitter";
                nome = "Twitter / X";
              } else if (domain.includes("facebook.com")) {
                tipo = "facebook";
                nome = "Facebook";
              } else if (domain.includes("instagram.com")) {
                tipo = "instagram";
                nome = "Instagram";
              } else if (domain.includes("youtube.com")) {
                tipo = "youtube";
                nome = "YouTube";
              } else if (domain.includes("linkedin.com")) {
                tipo = "linkedin";
                nome = "LinkedIn";
              } else {
                // Tenta extrair um nome mais amigável do path
                const pathParts = new URL(url).pathname.split('/').filter(part => part);
                if (pathParts.length > 0) {
                  nome = pathParts[pathParts.length -1];
                } else {
                  nome = domain;
                }
              }
            } catch (e) {
              logger.warn(`URL de rede social inválida: ${url}`, e);
              nome = url; // Fallback para a URL completa se inválida
            }
            return { nome, url, tipo };
          });
          setRedesSociaisState(mappedRedes);
        } else {
          setRedesSociaisState([]);
        }

        // Mapear 'historico' para 'filiacoes' e 'mandatos' (mandatos na câmara)
        if (historico && historico.length > 0) {
          const filiacoesReais = historico.reduce((acc, item) => {
            const ultimaFiliacao = acc.length > 0 ? acc[acc.length - 1] : null;
            if (!ultimaFiliacao || ultimaFiliacao.partido.sigla !== item.siglaPartido) {
              if (ultimaFiliacao) {
                ultimaFiliacao.dataDesfiliacao = item.dataHora; // Aproximação
              }
              acc.push({
                partido: { sigla: item.siglaPartido, nome: item.siglaPartido, codigo: item.uriPartido.split('/').pop() }, // Nome completo do partido não disponível
                dataFiliacao: item.dataHora, // Aproximação
                dataDesfiliacao: null,
                atual: false, // Será definido abaixo
                dadoReal: true,
              });
            }
            return acc;
          }, [] as Array<any>);

          if (filiacoesReais.length > 0) {
             // A última filiação no histórico é a atual, se o deputado estiver em exercício
            const filiacaoMaisRecente = filiacoesReais[filiacoesReais.length -1];
            if(filiacaoMaisRecente.partido.sigla === ultimoStatus.siglaPartido) {
                filiacaoMaisRecente.atual = true;
            }
          }
          setFiliacoes(filiacoesReais);

          const mandatosCamara = historico
            .filter(h => h.descricaoStatus && (h.descricaoStatus.includes("Nome no início da legislatura") || h.descricaoStatus.includes("Posse de Eleito Titular")))
            .map(h => ({
              codigo: h.id.toString(),
              participacao: h.condicaoEleitoral,
              legislatura: h.idLegislatura.toString(),
              dataInicio: h.dataHora.split('T')[0], // Apenas data
              // dataFim precisa ser inferida ou obtida de outro lugar, o histórico não tem dataFim explícita para o mandato em si
              dataFim: h.situacao === "Fim de Mandato" ? h.dataHora.split('T')[0] : undefined,
              descricao: `Deputado Federal (${h.siglaUf})`,
              titular: h.condicaoEleitoral === "Titular",
              suplente: h.condicaoEleitoral !== "Titular", // Simplificação
              afastado: h.situacao !== "Exercício" && h.situacao !== "Fim de Mandato",
              observacao: h.descricaoStatus,
              dadoReal: true,
              // exercicios e suplentes não estão diretamente no 'historico' do deputado
            }));
          setMandatos(prevMandatos => [...mandatosCamara, ...prevMandatos.filter(m => !m.dadoReal)]); // Adiciona mandatos da câmara
        }

        // Mapear 'mandatosExternos'
        if (mandatosExternos && mandatosExternos.length > 0) {
          const outrosMandatos = mandatosExternos.map(m => ({
            codigo: `${m.cargo}-${m.anoInicio}`, // ID improvisado
            participacao: "Titular", // Assumindo titular
            legislatura: "N/A", // Não aplicável diretamente
            dataInicio: `${m.anoInicio}-01-01`, // Aproximação
            dataFim: `${m.anoFim}-12-31`, // Aproximação
            descricao: `${m.cargo} (${m.municipio ? `${m.municipio}-` : ''}${m.siglaUf})`,
            titular: true,
            suplente: false,
            afastado: false,
            observacao: `Eleito pelo ${m.siglaPartidoEleicao}`,
            dadoReal: true,
          }));
          setMandatos(prevMandatos => [...prevMandatos.filter(m => m.dadoReal && m.descricao.includes("Deputado Federal")), ...outrosMandatos]);
        }


        // Mapear 'orgaos' para 'comissoes' e 'cargos'
        if (orgaos && orgaos.length > 0) {
          const comissoesAtuais = orgaos
            .filter(o => !o.dataFim) // Apenas órgãos/comissões atuais
            .map(o => ({
              codigo: o.idOrgao.toString(),
              sigla: o.siglaOrgao,
              nome: o.nomeOrgao,
              participacao: o.titulo, // Ex: Titular, Suplente
              // cargo em comissão específico não está claro no JSON, usando o 'titulo'
              cargo: o.titulo,
              dataInicio: o.dataInicio.split('T')[0],
              dataFim: o.dataFim ? o.dataFim.split('T')[0] : undefined,
              titular: o.titulo === "Titular", // Simplificação
              casa: "CD", // Câmara dos Deputados
              dadoReal: true,
            }));
          setComissoes(comissoesAtuais);

          const cargosEmOrgaos = orgaos
            .filter(o => !o.dataFim)
            .map(o => ({
              codigo: `${o.idOrgao}-${o.codTitulo}`, // ID improvisado
              cargo: { descricao: o.titulo, tipo: "Comissão" }, // Tipo genérico
              comissao: {
                codigo: o.idOrgao.toString(),
                nome: o.nomeOrgao,
                sigla: o.siglaOrgao,
                casa: "CD",
              },
              dataInicio: o.dataInicio.split('T')[0],
              dataFim: o.dataFim ? o.dataFim.split('T')[0] : undefined,
              atual: !o.dataFim,
              dadoReal: true,
            }));
          setCargos(cargosEmOrgaos);
        }
        // Licenças não estão no JSON de exemplo, manter vazio ou adaptar se houver fonte
        setLicencas([]);

        // Mapear frentes parlamentares
        if (frentes && frentes.length > 0) {
          setFrentesParlamentares(frentes.map(f => ({ id: f.id, titulo: f.titulo, uri: f.uri, dadoReal: true })));
        } else {
          setFrentesParlamentares([]);
        }


      } else if (errorPerfil) {
        logger.error(`Erro ao carregar perfil do deputado ${id}:`, errorPerfil);
        const deputadoId = id || '0';
        setDeputado(prevState => ({
          ...prevState,
          codigo: deputadoId,
          nome: `Deputado ${deputadoId}`,
          nomeCompleto: `Deputado ID ${deputadoId} (Erro ao carregar)`,
          foto: `https://www.camara.leg.br/internet/deputado/bandep/${deputadoId}.jpg`,
          paginaOficial: `https://www.camara.leg.br/deputados/${deputadoId}`,
          email: `dep.${deputadoId}@camara.leg.br`,
        }));
      }
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [perfilDeputadoReal, loadingPerfil, errorPerfil, id]);


  const cargosMesa = cargos.filter(cargo =>
    cargo.comissao?.sigla === "MESA" || 
    cargo.cargo.descricao.toUpperCase().includes("PRESIDENTE") ||
    cargo.cargo.descricao.toUpperCase().includes("SECRETÁRIO")
  );

  const cargosLideranca = cargos.filter(cargo =>
    !cargosMesa.some(cargoMesa => cargoMesa.codigo === cargo.codigo)
  );

  // A lógica de mapeamento de frentes foi movida para dentro do useEffect principal

  const trajetoriaPolitica = [
    { periodo: "2023-Atual", cargo: "Deputado Federal", descricao: "Atuação em comissões de Educação e Cultura" },
    { periodo: "2019-2022", cargo: "Vereador Municipal", descricao: "Liderança na câmara municipal" }
  ];

  // redesSociaisState é agora o estado com os dados reais
  // const redesSociais = [
  //   { nome: "@deputadoexemplo", url: "https://twitter.com/deputadoexemplo", tipo: "twitter" },
  //   { nome: "@deputadoexemplo", url: "https://www.instagram.com/deputadoexemplo/", tipo: "instagram" }
  // ];

  const votacoesRelevantes = [
    { titulo: "PL 123/2023 - Reforma Tributária", voto: "A favor", tema: "Economia", alinhamento: "Alinhado ao partido" },
    { titulo: "PEC 45/2023 - Educação Básica", voto: "Contra", tema: "Educação", alinhamento: "Contra orientação partidária" }
  ];

  const historicoJuridico = [
    { processo: "INQ 98765-43.2022", tipo: "Investigação Parlamentar", status: "Arquivado", tribunal: "STF" }
  ];

  const contribuicoesComunidade = [
    { usuario: "Cidadão SP-1234", relato: "Proposta de emenda popular", status: "Recebida", data: "10/03/2024" }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {errorPerfil && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <div className="text-red-500 mr-3 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Erro ao carregar dados</h3>
            <div className="text-sm text-red-700 mt-1">
              Não foi possível carregar os dados completos do deputado. Exibindo informações genéricas.
            </div>
            <button
              className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {loading ? (
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-gray-200">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="relative w-24 h-24">
                <img
                  src={deputado.foto || `https://via.placeholder.com/200?text=${deputado.nome.charAt(0)}`}
                  className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover"
                  alt={deputado.nome}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    const initial = deputado.nome ? deputado.nome.charAt(0).toUpperCase() : 'D';
                    e.currentTarget.src = `https://via.placeholder.com/200?text=${initial}`;
                  }}
                />
                {errorPerfil && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    !
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    {loading ? <span className="animate-pulse bg-gray-200 h-8 w-48 inline-block rounded"></span> : deputado.nome}
                  </h1>
                  <div className="text-gray-600">
                    {loading ? <span className="animate-pulse bg-gray-200 h-5 w-64 inline-block rounded"></span> : deputado.nomeCompleto}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      {loading ?
                        <span className="animate-pulse bg-emerald-200 h-5 w-16 inline-block rounded"></span> :
                        `${deputado.partido?.sigla || 'N/A'} - ${deputado.uf || 'BR'}`
                      }
                    </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {loading ?
                        <span className="animate-pulse bg-blue-200 h-5 w-24 inline-block rounded"></span> :
                        (deputado.bloco ? (deputado.bloco.apelido || deputado.bloco.nome) : 'Sem Bloco Parlamentar')
                      }
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                      ⚖️ {deputado.processos} Processo Ativo
                    </span>
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
                  <button className="p-3 rounded-full bg-gray-100 hover:bg-gray-200" onClick={toggleFavorite}>
                    <svg
                      className={`w-6 h-6 ${isFavorited ? 'text-yellow-500' : 'text-gray-700'}`}
                      fill={isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Mandato</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">
                      {mandatos.find(m => isLegislaturaAtual(m.dataInicio, m.dataFim)) ? `${new Date().getFullYear() - new Date(mandatos.find(m => isLegislaturaAtual(m.dataInicio, m.dataFim))!.dataInicio).getFullYear()} Anos` : 'N/A'}
                    </div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Presença</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">{deputado.presenca}%</div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Projetos</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">{deputado.projetos}</div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Ranking</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">#{deputado.ranking}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Trajetória Política</h3>
              <div className="space-y-4">
                {trajetoriaPolitica.map((item, index) => (
                  <div key={index} className="relative pl-6 border-l-2 border-emerald-500">
                    <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px]"></div>
                    <div className="font-medium text-gray-800">{item.periodo}</div>
                    <div className="text-sm text-gray-600">{item.cargo}</div>
                    <div className="text-xs text-gray-500 mt-2">{item.descricao}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Dados Pessoais</h3>
              <div className="space-y-3">
                {deputado.dadosPessoais?.dataNascimento && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Data de Nascimento</div>
                      <div className="text-sm text-gray-600">{deputado.dadosPessoais.dataNascimento}</div>
                    </div>
                  </div>
                )}

                {deputado.dadosPessoais?.naturalidade && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Naturalidade</div>
                      <div className="text-sm text-gray-600">{deputado.dadosPessoais.naturalidade} - {deputado.dadosPessoais.ufNaturalidade}</div>
                    </div>
                  </div>
                )}

                {deputado.genero && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Gênero</div>
                      <div className="text-sm text-gray-600">{deputado.genero}</div>
                    </div>
                  </div>
                )}

                {deputado.email && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">E-mail</div>
                      <div className="text-sm text-gray-600">{deputado.email}</div>
                    </div>
                  </div>
                )}

                {deputado.telefones && deputado.telefones.length > 0 && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Telefone</div>
                      {deputado.telefones && deputado.telefones.map((telefone, index) => (
                        <div key={index} className="text-sm text-gray-600">{telefone.tipo}: {telefone.numero}</div>
                      ))}
                    </div>
                  </div>
                )}

                {deputado.dadosPessoais?.enderecoParlamentar && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Endereço Parlamentar</div>
                      <div className="text-sm text-gray-600">{deputado.dadosPessoais.enderecoParlamentar}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Formação Acadêmica</h3>
                {deputado.formacao?.historicoAcademico &&
                 deputado.formacao.historicoAcademico.length > 0 &&
                 !deputado.formacao.historicoAcademico.some((formacao: any) => 'dadoReal' in formacao && formacao.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dados genéricos
                  </span>
                )}
              </div>
              {deputado.formacao?.historicoAcademico && deputado.formacao.historicoAcademico.length > 0 ? (
                <div className="space-y-4">
                  {deputado.formacao.historicoAcademico.map((formacao: any, index: number) => (
                    <div key={index} className="relative pl-6 border-l-2 border-blue-500">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px]"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{formacao.grau} em {formacao.curso}</div>
                          <div className="text-sm text-gray-600">{formacao.instituicao}</div>
                          <div className="text-xs text-gray-500 mt-1">{formacao.local}</div>
                        </div>
                        {!formacao.dadoReal && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Genérico
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">Nenhuma formação acadêmica registrada</div>
              )}

              {deputado.formacao?.profissao && deputado.formacao.profissao.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Profissões</h4>
                    {!deputado.formacao.profissao.some((profissao: any) => profissao.dadoReal) && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Todos genéricos
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {deputado.formacao.profissao.map((profissao: any, index: number) => (
                      <div key={index} className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm ${profissao.principal ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                          {profissao.nome}
                        </span>
                        {!profissao.dadoReal && (
                          <span className="ml-1 px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                            <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Filiações Partidárias</h3>
                {filiacoes.length > 0 && !filiacoes.some((filiacao:any) => filiacao.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Todos genéricos
                  </span>
                )}
              </div>
              {filiacoes.length > 0 ? (
                <div className="space-y-4">
                  {filiacoes.map((filiacao: any, index: number) => (
                    <div key={index} className="relative pl-6 border-l-2 border-emerald-500">
                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px]"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{filiacao.partido.sigla} - {filiacao.partido.nome}</div>
                          <div className="text-sm text-gray-600">
                            {filiacao.dataFiliacao} {filiacao.dataDesfiliacao ? `até ${filiacao.dataDesfiliacao}` : '(atual)'}
                          </div>
                          {filiacao.atual && <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">Atual</span>}
                        </div>
                        {!filiacao.dadoReal && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Genérico
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">Nenhuma filiação partidária registrada</div>
              )}
            </div>

            <div className="bg-gray-100 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Redes Sociais e Links</h3>
              <div className="space-y-3">
                {redesSociaisState.length > 0 ? redesSociaisState.map((rede, index) => (
                  <a key={index} href={rede.url} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700">
                    {rede.tipo === 'twitter' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>}
                    {rede.tipo === 'facebook' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>}
                    {rede.tipo === 'instagram' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.948-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>}
                    {rede.tipo === 'youtube' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>}
                    {rede.tipo === 'linkedin' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-4.481 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z"/></svg>}
                    {rede.tipo === 'website' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>}
                    {rede.nome}
                  </a>
                )) : <div className="text-sm text-gray-500">Nenhuma rede social informada.</div>}

                {deputado.paginaOficial && (
                  <a href={deputado.paginaOficial} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-3 text-blue-600 hover:text-blue-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Página Oficial na Câmara
                  </a>
                )}

                {deputado.paginaParticular && (
                  <a href={deputado.paginaParticular}
                     className="flex items-center gap-3 text-purple-600 hover:text-purple-700"
                     target="_blank" rel="noopener noreferrer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Site Pessoal
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Atividade na Câmara</h2>
                <YearSelector
                  selectedYear={activeYear}
                  availableYears={availableYears}
                  onChange={setActiveYear}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Propostas Legislativas</h3>
                  <div className="text-4xl font-bold text-emerald-600">{deputado.projetos}</div>
                  <span className="text-sm text-gray-600">Maioria sobre educação</span>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Votações Nominais</h3>
                  <div className="text-4xl font-bold text-blue-600">210</div> 
                  <span className="text-sm text-gray-600">80% alinhado ao partido</span> 
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Discursos</h3>
                  <div className="text-4xl font-bold text-purple-600">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div>
                    ) : (
                      <DiscursosCount deputadoId={id} ano={activeYear} /> 
                    )}
                  </div>
                  <div className="flex gap-3 mt-3">
                    <a href="#" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                      </svg>
                      Vídeo
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Mandatos</h2>
                {mandatos.length > 0 && !mandatos.some((mandato:any) => mandato.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Todos genéricos
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {mandatos.map((mandato: any, index: number) => { // Adicionado tipo any para mandato e index
                  const isAtual = isLegislaturaAtual(mandato.dataInicio, mandato.dataFim);
                  const isLegislatura57 = mandato.legislatura === '57'; 

                  return (
                    <div key={index} className={`${isAtual ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-gray-100'} p-4 rounded-xl`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${mandato.titular ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {mandato.titular ? 'T' : 'S'}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{mandato.descricao}</h3>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-sm text-gray-600">
                              {mandato.dataInicio} {mandato.dataFim ? `a ${mandato.dataFim}` : '(atual)'}
                            </div>
                            <span className={`px-2 py-0.5 ${isLegislatura57 ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-gray-200 text-gray-700'} rounded-full text-xs`}>
                              Legislatura {mandato.legislatura}
                              {isLegislatura57 && ' (atual)'}
                            </span>
                            {mandato.uf && <span className="text-sm text-gray-600">{mandato.uf}</span>}
                          </div>
                          {mandato.primeiraLegislatura && ( 
                            <div className="text-xs text-gray-500 mt-1">
                              {mandato.primeiraLegislatura.numero}ª Legislatura: {mandato.primeiraLegislatura.dataInicio} a {mandato.primeiraLegislatura.dataFim}
                              {isLegislaturaAtual(mandato.primeiraLegislatura.dataInicio, mandato.primeiraLegislatura.dataFim) &&
                                <span className="ml-1 text-emerald-600 font-semibold">(atual)</span>}
                            </div>
                          )}
                        </div>
                        <div className="ml-auto flex flex-col items-end gap-1">
                          {isAtual && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                              Mandato Atual
                            </span>
                          )}
                          {mandato.afastado && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                              Afastado
                            </span>
                          )}
                          {!mandato.dadoReal && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Genérico
                            </span>
                          )}
                        </div>
                      </div>

                      {mandato.observacao && (
                        <div className="text-sm text-gray-600 mt-2 italic">{mandato.observacao}</div>
                      )}

                      {mandato.exercicios && mandato.exercicios.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Exercícios:</div>
                          <div className="space-y-1">
                            {mandato.exercicios.map((exercicio: any, idx: number) => ( // Adicionado tipo any
                              <div key={idx} className="flex items-start gap-2">
                                <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs mt-1">{idx + 1}</span>
                                <div>
                                  <div className="text-sm text-gray-600">
                                    {exercicio.dataInicio} {exercicio.dataFim ? `a ${exercicio.dataFim}` : '(atual)'}
                                  </div>
                                  {exercicio.descricaoCausaAfastamento && (
                                    <div className="text-xs text-gray-500">
                                      {exercicio.descricaoCausaAfastamento}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {mandato.suplentes && mandato.suplentes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Suplentes:</div>
                          <div className="space-y-1">
                            {mandato.suplentes.map((suplente: any, idx: number) => ( // Adicionado tipo any
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                <span className="text-sm text-gray-600">{suplente.nome} ({suplente.participacao})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TODO: Usar ComissoesDeputado ou adaptar ComissoesSenador. Passar frentes para exibição combinada. */}
            <ComissoesSenador comissoes={comissoes} senadorId={id || ''} />

            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cargos</h2>
                {cargos.length > 0 && !cargos.some((cargo:any) => cargo.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dados genéricos
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mesas Diretoras</h3>
              {cargosMesa.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {cargosMesa.map((cargo: any, index: number) => ( // Adicionado tipo any
                    <div key={index} className="bg-gray-100 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800">{cargo.cargo.descricao}</h3>
                              <div className="text-sm text-gray-600">{cargo.comissao?.nome || 'Mesa Diretora'}</div>
                              <div className="text-sm text-gray-600">
                                {cargo.dataInicio} {cargo.dataFim ? `a ${cargo.dataFim}` : '(atual)'}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {cargo.atual && (
                                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                  Atual
                                </span>
                              )}
                              {!cargo.dadoReal && (
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
                <div className="bg-gray-100 p-6 rounded-xl text-center mb-6">
                  <div className="text-gray-500">Nenhum cargo em mesa diretora registrado</div>
                </div>
              )}

              <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Comissões e Outros Cargos</h3>
              {cargosLideranca.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {cargosLideranca.map((cargo: any, index: number) => ( // Adicionado tipo any
                    <div key={index} className="bg-gray-100 p-4 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium text-gray-800">{cargo.cargo.descricao}</h3>
                              <div className="text-sm text-gray-600">
                                {cargo.comissao?.nome || 'Comissão'}
                                {cargo.comissao?.casa && ` (${cargo.comissao.casa})`}
                              </div>
                              <div className="text-sm text-gray-600">
                                {cargo.dataInicio} {cargo.dataFim ? `a ${cargo.dataFim}` : '(atual)'}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {cargo.atual && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                                  Atual
                                </span>
                              )}
                              {!cargo.dadoReal && (
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
                  <div className="text-gray-500">Nenhum cargo em comissão registrado</div>
                </div>
              )}
            </div>

            {/* TODO: Usar LicencasDeputado ou adaptar LicencasSenador */}
            <LicencasSenador licencas={licencas} senadorId={id || ''} />

            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Desempenho Legislativo</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dados genéricos
                </span>
              </div>
              <div className="bg-gray-100 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="performance-ring w-48 h-48 mx-auto rounded-full flex items-center justify-center"
                       style={{background: `conic-gradient(#10b981 ${deputado.presenca}%, #e2e7eb 0)`}}>
                    <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{deputado.pontuacao}</span>
                      <span className="text-sm text-gray-600">Pontuação Geral</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">{deputado.presenca}%</div>
                      <div>
                        <div className="font-medium text-gray-800">Presença</div>
                        <div className="text-sm text-gray-600">Média partidária: 85%</div> 
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">{deputado.aprovacao}%</div>
                      <div>
                        <div className="font-medium text-gray-800">Aprovação</div>
                        <div className="text-sm text-gray-600">Entre pares do partido</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Votações Relevantes</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dados genéricos
                </span>
              </div>
              <div className="space-y-4">
                {votacoesRelevantes.map((votacao, index) => (
                  <div key={index} className="bg-gray-100 p-4 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        {votacao.voto === "A favor" ? "👍" : "👎"}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{votacao.titulo}</h3>
                        <div className="text-sm text-gray-600">Votou {votacao.voto.toLowerCase()}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm mb-2">
                          {votacao.tema === "Economia" ? "💰 " : "📚 "}{votacao.tema} 
                        </span>
                        <span className="text-sm text-gray-600">{votacao.alinhamento}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* TODO: Usar DiscursosApartesDeputado ou adaptar DiscursosApartesSenador */}
            <DiscursosApartesSenador senadorId={id} ano={activeYear} />
            {/* TODO: Usar MateriasLegislativasDeputado ou adaptar MateriasLegislativasSenador */}
            <MateriasLegislativasSenador senadorId={id} ano={activeYear} />

            {/* Seção de Frentes Parlamentares foi removida daqui para ser integrada em Comissões */}

            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Histórico Jurídico</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dados genéricos
                </span>
              </div>
              <div className="bg-red-50 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {historicoJuridico.map((processo, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">⚖️</div>
                        <div>
                          <div className="font-medium text-gray-800">{processo.processo}</div>
                          <div className="text-sm text-gray-600">{processo.tipo}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">{processo.status}</span>
                        <span className="text-sm text-gray-600">{processo.tribunal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Contribuições da Comunidade</h2>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Dados genéricos
                </span>
              </div>
              <div className="bg-yellow-50 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contribuicoesComunidade.map((contribuicao, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">👤</span>
                        <div>
                          <div className="text-sm font-medium text-gray-800">{contribuicao.usuario} reportou:</div>
                          <div className="text-sm text-gray-600">"{contribuicao.relato}"</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-emerald-600">✓ {contribuicao.status}</span>
                        <span className="text-gray-600">{contribuicao.data}</span>
                      </div>
                    </div>
                  ))}
                  <button className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                    </svg>
                    Reportar Inconsistência
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeputadoPerfilGenerico;
