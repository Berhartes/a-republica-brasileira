// src/domains/congresso/camara/hooks/useDeputadoPerfil.ts
import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/shared/services/firebase';
import { logger } from '@/app/monitoring/logger';

/**
 * Interface para o perfil completo do deputado no Firestore,
 * baseada na estrutura de dados de exemplo fornecida (204379.json).
 */
export interface DeputadoPerfil {
  id: number;
  uri: string;
  nomeCivil: string;
  ultimoStatus: {
    id: number;
    uri: string;
    nome: string; // Nome parlamentar
    siglaPartido: string;
    uriPartido: string | null;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
    email: string | null; // Email parlamentar
    data: string; // Data do último status
    nomeEleitoral: string;
    gabinete: {
      nome: string; // Número do gabinete
      predio: string;
      sala: string;
      andar: string;
      telefone: string;
      email: string; // Email do gabinete
    };
    situacao: string; // Ex: "Exercício"
    condicaoEleitoral: string; // Ex: "Titular"
    descricaoStatus: string | null;
  };
  cpf: string; // Geralmente não é público, mas está no exemplo
  sexo: "M" | "F";
  urlWebsite: string | null;
  redeSocial: string[]; // Array de URLs das redes sociais
  dataNascimento: string;
  dataFalecimento: string | null;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
  orgaos?: Array<{
    idOrgao: number;
    uriOrgao: string;
    siglaOrgao: string;
    nomeOrgao: string;
    nomePublicacao: string;
    titulo: string; // Cargo no órgão (Ex: "Titular", "Suplente")
    codTitulo: string;
    dataInicio: string;
    dataFim: string | null;
  }>;
  frentes?: Array<{
    id: number;
    uri: string;
    titulo: string;
    idLegislatura: number;
  }>;
  ocupacoes?: Array<{
    titulo: string | null;
    entidade: string | null;
    entidadeUF: string | null;
    entidadePais: string | null;
    anoInicio: number | null;
    anoFim: number | null;
  }>;
  mandatosExternos?: Array<{
    cargo: string;
    siglaUf: string;
    municipio: string;
    anoInicio: string;
    anoFim: string;
    siglaPartidoEleicao: string;
    uriPartidoEleicao: string;
  }>;
  historico?: Array<{ // Histórico de status e mandatos na Câmara
    id: number;
    uri: string;
    nome: string;
    nomeEleitoral: string;
    siglaPartido: string;
    uriPartido: string;
    siglaUf: string;
    idLegislatura: number;
    email: string | null;
    urlFoto: string;
    dataHora: string;
    situacao: string;
    condicaoEleitoral: string;
    descricaoStatus: string;
  }>;
  profissoes?: Array<{
    dataHora: string | null;
    codTipoProfissao: number | null;
    titulo: string | null;
  }>;
  // Campos adicionais que podem ser úteis e estavam na interface SenadorPerfil
  // mas que precisam ser validados se existem para Deputados ou adaptados.
  // Por enquanto, focaremos nos campos do JSON de exemplo.
  // filiacoesPartidarias?: Array<any>; // Estrutura a ser definida se necessário
  // licencas?: Array<any>; // Estrutura a ser definida se necessário
  // atualizadoEm?: string; // Timestamp da última atualização no Firestore
  // metadados?: any; // Metadados sobre a fonte dos dados
}

/**
 * Hook para buscar o perfil completo de um deputado do Firestore.
 *
 * @param id ID do deputado (numérico ou string)
 * @returns Objeto com dados do perfil, estado de carregamento e erro
 */
export function useDeputadoPerfil(id: string | number | undefined) {
  return useQuery<DeputadoPerfil | null, Error>({
    queryKey: ['deputado', 'perfil', id],
    queryFn: async () => {
      if (!id) {
        logger.warn('ID do deputado não fornecido para useDeputadoPerfil');
        return null;
      }

      const deputadoId = typeof id === 'number' ? id.toString() : id;

      logger.info(`Buscando perfil do deputado ${deputadoId} no Firestore`);

      // Caminho principal para perfis de deputados
      const perfilRef = doc(db, `congressoNacional/camaraDeputados/perfil/${deputadoId}`);

      try {
        const useEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
        logger.info(`Modo de acesso ao Firestore (DeputadoPerfil): ${useEmulators ? 'Emulador' : 'Produção'}`);

        const perfilDoc = await getDoc(perfilRef);
        logger.info(`Tentativa de acesso ao caminho: congressoNacional/camaraDeputados/perfil/${deputadoId}`);

        if (!perfilDoc.exists()) {
          logger.warn(`Perfil do deputado ${deputadoId} não encontrado no Firestore no caminho ${perfilRef.path}`);
          // Poderíamos adicionar lógicas de fallback para outros caminhos se existirem para deputados,
          // similar ao que useSenadorPerfil faz. Por ora, apenas um caminho.
          return null;
        }

        const perfilData = perfilDoc.data() as DeputadoPerfil;
        logger.info(`Perfil do deputado ${deputadoId} carregado com sucesso:`, {
          nome: perfilData.ultimoStatus?.nome,
          partido: perfilData.ultimoStatus?.siglaPartido,
          uf: perfilData.ultimoStatus?.siglaUf,
          caminho: perfilDoc.ref.path,
        });
        return perfilData;

      } catch (firestoreError: any) {
        logger.error(`Erro do Firestore ao buscar perfil do deputado ${deputadoId}:`, firestoreError);
        console.error('ERRO DETALHADO FIRESTORE (DeputadoPerfil):', {
          erro: firestoreError,
          mensagem: firestoreError?.message,
          stack: firestoreError?.stack,
          caminho: perfilRef.path,
          config: {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 5) + '...',
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            useEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR,
          },
        });

        const errorMessage = firestoreError?.message || String(firestoreError);
        if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
          throw new Error(`Erro de permissão: Não foi possível acessar os dados do Firestore para o deputado ${deputadoId}. Verifique as regras de segurança.`);
        }
        if (errorMessage.includes('network') || errorMessage.includes('Network')) {
          throw new Error(`Erro de rede: Não foi possível conectar ao Firestore para buscar o deputado ${deputadoId}. Verifique sua conexão.`);
        }
        if (errorMessage.includes('not found') || errorMessage.includes('Not found') && !errorMessage.toLowerCase().includes('document')) {
             // Ignora "document not found" pois já é tratado acima, foca em "project not found" ou similar.
            throw new Error(`Erro de configuração: Projeto Firebase não encontrado ou mal configurado para deputado ${deputadoId}.`);
        }
        throw new Error(`Erro ao acessar o Firestore para o deputado ${deputadoId}: ${errorMessage}`);
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
    gcTime: 1000 * 60 * 60 * 12, // 12 horas
    retry: 1, // Tentar apenas uma vez
    enabled: !!id, // Só executa a query se o ID estiver presente
  });
}

export default useDeputadoPerfil;
