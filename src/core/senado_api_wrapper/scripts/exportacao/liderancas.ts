/**
 * Módulo de exportação de lideranças para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { 
  ResultadoTransformacao, 
  LiderancaTransformada,
  TipoLiderancaTransformado,
  TipoUnidadeTransformado,
  TipoCargoTransformado
} from '../transformacao/liderancas';

/**
 * Classe para exportar dados de lideranças para arquivos
 */
export class LiderancasExporter {
  /**
   * Exporta a lista de lideranças para JSON
   * @param liderancasTransformadas - Dados transformados das lideranças
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportLiderancas(
    liderancasTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${liderancasTransformadas.liderancas.total} lideranças da legislatura ${legislaturaNumero}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `liderancas_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('liderancas', 'listas', fileName);
      
      // Exportar para JSON
      exportToJson(liderancasTransformadas, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Lista de lideranças da legislatura ${legislaturaNumero} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de lideranças da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta lideranças para arquivos JSON individuais
   * @param liderancasTransformadas - Lideranças transformadas
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde as lideranças foram exportadas
   */
  async exportLiderancasDetalhadas(
    liderancasTransformadas: ResultadoTransformacao, 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${liderancasTransformadas.liderancas.total} lideranças detalhadas ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `liderancas_${timestamp}`;
      
      const baseFolder = path.join('liderancas', 'detalhadas', folderName);
      
      // Exportar lideranças e criar índice
      exportItemsAsIndividualFiles(
        liderancasTransformadas.liderancas.itens,
        baseFolder,
        (lideranca: LiderancaTransformada) => `${lideranca.codigo}_${lideranca.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      );
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'atual',
        totalLiderancas: liderancasTransformadas.liderancas.total,
        tiposLideranca: {
          total: liderancasTransformadas.referencias.tiposLideranca.length,
          itens: liderancasTransformadas.referencias.tiposLideranca.map(t => t.descricao)
        },
        tiposUnidade: {
          total: liderancasTransformadas.referencias.tiposUnidade.length,
          itens: liderancasTransformadas.referencias.tiposUnidade.map(t => t.descricao)
        },
        tiposCargo: {
          total: liderancasTransformadas.referencias.tiposCargo.length,
          itens: liderancasTransformadas.referencias.tiposCargo.map(t => t.descricao)
        }
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      // Exportar dados de referência
      exportToJson({
        timestamp: new Date().toISOString(),
        total: liderancasTransformadas.referencias.tiposLideranca.length,
        itens: liderancasTransformadas.referencias.tiposLideranca
      }, `${baseFolder}/tipos_lideranca.json`);
      
      exportToJson({
        timestamp: new Date().toISOString(),
        total: liderancasTransformadas.referencias.tiposUnidade.length,
        itens: liderancasTransformadas.referencias.tiposUnidade
      }, `${baseFolder}/tipos_unidade.json`);
      
      exportToJson({
        timestamp: new Date().toISOString(),
        total: liderancasTransformadas.referencias.tiposCargo.length,
        itens: liderancasTransformadas.referencias.tiposCargo
      }, `${baseFolder}/tipos_cargo.json`);
      
      logger.info(`Lideranças exportadas para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar lideranças detalhadas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta referências para arquivos JSON
   * @param referencias - Referências transformadas
   * @returns Objeto com caminhos dos arquivos gerados
   */
  async exportReferencias(
    referencias: ResultadoTransformacao['referencias']
  ): Promise<Record<string, string>> {
    try {
      logger.info('Exportando referências de lideranças para JSON');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const paths: Record<string, string> = {};
      
      // Exportar tipos de liderança
      const tiposLiderancaPath = path.join('liderancas', 'referencias', `tipos_lideranca_${timestamp}.json`);
      exportToJson(referencias.tiposLideranca, tiposLiderancaPath);
      paths.tiposLideranca = path.join(process.cwd(), 'dados_extraidos', tiposLiderancaPath);
      
      // Exportar tipos de unidade
      const tiposUnidadePath = path.join('liderancas', 'referencias', `tipos_unidade_${timestamp}.json`);
      exportToJson(referencias.tiposUnidade, tiposUnidadePath);
      paths.tiposUnidade = path.join(process.cwd(), 'dados_extraidos', tiposUnidadePath);
      
      // Exportar tipos de cargo
      const tiposCargoPath = path.join('liderancas', 'referencias', `tipos_cargo_${timestamp}.json`);
      exportToJson(referencias.tiposCargo, tiposCargoPath);
      paths.tiposCargo = path.join(process.cwd(), 'dados_extraidos', tiposCargoPath);
      
      logger.info('Referências de lideranças exportadas para JSON');
      
      return paths;
    } catch (error: any) {
      logger.error(`Erro ao exportar referências para JSON: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta membros de lideranças para CSV
   * @param liderancas - Lideranças
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo CSV
   */
  async exportMembrosCSV(
    liderancas: ResultadoTransformacao['liderancas'],
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando membros de lideranças para JSON`);
      
      // Extrair todos os membros de todas as lideranças
      const membros = [];
      
      for (const lideranca of liderancas.itens) {
        if (lideranca.membros) {
          for (const membro of lideranca.membros) {
            membros.push({
              ...membro,
              liderancaCodigo: lideranca.codigo,
              liderancaNome: lideranca.nome,
              liderancaTipo: lideranca.tipo?.descricao || 'N/A'
            });
          }
        }
      }
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `membros_liderancas_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('liderancas', 'membros', fileName);
      
      // Exportar para JSON (em vez de CSV)
      exportToJson(membros, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Membros de lideranças exportados para JSON: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar membros de lideranças: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta lideranças filtradas por critério
   * @param liderancas - Lideranças
   * @param nomeArquivo - Nome do arquivo
   * @param criterio - Critério de filtragem (texto no nome ou tipo)
   * @returns Caminho do arquivo
   */
  async exportLiderancasFiltradas(
    liderancas: ResultadoTransformacao['liderancas'],
    nomeArquivo: string,
    criterio: string
  ): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${nomeArquivo}_${timestamp}.json`;
      const filePath = path.join('liderancas', 'filtradas', fileName);
      
      // Filtrar lideranças pelo critério (no nome ou tipo)
      const liderancasFiltradas = liderancas.itens.filter(lideranca => 
        lideranca.nome.includes(criterio) || 
        lideranca.tipo?.descricao?.includes(criterio)
      );
      
      logger.info(`Exportando ${liderancasFiltradas.length} lideranças filtradas por "${criterio}"`);
      
      // Exportar para JSON
      exportToJson({
        timestamp: new Date().toISOString(),
        criterio,
        total: liderancasFiltradas.length,
        liderancas: liderancasFiltradas
      }, filePath);
      
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      logger.info(`Lideranças filtradas exportadas para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lideranças filtradas por "${criterio}": ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta uma única liderança
   * @param lideranca - Liderança
   * @returns Caminho do arquivo
   */
  async exportLideranca(
    lideranca: LiderancaTransformada
  ): Promise<string> {
    try {
      logger.info(`Exportando liderança ${lideranca.nome} (${lideranca.codigo})`);
      
      const fileName = `${lideranca.codigo}_${lideranca.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = path.join('liderancas', 'individuais', fileName);
      
      exportToJson(lideranca, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Liderança exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar liderança ${lideranca.codigo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de lideranças
   * @param liderancasTransformadas - Lideranças transformadas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    liderancasTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${liderancasTransformadas.liderancas.total} lideranças da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_liderancas_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('liderancas', 'historico', fileName);
      
      // Exportar versão resumida para economizar espaço
      const liderancasResumidas = liderancasTransformadas.liderancas.itens.map(lideranca => ({
        codigo: lideranca.codigo,
        nome: lideranca.nome,
        tipo: lideranca.tipo?.descricao,
        parlamentar: lideranca.parlamentar?.nome,
        partido: lideranca.parlamentar?.partido,
        atualizadoEm: lideranca.atualizadoEm
      }));
      
      exportToJson({
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero,
        total: liderancasResumidas.length,
        liderancas: liderancasResumidas
      }, filePath);
      
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de lideranças da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
}

// Exporta uma instância do exportador
export const liderancasExporter = new LiderancasExporter();
