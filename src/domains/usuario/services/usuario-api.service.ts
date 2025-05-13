/**
 * Serviço de API para o domínio de usuário
 */

import axios from 'axios';
import { logger } from '@/app/monitoring';
import { Usuario, PerfilFormValues, PerfilConfigValues, SenhaAlteracaoValues } from '../types';

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

export const usuarioApiService = {
  /**
   * Obter perfil do usuário atual
   * @returns Perfil do usuário
   */
  async obterPerfilUsuario(): Promise<Usuario> {
    try {
      const { data } = await api.get('/perfil');
      return data;
    } catch (error) {
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
      const { data } = await api.put('/perfil', perfilData);
      return data;
    } catch (error) {
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
      const { data } = await api.put('/configuracoes', configData);
      return data;
    } catch (error) {
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
      const { data } = await api.put('/senha', senhaData);
      return data;
    } catch (error) {
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
      const { data } = await api.get('/interesses');
      return data;
    } catch (error) {
      logger.error('Erro ao obter interesses:', error);
      throw error;
    }
  }
};
