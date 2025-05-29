import { OpcoesExportacao } from './exportacao-avanc';
/**
 * Função para exportar dados para JSON (implementação local)
 * @param dados - Dados a serem exportados
 * @param filePath - Caminho do arquivo
 */
export declare function exportToJson(dados: any, filePath: string): void;
/**
 * Exporta itens como arquivos individuais
 * @param dados - Array de dados a serem exportados
 * @param baseDir - Diretório base
 * @param getFileName - Função para obter o nome do arquivo para cada item
 */
export declare function exportItemsAsIndividualFiles<T>(dados: T[], baseDir: string, getFileName: (item: T) => string): void;
/**
 * Interface para opções de exportação de dados para o Firestore
 */
export interface OpcoesExportacaoFirestore {
    salvarNoPC: boolean;
    caminhoBase?: string;
    timestamp?: string;
}
/**
 * Interface para opções de exportação básica
 */
export interface OpcoesExportacaoBasica {
    caminhoBase?: string;
    timestamp?: string;
}
/**
 * Exporta dados para o formato Firestore (simulação da estrutura)
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação
 * @param prepararDadosFirestore - Função para preparar os dados no formato do Firestore
 */
export declare function exportarDadosFirestore<T>(dados: T[], opcoes: OpcoesExportacaoFirestore, prepararDadosFirestore: () => Record<string, any>): Promise<void>;
/**
 * Exporta dados brutos para arquivos JSON
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação
 */
export declare function exportarDadosBrutos<T>(dados: T, opcoes: OpcoesExportacaoBasica): Promise<void>;
/**
 * Exporta dados com opções avançadas (JSON, CSV, estatísticas)
 * @param dados - Dados a serem exportados
 * @param opcoes - Opções de exportação avançada
 * @param tempoInicio - Timestamp de início do processamento (para cálculo do tempo total)
 */
export declare function exportarDadosAvancados<T>(dados: T[], opcoes: OpcoesExportacao, tempoInicio?: number): Promise<void>;
