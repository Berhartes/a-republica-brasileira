/**
 * Módulo para exportação de dados de matérias legislativas para arquivos
 *
 * Este módulo implementa funções para exportar dados de matérias legislativas
 * para arquivos JSON, facilitando a análise e depuração.
 */
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { MateriaResult } from '../extracao/materias';
import { MateriaTransformada } from '../transformacao/materias';

/**
 * Classe para exportação de dados de matérias legislativas
 */
export class MateriasExporter {
  /**
   * Exporta matérias extraídas para arquivos JSON
   * @param materias - Array de matérias extraídas
   * @param legislatura - Número da legislatura
   */
  async exportMateriasExtraidas(materias: MateriaResult[], legislatura: number): Promise<void> {
    try {
      logger.info(`Exportando ${materias.length} matérias extraídas para arquivos JSON`);

      // 1. Exportar arquivo consolidado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/extraidos/materias_extraidas_${legislatura}_${timestamp}.json`;

      exportToJson(materias, filePath);

      // 2. Exportar arquivos individuais para cada senador
      const dirPath = `senadores/extraidos/materias/${legislatura}`;

      exportItemsAsIndividualFiles(materias, dirPath, (item: MateriaResult) => `materia_${item.codigo}_${timestamp}`);

      logger.info(`Exportação de matérias extraídas concluída`);
    } catch (error: any) {
      logger.error(`Erro ao exportar matérias extraídas: ${error.message}`);
    }
  }

  /**
   * Exporta matérias transformadas para arquivos JSON
   * @param materias - Array de matérias transformadas
   * @param legislatura - Número da legislatura
   */
  async exportMateriasTransformadas(materias: MateriaTransformada[], legislatura: number): Promise<void> {
    try {
      logger.info(`Exportando ${materias.length} matérias transformadas para arquivos JSON`);

      // 1. Exportar arquivo consolidado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/transformados/materias_transformadas_${legislatura}_${timestamp}.json`;

      exportToJson(materias, filePath);

      // 2. Exportar arquivos individuais para cada senador
      const dirPath = `senadores/transformados/materias/${legislatura}`;

      exportItemsAsIndividualFiles(materias, dirPath, (item: MateriaTransformada) => `materia_${item.codigo}_${timestamp}`);

      logger.info(`Exportação de matérias transformadas concluída`);
    } catch (error: any) {
      logger.error(`Erro ao exportar matérias transformadas: ${error.message}`);
    }
  }

  /**
   * Exporta estatísticas de matérias para arquivo JSON
   * @param estatisticas - Estatísticas de matérias
   * @param legislatura - Número da legislatura
   */
  async exportEstatisticas(estatisticas: any, legislatura: number): Promise<void> {
    try {
      logger.info(`Exportando estatísticas de matérias para arquivo JSON`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/estatisticas/materias_estatisticas_${legislatura}_${timestamp}.json`;

      exportToJson(estatisticas, filePath);

      logger.info(`Exportação de estatísticas de matérias concluída`);
    } catch (error: any) {
      logger.error(`Erro ao exportar estatísticas de matérias: ${error.message}`);
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const materiasExporter = new MateriasExporter();
