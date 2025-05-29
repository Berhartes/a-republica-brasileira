/**
 * Interface para opções de linha de comando
 */
export interface CommandOptions {
    legislatura?: string;
    limite?: string;
    senador?: string;
    [key: string]: string | undefined;
}
/**
 * Analisa argumentos da linha de comando
 * @returns Objeto com opções extraídas
 */
export declare function parseArgs(): CommandOptions;
/**
 * Obtém um valor booleano de uma opção
 * @param options - Opções de linha de comando
 * @param key - Chave da opção
 * @param defaultValue - Valor padrão se a opção não estiver presente
 * @returns Valor booleano da opção
 */
export declare function getBooleanOption(options: CommandOptions, key: string, defaultValue?: boolean): boolean;
/**
 * Obtém um valor numérico de uma opção
 * @param options - Opções de linha de comando
 * @param key - Chave da opção
 * @param defaultValue - Valor padrão se a opção não estiver presente ou for inválida
 * @returns Valor numérico da opção
 */
export declare function getNumberOption(options: CommandOptions, key: string, defaultValue: number): number;
/**
 * Exibe mensagem de ajuda padronizada para scripts
 * @param scriptName - Nome do script
 * @param opcoesEspecificas - Texto com opções específicas do script
 * @param exemplosEspecificos - Texto com exemplos específicos do script
 */
export declare function exibirAjuda(scriptName: string, opcoesEspecificas?: string, exemplosEspecificos?: string): void;
