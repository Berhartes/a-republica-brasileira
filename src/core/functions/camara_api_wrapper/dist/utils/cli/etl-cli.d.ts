/**
 * Parser CLI unificado e profissional para o sistema ETL
 *
 * Este módulo fornece uma interface consistente para parsing
 * de argumentos de linha de comando em todos os scripts ETL.
 */
import { ETLOptions } from '../../types/etl.types';
/**
 * Configuração para opções customizadas
 */
interface OptionConfig {
    description?: string;
    validator?: (value: string) => boolean;
    transformer?: (value: string) => any;
    defaultValue?: any;
}
/**
 * Parser de linha de comando para scripts ETL
 */
export declare class ETLCommandParser {
    private scriptName;
    private description;
    private args;
    private customOptions;
    constructor(scriptName: string, description: string);
    /**
     * Adiciona uma opção customizada
     */
    addCustomOption(name: string, config: OptionConfig | ((value: string) => any)): this;
    /**
     * Faz o parse dos argumentos e retorna as opções
     */
    parse(): ETLOptions;
    /**
     * Verifica se deve exibir ajuda
     */
    private shouldShowHelp;
    /**
     * Exibe a mensagem de ajuda
     */
    showHelp(): void;
    /**
     * Verifica se é um atalho de legislatura
     */
    private isLegislaturaShortcut;
    /**
     * Faz parse de atalho de legislatura
     */
    private parseLegislaturaShortcut;
    /**
     * Faz parse de número com validação
     */
    private parseNumber;
    /**
     * Faz parse de data com validação
     */
    private parseDate;
    /**
     * Valida se apenas um destino foi escolhido
     */
    private validateDestino;
    /**
     * Valida as opções parseadas
     */
    private validateOptions;
}
/**
 * Função helper para criar parser com configurações padrão
 */
export declare function createETLParser(scriptName: string, description: string): ETLCommandParser;
export {};
