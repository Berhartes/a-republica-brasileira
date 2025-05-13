/**
 * Módulo de exportação de blocos parlamentares para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { ResultadoTransformacao, BlocoTransformado } from '../transformacao/blocos';

/**
 * Classe para exportar dados de blocos parlamentares para arquivos
 */
export class BlocosExporter {
  /**
   * Exporta a lista de blocos para JSON
   * @param blocosTransformados - Dados transformados dos blocos
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportBlocos(
    blocosTransformados: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${blocosTransformados.total} blocos da legislatura ${legislaturaNumero}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `blocos_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('blocos', 'listas', fileName);
      
      // Exportar para JSON
      exportToJson(blocosTransformados, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Lista de blocos da legislatura ${legislaturaNumero} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de blocos da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta blocos para arquivos JSON individuais
   * @param blocosTransformados - Blocos transformados
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde os blocos foram exportados
   */
  async exportBlocosDetalhados(
    blocosTransformados: ResultadoTransformacao, 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${blocosTransformados.total} blocos detalhados ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `blocos_${timestamp}`;
      
      const baseFolder = path.join('blocos', 'detalhados', folderName);
      
      // Exportar blocos e criar índice
      exportItemsAsIndividualFiles(
        blocosTransformados.blocos,
        baseFolder,
        (bloco: BlocoTransformado) => `${bloco.codigo}_${bloco.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      );
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'diversos',
        totalBlocos: blocosTransformados.total,
        distribuicaoPartidos: this.calcularDistribuicaoPartidos(blocosTransformados.blocos)
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      logger.info(`Blocos exportados para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar blocos detalhados: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um único bloco
   * @param bloco - Bloco
   * @returns Caminho do arquivo
   */
  async exportBloco(
    bloco: BlocoTransformado
  ): Promise<string> {
    try {
      logger.info(`Exportando bloco ${bloco.nome} (${bloco.codigo})`);
      
      const fileName = `${bloco.codigo}_${bloco.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = path.join('blocos', 'individuais', fileName);
      
      exportToJson(bloco, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Bloco exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar bloco ${bloco.codigo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de blocos
   * @param blocosTransformados - Blocos transformados
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    blocosTransformados: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${blocosTransformados.total} blocos da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_blocos_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('blocos', 'historico', fileName);
      
      // Exportar versão resumida para economizar espaço
      const blocosResumidos = blocosTransformados.blocos.map((bloco: BlocoTransformado) => ({
        codigo: bloco.codigo,
        nome: bloco.nome,
        sigla: bloco.sigla,
        quantidadePartidos: bloco.partidos?.length || 0,
        ultimaAtualizacao: bloco.atualizadoEm
      }));
      
      exportToJson(blocosResumidos, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de blocos da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calcula a distribuição de partidos por bloco
   * @param blocos - Lista de blocos
   * @returns Distribuição de partidos
   */
  private calcularDistribuicaoPartidos(blocos: BlocoTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    for (const bloco of blocos) {
      if (bloco.partidos && Array.isArray(bloco.partidos)) {
        for (const partido of bloco.partidos) {
          const sigla = partido.sigla || 'Sem Sigla';
          distribuicao[sigla] = (distribuicao[sigla] || 0) + 1;
        }
      }
    }
    
    return distribuicao;
  }
}

// Exporta uma instância do exportador
export const blocosExporter = new BlocosExporter();
