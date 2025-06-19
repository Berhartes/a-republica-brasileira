/**
 * Hook para gerenciar o perfil do usuário
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usuarioApiService } from '../services';
import { PerfilFormValues, PerfilConfigValues, SenhaAlteracaoValues, Usuario } from '../types';
import { logger } from '@/app/monitoring';

// Dados de fallback para quando a API não está disponível
const fallbackPerfil: Usuario = {
  id: 'local-user',
  displayName: 'Usuário Local',
  email: 'usuario@local.dev',
  photoURL: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  theme: 'system',
  language: 'pt-BR',
  estadoEleitoral: 'br',
  privacy: {
    showEmail: false,
    showLocation: true,
    showInterests: true
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false
  },
  interests: ['política', 'legislação', 'democracia']
};

// Lista de interesses de fallback
const fallbackInteresses = [
  'política',
  'legislação',
  'democracia',
  'direitos humanos',
  'meio ambiente',
  'educação',
  'saúde',
  'segurança',
  'economia',
  'tecnologia'
];

export const usePerfil = () => {
  const queryClient = useQueryClient();

  // Query para obter perfil do usuário
  const {
    data: perfil,
    isLoading: isLoadingPerfil,
    error: perfilError
  } = useQuery({
    queryKey: ['perfil'],
    queryFn: () => usuarioApiService.obterPerfilUsuario(),
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
    // Usar dados de fallback quando a API não está disponível
    placeholderData: fallbackPerfil
  });

  // Query para obter interesses
  const {
    data: interesses = fallbackInteresses,
    isLoading: isLoadingInteresses
  } = useQuery({
    queryKey: ['interesses'],
    queryFn: () => usuarioApiService.obterInteresses(),
    staleTime: 1000 * 60 * 60, // 1 hora,
    // Usar dados de fallback quando a API não está disponível
    placeholderData: fallbackInteresses
  });

  // Mutation para atualizar perfil
  const {
    mutate: atualizarPerfil,
    isPending: isUpdatingPerfil,
    error: updateError
  } = useMutation({
    mutationFn: (dados: PerfilFormValues) => usuarioApiService.atualizarPerfil(dados),
    onSuccess: (data) => {
      queryClient.setQueryData(['perfil'], data);
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
    },
    onError: (error) => {
      logger.error('Erro ao atualizar perfil:', error);
    }
  });

  // Mutation para atualizar configurações
  const {
    mutate: atualizarConfiguracoes,
    isPending: isUpdatingConfig
  } = useMutation({
    mutationFn: (dados: PerfilConfigValues) => usuarioApiService.atualizarConfiguracoes(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['perfil'] });
    },
    onError: (error) => {
      logger.error('Erro ao atualizar configurações:', error);
    }
  });

  // Mutation para alterar senha
  const {
    mutate: alterarSenha,
    isPending: isChangingPassword,
    error: passwordError
  } = useMutation({
    mutationFn: (dados: SenhaAlteracaoValues) => usuarioApiService.alterarSenha(dados),
    onError: (error) => {
      logger.error('Erro ao alterar senha:', error);
    }
  });

  return {
    // Dados
    perfil,
    interesses,

    // Loading states
    isLoadingPerfil,
    isLoadingInteresses,
    isUpdatingPerfil,
    isUpdatingConfig,
    isChangingPassword,

    // Erros
    perfilError,
    updateError,
    passwordError,

    // Ações
    atualizarPerfil,
    atualizarConfiguracoes,
    alterarSenha
  };
};
