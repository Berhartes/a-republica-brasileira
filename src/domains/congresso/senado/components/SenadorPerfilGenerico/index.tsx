import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { Card, CardContent } from '@/shared/components/ui/card';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { useSenadorPerfil } from '@/domains/congresso/senado/hooks';
import { useDiscursosSenador } from '@/domains/congresso/senado/hooks/useDiscursosSenador';
import { logger } from '@/app/monitoring/logger';
import ComissoesSenador from '@/domains/congresso/senado/components/ComissoesSenador';
import LicencasSenador from '@/domains/congresso/senado/components/LicencasSenador';
import DiscursosApartesSenador from '@/domains/congresso/senado/components/DiscursosApartesSenador';
import MateriasLegislativasSenador from '@/domains/congresso/senado/components/MateriasLegislativasSenador';
import ScrollableSection from '@/shared/components/ui/scrollable-section';
import YearSelector from '@/shared/components/ui/year-selector';
import './styles.css';

/**
 * Props para o componente DiscursosCount
 */
interface DiscursosCountProps {
  senadorId: string;
  ano: number | null;
}

/**
 * Componente para exibir a contagem de discursos de um senador filtrados por ano
 */
const DiscursosCount: React.FC<DiscursosCountProps> = ({ senadorId, ano }: DiscursosCountProps) => {
  // Buscar dados de discursos
  const { data, isLoading, error } = useDiscursosSenador(senadorId);

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div>;
  }

  if (error || !data) {
    return <>0</>;
  }

  // Filtrar discursos pelo ano selecionado
  const discursosFiltrados = data.discursos?.filter(discurso => {
    if (!discurso.data) return false;

    // Se ano for null, retornar todos os discursos
    if (ano === null) return true;

    // Extrair o ano da data do discurso (formato: YYYY-MM-DD)
    const discursoAno = new Date(discurso.data).getFullYear();
    return discursoAno === ano;
  });

  // Retornar a contagem de discursos filtrados
  return <>{discursosFiltrados?.length || 0}</>;
};

interface SenadorPerfilGenericoProps {
  id?: string;
}

const SenadorPerfilGenerico: React.FC<SenadorPerfilGenericoProps> = ({ id: propId }: SenadorPerfilGenericoProps) => {
  // Usar ID da rota se não for fornecido como prop
  const params = useParams({ from: '/senador/$id' });
  const id = propId || params.id as string;

  // Estado para o ano ativo
  const [activeYear, setActiveYear] = useState<number | null>(new Date().getFullYear());

  // Anos disponíveis para seleção (anos de mandato até o ano atual)
  const currentYear = new Date().getFullYear();
  const mandatoInicio = 2023; // Início do mandato atual (57ª legislatura)

  // Criar array com os anos de mandato até o ano atual
  const availableYears = Array.from(
    { length: currentYear - mandatoInicio + 1 },
    (_, i) => mandatoInicio + i
  ).reverse(); // Mais recente primeiro

  // Função para verificar se uma legislatura é atual com base na data
  const isLegislaturaAtual = (dataInicio?: string, dataFim?: string | null): boolean => {
    const hoje = new Date();
    const inicio = dataInicio ? new Date(dataInicio) : null;
    const fim = dataFim ? new Date(dataFim) : null;

    // Se não tiver data de início, não é atual
    if (!inicio) return false;

    // Se não tiver data de fim ou a data de fim for no futuro, e a data de início for no passado
    return inicio <= hoje && (!fim || fim >= hoje);
  };

  // Buscar dados do perfil do senador do Firestore
  const {
    data: perfilSenador,
    isLoading: loadingPerfil,
    error: errorPerfil
  } = useSenadorPerfil(id);

  // Estado para controlar o carregamento geral
  const [loading, setLoading] = useState<boolean>(true);

  // Estado para armazenar as filiações partidárias
  const [filiacoes, setFiliacoes] = useState<Array<{
    partido: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    dataFiliacao: string;
    dataDesfiliacao: string | null;
    atual: boolean;
    dadoReal?: boolean;
  }>>([
    {
      partido: {
        codigo: "582",
        sigla: "PXX",
        nome: "Partido Exemplo"
      },
      dataFiliacao: "2022-02-23",
      dataDesfiliacao: null,
      atual: true
    },
    {
      partido: {
        codigo: "554",
        sigla: "PYY",
        nome: "Partido Anterior"
      },
      dataFiliacao: "2011-02-01",
      dataDesfiliacao: "2022-02-23",
      atual: false
    }
  ]);

  // Estado para apartes removido - agora usando o componente DiscursosApartesSenador

  // Estado para comissões
  const [comissoes, setComissoes] = useState<Array<{
    codigo: string;
    sigla: string;
    nome: string;
    casa: string;
    dataInicio: string;
    dataFim: string | null;
    participacao: string;
    atual: boolean;
    dadoReal?: boolean;
  }>>([]);

  // Estado para licenças
  const [licencas, setLicencas] = useState<Array<{
    codigo: string;
    tipo: {
      sigla: string;
      descricao: string;
    };
    dataInicio: string;
    dataFim: string;
    atual: boolean;
    dadoReal?: boolean;
  }>>([]);

  // Estado para cargos
  const [cargos, setCargos] = useState<Array<{
    codigo: string;
    cargo: {
      codigo: string;
      descricao: string;
    };
    comissao: {
      codigo: string;
      sigla: string;
      nome: string;
      casa: string;
    } | null;
    dataInicio: string;
    dataFim: string | null;
    atual: boolean;
    dadoReal?: boolean;
  }>>([]);

  // Estado para mandatos
  const [mandatos, setMandatos] = useState<Array<{
    codigo: string;
    participacao: string;
    legislatura: string;
    dataInicio: string;
    dataFim: string | null;
    descricao: string;
    titular: boolean;
    suplente: boolean;
    afastado: boolean;
    observacao?: string;
    uf?: string;
    primeiraLegislatura?: {
      numero: string;
      dataInicio: string;
      dataFim: string;
    };
    segundaLegislatura?: {
      numero: string;
      dataInicio: string;
      dataFim: string;
    };
    exercicios?: Array<{
      codigo: string;
      dataInicio: string;
      dataFim: string | null;
      causaAfastamento: string | null;
      descricaoCausaAfastamento: string | null;
    }>;
    suplentes?: Array<{
      codigo: string;
      nome: string;
      participacao: string;
    }>;
    dadoReal?: boolean;
  }>>([
    {
      codigo: "615",
      participacao: "Titular",
      legislatura: "57",
      dataInicio: "2023-02-01",
      dataFim: null,
      descricao: "Senador Federal",
      titular: true,
      suplente: false,
      afastado: false,
      observacao: "Mandato atual",
      exercicios: [
        {
          codigo: "3022",
          dataInicio: "2023-02-01",
          dataFim: null,
          causaAfastamento: null,
          descricaoCausaAfastamento: null
        }
      ],
      suplentes: [
        {
          codigo: "6387",
          nome: "Primeiro Suplente",
          participacao: "1º Suplente"
        },
        {
          codigo: "6388",
          nome: "Segundo Suplente",
          participacao: "2º Suplente"
        }
      ],
      dadoReal: false
    },
    {
      codigo: "614",
      participacao: "Titular",
      legislatura: "56",
      dataInicio: "2019-02-01",
      dataFim: "2023-01-31",
      descricao: "Senador Federal",
      titular: true,
      suplente: false,
      afastado: false,
      observacao: "Mandato anterior",
      dadoReal: false
    },
    {
      codigo: "613",
      participacao: "Suplente",
      legislatura: "55",
      dataInicio: "2015-02-01",
      dataFim: "2019-01-31",
      descricao: "Deputado Federal",
      titular: false,
      suplente: true,
      afastado: false,
      observacao: "Mandato na Câmara",
      dadoReal: false
    }
  ]);

  // Estado para armazenar os dados do senador (combinando dados do Firestore com dados genéricos)
  const [senador, setSenador] = useState({
    codigo: id === "6331" ? "6331" : "5000",
    nome: id === "6331" ? "Sergio Moro" : "Senador Exemplo",
    nomeCompleto: id === "6331" ? "Sergio Fernando Moro" : "Nome Completo do Senador Exemplo",
    genero: "Masculino",
    partido: {
      sigla: id === "6331" ? "UNIÃO" : "PXX",
      nome: id === "6331" ? "União Brasil" : "Partido Exemplo"
    },
    uf: id === "6331" ? "PR" : "UF",
    foto: id === "6331"
      ? "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador6331.jpg"
      : "https://www.senado.leg.br/senadores/img/fotos-oficiais/senador5000.jpg",
    paginaOficial: id === "6331"
      ? "https://www25.senado.leg.br/web/senadores/senador/-/perfil/6331"
      : "http://www25.senado.leg.br/web/senadores/senador/-/perfil/5000",
    paginaParticular: "https://www.senadorexemplo.com.br",
    email: id === "6331" ? "sen.sergiomoro@senado.leg.br" : "senador.exemplo@senado.leg.br",
    telefones: [
      { numero: id === "6331" ? "(61) 3303-6391" : "(61) 3303-0000", tipo: "Gabinete", ordem: 1 }
    ],
    situacao: {
      emExercicio: true,
      afastado: false,
      titular: true,
      suplente: false,
      cargoMesa: false,
      cargoLideranca: false
    },
    dadosPessoais: {
      dataNascimento: id === "6331" ? "1972-08-01" : "1970-01-01",
      naturalidade: id === "6331" ? "Maringá" : "Cidade Natal",
      ufNaturalidade: id === "6331" ? "PR" : "UF",
      enderecoParlamentar: id === "6331" ? "Senado Federal, Anexo 1, 14º Pavimento" : "Senado Federal Anexo 1 15º Pavimento"
    },
    formacao: {
      historicoAcademico: [
        {
          curso: "Direito",
          grau: "Bacharelado",
          instituicao: "Universidade Federal",
          local: "Brasília"
        },
        {
          curso: "Administração Pública",
          grau: "Mestrado",
          instituicao: "Universidade Estadual",
          local: "São Paulo"
        }
      ],
      profissao: [
        { nome: "Advogado", principal: true },
        { nome: "Professor", principal: false }
      ]
    },
    bloco: {
      codigo: "123",
      nome: "Bloco Parlamentar",
      apelido: "Bloco",
      dataCriacao: "2023-01-01"
    },
    presenca: id === "6331" ? 83 : 75,
    projetos: id === "6331" ? 129 : 45,
    ranking: id === "6331" ? 112 : 50,
    pontuacao: id === "6331" ? 6.5 : 5.0,
    aprovacao: id === "6331" ? 64 : 50,
    processos: id === "6331" ? 1 : 0
  });

  // Atualizar os dados do senador quando os dados do Firestore estiverem disponíveis
  useEffect(() => {
    // Quando terminar de carregar (seja com sucesso ou erro)
    if (!loadingPerfil) {
      // Se tiver dados do perfil, atualizar apenas a foto e o nome do senador
      if (perfilSenador) {
        logger.info(`Perfil do senador ${id} carregado do Firestore:`, perfilSenador);

        // Atualizar os dados do senador com os dados do Firestore, mantendo os dados genéricos para campos não disponíveis
        setSenador(prevState => {
          // Criar uma cópia do estado atual
          const updatedSenador = { ...prevState };

          // Atualizar campos básicos
          updatedSenador.codigo = perfilSenador.codigo || prevState.codigo;
          updatedSenador.nome = perfilSenador.nome || prevState.nome;
          updatedSenador.nomeCompleto = perfilSenador.nomeCompleto || prevState.nomeCompleto;
          updatedSenador.foto = perfilSenador.foto || prevState.foto;

          // Atualizar campos adicionais se disponíveis
          if (perfilSenador.partido) {
            updatedSenador.partido = {
              sigla: perfilSenador.partido.sigla || prevState.partido.sigla,
              nome: perfilSenador.partido.nome || prevState.partido.nome
            };
          }

          if (perfilSenador.uf) {
            updatedSenador.uf = perfilSenador.uf;
          }

          if (perfilSenador.email) {
            updatedSenador.email = perfilSenador.email;
          }

          if (perfilSenador.paginaOficial) {
            updatedSenador.paginaOficial = perfilSenador.paginaOficial;
          }

          if (perfilSenador.telefones && perfilSenador.telefones.length > 0) {
            updatedSenador.telefones = perfilSenador.telefones;
          }

          if (perfilSenador.situacao) {
            updatedSenador.situacao = {
              ...prevState.situacao,
              ...perfilSenador.situacao
            };
          }

          if (perfilSenador.dadosPessoais) {
            updatedSenador.dadosPessoais = {
              ...prevState.dadosPessoais,
              ...perfilSenador.dadosPessoais
            };
          }

          // Atualizar o gênero se disponível
          if (perfilSenador.genero) {
            // Se o gênero for "F" ou "M", converter para "Feminino" ou "Masculino"
            if (perfilSenador.genero === 'F') {
              updatedSenador.genero = 'Feminino';
            } else if (perfilSenador.genero === 'M') {
              updatedSenador.genero = 'Masculino';
            } else {
              updatedSenador.genero = perfilSenador.genero;
            }
          } else if ('sexo' in perfilSenador && perfilSenador.sexo) {
            updatedSenador.genero = perfilSenador.sexo === 'M' ? 'Masculino' : 'Feminino';
          }

          // Atualizar formação acadêmica e profissão se disponíveis
          if ('formacao' in perfilSenador && perfilSenador.formacao) {
            // Verificar se o objeto formacao já existe no estado atual
            if (!updatedSenador.formacao) {
              updatedSenador.formacao = {} as any;
            }

            // Atualizar histórico acadêmico
            if ('historicoAcademico' in perfilSenador.formacao &&
                perfilSenador.formacao.historicoAcademico &&
                Array.isArray(perfilSenador.formacao.historicoAcademico)) {

              updatedSenador.formacao.historicoAcademico = perfilSenador.formacao.historicoAcademico.map(
                (curso: any) => ({ ...curso, dadoReal: true })
              );
            }

            // Atualizar profissão
            if ('profissao' in perfilSenador.formacao &&
                perfilSenador.formacao.profissao &&
                Array.isArray(perfilSenador.formacao.profissao)) {

              updatedSenador.formacao.profissao = perfilSenador.formacao.profissao.map(
                (profissao: any) => ({ ...profissao, dadoReal: true })
              );
            }
          }

          // Retornar o objeto atualizado
          return updatedSenador;
        });

        // Atualizar as filiações partidárias se disponíveis no Firestore
        if (perfilSenador && 'filiacoes' in perfilSenador && perfilSenador.filiacoes && Array.isArray(perfilSenador.filiacoes) && perfilSenador.filiacoes.length > 0) {
          // Criar um novo array apenas com os dados reais do Firestore
          const filiacoesReais = perfilSenador.filiacoes.map((filiacao: any) => {
            if (filiacao.partido && typeof filiacao.partido === 'object') {
              return {
                partido: {
                  codigo: filiacao.partido.codigo || '',
                  sigla: filiacao.partido.sigla || '',
                  nome: filiacao.partido.nome || ''
                },
                dataFiliacao: filiacao.dataFiliacao || filiacao.dataInicio || '',
                dataDesfiliacao: filiacao.dataDesfiliacao || filiacao.dataFim || null,
                atual: filiacao.atual || !filiacao.dataDesfiliacao,
                // Marcar como dado real do Firestore
                dadoReal: true
              };
            }
            return null;
          }).filter(Boolean) as any[];

          // Atualizar o estado apenas se houver filiações válidas
          if (filiacoesReais.length > 0) {
            // Substituir completamente as filiações genéricas com os dados reais
            setFiliacoes(filiacoesReais);
          }
        }

        // Lógica de atualização de apartes removida - agora usando o componente DiscursosApartesSenador

        // Atualizar as comissões se disponíveis no Firestore
        if (perfilSenador && 'comissoes' in perfilSenador && perfilSenador.comissoes && Array.isArray(perfilSenador.comissoes) && perfilSenador.comissoes.length > 0) {
          // Criar um novo array apenas com os dados reais do Firestore
          const comissoesReais = perfilSenador.comissoes.map((comissao: any) => {
            if (comissao) {
              // Verificar se é atual com base na dataFim
              let isAtual = comissao.atual;

              // Se atual não estiver definido, verificar com base na dataFim
              if (isAtual === undefined) {
                isAtual = !comissao.dataFim || new Date(comissao.dataFim) >= new Date();
              }

              return {
                codigo: comissao.codigo || '',
                sigla: comissao.sigla || '',
                nome: comissao.nome || '',
                casa: comissao.casa || 'SF',
                dataInicio: comissao.dataInicio || '',
                dataFim: comissao.dataFim || null,
                participacao: comissao.participacao || 'Titular',
                atual: isAtual,
                // Marcar como dado real do Firestore
                dadoReal: true
              };
            }
            return null;
          }).filter(Boolean) as any[];

          // Atualizar o estado apenas se houver comissões válidas
          if (comissoesReais.length > 0) {
            // Substituir completamente as comissões genéricas com os dados reais
            setComissoes(comissoesReais);
          }
        } else {
          // Se não houver comissões no Firestore, usar dados genéricos
          const dataPassada = new Date();
          dataPassada.setFullYear(dataPassada.getFullYear() - 1); // Data de 1 ano atrás

          setComissoes([
            {
              codigo: "834",
              sigla: "CDH",
              nome: "Comissão de Direitos Humanos e Legislação Participativa",
              casa: "SF",
              participacao: "Titular",
              dataInicio: "2023-03-07",
              dataFim: "2025-02-01",
              atual: true,
              dadoReal: false
            },
            {
              codigo: "38",
              sigla: "CAE",
              nome: "Comissão de Assuntos Econômicos",
              casa: "SF",
              participacao: "Titular",
              dataInicio: "2023-03-07",
              dataFim: "2025-02-01",
              atual: true,
              dadoReal: false
            },
            {
              codigo: "47",
              sigla: "CE",
              nome: "Comissão de Educação e Cultura",
              casa: "SF",
              participacao: "Suplente",
              dataInicio: "2023-03-07",
              dataFim: "2025-02-01",
              atual: true,
              dadoReal: false
            },
            {
              codigo: "54",
              sigla: "CRE",
              nome: "Comissão de Relações Exteriores e Defesa Nacional",
              casa: "SF",
              participacao: "Titular",
              dataInicio: "2022-03-07",
              dataFim: dataPassada.toISOString().split('T')[0],
              atual: false,
              dadoReal: false
            }
          ]);
        }

        // Atualizar as licenças se disponíveis no Firestore
        if (perfilSenador && 'licencas' in perfilSenador && perfilSenador.licencas && Array.isArray(perfilSenador.licencas) && perfilSenador.licencas.length > 0) {
          // Criar um novo array apenas com os dados reais do Firestore
          const licencasReais = perfilSenador.licencas.map((licenca: any) => {
            if (licenca) {
              // Verificar se é atual com base nas datas
              const dataAtual = new Date();
              const dataInicio = new Date(licenca.dataInicio);
              const dataFim = licenca.dataFim ? new Date(licenca.dataFim) : dataInicio;
              const isAtual = dataInicio <= dataAtual && dataFim >= dataAtual;

              return {
                codigo: licenca.codigo || '',
                tipo: {
                  sigla: licenca.tipo?.sigla || 'LICENCA_ATIVIDADE_PARLAMENTAR',
                  descricao: licenca.tipo?.descricao || 'Missão política ou cultural de interesse parlamentar'
                },
                dataInicio: licenca.dataInicio || '',
                dataFim: licenca.dataFim || licenca.dataInicio || '',
                atual: isAtual,
                // Marcar como dado real do Firestore
                dadoReal: true
              };
            }
            return null;
          }).filter(Boolean) as any[];

          // Atualizar o estado apenas se houver licenças válidas
          if (licencasReais.length > 0) {
            // Substituir completamente as licenças genéricas com os dados reais
            setLicencas(licencasReais);
          }
        } else {
          // Se não houver licenças no Firestore, usar dados genéricos
          const dataAtual = new Date();
          const dataPassada = new Date();
          dataPassada.setDate(dataPassada.getDate() - 5); // Data de 5 dias atrás
          const dataFutura = new Date();
          dataFutura.setDate(dataFutura.getDate() + 5); // Data de 5 dias no futuro

          setLicencas([
            {
              codigo: "21314",
              tipo: {
                sigla: "LICENCA_ATIVIDADE_PARLAMENTAR",
                descricao: "Missão política ou cultural de interesse parlamentar"
              },
              dataInicio: dataAtual.toISOString().split('T')[0],
              dataFim: dataFutura.toISOString().split('T')[0],
              atual: true,
              dadoReal: false
            },
            {
              codigo: "19155",
              tipo: {
                sigla: "LICENCA_ATIVIDADE_PARLAMENTAR",
                descricao: "Missão política ou cultural de interesse parlamentar"
              },
              dataInicio: dataPassada.toISOString().split('T')[0],
              dataFim: dataPassada.toISOString().split('T')[0],
              atual: false,
              dadoReal: false
            },
            {
              codigo: "18123",
              tipo: {
                sigla: "LICENCA_SAUDE",
                descricao: "Licença para tratamento de saúde"
              },
              dataInicio: "2023-11-15",
              dataFim: "2023-11-20",
              atual: false,
              dadoReal: false
            }
          ]);
        }

        // Atualizar os mandatos se disponíveis no Firestore
        if (perfilSenador && 'mandatos' in perfilSenador && perfilSenador.mandatos && Array.isArray(perfilSenador.mandatos) && perfilSenador.mandatos.length > 0) {
          // Criar um novo array apenas com os dados reais do Firestore
          const mandatosReais = perfilSenador.mandatos.map((mandato: any) => {
            if (mandato) {
              // Verificar se é atual com base na dataFim
              const dataAtual = new Date();
              const dataFim = mandato.dataFim ? new Date(mandato.dataFim) :
                             mandato.segundaLegislatura?.dataFim ? new Date(mandato.segundaLegislatura.dataFim) :
                             mandato.primeiraLegislatura?.dataFim ? new Date(mandato.primeiraLegislatura.dataFim) : null;
              const isAtual = !dataFim || dataFim >= dataAtual;

              // Determinar se é titular ou suplente
              const isTitular = mandato.participacao?.toUpperCase().includes('TITULAR') ||
                               !mandato.participacao?.toUpperCase().includes('SUPLENTE');
              const isSuplente = !isTitular;

              // Determinar se está afastado
              const isAfastado = mandato.exercicios && Array.isArray(mandato.exercicios) &&
                                mandato.exercicios.some((exercicio: any) =>
                                  exercicio.dataFim && new Date(exercicio.dataFim) < dataAtual);

              // Processar exercícios
              let exercicios = undefined;
              if (mandato.exercicios && Array.isArray(mandato.exercicios) && mandato.exercicios.length > 0) {
                exercicios = mandato.exercicios.map((exercicio: any) => ({
                  codigo: exercicio.codigo || '',
                  dataInicio: exercicio.dataInicio || '',
                  dataFim: exercicio.dataFim || null,
                  causaAfastamento: exercicio.causaAfastamento || null,
                  descricaoCausaAfastamento: exercicio.descricaoCausaAfastamento || null
                }));
              }

              // Processar suplentes
              let suplentes = undefined;
              if (mandato.suplentes && Array.isArray(mandato.suplentes) && mandato.suplentes.length > 0) {
                suplentes = mandato.suplentes.map((suplente: any) => ({
                  codigo: suplente.codigo || '',
                  nome: suplente.nome || '',
                  participacao: suplente.participacao || ''
                }));
              }

              // Processar primeira legislatura
              const primeiraLegislatura = mandato.primeiraLegislatura ? {
                numero: mandato.primeiraLegislatura.numero || '',
                dataInicio: mandato.primeiraLegislatura.dataInicio || '',
                dataFim: mandato.primeiraLegislatura.dataFim || ''
              } : undefined;

              // Processar segunda legislatura
              const segundaLegislatura = mandato.segundaLegislatura ? {
                numero: mandato.segundaLegislatura.numero || '',
                dataInicio: mandato.segundaLegislatura.dataInicio || '',
                dataFim: mandato.segundaLegislatura.dataFim || ''
              } : undefined;

              return {
                codigo: mandato.codigo || '',
                participacao: mandato.participacao || 'Titular',
                legislatura: mandato.legislatura || mandato.primeiraLegislatura?.numero || '',
                dataInicio: mandato.dataInicio || mandato.primeiraLegislatura?.dataInicio || '',
                dataFim: mandato.dataFim || mandato.primeiraLegislatura?.dataFim || null,
                descricao: isTitular ? 'Senador Federal' : 'Suplente de Senador',
                titular: isTitular,
                suplente: isSuplente,
                afastado: isAfastado,
                observacao: isAtual ? 'Mandato atual' : 'Mandato anterior',
                uf: mandato.uf || '',
                primeiraLegislatura,
                segundaLegislatura,
                exercicios: exercicios,
                suplentes: suplentes,
                // Marcar como dado real do Firestore
                dadoReal: true
              };
            }
            return null;
          }).filter(Boolean) as any[];

          // Atualizar o estado apenas se houver mandatos válidos
          if (mandatosReais.length > 0) {
            // Substituir completamente os mandatos genéricos com os dados reais
            setMandatos(mandatosReais);
          }
        }

        // Atualizar os cargos se disponíveis no Firestore
        if (perfilSenador && 'cargos' in perfilSenador && perfilSenador.cargos && Array.isArray(perfilSenador.cargos) && perfilSenador.cargos.length > 0) {
          // Criar um novo array apenas com os dados reais do Firestore
          const cargosReais = perfilSenador.cargos.map((cargo: any) => {
            if (cargo) {
              // Verificar se é atual com base na dataFim
              const dataAtual = new Date();
              const dataFim = cargo.dataFim ? new Date(cargo.dataFim) : null;
              const isAtual = cargo.atual !== undefined ? cargo.atual : !dataFim || dataFim >= dataAtual;

              return {
                codigo: cargo.codigo || '',
                cargo: {
                  codigo: cargo.cargo?.codigo || '',
                  descricao: cargo.cargo?.descricao || ''
                },
                comissao: cargo.comissao ? {
                  codigo: cargo.comissao.codigo || '',
                  sigla: cargo.comissao.sigla || '',
                  nome: cargo.comissao.nome || '',
                  casa: cargo.comissao.casa || 'SF'
                } : null,
                dataInicio: cargo.dataInicio || '',
                dataFim: cargo.dataFim || null,
                atual: isAtual,
                // Marcar como dado real do Firestore
                dadoReal: true
              };
            }
            return null;
          }).filter(Boolean) as any[];

          // Atualizar o estado apenas se houver cargos válidos
          if (cargosReais.length > 0) {
            // Substituir completamente os cargos genéricos com os dados reais
            setCargos(cargosReais);
          }
        } else {
          // Se não houver cargos no Firestore, usar dados genéricos
          setCargos([
            {
              codigo: "1234",
              cargo: {
                codigo: "248",
                descricao: "Secretário"
              },
              comissao: {
                codigo: "2583",
                sigla: "FPE",
                nome: "Frente Parlamentar Evangélica",
                casa: "CN"
              },
              dataInicio: "2023-03-15",
              dataFim: null,
              atual: true,
              dadoReal: false
            },
            {
              codigo: "5678",
              cargo: {
                codigo: "4",
                descricao: "1º VICE-PRESIDENTE"
              },
              comissao: {
                codigo: "2307",
                sigla: "GPISRAEL",
                nome: "Grupo Parlamentar Brasil - Israel",
                casa: "CN"
              },
              dataInicio: "2023-02-28",
              dataFim: null,
              atual: true,
              dadoReal: false
            },
            {
              codigo: "9012",
              cargo: {
                codigo: "1",
                descricao: "PRESIDENTE"
              },
              comissao: {
                codigo: "1307",
                sigla: "CRA",
                nome: "Comissão de Agricultura e Reforma Agrária",
                casa: "SF"
              },
              dataInicio: "2023-08-09",
              dataFim: "2025-02-01",
              atual: true,
              dadoReal: false
            }
          ]);
        }
      } else if (errorPerfil) {
        // Se ocorreu um erro, registrar no log mas continuar com os dados genéricos
        logger.error(`Erro ao carregar perfil do senador ${id}:`, errorPerfil);

        // Tentar gerar um nome genérico baseado no ID para melhorar a experiência
        const senadorId = id || '0000';

        // Atualizar apenas o código para garantir consistência
        setSenador(prevState => ({
          ...prevState,
          codigo: senadorId,
          nome: `Senador ${senadorId}`,
          nomeCompleto: `Senador ID ${senadorId}`
        }));
      }

      // Sempre desativar o loading quando terminar, independente do resultado
      setLoading(false);
    } else {
      // Enquanto estiver carregando, manter o estado de loading ativo
      setLoading(true);
    }
  }, [perfilSenador, loadingPerfil, errorPerfil, id]);

  // Dados genéricos para mandatos já definidos no estado

  // Dados genéricos para comissões já definidos no estado

  // Dados genéricos para filiações partidárias já definidos no estado

  // Dados genéricos para licenças já definidos no estado

  // Filtrar cargos por tipo
  const cargosMesa = cargos.filter(cargo =>
    cargo.comissao?.sigla === "MESA" ||
    cargo.cargo.descricao.toUpperCase().includes("PRESIDENTE") ||
    cargo.cargo.descricao.toUpperCase().includes("SECRETÁRIO")
  );

  // Cargos de liderança são os que não são de mesa
  const cargosLideranca = cargos.filter(cargo =>
    !cargosMesa.some(cargoMesa => cargoMesa.codigo === cargo.codigo)
  );

  // Dados específicos para o senador 6331 ou genéricos para outros
  const trajetoriaPolitica = id === "6331" ? [
    {
      periodo: "2023-Atual",
      cargo: "Senador Federal",
      descricao: "Atuação em comissões de Justiça e Segurança Pública"
    },
    {
      periodo: "2019-2022",
      cargo: "Ministro da Justiça",
      descricao: "Ministro da Justiça e Segurança Pública"
    },
    {
      periodo: "2003-2018",
      cargo: "Juiz Federal",
      descricao: "Juiz Federal da 13ª Vara Federal de Curitiba"
    }
  ] : [
    {
      periodo: "2023-Atual",
      cargo: "Senador Federal",
      descricao: "12 projetos de saúde"
    },
    {
      periodo: "2020-2022",
      cargo: "Secretário Estadual",
      descricao: "Gestão de políticas públicas"
    },
    {
      periodo: "2018-2019",
      cargo: "Deputado Federal",
      descricao: "Atuação em comissões"
    }
  ];

  // Dados genéricos para redes sociais
  const redesSociais = [
    {
      nome: "@senadorexemplo",
      url: "https://twitter.com/senadorexemplo",
      tipo: "twitter"
    },
    {
      nome: "@senadorexemplo",
      url: "https://www.instagram.com/senadorexemplo/",
      tipo: "instagram"
    }
  ];

  // Dados genéricos para votações relevantes
  const votacoesRelevantes = [
    {
      titulo: "PEC 6/2023 - Emergências",
      voto: "A favor",
      tema: "Saúde",
      alinhamento: "Alinhado ao governo"
    },
    {
      titulo: "PL 490/2023 - Terras Indígenas",
      voto: "Contra",
      tema: "Meio Ambiente",
      alinhamento: "Alinhado à bancada ruralista"
    }
  ];

  // Dados genéricos para apartes já definidos no estado

  // Dados genéricos para histórico jurídico
  const historicoJuridico = [
    {
      processo: "AP 4056789-12.2021",
      tipo: "Improbidade administrativa",
      status: "Em andamento",
      tribunal: "STF - 1ª Turma"
    }
  ];

  // Dados genéricos para contribuições da comunidade
  const contribuicoesComunidade = [
    {
      usuario: "Usuário RJ-7890",
      relato: "Declaração de bens incompleta",
      status: "Em análise",
      data: "05/04/2024"
    }
  ];

  // Não vamos mais bloquear a renderização em caso de erro
  // O componente sempre mostrará dados, mesmo que sejam genéricos

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Alerta de erro (se houver) */}
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
              Não foi possível carregar os dados completos do senador. Exibindo informações genéricas.
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
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {loading ? (
              <div className="w-24 h-24 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-gray-200">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="relative w-24 h-24">
                <img
                  src={senador.foto || `https://via.placeholder.com/200?text=${senador.nome.charAt(0)}`}
                  className="w-24 h-24 rounded-full border-4 border-emerald-500 object-cover"
                  alt={senador.nome}
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.onerror = null;
                    // Usar a primeira letra do nome para gerar uma imagem de placeholder
                    const initial = senador.nome ? senador.nome.charAt(0).toUpperCase() : 'S';
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
                    {loading ? <span className="animate-pulse bg-gray-200 h-8 w-48 inline-block rounded"></span> : senador.nome}
                  </h1>
                  <div className="text-gray-600">
                    {loading ? <span className="animate-pulse bg-gray-200 h-5 w-64 inline-block rounded"></span> : senador.nomeCompleto}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                      {loading ?
                        <span className="animate-pulse bg-emerald-200 h-5 w-16 inline-block rounded"></span> :
                        `${senador.partido?.sigla || 'N/A'} - ${senador.uf || 'BR'}`
                      }
                    </span>
                    {/* Sempre exibir o espaço para o bloco, mesmo que seja N/A */}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {loading ?
                        <span className="animate-pulse bg-blue-200 h-5 w-24 inline-block rounded"></span> :
                        (senador.bloco ? (senador.bloco.apelido || senador.bloco.nome) : 'Sem Bloco')
                      }
                    </span>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full">
                      ⚖️ {senador.processos} Processo Ativo
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
                </div>
              </div>

              {/* Estatísticas Rápidas */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Mandato</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">2 Anos</div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Presença</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">{senador.presenca}%</div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Projetos</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">{senador.projetos}</div>
                  )}
                </div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm text-gray-600">Ranking</div>
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-20 rounded mt-1"></div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">#{senador.ranking}</div>
                  )}
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

            {/* Dados Pessoais */}
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Dados Pessoais</h3>
              <div className="space-y-3">
                {senador.dadosPessoais?.dataNascimento && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Data de Nascimento</div>
                      <div className="text-sm text-gray-600">{senador.dadosPessoais.dataNascimento}</div>
                    </div>
                  </div>
                )}

                {senador.dadosPessoais?.naturalidade && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Naturalidade</div>
                      <div className="text-sm text-gray-600">{senador.dadosPessoais.naturalidade} - {senador.dadosPessoais.ufNaturalidade}</div>
                    </div>
                  </div>
                )}

                {senador.genero && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Gênero</div>
                      <div className="text-sm text-gray-600">{senador.genero}</div>
                    </div>
                  </div>
                )}

                {senador.email && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">E-mail</div>
                      <div className="text-sm text-gray-600">{senador.email}</div>
                    </div>
                  </div>
                )}

                {senador.telefones && senador.telefones.length > 0 && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Telefone</div>
                      {senador.telefones.map((telefone, index) => (
                        <div key={index} className="text-sm text-gray-600">{telefone.tipo}: {telefone.numero}</div>
                      ))}
                    </div>
                  </div>
                )}

                {senador.dadosPessoais?.enderecoParlamentar && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 mt-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-800">Endereço Parlamentar</div>
                      <div className="text-sm text-gray-600">{senador.dadosPessoais.enderecoParlamentar}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Formação Acadêmica */}
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Formação Acadêmica</h3>
                {senador.formacao?.historicoAcademico &&
                 senador.formacao.historicoAcademico.length > 0 &&
                 !senador.formacao.historicoAcademico.some((formacao: any) => 'dadoReal' in formacao && formacao.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dados genéricos
                  </span>
                )}
              </div>
              {senador.formacao?.historicoAcademico && senador.formacao.historicoAcademico.length > 0 ? (
                <div className="space-y-4">
                  {senador.formacao.historicoAcademico.map((formacao, index) => (
                    <div key={index} className="relative pl-6 border-l-2 border-blue-500">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px]"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-800">{formacao.grau} em {formacao.curso}</div>
                          <div className="text-sm text-gray-600">{formacao.instituicao}</div>
                          <div className="text-xs text-gray-500 mt-1">{formacao.local}</div>
                        </div>
                        {!('dadoReal' in formacao && formacao.dadoReal) && (
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

              {senador.formacao?.profissao && senador.formacao.profissao.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Profissões</h4>
                    {!senador.formacao.profissao.some((profissao: any) => 'dadoReal' in profissao && profissao.dadoReal) && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Todos genéricos
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {senador.formacao.profissao.map((profissao, index) => (
                      <div key={index} className="flex items-center">
                        <span className={`px-3 py-1 rounded-full text-sm ${profissao.principal ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                          {profissao.nome}
                        </span>
                        {!('dadoReal' in profissao && profissao.dadoReal) && (
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

            {/* Filiações Partidárias */}
            <div className="bg-gray-100 p-6 rounded-xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Filiações Partidárias</h3>
                {filiacoes.length > 0 && !filiacoes.some(filiacao => filiacao.dadoReal) && (
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
                  {filiacoes.map((filiacao, index) => (
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

            {/* Redes Sociais */}
            <div className="bg-gray-100 p-6 rounded-xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Redes Sociais</h3>
              <div className="space-y-3">
                {redesSociais.map((rede, index) => (
                  <a key={index} href={rede.url}
                     className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                    {rede.nome}
                  </a>
                ))}

                {senador.paginaOficial && (
                  <a href={senador.paginaOficial}
                     className="flex items-center gap-3 text-blue-600 hover:text-blue-700"
                     target="_blank" rel="noopener noreferrer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Página Oficial no Senado
                  </a>
                )}

                {senador.paginaParticular && (
                  <a href={senador.paginaParticular}
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

          {/* Coluna Direita */}
          <div className="lg:col-span-2 space-y-6">
            {/* Atividade no Senado */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Atividade no Senado</h2>
                <YearSelector
                  selectedYear={activeYear}
                  availableYears={availableYears}
                  onChange={setActiveYear}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Propostas Legislativas</h3>
                  <div className="text-4xl font-bold text-emerald-600">{senador.projetos}</div>
                  <span className="text-sm text-gray-600">87% sobre saúde</span>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Votações Nominais</h3>
                  <div className="text-4xl font-bold text-blue-600">184</div>
                  <span className="text-sm text-gray-600">73% alinhado ao partido</span>
                </div>

                <div className="bg-gray-100 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Discursos</h3>
                  <div className="text-4xl font-bold text-purple-600">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-10 w-16 rounded"></div>
                    ) : (
                      <DiscursosCount senadorId={id} ano={activeYear} />
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

            {/* Mandatos */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Mandatos</h2>
                {mandatos.length > 0 && !mandatos.some(mandato => mandato.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Todos genéricos
                  </span>
                )}
              </div>
              <div className="space-y-4">
                {mandatos.map((mandato, index) => {
                  // Verificar se o mandato é atual com base nas datas
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
                          {mandato.segundaLegislatura && (
                            <div className="text-xs text-gray-500 mt-1">
                              {mandato.segundaLegislatura.numero}ª Legislatura: {mandato.segundaLegislatura.dataInicio} a {mandato.segundaLegislatura.dataFim}
                              {isLegislaturaAtual(mandato.segundaLegislatura.dataInicio, mandato.segundaLegislatura.dataFim) &&
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
                            {mandato.exercicios.map((exercicio, idx) => (
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
                            {mandato.suplentes.map((suplente, idx) => (
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

            {/* Comissões */}
            <ComissoesSenador comissoes={comissoes} senadorId={id || ''} />

            {/* Cargos */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Cargos</h2>
                {cargos.length > 0 && !cargos.some(cargo => cargo.dadoReal) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Dados genéricos
                  </span>
                )}
              </div>

              {/* Cargos em Mesas Diretoras */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Mesas Diretoras</h3>
              {cargosMesa.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {cargosMesa.map((cargo, index) => (
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

              {/* Cargos de Liderança */}
              <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-6">Comissões e Outros Cargos</h3>
              {cargosLideranca.length > 0 ? (
                <ScrollableSection itemsToShow={5} containerClassName="space-y-4">
                  {cargosLideranca.map((cargo, index) => (
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

            {/* Licenças */}
            <LicencasSenador licencas={licencas} senadorId={id || ''} />

            {/* Desempenho Legislativo */}
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
                       style={{background: `conic-gradient(#10b981 ${senador.presenca}%, #e2e7eb 0)`}}>
                    <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-gray-800">{senador.pontuacao}</span>
                      <span className="text-sm text-gray-600">Pontuação Geral</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">{senador.presenca}%</div>
                      <div>
                        <div className="font-medium text-gray-800">Presença</div>
                        <div className="text-sm text-gray-600">Média partidária: 79%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">{senador.aprovacao}%</div>
                      <div>
                        <div className="font-medium text-gray-800">Aprovação</div>
                        <div className="text-sm text-gray-600">Entre pares do partido</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Votações Relevantes */}
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
                          {votacao.tema === "Saúde" ? "🏥 " : "🌳 "}{votacao.tema}
                        </span>
                        <span className="text-sm text-gray-600">{votacao.alinhamento}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>



            {/* Discursos e Apartes */}
            <DiscursosApartesSenador senadorId={id} ano={activeYear} />

            {/* Matérias Legislativas */}
            <MateriasLegislativasSenador senadorId={id} ano={activeYear} />

            {/* Histórico Jurídico */}
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

            {/* Colaboração Comunitária */}
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

export default SenadorPerfilGenerico;
