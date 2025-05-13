/**
 * Módulo de exportação de senadores para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { ResultadoTransformacao, SenadorTransformado } from '../transformacao/senadores';

/**
 * Classe para exportar dados de senadores para arquivos
 */
export class SenadoresExporter {
  /**
   * Exporta a lista de senadores para JSON
   * @param senadoresTransformados - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportSenadores(
    senadoresTransformados: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando lista de ${senadoresTransformados.senadores.length} senadores da legislatura ${legislaturaNumero}`);
      
      // Criar nome de arquivo baseado na data
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `senadores_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('senadores', 'listas', fileName);
      
      // Exportar para JSON
      exportToJson(senadoresTransformados, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Lista de senadores da legislatura ${legislaturaNumero} exportada para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar lista de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta senadores para arquivos JSON individuais
   * @param senadoresTransformados - Senadores transformados
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde os senadores foram exportados
   */
  async exportSenadoresDetalhados(
    senadoresTransformados: ResultadoTransformacao, 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${senadoresTransformados.senadores.length} senadores detalhados ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `senadores_${timestamp}`;
      
      const baseFolder = path.join('senadores', 'detalhados', folderName);
      
      // Exportar senadores e criar índice
      exportItemsAsIndividualFiles(
        senadoresTransformados.senadores,
        baseFolder,
        (senador: SenadorTransformado) => `${senador.codigo}_${senador.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      );
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'diversos',
        totalSenadores: senadoresTransformados.senadores.length,
        distribuicaoPartidos: this.calcularDistribuicaoPartidos(senadoresTransformados.senadores),
        distribuicaoUF: this.calcularDistribuicaoUF(senadoresTransformados.senadores),
        distribuicaoGenero: this.calcularDistribuicaoGenero(senadoresTransformados.senadores)
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      logger.info(`Senadores exportados para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar senadores detalhados: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um único senador
   * @param senador - Senador
   * @returns Caminho do arquivo
   */
  async exportSenador(
    senador: SenadorTransformado
  ): Promise<string> {
    try {
      logger.info(`Exportando senador ${senador.nome} (${senador.codigo})`);
      
      const fileName = `${senador.codigo}_${senador.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = path.join('senadores', 'individuais', fileName);
      
      exportToJson(senador, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Senador exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar senador ${senador.codigo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de senadores
   * @param senadoresTransformados - Senadores transformados
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    senadoresTransformados: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${senadoresTransformados.senadores.length} senadores da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_senadores_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('senadores', 'historico', fileName);
      
      // Exportar versão resumida para economizar espaço
      const senadoresResumidos = senadoresTransformados.senadores.map((senador: SenadorTransformado) => ({
        codigo: senador.codigo,
        nome: senador.nome,
        siglaPartido: senador.partido?.sigla || 'Não Informado',
        uf: senador.uf,
        sexo: senador.genero,
        situacao: {
          afastado: senador.situacao?.afastado || false,
          titular: senador.situacao?.titular || true
        },
        ultimaAtualizacao: senador.atualizadoEm
      }));
      
      exportToJson(senadoresResumidos, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de senadores da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calcula a distribuição de senadores por partido
   * @param senadores - Lista de senadores
   * @returns Distribuição por partido
   */
  private calcularDistribuicaoPartidos(senadores: SenadorTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    senadores.forEach(senador => {
      const siglaPartido = senador.partido?.sigla || 'Sem Partido';
      distribuicao[siglaPartido] = (distribuicao[siglaPartido] || 0) + 1;
    });
    
    return distribuicao;
  }
  
  /**
   * Calcula a distribuição de senadores por UF
   * @param senadores - Lista de senadores
   * @returns Distribuição por UF
   */
  private calcularDistribuicaoUF(senadores: SenadorTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    senadores.forEach(senador => {
      const uf = senador.uf || 'Não Informado';
      distribuicao[uf] = (distribuicao[uf] || 0) + 1;
    });
    
    return distribuicao;
  }
  
  /**
   * Calcula a distribuição de senadores por gênero
   * @param senadores - Lista de senadores
   * @returns Distribuição por gênero
   */
  private calcularDistribuicaoGenero(senadores: SenadorTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {
      Masculino: 0,
      Feminino: 0,
      'Não Informado': 0
    };
    
    senadores.forEach(senador => {
      const genero = senador.genero?.toLowerCase();
      
      if (genero === 'masculino' || genero === 'm') {
        distribuicao.Masculino += 1;
      } else if (genero === 'feminino' || genero === 'f') {
        distribuicao.Feminino += 1;
      } else {
        distribuicao['Não Informado'] += 1;
      }
    });
    
    return distribuicao;
  }
}

// Exporta uma instância do exportador
export const senadoresExporter = new SenadoresExporter();
