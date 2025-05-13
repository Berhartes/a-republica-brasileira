/**
 * Script para processar perfis de senadores (extração, transformação e carregamento)
 * Este script extrai dados completos de senadores, incluindo seus perfis detalhados,
 * diferente do processar_senadores.ts que extrai apenas dados básicos.
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { perfilSenadoresExtractor } from './extracao/perfilsenadores';
import { perfilSenadoresTransformer, SenadorCompletoTransformado } from './transformacao/perfilsenadores';
import { perfilSenadoresLoader } from './carregamento/perfilsenadores';
import { perfilSenadoresExporter } from './exportacao/perfilsenadores';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';

/**
 * Função para processar o fluxo completo de perfis de senadores
 * @param legislaturaEspecifica - Número de legislatura específica para processamento (opcional)
 */
async function processarPerfilSenadores(legislaturaEspecifica?: number): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de perfis completos de senadores ===');
    
    // 0. Obter legislatura atual ou usar a especificada
    logger.info('0. Obtendo informações da legislatura');
    let legislaturaAtual: number;
    
    if (legislaturaEspecifica) {
      // Usar legislatura específica se fornecida
      logger.info(`Usando legislatura específica: ${legislaturaEspecifica}`);
      legislaturaAtual = legislaturaEspecifica;
    } else {
      // Obter legislatura atual
      const legislatura = await obterNumeroLegislaturaAtual();
      
      if (!legislatura) {
        throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
      }
      
      legislaturaAtual = legislatura;
      logger.info(`Legislatura atual: ${legislaturaAtual}`);
    }
    
    if (legislaturaAtual <= 0 || legislaturaAtual > 58) {
      throw new Error(`Legislatura inválida: ${legislaturaAtual}. Deve estar entre 1 e 58.`);
    }
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    
    // 1.1 Extrair lista de senadores
    logger.info('1.1 Extraindo lista de senadores da legislatura');
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislaturaAtual);
    logger.info(`Extração de lista concluída: ${senadoresExtraidos.senadores.length} senadores extraídos`);
    
    if (senadoresExtraidos.senadores.length === 0) {
      logger.warn(`Nenhum senador encontrado para a legislatura ${legislaturaAtual}. Abortando processamento.`);
      return;
    }
    
    // 1.2 Transformar lista básica para identificar códigos dos senadores
    logger.info('1.2 Transformando lista básica de senadores');
    const senadoresTransformados = perfilSenadoresTransformer.transformSenadoresLegislatura(senadoresExtraidos, legislaturaAtual);
    logger.info(`Transformação de lista concluída: ${senadoresTransformados.senadores.length} senadores transformados`);
    
    // 1.2.A Exportar lista básica para arquivos locais para análise
    logger.info('1.2.A Exportando lista de senadores para arquivos JSON');
    await perfilSenadoresExporter.exportSenadoresLegislatura(senadoresTransformados, legislaturaAtual);
    
    // 1.3 Extrair perfis completos dos senadores
    logger.info('1.3 Extraindo perfis completos dos senadores');
    const concurrency = 1; // Para não sobrecarregar a API - reduzido para apenas 1 requisição por vez
    const maxRetries = 5; // Aumentado para 5 tentativas
    
    // Filtrar apenas senadores com código válido
    const codigosSenadores = senadoresTransformados.senadores
      .filter(s => s && s.codigo)
      .map(s => s.codigo);
    
    logger.info(`Iniciando extração de ${codigosSenadores.length} perfis completos`);
    
    const perfisExtraidos = await perfilSenadoresExtractor.extractMultiplosPerfis(
      codigosSenadores,
      concurrency,
      maxRetries
    );
    
    logger.info(`Extração de perfis concluída: ${perfisExtraidos.length} perfis extraídos`);
    
    // 1.3.A Exportar dados brutos extraídos
    logger.info('1.3.A Exportando dados brutos extraídos para arquivos JSON');
    const { exportToJson } = require('./utils/file_exporter');
    exportToJson(perfisExtraidos, `senadores/extraidos/perfis_extraidos_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    
    // 2.1 Transformar perfis completos
    const perfisTransformados = perfisExtraidos
      .map(perfil => {
        try {
          return perfilSenadoresTransformer.transformPerfilCompleto(perfil);
        } catch (error: any) {
          logger.warn(`Erro ao transformar perfil do senador ${perfil?.codigo || 'desconhecido'}: ${error.message}`);
          return null;
        }
      })
      .filter((perfil): perfil is SenadorCompletoTransformado => Boolean(perfil)); // Remove itens nulos e preserva o tipo
    
    logger.info(`Transformação de perfis concluída: ${perfisTransformados.length} perfis transformados`);
    
    // 2.1.A Exportar perfis transformados
    logger.info('2.1.A Exportando perfis transformados para arquivos JSON');
    await perfilSenadoresExporter.exportPerfisSenadores(perfisTransformados, legislaturaAtual);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    
    // 3.1 Carregar lista de senadores da legislatura
    logger.info('3.1 Carregando lista básica de senadores');
    await perfilSenadoresLoader.saveSenadoresLegislatura(senadoresTransformados, legislaturaAtual);
    
    // 3.2 Carregar perfis completos
    logger.info('3.2 Carregando perfis completos dos senadores');
    const resultadoCarregamento = await perfilSenadoresLoader.saveMultiplosPerfis(
      perfisTransformados,
      legislaturaAtual
    );
    
    logger.info(`Carregamento de perfis concluído: ${resultadoCarregamento.sucessos} salvos com sucesso, ${resultadoCarregamento.falhas} falhas`);
    
    // 3.3 Se for a legislatura atual, atualizar também a lista de "senadores atuais"
    if (!legislaturaEspecifica || legislaturaEspecifica === legislaturaAtual) {
      logger.info('3.3 Atualizando estrutura de senadores atuais');
      await perfilSenadoresLoader.saveSenadoresAtuais(
        senadoresTransformados,
        perfisTransformados,
        legislaturaAtual
      );
    }
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await perfilSenadoresLoader.saveHistorico(perfisTransformados, legislaturaAtual);
    
    // 4.A Exportar histórico
    logger.info('4.A Exportando histórico para arquivos JSON');
    await perfilSenadoresExporter.exportHistorico(perfisTransformados, legislaturaAtual);
    
    logger.info('Histórico salvo com sucesso');
    
    logger.info('=== Processamento de perfis de senadores concluído com sucesso ===');
    logger.info('NOTA: Os dados foram exportados para a pasta "exports" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarPerfilSenadores');
    throw error;
  }
}

/**
 * Processar perfis de senadores de uma lista específica de legislaturas
 * @param legislaturas - Lista de números de legislaturas para processar
 */
async function processarPerfilSenadoresMultiplasLegislaturas(legislaturas: number[]): Promise<void> {
  try {
    logger.info(`=== Iniciando processamento de perfis para ${legislaturas.length} legislaturas ===`);
    
    // Ordenar legislaturas (mais recentes primeiro)
    const legislaturasOrdenadas = [...legislaturas].sort((a, b) => b - a);
    
    for (const [index, legislatura] of legislaturasOrdenadas.entries()) {
      logger.info(`Processando legislatura ${legislatura} (${index + 1}/${legislaturasOrdenadas.length})`);
      
      try {
        await processarPerfilSenadores(legislatura);
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
    
    logger.info('=== Processamento de múltiplas legislaturas concluído ===');
  } catch (error: any) {
    handleError(error, 'processarPerfilSenadoresMultiplasLegislaturas');
    throw error;
  }
}

/**
 * Função para processar a legislatura específica de linha de comando
 */
function processarLegislaturaEspecifica(): void {
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportarDados = false;
  let limiteSenadores: number | undefined = undefined;
  
  // Analisar argumentos
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--exportar' || arg === '-e') {
      exportarDados = true;
    } else if (arg === '--limite' || arg === '-l') {
      const limite = parseInt(args[++i], 10);
      if (!isNaN(limite) && limite > 0) {
        limiteSenadores = limite;
        logger.info(`Configurado limite de ${limiteSenadores} senadores para processamento`);
      } else {
        logger.warn(`Limite inválido: ${args[i]}. Deve ser um número positivo.`);
      }
    } else if (i === 0 && !isNaN(parseInt(arg, 10))) {
      // Primeiro argumento numérico é tratado como legislatura
      const legislaturaArg = parseInt(arg, 10);
      if (legislaturaArg > 0 && legislaturaArg <= 58) {
        legislatura = legislaturaArg;
      } else {
        logger.error(`Legislatura inválida: ${arg}. Deve ser um número entre 1 e 58.`);
        process.exit(1);
      }
    }
  }
  
  // Se o usuário solicitou exportação, redirecionar para o processamento integrado
  if (exportarDados) {
    logger.info('Redirecionando para o processamento com exportação avançada...');
    
    // Importar dinamicamente para evitar dependências circulares
    import('./processar_perfilsenadores_export').then(({ processarPerfilSenadoresComExportacao }) => {
      // Configurar opções padrão de exportação
      const opcoesExportacao = {
        exportar: true,
        legislatura,
        limiteSenadores,
        opcoesExportacao: {
          formato: 'ambos' as 'ambos' | 'json' | 'csv',
          comprimir: false,
          nivelDetalhamento: 'ambos' as 'ambos' | 'completo' | 'resumido',
          caminhoBase: 'senadores_exportados'
        }
      };
      
      // Chamar o processamento integrado
      processarPerfilSenadoresComExportacao(opcoesExportacao)
        .then(() => {
          logger.info('Processamento com exportação concluído com sucesso.');
          process.exit(0);
        })
        .catch(error => {
          logger.error('Falha no processamento com exportação', error);
          process.exit(1);
        });
    });
  } else {
    // Processar legislatura específica ou atual sem exportação avançada
    processarPerfilSenadores(legislatura)
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

// Função auxiliar para exportar diretamente para JSON 
// (para uso interno, sem precisar expor a dependência completa)
async function exportToJSON(data: any, filePath: string): Promise<void> {
  const { exportToJson } = require('./utils/file_exporter');
  exportToJson(data, filePath);
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecifica();
}

export { processarPerfilSenadores, processarPerfilSenadoresMultiplasLegislaturas };
