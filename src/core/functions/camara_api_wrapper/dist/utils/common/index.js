/**
 * Utilitários Comuns e Ferramentas Auxiliares
 *
 * Este módulo contém utilitários comuns, ferramentas de exportação e outras
 * funcionalidades auxiliares que são usadas em múltiplos contextos.
 *
 * @example
 * ```typescript
 * import { exportarDadosAvancados, OpcoesExportacao } from '../utils/common';
 *
 * const opcoes: OpcoesExportacao = {
 *   formato: 'json',
 *   comprimir: true,
 *   nivelDetalhamento: 'completo'
 * };
 *
 * await exportarDadosAvancados(dados, opcoes, Date.now());
 * ```
 */
// Exportadores de dados
export { exportarDadosFirestore, exportarDadosBrutos, exportarDadosAvancados, exportToJson, exportItemsAsIndividualFiles } from './data-exporter';
export { exportarDados, exportarParaJSON, exportarParaCSV, exportarObjeto, criarEstruturaDiretorios, calcularCompletude, verificarConsistencia, gerarEstatisticasGerais, criarDadosResumidos } from './exportacao-avanc';
//# sourceMappingURL=index.js.map