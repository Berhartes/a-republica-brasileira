// src/domains/congresso/senado/hooks/useSenadorPerfil.ts
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { logger } from '@/app/monitoring/logger';
import { senadorMoroFallback } from '../data/senador-6331-fallback';

/**
 * Interface para o perfil completo do senador no Firestore
 */
export interface SenadorPerfil {
  codigo: string;
  nome: string;
  nomeCompleto: string;
  genero: string;
  foto?: string;
  paginaOficial?: string;
  paginaParticular?: string;
  email?: string;
  partido: {
    sigla: string;
    nome: string | null;
  };
  uf: string;
  bloco?: {
    codigo: string;
    nome: string;
    apelido: string;
    dataCriacao: string;
  };
  telefones: Array<{
    numero: string;
    tipo: string;
    ordem: number;
  }>;
  situacao: {
    emExercicio: boolean;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa: boolean;
    cargoLideranca: boolean;
  };
  dadosPessoais?: {
    dataNascimento?: string;
    naturalidade?: string;
    ufNaturalidade?: string;
    enderecoParlamentar?: string;
  };
  formacao?: Array<{
    curso: string;
    instituicao: string;
    grau: string;
    anoInicio?: string;
    anoFim?: string;
  }>;
  profissoes?: string[];
  mandatos?: Array<{
    dataInicio: string;
    dataFim?: string;
    descricao: string;
    legislatura: string;
    participacao: string;
    titular: boolean;
    suplente: boolean;
    afastado: boolean;
    observacao?: string;
  }>;
  comissoes?: Array<{
    codigo: string;
    sigla: string;
    nome: string;
    participacao: string;
    cargo: string;
    dataInicio: string;
    dataFim?: string;
    titular: boolean;
  }>;
  filiacoes?: Array<{
    partido: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    dataInicio: string;
    dataFim?: string;
  }>;
  licencas?: Array<{
    dataInicio: string;
    dataFim?: string;
    tipo: string;
    descricao: string;
  }>;
  apartes?: Array<{
    data: string;
    sequencia: number;
    urlTexto: string;
    urlAudio: string;
    urlVideo: string;
  }>;
  situacaoAtual?: {
    emExercicio: boolean;
    titular: boolean;
    suplente: boolean;
    afastado: boolean;
    motivoAfastamento?: string;
    mandatoAtual?: {
      dataInicio: string;
      dataFim?: string;
      descricao: string;
      legislatura: string;
      participacao: string;
    };
    licencaAtual?: {
      dataInicio: string;
      dataFim?: string;
      tipo: string;
      descricao: string;
    };
    ultimaLegislatura?: string;
  };
  metadados?: {
    atualizadoEm: string;
    fontes: {
      dadosBasicos: string;
      mandatos: string;
      cargos: string;
      comissoes: string;
      filiacoes: string;
      historicoAcademico: string;
      licencas: string;
      profissao: string;
      apartes: string;
    };
  };
  redeSocial?: Array<{
    nome: string;
    url: string;
  }>;
  atualizadoEm?: string;
}

/**
 * Hook para buscar o perfil completo de um senador do Firestore
 *
 * @param id ID do senador
 * @returns Objeto com dados do perfil, estado de carregamento e erro
 *
 * @example
 * const { data: perfilSenador, isLoading, error } = useSenadorPerfil('123');
 */
export function useSenadorPerfil(id: string | number) {
  return useQuery({
    queryKey: ['senador', 'perfil', id],
    queryFn: async () => {
      try {
        // Converter ID para string se for número
        const senadorId = typeof id === 'number' ? id.toString() : id;

        // Verificar se o ID é válido
        if (!senadorId) {
          logger.warn('ID do senador não fornecido');
          return null;
        }

        logger.info(`Buscando perfil do senador ${senadorId} no Firestore`);

        // Tentar primeiro o caminho específico para perfis
        const perfilRef = doc(db, `congressoNacional/senadoFederal/perfis/${senadorId}`);

        try {
          // Verificar se estamos usando emuladores
          const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
          logger.info(`Modo de acesso ao Firestore: ${useEmulators ? 'Emulador' : 'Produção'}`);

          // Buscar o documento
          let perfilDoc = await getDoc(perfilRef);
          logger.info(`Tentativa de acesso ao caminho: congressoNacional/senadoFederal/perfis/${senadorId}`);

          // Se não encontrar no caminho específico, tentar no caminho alternativo
          if (!perfilDoc.exists()) {
            logger.info(`Perfil do senador ${senadorId} não encontrado no caminho principal, tentando caminho alternativo...`);

            // Tentar buscar na coleção de senadores atuais
            const senadorAtualRef = doc(db, `congressoNacional/senadoFederal/atual/senadores/itens/${senadorId}`);
            logger.info(`Tentativa de acesso ao caminho: congressoNacional/senadoFederal/atual/senadores/itens/${senadorId}`);
            perfilDoc = await getDoc(senadorAtualRef);

            // Se ainda não encontrar, tentar na coleção da legislatura atual
            if (!perfilDoc.exists()) {
              logger.info(`Senador ${senadorId} não encontrado na coleção 'atual', tentando na legislatura...`);

              // Obter a legislatura atual (57 é a atual, mas idealmente deveria ser dinâmico)
              const legislaturaAtual = 57;
              const senadorLegRef = doc(db, `congressoNacional/senadoFederal/legislaturas/${legislaturaAtual}/senadores/${senadorId}`);
              logger.info(`Tentativa de acesso ao caminho: congressoNacional/senadoFederal/legislaturas/${legislaturaAtual}/senadores/${senadorId}`);
              perfilDoc = await getDoc(senadorLegRef);
            }
          }

          if (!perfilDoc.exists()) {
            logger.warn(`Perfil do senador ${senadorId} não encontrado em nenhum caminho do Firestore`);

            // Se for o senador 6331 (Sergio Moro), usar dados de fallback
            if (senadorId === '6331') {
              logger.info(`Usando dados de fallback para o senador 6331 (Sergio Moro)`);
              return senadorMoroFallback;
            }

            return null;
          }

          // Retornar os dados do documento
          const perfilData = perfilDoc.data() as SenadorPerfil;
          logger.info(`Perfil do senador ${senadorId} carregado com sucesso:`, {
            nome: perfilData.nome,
            partido: perfilData.partido?.sigla,
            uf: perfilData.uf,
            caminho: perfilDoc.ref.path
          });
          return perfilData;
        } catch (firestoreError) {
          // Erro específico do Firestore (permissões, etc.)
          logger.error(`Erro do Firestore ao buscar perfil do senador ${senadorId}:`, firestoreError);

          // Log detalhado para depuração
          console.error('ERRO DETALHADO FIRESTORE:', {
            erro: firestoreError,
            mensagem: firestoreError instanceof Error ? firestoreError.message : String(firestoreError),
            stack: firestoreError instanceof Error ? firestoreError.stack : 'Sem stack trace',
            caminho: `congressoNacional/senadoFederal/perfis/${senadorId}`,
            config: {
              apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 5) + '...',
              projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
              useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR
            }
          });

          // Se for o senador 6331 (Sergio Moro), usar dados de fallback mesmo em caso de erro
          if (senadorId === '6331') {
            logger.info(`Usando dados de fallback para o senador 6331 (Sergio Moro) devido a erro do Firestore`);
            return senadorMoroFallback;
          }

          // Verificar se é um erro de permissões
          const errorMessage = firestoreError instanceof Error ? firestoreError.message : String(firestoreError);

          if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
            logger.error(`Erro de permissão ao acessar o Firestore. Verifique se as regras de segurança estão configuradas corretamente e se o projeto Firebase está correto.`);
            throw new Error(`Erro de permissão: Não foi possível acessar os dados do Firestore. Verifique se o Firebase está configurado corretamente.`);
          }

          if (errorMessage.includes('network') || errorMessage.includes('Network')) {
            logger.error(`Erro de rede ao acessar o Firestore. Verifique sua conexão com a internet.`);
            throw new Error(`Erro de rede: Não foi possível conectar ao Firestore. Verifique sua conexão com a internet.`);
          }

          if (errorMessage.includes('not found') || errorMessage.includes('Not found')) {
            logger.error(`Projeto Firebase não encontrado. Verifique se o ID do projeto está correto.`);
            throw new Error(`Erro de configuração: Projeto Firebase não encontrado. Verifique se o ID do projeto está correto.`);
          }

          throw new Error(`Erro ao acessar o Firestore: ${errorMessage}`);
        }
      } catch (error) {
        logger.error(`Erro ao buscar perfil do senador ${id}:`, error);

        // Se for o senador 6331 (Sergio Moro), usar dados de fallback mesmo em caso de erro geral
        const senadorId = typeof id === 'number' ? id.toString() : id;
        if (senadorId === '6331') {
          logger.info(`Usando dados de fallback para o senador 6331 (Sergio Moro) devido a erro geral`);
          return senadorMoroFallback;
        }

        throw new Error(`Falha ao carregar perfil do senador: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hora
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    retry: 1, // Tentar apenas uma vez para evitar muitas requisições em caso de erro
  });
}

export default useSenadorPerfil;
