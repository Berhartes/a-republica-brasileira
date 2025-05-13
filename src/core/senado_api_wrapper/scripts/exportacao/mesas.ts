/**
 * Módulo de exportação de mesas diretoras para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { ResultadoTransformacao, MesaTransformada } from '../transformacao/mesas';

/**
 * Classe para exportar dados de mesas diretoras para arquivos
 */
export class MesasExporter {
  /**
   * Exporta a lista de mesas para JSON
   * @param mesasTransformadas - Dados transformados das mesas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportMesas(
    mesasTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${mesasTransformadas.total} mesas da legislatura ${legislaturaNumero}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `mesas_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('mesas', 'listas', fileName);
      
      // Exportar para JSON
      exportToJson(mesasTransformadas, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Lista de mesas da legislatura ${legislaturaNumero} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de mesas da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta mesas para arquivos JSON individuais
   * @param mesasTransformadas - Mesas transformadas
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde as mesas foram exportadas
   */
  async exportMesasDetalhadas(
    mesasTransformadas: ResultadoTransformacao, 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${mesasTransformadas.total} mesas detalhadas ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `mesas_${timestamp}`;
      
      const baseFolder = path.join('mesas', 'detalhadas', folderName);
      
      // Exportar mesas e criar índice
      exportItemsAsIndividualFiles(
        mesasTransformadas.mesas,
        baseFolder,
        (mesa: MesaTransformada) => `${mesa.tipo}_${mesa.codigo}`
      );
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'atual',
        totalMesas: mesasTransformadas.total,
        tipos: {
          senado: mesasTransformadas.mesas.filter(m => m.tipo === 'senado').length,
          congresso: mesasTransformadas.mesas.filter(m => m.tipo === 'congresso').length
        },
        totalMembros: mesasTransformadas.mesas.reduce((total, mesa) => total + (mesa.membros?.length || 0), 0)
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      logger.info(`Mesas exportadas para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar mesas detalhadas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta membros das mesas para CSV
   * @param mesasTransformadas - Dados transformados das mesas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo CSV
   */
  async exportMembrosCSV(
    mesasTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando membros das mesas da legislatura ${legislaturaNumero} para JSON`);
      
      // Extrair todos os membros de todas as mesas
      const membros: Array<Record<string, any>> = [];
      
      mesasTransformadas.mesas.forEach(mesa => {
        if (mesa.membros && Array.isArray(mesa.membros)) {
          mesa.membros.forEach(membro => {
            membros.push({
              codigo: membro.codigo,
              nome: membro.nome,
              partido: membro.partido || 'N/A',
              uf: membro.uf || 'N/A',
              cargo: membro.cargo?.descricao || 'N/A',
              codigoCargo: membro.cargo?.codigo || 'N/A',
              mesaTipo: mesa.tipo,
              mesaNome: mesa.nome
            });
          });
        }
      });
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `membros_mesas_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('mesas', 'membros', fileName);
      
      // Exportar para JSON em vez de CSV
      exportToJson(membros, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Membros das mesas exportados para JSON: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar membros das mesas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta uma única mesa
   * @param mesa - Mesa
   * @returns Caminho do arquivo
   */
  async exportMesa(
    mesa: MesaTransformada
  ): Promise<string> {
    try {
      logger.info(`Exportando mesa ${mesa.nome} (${mesa.tipo})`);
      
      const fileName = `${mesa.tipo}_${mesa.codigo}.json`;
      const filePath = path.join('mesas', 'individuais', fileName);
      
      exportToJson(mesa, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Mesa exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar mesa ${mesa.tipo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de mesas
   * @param mesasTransformadas - Mesas transformadas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    mesasTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${mesasTransformadas.total} mesas da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_mesas_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('mesas', 'historico', fileName);
      
      // Exportar versão completa para histórico
      exportToJson(mesasTransformadas, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de mesas da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
}

// Exporta uma instância do exportador
export const mesasExporter = new MesasExporter();
