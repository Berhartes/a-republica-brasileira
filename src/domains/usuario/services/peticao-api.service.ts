/**
 * Serviço de API para petições
 */

import axios from 'axios';
import { logger } from '@/app/monitoring';
import { 
  Peticao, 
  Assinatura, 
  Comentario, 
  PeticaoFormValues, 
  AssinaturaPeticaoValues, 
  ComentarioPeticaoValues 
} from '../types';

// Criar instância do axios com configuração base
const api = axios.create({
  baseURL: '/api/peticoes',
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
    logger.error('Erro na requisição de API de petições:', error);
    return Promise.reject(error);
  }
);

export const peticaoApiService = {
  /**
   * Obter lista de petições
   * @param filters Filtros opcionais
   * @returns Lista de petições
   */
  async obterPeticoes(filters?: { 
    categoria?: string; 
    status?: string; 
    termo?: string;
    page?: number;
    limit?: number;
  }): Promise<{ peticoes: Peticao[]; total: number; page: number; totalPages: number }> {
    try {
      const { data } = await api.get('/', { params: filters });
      return data;
    } catch (error) {
      logger.error('Erro ao obter petições:', error);
      throw error;
    }
  },

  /**
   * Obter detalhes de uma petição
   * @param id ID da petição
   * @returns Detalhes da petição
   */
  async obterPeticao(id: string): Promise<Peticao> {
    try {
      const { data } = await api.get(`/${id}`);
      return data;
    } catch (error) {
      logger.error(`Erro ao obter petição ${id}:`, error);
      throw error;
    }
  },

  /**
   * Criar nova petição
   * @param peticaoData Dados da petição
   * @returns Petição criada
   */
  async criarPeticao(peticaoData: PeticaoFormValues): Promise<Peticao> {
    try {
      const { data } = await api.post('/', peticaoData);
      return data;
    } catch (error) {
      logger.error('Erro ao criar petição:', error);
      throw error;
    }
  },

  /**
   * Assinar uma petição
   * @param peticaoId ID da petição
   * @param assinaturaData Dados da assinatura
   * @returns Assinatura criada
   */
  async assinarPeticao(
    peticaoId: string, 
    assinaturaData: AssinaturaPeticaoValues
  ): Promise<Assinatura> {
    try {
      const { data } = await api.post(`/${peticaoId}/assinaturas`, assinaturaData);
      return data;
    } catch (error) {
      logger.error(`Erro ao assinar petição ${peticaoId}:`, error);
      throw error;
    }
  },

  /**
   * Adicionar comentário a uma petição
   * @param peticaoId ID da petição
   * @param comentarioData Dados do comentário
   * @returns Comentário criado
   */
  async adicionarComentario(
    peticaoId: string,
    comentarioData: ComentarioPeticaoValues
  ): Promise<Comentario> {
    try {
      const { data } = await api.post(`/${peticaoId}/comentarios`, comentarioData);
      return data;
    } catch (error) {
      logger.error(`Erro ao adicionar comentário à petição ${peticaoId}:`, error);
      throw error;
    }
  },

  /**
   * Obter assinaturas de uma petição
   * @param peticaoId ID da petição
   * @param page Página
   * @param limit Limite por página
   * @returns Lista de assinaturas
   */
  async obterAssinaturas(
    peticaoId: string,
    page = 1,
    limit = 20
  ): Promise<{ assinaturas: Assinatura[]; total: number; page: number; totalPages: number }> {
    try {
      const { data } = await api.get(`/${peticaoId}/assinaturas`, {
        params: { page, limit }
      });
      return data;
    } catch (error) {
      logger.error(`Erro ao obter assinaturas da petição ${peticaoId}:`, error);
      throw error;
    }
  },

  /**
   * Obter comentários de uma petição
   * @param peticaoId ID da petição
   * @param page Página
   * @param limit Limite por página
   * @returns Lista de comentários
   */
  async obterComentarios(
    peticaoId: string,
    page = 1,
    limit = 20
  ): Promise<{ comentarios: Comentario[]; total: number; page: number; totalPages: number }> {
    try {
      const { data } = await api.get(`/${peticaoId}/comentarios`, {
        params: { page, limit }
      });
      return data;
    } catch (error) {
      logger.error(`Erro ao obter comentários da petição ${peticaoId}:`, error);
      throw error;
    }
  }
};
