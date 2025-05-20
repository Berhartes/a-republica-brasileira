// src/domains/congresso/senado/hooks/useDiscursosSenador.ts
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { logger } from '@/app/monitoring/logger';

/**
 * Interface para um discurso de senador
 */
export interface Discurso {
  codigo: string;
  data: string;
  sessao: {
    codigo: string;
    data: string;
    tipo: string;
  };
  tipo: string;
  fase: string;
  assunto: string;
  texto: string;
  url?: string;
  urlVideo?: string;
  urlAudio?: string;
  indexacao?: string[];
  dadoReal?: boolean;
}

/**
 * Interface para um aparte de senador
 */
export interface Aparte {
  codigo: string;
  data: string;
  sessao: {
    codigo: string;
    data: string;
    tipo: string;
  };
  orador: {
    codigo: string;
    nome: string;
    partido: string;
    uf: string;
  };
  assunto: string;
  texto: string;
  url?: string;
  urlVideo?: string;
  urlAudio?: string;
  dadoReal?: boolean;
}

/**
 * Interface para os discursos e apartes de um senador
 */
export interface DiscursosSenador {
  codigo: string;
  senador: {
    nome: string;
    partido: string;
    uf: string;
  };
  discursos: Discurso[];
  apartes: Aparte[];
  atualizadoEm?: string;
}

/**
 * Interface para os dados brutos de discursos do Firestore
 */
interface FirestoreDiscursoRaw {
  id: string;
  data: string;
  indexacao?: string;
  url?: string;
  urlTexto?: string;
  resumo?: string;
  tipo?: string;
}

/**
 * Interface para os dados brutos de apartes do Firestore
 */
interface FirestoreAparteRaw {
  id: string;
  data: string;
  discursoId: string;
  orador: {
    codigo: string;
    nome: string;
    partido?: string;
    uf?: string;
  };
  url?: string;
  urlTexto?: string;
  resumo?: string;
  tipoUsoPalavra?: {
    codigo: string;
    sigla: string;
    descricao: string;
  };
  casa?: {
    sigla: string;
    nome: string;
  };
  sessao?: {
    codigo: string;
    data: string;
    hora: string;
    tipo: string;
    numero: string;
  };
}

/**
 * Interface para os dados brutos do Firestore
 */
interface FirestoreDiscursosSenadorRaw {
  codigo: string;
  senador: {
    codigo: string;
    nome: string;
    partido?: {
      sigla: string;
      nome?: string;
    };
    uf?: string;
  };
  discursos: FirestoreDiscursoRaw[];
  apartes: FirestoreAparteRaw[];
  atualizadoEm?: string;
}

/**
 * Transforma um discurso bruto do Firestore para o formato esperado pelo componente
 */
function transformarDiscurso(discursoRaw: FirestoreDiscursoRaw): Discurso {
  // Extrair data do discurso
  const data = discursoRaw.data || '';

  // Criar objeto de sessão com valores padrão
  const sessao = {
    codigo: '',
    data: data, // Usar a mesma data do discurso
    tipo: ''
  };

  // Extrair tipo do discurso
  const tipo = discursoRaw.tipo || 'Discurso';

  // Extrair assunto do discurso (usando resumo se disponível)
  const assunto = discursoRaw.resumo?.split('.')[0] || 'Sem assunto';

  // Criar texto do discurso (usando resumo completo se disponível)
  const texto = discursoRaw.resumo || 'Texto não disponível';

  // Criar URL do discurso
  const url = discursoRaw.urlTexto || discursoRaw.url;

  // Criar discurso transformado
  return {
    codigo: discursoRaw.id,
    data,
    sessao,
    tipo,
    fase: 'N/A', // Valor padrão
    assunto,
    texto,
    url,
    indexacao: discursoRaw.indexacao ? [discursoRaw.indexacao] : undefined,
    dadoReal: true // Marcar como dados reais
  };
}

/**
 * Transforma um aparte bruto do Firestore para o formato esperado pelo componente
 */
function transformarAparte(aparteRaw: FirestoreAparteRaw): Aparte {
  // Extrair data do aparte
  const data = aparteRaw.data || '';

  // Criar objeto de sessão com valores padrão ou usando dados disponíveis
  const sessao = aparteRaw.sessao ? {
    codigo: aparteRaw.sessao.codigo || '',
    data: aparteRaw.sessao.data || data,
    tipo: aparteRaw.sessao.tipo || ''
  } : {
    codigo: '',
    data: data,
    tipo: ''
  };

  // Extrair informações do orador
  const orador = {
    codigo: aparteRaw.orador?.codigo || '',
    nome: aparteRaw.orador?.nome || 'Não informado',
    partido: aparteRaw.orador?.partido || 'N/A',
    uf: aparteRaw.orador?.uf || ''
  };

  // Extrair assunto do aparte (usando resumo se disponível)
  const assunto = aparteRaw.resumo?.split('.')[0] || 'Sem assunto';

  // Criar texto do aparte (usando resumo completo se disponível)
  const texto = aparteRaw.resumo || 'Texto não disponível';

  // Criar URL do aparte
  const url = aparteRaw.urlTexto || aparteRaw.url;

  // Criar aparte transformado
  return {
    codigo: aparteRaw.id,
    data,
    sessao,
    orador,
    assunto,
    texto,
    url,
    dadoReal: true // Marcar como dados reais
  };
}

/**
 * Hook para buscar discursos e apartes de um senador do Firestore
 *
 * @param id ID do senador
 * @returns Objeto com dados dos discursos, estado de carregamento e erro
 *
 * @example
 * const { data: discursosSenador, isLoading, error } = useDiscursosSenador('6331');
 */
export function useDiscursosSenador(id: string | number) {
  return useQuery({
    queryKey: ['senador', 'discursos', id],
    queryFn: async () => {
      try {
        // Converter ID para string se for número
        const senadorId = typeof id === 'number' ? id.toString() : id;

        // Verificar se o ID é válido
        if (!senadorId) {
          logger.warn('ID do senador não fornecido');
          return null;
        }

        logger.info(`Buscando discursos do senador ${senadorId} no Firestore`);

        // Caminho para os discursos do senador
        const discursosRef = doc(db, `congressoNacional/senadoFederal/discursos/${senadorId}`);

        try {
          // Buscar o documento
          const discursosDoc = await getDoc(discursosRef);

          if (!discursosDoc.exists()) {
            logger.warn(`Discursos do senador ${senadorId} não encontrados no Firestore`);

            // Retornar dados vazios em vez de null para facilitar o uso
            return {
              codigo: senadorId,
              senador: {
                nome: "Não encontrado",
                partido: "",
                uf: ""
              },
              discursos: [],
              apartes: []
            } as DiscursosSenador;
          }

          // Obter dados brutos do Firestore
          const rawData = discursosDoc.data() as FirestoreDiscursosSenadorRaw;

          logger.info(`Dados brutos do senador ${senadorId} carregados do Firestore:`, {
            nome: rawData.senador?.nome,
            totalDiscursosRaw: rawData.discursos?.length || 0,
            totalApartesRaw: rawData.apartes?.length || 0
          });

          // Transformar dados para o formato esperado pelo componente
          const discursosTransformados = (rawData.discursos || [])
            .filter(d => d && d.id) // Filtrar discursos inválidos
            .map(transformarDiscurso);

          const apartesTransformados = (rawData.apartes || [])
            .filter(a => a && a.id) // Filtrar apartes inválidos
            .map(transformarAparte);

          // Criar objeto final com dados transformados
          const discursosData: DiscursosSenador = {
            codigo: senadorId,
            senador: {
              nome: rawData.senador?.nome || "Nome não disponível",
              partido: rawData.senador?.partido?.sigla || "",
              uf: rawData.senador?.uf || ""
            },
            discursos: discursosTransformados,
            apartes: apartesTransformados,
            atualizadoEm: rawData.atualizadoEm
          };

          logger.info(`Discursos do senador ${senadorId} transformados com sucesso:`, {
            nome: discursosData.senador.nome,
            totalDiscursos: discursosData.discursos.length,
            totalApartes: discursosData.apartes.length
          });

          return discursosData;
        } catch (firestoreError) {
          logger.error(`Erro do Firestore ao buscar discursos do senador ${senadorId}:`, firestoreError);
          throw new Error(`Erro ao acessar o Firestore: ${firestoreError instanceof Error ? firestoreError.message : 'Erro desconhecido'}`);
        }
      } catch (error) {
        logger.error(`Erro ao buscar discursos do senador ${id}:`, error);
        throw new Error(`Falha ao carregar discursos do senador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1, // Tentar apenas uma vez para evitar muitas requisições em caso de erro
  });
}

export default useDiscursosSenador;
