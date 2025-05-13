/**
 * Serviço para gerenciar o estado eleitoral do usuário
 */

import { todosEstados } from '@/domains/congresso/components/Dashboards/dashboardConfig';
import { PerfilConfigValues } from '../schemas';

/**
 * Serviço para gerenciar o estado eleitoral do usuário
 * Fornece métodos para obter e definir o estado eleitoral,
 * com persistência no localStorage e integração com o perfil do usuário
 */
export const estadoEleitoralService = {
  /**
   * Obtém o estado eleitoral do usuário
   * Tenta obter do localStorage, com fallback para 'br' (Brasil)
   * @returns Código UF do estado eleitoral
   */
  getEstadoEleitoral(): string {
    // Tentar obter do localStorage
    const localEstado = localStorage.getItem('estadoEleitoral');
    if (localEstado && todosEstados[localEstado.toLowerCase()]) {
      return localEstado.toLowerCase();
    }
    
    // Valor padrão
    return 'br';
  },
  
  /**
   * Define o estado eleitoral do usuário
   * Salva no localStorage e dispara evento stateChange
   * @param uf Código UF do estado eleitoral
   */
  setEstadoEleitoral(uf: string): void {
    if (!uf || !todosEstados[uf.toLowerCase()]) {
      console.error(`Estado inválido: ${uf}`);
      return;
    }
    
    const estadoUf = uf.toLowerCase();
    
    // Salvar no localStorage
    localStorage.setItem('estadoEleitoral', estadoUf);
    
    // Disparar evento para atualizar os componentes
    const stateChangeEvent = new CustomEvent('stateChange', { 
      detail: { 
        code: estadoUf,
        name: todosEstados[estadoUf]
      } 
    });
    window.dispatchEvent(stateChangeEvent);
    
    console.log(`Estado eleitoral definido: ${estadoUf} (${todosEstados[estadoUf]})`);
  },
  
  /**
   * Cria um objeto de configuração para atualizar o perfil do usuário
   * @param estadoUf Código UF do estado eleitoral
   * @param perfilAtual Perfil atual do usuário (opcional)
   * @returns Objeto de configuração para atualizar o perfil
   */
  criarConfigAtualizacao(estadoUf: string, perfilAtual?: any): PerfilConfigValues {
    return {
      theme: perfilAtual?.theme || 'system',
      language: perfilAtual?.language || 'pt-BR',
      estadoEleitoral: estadoUf.toLowerCase(),
      privacy: perfilAtual?.privacy || {
        showEmail: false,
        showLocation: true,
        showInterests: true
      },
      accessibility: perfilAtual?.accessibility || {
        fontSize: 'medium',
        highContrast: false,
        reduceMotion: false
      }
    };
  }
};
