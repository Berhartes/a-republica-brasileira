/**
 * Módulo de exportação de legislatura para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson } from '../utils/file_exporter';
import { Legislatura } from '../utils/legislatura';

/**
 * Classe para exportar dados de legislatura para arquivos
 */
export class LegislaturaExporter {
  /**
   * Exporta a legislatura para JSON
   * @param legislatura - Dados da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportLegislatura(
    legislatura: Legislatura
  ): Promise<string> {
    try {
      const numeroLegislatura = parseInt(legislatura.NumeroLegislatura, 10);
      logger.info(`Exportando dados da legislatura ${numeroLegislatura}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `legislatura_${numeroLegislatura}_${timestamp}.json`;
      const filePath = path.join('legislatura', 'atual', fileName);
      
      // Exportar para JSON
      exportToJson(legislatura, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Legislatura ${numeroLegislatura} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar legislatura: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta informações detalhadas da legislatura
   * @param legislatura - Dados da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportLegislaturaDetalhada(
    legislatura: Legislatura
  ): Promise<string> {
    try {
      const numeroLegislatura = parseInt(legislatura.NumeroLegislatura, 10);
      logger.info(`Exportando detalhes da legislatura ${numeroLegislatura}`);
      
      // Criar pasta baseada na data
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = `legislatura_${numeroLegislatura}_${timestamp}`;
      const baseFolder = path.join('legislatura', 'detalhes', folderName);
      
      // Processar sessões legislativas
      const sessoes = legislatura.SessoesLegislativas?.SessaoLegislativa;
      let sessoesFormatadas: Array<typeof sessoes extends Array<infer T> ? T : typeof sessoes> = [];
      
      if (sessoes) {
        sessoesFormatadas = Array.isArray(sessoes) ? sessoes : [sessoes];
      }
      
      // Formar o objeto detalhado
      const detalhes = {
        numero: numeroLegislatura,
        dataInicio: legislatura.DataInicio,
        dataFim: legislatura.DataFim,
        dataEleicao: legislatura.DataEleicao,
        ativa: this.verificarLegislaturaAtiva(legislatura),
        duracaoEmDias: this.calcularDuracaoEmDias(legislatura),
        sessoes: sessoesFormatadas.map((sessao) => {
          if (!sessao) return null;
          
          // Verificar se sessao é um array e alertar sobre uso incorreto
          if (Array.isArray(sessao)) {
            logger.warn('Uma sessão legislativa foi detectada como array, o que é inesperado');
            return null;
          }

          return {
            numero: parseInt(sessao.NumeroSessaoLegislativa, 10),
            tipo: sessao.TipoSessaoLegislativa,
            dataInicio: sessao.DataInicio,
            dataFim: sessao.DataFim,
            intervalo: sessao.DataInicioIntervalo ? {
              inicio: sessao.DataInicioIntervalo,
              fim: sessao.DataFimIntervalo
            } : null
          };
        }).filter((s): s is NonNullable<typeof s> => s !== null),
        timestamp: new Date().toISOString()
      };
      
      // Exportar detalhes
      exportToJson(detalhes, `${baseFolder}/detalhes.json`);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', baseFolder, 'detalhes.json');
      
      logger.info(`Detalhes da legislatura ${numeroLegislatura} exportados para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar detalhes da legislatura: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta o histórico da legislatura
   * @param legislatura - Dados da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportHistorico(
    legislatura: Legislatura
  ): Promise<string> {
    try {
      const numeroLegislatura = parseInt(legislatura.NumeroLegislatura, 10);
      logger.info(`Exportando histórico da legislatura ${numeroLegislatura}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_legislatura_${numeroLegislatura}_${timestamp}.json`;
      const filePath = path.join('legislatura', 'historico', fileName);
      
      // Exportar versão resumida para o histórico
      const historicoResumido = {
        numero: numeroLegislatura,
        dataInicio: legislatura.DataInicio,
        dataFim: legislatura.DataFim,
        ativa: this.verificarLegislaturaAtiva(legislatura),
        quantidadeSessoes: this.contarSessoes(legislatura),
        dataExtracao: new Date().toISOString()
      };
      
      exportToJson(historicoResumido, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico da legislatura exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico da legislatura: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Verifica se a legislatura está ativa na data atual
   * @param legislatura - Dados da legislatura
   * @returns true se a legislatura está ativa
   */
  private verificarLegislaturaAtiva(legislatura: Legislatura): boolean {
    const hoje = new Date();
    const dataInicio = new Date(legislatura.DataInicio);
    const dataFim = new Date(legislatura.DataFim);
    
    return hoje >= dataInicio && hoje <= dataFim;
  }
  
  /**
   * Calcula a duração da legislatura em dias
   * @param legislatura - Dados da legislatura
   * @returns Duração em dias
   */
  private calcularDuracaoEmDias(legislatura: Legislatura): number {
    const dataInicio = new Date(legislatura.DataInicio);
    const dataFim = new Date(legislatura.DataFim);
    
    // Calcular a diferença em milissegundos e converter para dias
    const diffTime = Math.abs(dataFim.getTime() - dataInicio.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  /**
   * Conta o número de sessões legislativas
   * @param legislatura - Dados da legislatura
   * @returns Número de sessões
   */
  private contarSessoes(legislatura: Legislatura): number {
    if (!legislatura.SessoesLegislativas) {
      return 0;
    }
    
    const sessoes = legislatura.SessoesLegislativas.SessaoLegislativa;
    return Array.isArray(sessoes) ? sessoes.length : 1;
  }
}

// Exporta uma instância do exportador
export const legislaturaExporter = new LegislaturaExporter();
