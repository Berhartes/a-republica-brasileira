/**
 * Opções de exportação para configurar o formato e destino dos dados
 */
export interface OpcoesExportacao {
    formato: 'json' | 'csv' | 'ambos';
    comprimir: boolean;
    caminhoBase?: string;
    nivelDetalhamento: 'completo' | 'resumido' | 'ambos';
}
/**
 * Estatísticas de completude dos dados
 */
export interface EstatisticasCompletude {
    camposPorItem: Record<string, {
        preenchidos: number;
        total: number;
        percentual: number;
    }>;
    media: number;
}
/**
 * Estatísticas de consistência dos dados
 */
export interface EstatisticasConsistencia {
    tiposValidos: Record<string, {
        validos: number;
        total: number;
        percentual: number;
    }>;
    dataCoerente: boolean;
    totais: {
        validos: number;
        total: number;
        percentual: number;
    };
}
/**
 * Estatísticas gerais sobre os dados
 */
export interface EstatisticasGerais {
    totalPerfis: number;
    distribuicaoPorEstado: Record<string, number>;
    distribuicaoPorPartido: Record<string, number>;
    distribuicaoPorGenero: Record<string, number>;
    dataExtracao: string;
    tempoProcessamento: number;
}
/**
 * Cria a estrutura de diretórios para armazenar os dados exportados
 * @param legislatura - Número da legislatura
 * @param dataExtracao - Data de extração (formato YYYY-MM-DD)
 * @param caminhoBase - Caminho base para criação dos diretórios
 * @returns Caminho principal criado
 */
export declare function criarEstruturaDiretorios(legislatura: number, dataExtracao?: string, caminhoBase?: string): Promise<string>;
/**
 * Exporta dados para formato JSON
 * @param dados - Dados a serem exportados
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
export declare function exportarParaJSON(dados: any, caminhoArquivo: string, comprimir?: boolean): Promise<string>;
/**
 * Exporta dados para formato CSV
 * @param dados - Dados a serem exportados
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
export declare function exportarParaCSV(dados: any[], caminhoArquivo: string, comprimir?: boolean): Promise<string>;
/**
 * Calcula a completude dos dados (campos preenchidos)
 * @param dados - Dados a serem analisados
 * @returns Estatísticas de completude
 */
export declare function calcularCompletude(dados: any[]): EstatisticasCompletude;
/**
 * Verifica a consistência dos dados (tipos e valores esperados)
 * @param dados - Dados a serem analisados
 * @returns Estatísticas de consistência
 */
export declare function verificarConsistencia(dados: any[]): EstatisticasConsistencia;
/**
 * Gera estatísticas gerais sobre os dados
 * @param dados - Dados a serem analisados
 * @returns Estatísticas gerais
 */
export declare function gerarEstatisticasGerais(dados: any[]): EstatisticasGerais;
/**
 * Processa dados para criar versões resumidas
 * @param dados - Dados completos a serem resumidos
 * @returns Versão resumida dos dados
 */
export declare function criarDadosResumidos(dados: any[]): any[];
/**
 * Exporta um objeto para formato JSON
 * @param objeto - Objeto a ser exportado
 * @param caminhoArquivo - Caminho do arquivo de destino
 * @param comprimir - Indica se o arquivo deve ser comprimido
 * @returns Caminho do arquivo gerado
 */
export declare function exportarObjeto(objeto: any, caminhoArquivo: string, comprimir?: boolean): Promise<string>;
/**
 * Função principal para exportar dados e gerar estatísticas
 * @param dados - Dados a serem exportados
 * @param legislatura - Número da legislatura
 * @param opcoes - Opções de exportação
 * @param tempoInicio - Timestamp de início do processamento (para cálculo do tempo total)
 */
export declare function exportarDados(dados: any[], legislatura: number, opcoes: OpcoesExportacao, tempoInicio: number): Promise<void>;
