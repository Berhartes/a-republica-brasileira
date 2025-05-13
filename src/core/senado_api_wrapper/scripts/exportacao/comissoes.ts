/**
 * Módulo de exportação de comissões do Senado para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { ResultadoTransformacao, ComissaoTransformada } from '../transformacao/comissoes';

/**
 * Classe para exportar dados de comissões para arquivos
 */
export class ComissoesExporter {
  /**
   * Exporta a lista de comissões para JSON
   * @param comissoesTransformadas - Dados transformados das comissões
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportComissoes(
    comissoesTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${comissoesTransformadas.total} comissões da legislatura ${legislaturaNumero}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `comissoes_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('comissoes', 'listas', fileName);
      
      // Exportar para JSON
      exportToJson(comissoesTransformadas, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Lista de comissões da legislatura ${legislaturaNumero} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de comissões da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta comissões para arquivos JSON individuais
   * @param comissoesTransformadas - Comissões transformadas
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde as comissões foram exportadas
   */
  async exportComissoesDetalhadas(
    comissoesTransformadas: ResultadoTransformacao, 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${comissoesTransformadas.total} comissões detalhadas ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `comissoes_${timestamp}`;
      
      const baseFolder = path.join('comissoes', 'detalhadas', folderName);
      
      // Criar array plano de todas as comissões para facilitar a exportação
      const comissoesPlanas: ComissaoTransformada[] = [];
      
      // Adicionar comissões do Senado
      Object.values(comissoesTransformadas.comissoes.senado).forEach(comissoesArray => {
        if (Array.isArray(comissoesArray)) {
          comissoesPlanas.push(...comissoesArray);
        }
      });
      
      // Adicionar comissões do Congresso
      Object.values(comissoesTransformadas.comissoes.congresso).forEach(comissoesArray => {
        if (Array.isArray(comissoesArray)) {
          comissoesPlanas.push(...comissoesArray);
        }
      });
      
      // Exportar comissões e criar índice
      exportItemsAsIndividualFiles(
        comissoesPlanas,
        baseFolder,
        (comissao: ComissaoTransformada) => `${comissao.codigo}_${comissao.sigla.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      );
      
      // Calcular distribuições para o sumário
      const distribuicaoTipos = this.calcularDistribuicaoTipos(comissoesPlanas);
      const distribuicaoSituacao = this.calcularDistribuicaoSituacao(comissoesPlanas);
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'diversos',
        totalComissoes: comissoesTransformadas.total,
        distribuicaoTipos,
        distribuicaoSituacao
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      logger.info(`Comissões exportadas para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar comissões detalhadas: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta uma única comissão
   * @param comissao - Comissão
   * @returns Caminho do arquivo
   */
  async exportComissao(
    comissao: ComissaoTransformada
  ): Promise<string> {
    try {
      logger.info(`Exportando comissão ${comissao.nome} (${comissao.codigo})`);
      
      const fileName = `${comissao.codigo}_${comissao.sigla.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = path.join('comissoes', 'individuais', fileName);
      
      exportToJson(comissao, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Comissão exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar comissão ${comissao.codigo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de comissões
   * @param comissoesTransformadas - Comissões transformadas
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    comissoesTransformadas: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${comissoesTransformadas.total} comissões da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_comissoes_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('comissoes', 'historico', fileName);
      
      // Criar array plano de todas as comissões para facilitar a exportação
      const comissoesPlanas: ComissaoTransformada[] = [];
      
      // Adicionar comissões do Senado
      Object.values(comissoesTransformadas.comissoes.senado).forEach(comissoesArray => {
        if (Array.isArray(comissoesArray)) {
          comissoesPlanas.push(...comissoesArray);
        }
      });
      
      // Adicionar comissões do Congresso
      Object.values(comissoesTransformadas.comissoes.congresso).forEach(comissoesArray => {
        if (Array.isArray(comissoesArray)) {
          comissoesPlanas.push(...comissoesArray);
        }
      });
      
      // Exportar versão resumida para economizar espaço
      const comissoesResumidas = comissoesPlanas.map((comissao: ComissaoTransformada) => ({
        codigo: comissao.codigo,
        sigla: comissao.sigla,
        nome: comissao.nome,
        tipo: typeof comissao.tipo === 'string' ? comissao.tipo : (comissao.tipo?.nome || ''),
        situacao: comissao.situacao?.nome || (comissao.ativa ? 'Ativa' : 'Inativa'),
        ultimaAtualizacao: comissao.atualizadoEm
      }));
      
      exportToJson(comissoesResumidas, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de comissões da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calcula a distribuição de comissões por tipo
   * @param comissoes - Lista de comissões
   * @returns Distribuição por tipo
   */
  private calcularDistribuicaoTipos(comissoes: ComissaoTransformada[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    comissoes.forEach(comissao => {
      let tipoNome = 'Não Informado';
      
      if (typeof comissao.tipo === 'string') {
        tipoNome = comissao.tipo;
      } else if (comissao.tipo && typeof comissao.tipo === 'object' && comissao.tipo.nome) {
        tipoNome = comissao.tipo.nome;
      }
      
      distribuicao[tipoNome] = (distribuicao[tipoNome] || 0) + 1;
    });
    
    return distribuicao;
  }
  
  /**
   * Calcula a distribuição de comissões por situação
   * @param comissoes - Lista de comissões
   * @returns Distribuição por situação
   */
  private calcularDistribuicaoSituacao(comissoes: ComissaoTransformada[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    comissoes.forEach(comissao => {
      let situacaoNome = comissao.ativa ? 'Ativa' : 'Inativa';
      
      if (comissao.situacao && typeof comissao.situacao === 'object' && comissao.situacao.nome) {
        situacaoNome = comissao.situacao.nome;
      }
      
      distribuicao[situacaoNome] = (distribuicao[situacaoNome] || 0) + 1;
    });
    
    return distribuicao;
  }
}

// Exporta uma instância do exportador
export const comissoesExporter = new ComissoesExporter();
