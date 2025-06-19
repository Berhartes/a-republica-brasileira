/**
 * Serviço de API para o domínio de usuário
 */

import axios, { AxiosError } from 'axios';
import { logger } from '@/app/monitoring';
import { Usuario, PerfilFormValues, PerfilConfigValues, SenhaAlteracaoValues } from '../types';

// Verificar se estamos em modo de desenvolvimento
const isDevelopment = import.meta.env.MODE === 'development';

// Obter URL base da API do ambiente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5177';

// Determinar o caminho base da API
const isLocalEmulator = API_BASE_URL.includes('localhost');
// No ambiente local, a função é acessada diretamente pelo nome
const apiPath = isLocalEmulator ? '/usuariosApi' : '/a-republica-brasileira/us-central1/usuariosApi';

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: `${API_BASE_URL}${apiPath}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para verificar se o erro é de conexão recusada
const isConnectionRefused = (error: any): boolean => {
  return (
    error instanceof AxiosError &&
    (error.code === 'ECONNREFUSED' ||
     error.message.includes('Network Error') ||
     (error.response?.status === 0 && error.message.includes('ERR_CONNECTION_REFUSED')))
  );
};

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    logger.error('Erro na requisição de API do usuário:', error);
    return Promise.reject(error);
  }
);

// Dados de fallback para desenvolvimento
const mockPerfil: Usuario = {
  id: 'mock-user',
  displayName: 'Usuário Mock',
  email: 'usuario.mock@exemplo.com',
  photoURL: 'https://via.placeholder.com/150',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: new Date().toISOString(),
  theme: 'system',
  language: 'pt-BR',
  estadoEleitoral: 'rj',
  privacy: {
    showEmail: true,
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

const mockInteresses = [
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

export const usuarioApiService = {
  /**
   * Obter perfil do usuário atual
   * @returns Perfil do usuário
   */
  async obterPerfilUsuario(): Promise<Usuario> {
    try {
      // Em desenvolvimento, se a variável de ambiente estiver definida para usar mock, retornar dados mock
      if (isDevelopment && import.meta.env.VITE_USE_MOCK_API === 'true') {
        logger.info('Usando dados mock para perfil do usuário');
        return mockPerfil;
      }

      const { data } = await api.get('/perfil');
      return data;
    } catch (error) {
      // Se for erro de conexão recusada e estiver em desenvolvimento, retornar dados mock
      if (isDevelopment && isConnectionRefused(error)) {
        logger.warn('API de usuário não disponível, usando dados mock para perfil');
        return mockPerfil;
      }

      logger.error('Erro ao obter perfil do usuário:', error);
      throw error;
    }
  },

  /**
   * Atualizar perfil do usuário
   * @param perfilData Dados do perfil a serem atualizados
   * @returns Perfil atualizado
   */
  async atualizarPerfil(perfilData: PerfilFormValues): Promise<Usuario> {
    try {
      // Em desenvolvimento, se a variável de ambiente estiver definida para usar mock, simular atualização
      if (isDevelopment && import.meta.env.VITE_USE_MOCK_API === 'true') {
        logger.info('Simulando atualização de perfil com dados mock');
        return { ...mockPerfil, ...perfilData };
      }

      const { data } = await api.put('/perfil', perfilData);
      return data;
    } catch (error) {
      // Se for erro de conexão recusada e estiver em desenvolvimento, simular sucesso
      if (isDevelopment && isConnectionRefused(error)) {
        logger.warn('API de usuário não disponível, simulando atualização de perfil');
        return { ...mockPerfil, ...perfilData };
      }

      logger.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  },

  /**
   * Atualizar configurações do usuário
   * @param configData Configurações a serem atualizadas
   * @returns Configurações atualizadas
   */
  async atualizarConfiguracoes(configData: PerfilConfigValues): Promise<PerfilConfigValues> {
    try {
      // Em desenvolvimento, se a variável de ambiente estiver definida para usar mock, simular atualização
      if (isDevelopment && import.meta.env.VITE_USE_MOCK_API === 'true') {
        logger.info('Simulando atualização de configurações com dados mock');
        return configData;
      }

      const { data } = await api.put('/configuracoes', configData);
      return data;
    } catch (error) {
      // Se for erro de conexão recusada e estiver em desenvolvimento, simular sucesso
      if (isDevelopment && isConnectionRefused(error)) {
        logger.warn('API de usuário não disponível, simulando atualização de configurações');
        return configData;
      }

      logger.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  },

  /**
   * Alterar senha do usuário
   * @param senhaData Dados para alteração de senha
   * @returns Status da operação
   */
  async alterarSenha(senhaData: SenhaAlteracaoValues): Promise<{ success: boolean; message: string }> {
    try {
      // Em desenvolvimento, se a variável de ambiente estiver definida para usar mock, simular alteração
      if (isDevelopment && import.meta.env.VITE_USE_MOCK_API === 'true') {
        logger.info('Simulando alteração de senha com dados mock');
        return { success: true, message: 'Senha alterada com sucesso (simulado)' };
      }

      const { data } = await api.put('/senha', senhaData);
      return data;
    } catch (error) {
      // Se for erro de conexão recusada e estiver em desenvolvimento, simular sucesso
      if (isDevelopment && isConnectionRefused(error)) {
        logger.warn('API de usuário não disponível, simulando alteração de senha');
        return { success: true, message: 'Senha alterada com sucesso (simulado)' };
      }

      logger.error('Erro ao alterar senha:', error);
      throw error;
    }
  },

  /**
   * Obter interesses disponíveis
   * @returns Lista de interesses disponíveis
   */
  async obterInteresses(): Promise<string[]> {
    try {
      // Em desenvolvimento, se a variável de ambiente estiver definida para usar mock, retornar dados mock
      if (isDevelopment && import.meta.env.VITE_USE_MOCK_API === 'true') {
        logger.info('Usando dados mock para interesses');
        return mockInteresses;
      }

      const { data } = await api.get('/interesses');
      return data;
    } catch (error) {
      // Se for erro de conexão recusada e estiver em desenvolvimento, retornar dados mock
      if (isDevelopment && isConnectionRefused(error)) {
        logger.warn('API de usuário não disponível, usando dados mock para interesses');
        return mockInteresses;
      }

      logger.error('Erro ao obter interesses:', error);
      throw error;
    }
  }
};
