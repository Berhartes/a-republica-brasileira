/**
 * Hook para gerenciar petições
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peticaoApiService } from '../services';
import { 
  PeticaoFormValues, 
  AssinaturaPeticaoValues, 
  ComentarioPeticaoValues 
} from '../types';
import { logger } from '@/app/monitoring';

// Hook para listar petições
export const usePeticoes = (filters?: { 
  categoria?: string; 
  status?: string; 
  termo?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ['peticoes', filters],
    queryFn: () => peticaoApiService.obterPeticoes(filters),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

// Hook para detalhes de uma petição
export const usePeticaoDetalhes = (peticaoId: string | undefined) => {
  const enabled = !!peticaoId;
  
  const { 
    data: peticao, 
    isLoading: isLoadingPeticao,
    error: peticaoError
  } = useQuery({
    queryKey: ['peticao', peticaoId],
    queryFn: () => peticaoApiService.obterPeticao(peticaoId as string),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });

  const { 
    data: assinaturasData, 
    isLoading: isLoadingAssinaturas,
  } = useQuery({
    queryKey: ['peticao', peticaoId, 'assinaturas'],
    queryFn: () => 
      peticaoApiService.obterAssinaturas(peticaoId as string, 1, 20),
    enabled,
  });

  const { 
    data: comentariosData, 
    isLoading: isLoadingComentarios,
  } = useQuery({
    queryKey: ['peticao', peticaoId, 'comentarios'],
    queryFn: () => 
      peticaoApiService.obterComentarios(peticaoId as string, 1, 20),
    enabled,
  });

  return {
    peticao,
    assinaturas: assinaturasData?.assinaturas || [],
    comentarios: comentariosData?.comentarios || [],
    isLoading: isLoadingPeticao || isLoadingAssinaturas || isLoadingComentarios,
    loadMoreAssinaturas: () => Promise.resolve(),
    loadMoreComentarios: () => Promise.resolve(),
    hasMoreAssinaturas: false,
    hasMoreComentarios: false,
    error: peticaoError,
  };
};

// Hook para criar e interagir com petições
export const usePeticaoActions = () => {
  const queryClient = useQueryClient();

  // Mutation para criar petição
  const { 
    mutate: criarPeticao, 
    isPending: isCreating,
    error: createError 
  } = useMutation({
    mutationFn: (dados: PeticaoFormValues) => peticaoApiService.criarPeticao(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['peticoes'] });
    },
    onError: (error) => {
      logger.error('Erro ao criar petição:', error);
    }
  });

  // Mutation para assinar petição
  const { 
    mutate: assinarPeticao, 
    isPending: isSigning,
    error: signError 
  } = useMutation({
    mutationFn: ({ peticaoId, dados }: { 
      peticaoId: string; 
      dados: AssinaturaPeticaoValues 
    }) => peticaoApiService.assinarPeticao(peticaoId, dados),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['peticao', variables.peticaoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['peticao', variables.peticaoId, 'assinaturas'] 
      });
    },
    onError: (error) => {
      logger.error('Erro ao assinar petição:', error);
    }
  });

  // Mutation para adicionar comentário
  const { 
    mutate: adicionarComentario, 
    isPending: isCommenting,
    error: commentError 
  } = useMutation({
    mutationFn: ({ peticaoId, dados }: { 
      peticaoId: string; 
      dados: ComentarioPeticaoValues 
    }) => peticaoApiService.adicionarComentario(peticaoId, dados),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['peticao', variables.peticaoId, 'comentarios'] 
      });
    },
    onError: (error) => {
      logger.error('Erro ao adicionar comentário:', error);
    }
  });

  return {
    criarPeticao,
    assinarPeticao,
    adicionarComentario,
    isCreating,
    isSigning,
    isCommenting,
    createError,
    signError,
    commentError,
  };
};
