/**
 * Módulo de exportação de votações de senadores para arquivos
 * Este módulo é especializado na exportação de votações de senadores
 */
import { logger } from '../utils/logger';
import { ResultadoTransformacaoLista } from '../transformacao/perfilsenadores';
import { VotacaoTransformada } from '../transformacao/votacoes';
import { exportToJson } from '../utils/file_exporter';

/**
 * Classe para exportar dados de votações de senadores para arquivos
 */
export class VotacoesExporter {
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
   * Exporta votações de senadores para arquivo JSON
   * @param votacoes - Lista de votações transformadas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo exportado
   */
  async exportVotacoesSenadores(
    votacoes: VotacaoTransformada[],
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando votações de ${votacoes.length} senadores da legislatura ${legislaturaNumero}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/votacoes/votacoes_senadores_legislatura_${legislaturaNumero}_${timestamp}.json`;

      await exportToJson(votacoes, filePath);

      logger.info(`Votações de senadores da legislatura ${legislaturaNumero} exportadas para: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error(`Erro ao exportar votações de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exporta votações de um senador específico para arquivo JSON
   * @param votacao - Votações transformadas do senador
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Caminho do arquivo exportado
   */
  async exportVotacoesSenador(
    votacao: VotacaoTransformada,
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando votações do senador ${votacao.senador.nome} (${votacao.codigo}) ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/votacoes/senador_${votacao.codigo}_${timestamp}.json`;

      await exportToJson(votacao, filePath);

      logger.info(`Votações do senador ${votacao.codigo} exportadas para: ${filePath}`);

      return filePath;
    } catch (error: any) {
      logger.error(`Erro ao exportar votações do senador ${votacao?.codigo || 'desconhecido'}: ${error.message}`);
      throw error;
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const votacoesExporter = new VotacoesExporter();
