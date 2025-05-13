/**
 * Módulo de exportação de perfis de senadores para arquivos físicos
 * Complementa o carregamento no Firestore, permitindo visualização e análise
 */
import * as path from 'path';
import { logger } from '../utils/logger';
import { exportToJson, exportItemsAsIndividualFiles } from '../utils/file_exporter';
import { SenadorBasicoTransformado, SenadorCompletoTransformado, ResultadoTransformacaoLista } from '../transformacao/perfilsenadores';

/**
 * Classe para exportar dados de perfis de senadores para arquivos
 */
export class PerfilSenadoresExporter {
  /**
   * Exporta a lista de senadores de uma legislatura para JSON
   * @param senadoresTransformados - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo gerado
   */
  async exportSenadoresLegislatura(
    senadoresTransformados: ResultadoTransformacaoLista, 
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
   * Exporta perfis completos de senadores para arquivos JSON individuais
   * @param perfisTransformados - Perfis transformados dos senadores
   * @param legislaturaNumero - Número da legislatura (opcional)
   * @returns Diretório onde os perfis foram exportados
   */
  async exportPerfisSenadores(
    perfisTransformados: SenadorCompletoTransformado[], 
    legislaturaNumero?: number
  ): Promise<string> {
    try {
      logger.info(`Exportando ${perfisTransformados.length} perfis completos de senadores ${legislaturaNumero ? `da legislatura ${legislaturaNumero}` : ''}`);
      
      // Criar pasta baseada na data e legislatura
      const timestamp = new Date().toISOString().split('T')[0];
      const folderName = legislaturaNumero 
        ? `legislatura_${legislaturaNumero}_${timestamp}` 
        : `perfis_${timestamp}`;
      
      const baseFolder = path.join('senadores', 'perfis', folderName);
      
      // Exportar perfis e criar índice
      exportItemsAsIndividualFiles(
        perfisTransformados,
        baseFolder,
        (perfil: SenadorCompletoTransformado) => `${perfil.codigo}_${perfil.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      );
      
      // Exportar sumário
      const sumario = {
        timestamp: new Date().toISOString(),
        legislatura: legislaturaNumero || 'diversos',
        totalSenadores: perfisTransformados.length,
        distribuicaoPartidos: this.calcularDistribuicaoPartidos(perfisTransformados),
        distribuicaoUF: this.calcularDistribuicaoUF(perfisTransformados),
        distribuicaoGenero: this.calcularDistribuicaoGenero(perfisTransformados)
      };
      
      exportToJson(sumario, `${baseFolder}/sumario.json`);
      
      logger.info(`Perfis exportados para a pasta: ${baseFolder}`);
      
      return baseFolder;
    } catch (error: any) {
      logger.error(`Erro ao exportar perfis de senadores: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um único perfil de senador
   * @param perfil - Perfil do senador
   * @returns Caminho do arquivo
   */
  async exportPerfilSenador(
    perfil: SenadorCompletoTransformado
  ): Promise<string> {
    try {
      logger.info(`Exportando perfil do senador ${perfil.nome} (${perfil.codigo})`);
      
      const fileName = `${perfil.codigo}_${perfil.nome.toLowerCase().replace(/[^a-z0-9]/g, '_')}.json`;
      const filePath = path.join('senadores', 'individuais', fileName);
      
      exportToJson(perfil, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Perfil do senador exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar perfil do senador ${perfil.codigo}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Exporta um snapshot histórico de perfis
   * @param perfisTransformados - Perfis transformados
   * @param legislaturaNumero - Número da legislatura
   * @returns Caminho do arquivo
   */
  async exportHistorico(
    perfisTransformados: SenadorCompletoTransformado[], 
    legislaturaNumero: number
  ): Promise<string> {
    try {
      logger.info(`Exportando histórico de ${perfisTransformados.length} perfis da legislatura ${legislaturaNumero}`);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `historico_legislatura_${legislaturaNumero}_${timestamp}.json`;
      const filePath = path.join('senadores', 'historico', fileName);
      
      // Exportar versão resumida para economizar espaço
      const perfilResumido = perfisTransformados.map(perfil => ({
        codigo: perfil.codigo,
        nome: perfil.nome,
        nomeCompleto: perfil.nomeCompleto,
        partido: perfil.partido,
        uf: perfil.uf,
        situacao: perfil.situacao,
        mandatoAtual: perfil.mandatoAtual,
        ultimaAtualizacao: perfil.atualizadoEm
      }));
      
      exportToJson(perfilResumido, filePath);
      const fullPath = path.join(process.cwd(), 'dados_extraidos', filePath);
      
      logger.info(`Histórico exportado para: ${fullPath}`);
      
      return fullPath;
    } catch (error: any) {
      logger.error(`Erro ao exportar histórico de perfis da legislatura ${legislaturaNumero}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calcula a distribuição de senadores por partido
   * @param perfis - Perfis de senadores
   * @returns Distribuição por partido
   */
  private calcularDistribuicaoPartidos(perfis: SenadorCompletoTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    perfis.forEach(perfil => {
      const siglaPartido = perfil.partido.sigla || 'Sem Partido';
      distribuicao[siglaPartido] = (distribuicao[siglaPartido] || 0) + 1;
    });
    
    return distribuicao;
  }
  
  /**
   * Calcula a distribuição de senadores por UF
   * @param perfis - Perfis de senadores
   * @returns Distribuição por UF
   */
  private calcularDistribuicaoUF(perfis: SenadorCompletoTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {};
    
    perfis.forEach(perfil => {
      const uf = perfil.uf || 'Não Informado';
      distribuicao[uf] = (distribuicao[uf] || 0) + 1;
    });
    
    return distribuicao;
  }
  
  /**
   * Calcula a distribuição de senadores por gênero
   * @param perfis - Perfis de senadores
   * @returns Distribuição por gênero
   */
  private calcularDistribuicaoGenero(perfis: SenadorCompletoTransformado[]): Record<string, number> {
    const distribuicao: Record<string, number> = {
      Masculino: 0,
      Feminino: 0,
      'Não Informado': 0
    };
    
    perfis.forEach(perfil => {
      const genero = perfil.genero.toLowerCase();
      
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
export const perfilSenadoresExporter = new PerfilSenadoresExporter();
