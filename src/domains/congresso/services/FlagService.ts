/**
 * Service for managing flags and their dashboard associations
 */

import { Flag, createFlag } from '../models/Flag';
import { todosEstados } from '../components/Dashboards/dashboardConfig';
import { getConfigPorUF } from '../components/Dashboards/dashboardConfig';

/**
 * Service for managing flags and their dashboard associations
 */
class FlagService {
  private flags: Map<string, Flag> = new Map();

  constructor() {
    this.initializeFlags();
  }

  /**
   * Initialize flags with default dashboard associations
   */
  private initializeFlags(): void {
    console.log('FlagService: Inicializando bandeiras...');

    // Add Brazil flag with explicit dashboard keys
    const brFlag = createFlag('BR', 'Brasil', '/flags/brazil/flag_circle_brazil.png');
    brFlag.dashboardKeys = ['cg-br', 'ale-br', 'gov-br'];
    this.addFlag(brFlag);

    // Add state flags
    Object.entries(todosEstados).forEach(([code, name]) => {
      // Skip Brazil as it's already added
      if (code.toLowerCase() === 'br') return;

      // Por padrão, usar a bandeira do Brasil para estados sem bandeira específica
      const lowerCode = code.toLowerCase();
      let flagUrl = '/flags/brazil/flag_circle_brazil.png';

      // Usar bandeiras específicas para estados que têm
      if (lowerCode === 'rj') {
        flagUrl = '/flags/estados/rio-de-janeiro/flag_circle_rio_de_janeiro-removebg-preview.png';
      } else if (lowerCode === 'sp') {
        flagUrl = '/flags/estados/sao-paulo/flag_circle_sao_paulo.png';
      } else if (lowerCode === 'mg') {
        flagUrl = '/flags/estados/minas-gerais/flag_circle_minas_gerais.png';
      } else if (lowerCode === 'es') {
        flagUrl = '/flags/estados/espirito-santo/flag_circle_espírito_santo.png';
      }

      // Criar a bandeira com chaves de dashboard explícitas
      const flag = createFlag(code, name, flagUrl);
      flag.dashboardKeys = [`cg-${lowerCode}`, `ale-${lowerCode}`, `gov-${lowerCode}`];

      this.addFlag(flag);
    });

    console.log(`FlagService: ${this.flags.size} bandeiras inicializadas`);
  }

  /**
   * Vincular explicitamente uma bandeira a dashboards
   * @param flagCode Código da bandeira
   * @param dashboardKeys Chaves dos dashboards
   */
  public linkFlagToDashboards(flagCode: string, dashboardKeys: string[]): void {
    const flag = this.getFlag(flagCode);

    if (!flag) {
      console.warn(`FlagService: Não foi possível vincular dashboards - bandeira não encontrada: ${flagCode}`);
      return;
    }

    flag.dashboardKeys = dashboardKeys;
    this.addFlag(flag); // Atualizar a bandeira no mapa
    console.log(`FlagService: Bandeira ${flagCode} vinculada aos dashboards: ${dashboardKeys.join(', ')}`);
  }

  /**
   * Add a flag to the service
   * @param flag Flag to add
   */
  public addFlag(flag: Flag): void {
    this.flags.set(flag.code.toLowerCase(), flag);
  }

  /**
   * Get a flag by its code
   * @param code Flag code
   * @returns Flag or undefined if not found
   */
  public getFlag(code: string): Flag | undefined {
    return this.flags.get(code.toLowerCase());
  }

  /**
   * Get all flags
   * @returns Array of all flags
   */
  public getAllFlags(): Flag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get dashboard keys for a specific flag
   * @param flagCode Flag code
   * @returns Array of dashboard keys or default keys if flag not found
   */
  public getDashboardKeysForFlag(flagCode: string): string[] {
    const flag = this.getFlag(flagCode);

    if (flag && flag.dashboardKeys && flag.dashboardKeys.length > 0) {
      return flag.dashboardKeys;
    }

    // Se a bandeira não for encontrada ou não tiver chaves de dashboard,
    // gerar as chaves padrão para este código
    console.warn(`FlagService: Gerando chaves de dashboard padrão para: ${flagCode}`);
    const lowerCode = flagCode.toLowerCase();
    return [`cg-${lowerCode}`, `ale-${lowerCode}`, `gov-${lowerCode}`];
  }

  /**
   * Get dashboard configurations for a specific flag
   * @param flagCode Flag code
   * @returns Dashboard configurations or undefined if flag not found
   */
  public getDashboardConfigsForFlag(flagCode: string): Record<string, any> | undefined {
    const flag = this.getFlag(flagCode);

    if (!flag) {
      console.warn(`FlagService: Bandeira não encontrada para o código: ${flagCode}`);
      // Fallback: gerar as chaves de dashboard padrão para este código
      const lowerCode = flagCode.toLowerCase();
      return getConfigPorUF(lowerCode);
    }

    // If flag has predefined dashboard configs, use them
    if (flag.dashboardConfigs) {
      return flag.dashboardConfigs;
    }

    // Otherwise, generate configs based on the flag code
    return getConfigPorUF(flagCode.toLowerCase());
  }

  /**
   * Método de depuração para verificar o estado do serviço
   * @returns Informações de depuração
   */
  public debug(): { flagCount: number, flags: string[] } {
    return {
      flagCount: this.flags.size,
      flags: Array.from(this.flags.keys())
    };
  }
}

// Create and export a singleton instance
export const flagService = new FlagService();
