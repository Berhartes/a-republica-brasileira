/**
 * Módulo de exportação de discursos de senadores para arquivos
 * Este módulo é especializado na exportação de discursos e apartes de senadores
 */
import { logger } from '../utils/logger';
import { ResultadoTransformacaoLista } from '../transformacao/perfilsenadores';
import { DiscursoTransformado } from '../carregamento/discursos';
import { exportToJson } from '../utils/file_exporter';

/**
 * Classe para exportar dados de discursos de senadores para arquivos
 */
export class DiscursosExporter {
  /**
   * Exporta lista de senadores de uma legislatura específica para arquivo JSON
   * @param transformedData - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo exportado
   */
  async exportSenadoresLegislatura(
    transformedData: ResultadoTransformacaoLista,
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${transformedData.senadores.length} senadores da legislatura ${legislaturaNumero}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/listas/senadores_legislatura_${legislaturaNumero}_${timestamp}.json`;

      await exportToJson(transformedData, filePath);

      logger.info(`Lista de senadores da legislatura ${legislaturaNumero} exportada para: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exporta discursos de senadores para arquivo JSON
   * @param discursos - Lista de discursos transformados
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo exportado
   */
  async exportDiscursosSenadores(
    discursos: DiscursoTransformado[],
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando discursos de ${discursos.length} senadores da legislatura ${legislaturaNumero}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/discursos/discursos_senadores_legislatura_${legislaturaNumero}_${timestamp}.json`;

      await exportToJson(discursos, filePath);

      logger.info(`Discursos de senadores da legislatura ${legislaturaNumero} exportados para: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error(`Erro ao exportar discursos de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exporta discursos de um senador específico para arquivo JSON
   * @param discurso - Discursos transformados do senador
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Caminho do arquivo exportado
   */
  async exportDiscursosSenador(
    discurso: DiscursoTransformado,
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando discursos do senador ${discurso.senador.nome} (${discurso.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/discursos/senador_${discurso.codigo}_${timestamp}.json`;

      await exportToJson(discurso, filePath);

      logger.info(`Discursos do senador ${discurso.codigo} exportados para: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error(`Erro ao exportar discursos do senador ${discurso?.codigo || 'desconhecido'}: ${error.message}`);
      throw error;
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const discursosExporter = new DiscursosExporter();
