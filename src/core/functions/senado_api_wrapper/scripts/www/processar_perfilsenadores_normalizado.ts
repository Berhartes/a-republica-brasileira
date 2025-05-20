/**
 * Script para processar perfis de senadores com estrutura normalizada
 * 
 * Este script implementa um fluxo ETL (Extract, Transform, Load) completo para
 * extrair dados de perfis de senadores do Senado Federal, transformá-los em um
 * formato normalizado e carregá-los no Firestore seguindo boas práticas de modelagem.
 * 
 * Características principais:
 * - Extrai dados completos de perfis de senadores
 * - Normaliza os dados em entidades separadas (senadores, mandatos, comissões, etc.)
 * - Salva os dados em coleções e subcoleções no Firestore
 * - Suporta parâmetros como --limite, --legislatura e --pc
 */

import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { perfilSenadoresExtractor } from './extracao/perfilsenadores';
import { perfilSenadoresTransformer } from './transformacao/perfilsenadores';
import { normalizarSenador } from './transformacao/normalizador';
import { carregadorNormalizado } from './carregamento/carregador_normalizado';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';
import { parseArgs } from './utils/args_parser';

/**
 * Função para processar o fluxo completo de perfis de senadores com estrutura normalizada
 * @param legislaturaEspecifica - Número de legislatura específica para processamento (opcional)
 * @param salvarNoPC - Se verdadeiro, salva a estrutura exata do Firestore no PC local (opcional)
 * @param limiteSenadores - Limita o processamento a um número específico de senadores (opcional)
 */
async function processarPerfilSenadoresNormalizado(
  legislaturaEspecifica?: number,
  salvarNoPC: boolean = false,
  limiteSenadores?: number
): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de perfis completos de senadores (ESTRUTURA NORMALIZADA) ===');

    // 0. Obter legislatura atual ou usar a especificada
    logger.info('0. Obtendo informações da legislatura');
    let legislaturaAtual: number;
    
    if (legislaturaEspecifica) {
      legislaturaAtual = legislaturaEspecifica;
      logger.info(`Usando legislatura específica: ${legislaturaAtual}`);
    } else {
      legislaturaAtual = await obterNumeroLegislaturaAtual();
      logger.info(`Usando legislatura atual: ${legislaturaAtual}`);
    }

    // 1. Extração
    logger.info('1. Iniciando etapa de extração');

    // 1.1 Extrair lista de senadores da legislatura
    logger.info('1.1 Extraindo lista de senadores da legislatura');
    const senadoresLegislatura = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislaturaAtual);
    
    if (!senadoresLegislatura || !senadoresLegislatura.Parlamentares || !senadoresLegislatura.Parlamentares.Parlamentar) {
      throw new Error(`Não foi possível obter a lista de senadores da legislatura ${legislaturaAtual}`);
    }

    // 1.2 Extrair perfis completos dos senadores
    logger.info('1.2 Extraindo perfis completos dos senadores');
    
    // Obter lista de códigos de senadores
    let codigosSenadores = senadoresLegislatura.Parlamentares.Parlamentar.map((senador: any) => {
      return senador.IdentificacaoParlamentar.CodigoParlamentar;
    });
    
    // Aplicar limite se especificado
    if (limiteSenadores && limiteSenadores > 0 && limiteSenadores < codigosSenadores.length) {
      logger.info(`Limitando processamento a ${limiteSenadores} senadores`);
      codigosSenadores = codigosSenadores.slice(0, limiteSenadores);
    }
    
    logger.info(`Processando ${codigosSenadores.length} senadores`);
    
    // Array para armazenar perfis extraídos
    const perfisExtraidos = [];
    
    // Extrair perfil completo de cada senador
    for (const [index, codigoSenador] of codigosSenadores.entries()) {
      try {
        logger.info(`Extraindo perfil do senador ${codigoSenador} (${index + 1}/${codigosSenadores.length})`);
        
        const perfilCompleto = await perfilSenadoresExtractor.extractPerfilCompleto(codigoSenador);
        perfisExtraidos.push(perfilCompleto);
        
        logger.info(`Perfil do senador ${codigoSenador} extraído com sucesso`);
      } catch (error: any) {
        logger.error(`Erro ao extrair perfil do senador ${codigoSenador}: ${error.message}`);
        
        // Adicionar objeto de erro para manter a consistência
        perfisExtraidos.push({
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          erro: error.message
        });
      }
      
      // Pausa entre senadores para não sobrecarregar a API
      if (index < codigosSenadores.length - 1) {
        logger.info(`Aguardando 2 segundos antes de extrair o próximo senador...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    logger.info(`Extração de perfis concluída: ${perfisExtraidos.length} senadores processados`);

    // 1.3 Exportar dados brutos extraídos
    logger.info('1.3 Exportando dados brutos extraídos para arquivos JSON');
    const { exportToJson } = require('./utils/file_exporter');
    exportToJson(perfisExtraidos, `senadores/extraidos/perfis_extraidos_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');

    // 2.1 Transformar lista de senadores
    logger.info('2.1 Transformando lista básica de senadores');
    const senadoresTransformados = perfilSenadoresTransformer.transformListaSenadores(senadoresLegislatura);
    
    logger.info(`Transformação de lista concluída: ${senadoresTransformados.senadores.length} senadores transformados`);

    // 2.2 Transformar perfis completos
    logger.info('2.2 Transformando perfis completos dos senadores');
    const perfisTransformados = await perfilSenadoresTransformer.transformMultiplosPerfis(perfisExtraidos);
    
    logger.info(`Transformação de perfis concluída: ${perfisTransformados.length} perfis transformados`);

    // 2.3 Normalizar perfis transformados
    logger.info('2.3 Normalizando perfis transformados');
    const perfisNormalizados = [];
    
    for (const perfil of perfisTransformados) {
      try {
        const perfilNormalizado = normalizarSenador(perfil);
        perfisNormalizados.push(perfilNormalizado);
      } catch (error: any) {
        logger.error(`Erro ao normalizar perfil do senador ${perfil.codigo}: ${error.message}`);
      }
    }
    
    logger.info(`Normalização concluída: ${perfisNormalizados.length} perfis normalizados`);

    // 2.4 Exportar dados transformados e normalizados
    logger.info('2.4 Exportando dados transformados e normalizados para arquivos JSON');
    exportToJson(perfisNormalizados, `senadores/transformados/perfis_normalizados_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');

    // Verificar se é para salvar no PC ou no Firestore
    if (salvarNoPC) {
      logger.info('Modo de exportação para PC ativado. Não será feito carregamento no Firestore.');
      
      // Exportar cada perfil normalizado em um arquivo separado
      logger.info('Exportando perfis normalizados em arquivos separados');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      for (const perfilNormalizado of perfisNormalizados) {
        const senadorFilePath = `senadores/perfis/normalizado_senador_${perfilNormalizado.senador.codigo}_${timestamp}.json`;
        exportToJson(perfilNormalizado, senadorFilePath);
      }
      
      logger.info(`${perfisNormalizados.length} arquivos de perfis normalizados exportados com sucesso`);
    } else {
      // Carregamento normal no Firestore
      
      // 3.1 Carregar perfis normalizados
      logger.info('3.1 Carregando perfis normalizados no Firestore');
      const resultadoCarregamento = await carregadorNormalizado.saveMultiplosSenadores(perfisNormalizados);
      
      logger.info(`Carregamento de perfis normalizados concluído: ${resultadoCarregamento.sucessos} salvos com sucesso, ${resultadoCarregamento.falhas} falhas`);
      logger.info(`Total de entidades carregadas: ${resultadoCarregamento.entidadesCarregadas.senadores} senadores, ${resultadoCarregamento.entidadesCarregadas.mandatos} mandatos, ${resultadoCarregamento.entidadesCarregadas.exercicios} exercícios, ${resultadoCarregamento.entidadesCarregadas.cargos} cargos, ${resultadoCarregamento.entidadesCarregadas.participacoesComissoes} participações em comissões, ${resultadoCarregamento.entidadesCarregadas.filiacoes} filiações, ${resultadoCarregamento.entidadesCarregadas.licencas} licenças, ${resultadoCarregamento.entidadesCarregadas.liderancas} lideranças, ${resultadoCarregamento.entidadesCarregadas.comissoes} comissões`);
    }

    logger.info('=== Processamento de perfis completos de senadores (ESTRUTURA NORMALIZADA) concluído com sucesso ===');
  } catch (error: any) {
    handleError('Erro no processamento de perfis de senadores', error);
    throw error;
  }
}

/**
 * Função para processar múltiplas legislaturas
 * @param legislaturas - Array de números de legislaturas para processamento
 * @param salvarNoPC - Se verdadeiro, salva a estrutura exata do Firestore no PC local (opcional)
 * @param limiteSenadores - Limita o processamento a um número específico de senadores (opcional)
 */
async function processarPerfilSenadoresMultiplasLegislaturasNormalizado(
  legislaturas: number[],
  salvarNoPC: boolean = false,
  limiteSenadores?: number
): Promise<void> {
  try {
    logger.info(`=== Iniciando processamento de perfis para ${legislaturas.length} legislaturas (ESTRUTURA NORMALIZADA) ===`);
    
    // Ordenar legislaturas (mais recentes primeiro)
    const legislaturasOrdenadas = [...legislaturas].sort((a, b) => b - a);
    
    for (const [index, legislatura] of legislaturasOrdenadas.entries()) {
      logger.info(`Processando legislatura ${legislatura} (${index + 1}/${legislaturasOrdenadas.length})`);
      
      try {
        await processarPerfilSenadoresNormalizado(legislatura, salvarNoPC, limiteSenadores);
        logger.info(`Legislatura ${legislatura} processada com sucesso`);
      } catch (error: any) {
        logger.error(`Erro ao processar legislatura ${legislatura}: ${error.message}`);
        // Continua o processamento das próximas legislaturas
      }
      
      // Pausa entre legislaturas para evitar sobrecarga na API
      if (index < legislaturasOrdenadas.length - 1) {
        logger.info('Aguardando 3 segundos antes de processar a próxima legislatura...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    logger.info(`=== Processamento de perfis para ${legislaturas.length} legislaturas (ESTRUTURA NORMALIZADA) concluído ===`);
  } catch (error: any) {
    handleError('Erro no processamento de múltiplas legislaturas', error);
    throw error;
  }
}

/**
 * Função principal para processar legislatura específica ou atual
 */
function processarLegislaturaEspecificaNormalizada(): void {
  // Analisar argumentos da linha de comando
  const args = parseArgs();
  
  // Verificar se é para processar múltiplas legislaturas
  if (args.multiplas) {
    logger.info('Modo de processamento de múltiplas legislaturas ativado');
    
    // Obter lista de legislaturas
    let legislaturas: number[] = [];
    
    if (args.legislaturas && typeof args.legislaturas === 'string') {
      // Converter string de legislaturas em array de números
      legislaturas = args.legislaturas.split(',').map(l => parseInt(l.trim(), 10)).filter(l => !isNaN(l));
    } else if (args.inicio && args.fim) {
      // Criar range de legislaturas
      const inicio = parseInt(args.inicio as string, 10);
      const fim = parseInt(args.fim as string, 10);
      
      if (!isNaN(inicio) && !isNaN(fim) && inicio <= fim) {
        legislaturas = Array.from({ length: fim - inicio + 1 }, (_, i) => inicio + i);
      }
    }
    
    if (legislaturas.length === 0) {
      logger.error('Nenhuma legislatura válida especificada para processamento múltiplo');
      process.exit(1);
    }
    
    // Processar múltiplas legislaturas
    processarPerfilSenadoresMultiplasLegislaturasNormalizado(
      legislaturas,
      args.pc === 'true' || args.pc === true,
      args.limite ? parseInt(args.limite as string, 10) : undefined
    )
      .then(() => {
        logger.info('Processamento de múltiplas legislaturas concluído com sucesso.');
        process.exit(0);
      })
      .catch(error => {
        logger.error('Falha no processamento de múltiplas legislaturas', error);
        process.exit(1);
      });
  } else {
    // Processar legislatura específica ou atual
    processarPerfilSenadoresNormalizado(
      args.legislatura ? parseInt(args.legislatura as string, 10) : undefined,
      args.pc === 'true' || args.pc === true,
      args.limite ? parseInt(args.limite as string, 10) : undefined
    )
      .then(() => {
        logger.info('Processamento concluído com sucesso.');
        process.exit(0);
      })
      .catch(error => {
        logger.error('Falha no processamento de perfis de senadores', error);
        process.exit(1);
      });
  }
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecificaNormalizada();
}

export { 
  processarPerfilSenadoresNormalizado, 
  processarPerfilSenadoresMultiplasLegislaturasNormalizado 
};
