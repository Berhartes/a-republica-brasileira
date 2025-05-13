/**
 * Script para processar senadores em exercício (extração, transformação, carregamento e exportação)
 * Este script integra os módulos de extração de dados da API do Senado e exportação nos formatos especificados
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { senadoresExtractor } from './extracao/senadores';
import { senadoresTransformer } from './transformacao/senadores';
import { senadoresLoader } from './carregamento/senadores';
import { senadoresExporter } from './exportacao/senadores';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';
import { OpcoesExportacao, exportarDados } from './utils/exportacao_avanc';

/**
 * Interface para opções de processamento
 */
interface OpcoesProcessamento {
  legislatura?: number;
  exportar: boolean;
  opcoesExportacao: OpcoesExportacao;
  limiteSenadores?: number; // Limite de senadores a processar (para testes)
}

/**
 * Função para processar o fluxo completo de senadores em exercício com exportação automática
 * @param opcoes - Opções de processamento
 */
async function processarSenadoresComExportacao(opcoes: OpcoesProcessamento): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de senadores em exercício com exportação ===');
    
    // Registrar tempo de início para cálculo de estatísticas
    const tempoInicio = Date.now();
    
    // 0. Obter legislatura atual ou usar a especificada
    logger.info('0. Obtendo informações da legislatura');
    let legislaturaAtual: number;
    
    if (opcoes.legislatura) {
      // Usar legislatura específica se fornecida
      logger.info(`Usando legislatura específica: ${opcoes.legislatura}`);
      legislaturaAtual = opcoes.legislatura;
    } else {
      // Obter legislatura atual
      const legislatura = await obterNumeroLegislaturaAtual();
      
      if (!legislatura) {
        throw new Error('Não foi possível obter a legislatura atual. O processamento será abortado.');
      }
      
      legislaturaAtual = legislatura;
      logger.info(`Legislatura atual: ${legislaturaAtual}`);
    }
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosExtraidos = await senadoresExtractor.extractSenadoresAtuais();
    logger.info(`Extração concluída: ${dadosExtraidos.senadores.length} senadores extraídos`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = senadoresTransformer.transformSenadoresAtuais(dadosExtraidos);
    
    // Aplicar limite de senadores se definido (para testes rápidos)
    if (opcoes.limiteSenadores && opcoes.limiteSenadores > 0 && opcoes.limiteSenadores < dadosTransformados.senadores.length) {
      logger.info(`Aplicando limite de ${opcoes.limiteSenadores} senadores para teste rápido`);
      dadosTransformados.senadores = dadosTransformados.senadores.slice(0, opcoes.limiteSenadores);
    }
    
    logger.info(`Transformação concluída: ${dadosTransformados.senadores.length} senadores transformados`);
    
    // 2.1.A Exportar dados transformados para arquivos locais para análise
    logger.info('2.1.A Exportando senadores transformados para arquivos JSON');
    await senadoresExporter.exportSenadores(dadosTransformados, legislaturaAtual);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await senadoresLoader.saveSenadoresAtuais(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} senadores salvos no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await senadoresLoader.saveSenadoresHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    // 4.A Exportar histórico
    logger.info('4.A Exportando histórico para arquivos JSON');
    await senadoresExporter.exportHistorico(dadosTransformados, legislaturaAtual);
    
    // 5. Exportação avançada (nova etapa)
    if (opcoes.exportar) {
      logger.info('5. Iniciando etapa de exportação avançada');
      await exportarDados(dadosTransformados.senadores, legislaturaAtual, opcoes.opcoesExportacao, tempoInicio);
      logger.info('Exportação avançada concluída com sucesso');
    } else {
      logger.info('Exportação avançada desativada pelas opções de linha de comando');
    }
    
    const tempoTotal = (Date.now() - tempoInicio) / 1000; // em segundos
    logger.info(`=== Processamento de senadores em exercício concluído com sucesso em ${tempoTotal.toFixed(2)}s ===`);
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarSenadoresComExportacao');
    throw error;
  }
}

/**
 * Função para processar os senadores com opções de exportação definidas pela linha de comando
 */
function processarSenadoresComExportacaoComandos(): void {
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportar: boolean = false;
  let limiteSenadores: number | undefined = undefined;
  
  // Opções de exportação com valores padrão
  const opcoesExportacao: OpcoesExportacao = {
    formato: 'ambos',
    comprimir: false,
    nivelDetalhamento: 'ambos',
    caminhoBase: 'senadores_exportados'
  };
  
  // Processar argumentos de linha de comando
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--exportar' || arg === '-e') {
      exportar = true;
    } else if (arg === '--formato' || arg === '-f') {
      const formato = args[++i];
      if (formato === 'json' || formato === 'csv' || formato === 'ambos') {
        opcoesExportacao.formato = formato as 'json' | 'csv' | 'ambos';
      } else {
        logger.warn(`Formato inválido: ${formato}. Usando padrão 'ambos'.`);
      }
    } else if (arg === '--comprimir' || arg === '-c') {
      opcoesExportacao.comprimir = true;
    } else if (arg === '--detalhamento' || arg === '-d') {
      const detalhamento = args[++i];
      if (detalhamento === 'completo' || detalhamento === 'resumido' || detalhamento === 'ambos') {
        opcoesExportacao.nivelDetalhamento = detalhamento as 'completo' | 'resumido' | 'ambos';
      } else {
        logger.warn(`Nível de detalhamento inválido: ${detalhamento}. Usando padrão 'ambos'.`);
      }
    } else if (arg === '--caminho' || arg === '-p') {
      opcoesExportacao.caminhoBase = args[++i];
    } else if (arg === '--limite' || arg === '-l') {
      const limite = parseInt(args[++i], 10);
      if (!isNaN(limite) && limite > 0) {
        limiteSenadores = limite;
      } else {
        logger.warn(`Limite inválido: ${args[i]}. Deve ser um número positivo.`);
      }
    } else if (i === 0 && !isNaN(parseInt(arg, 10))) {
      // Assume que o primeiro argumento numérico é a legislatura
      const legislaturaArg = parseInt(arg, 10);
      if (legislaturaArg > 0 && legislaturaArg <= 58) {
        legislatura = legislaturaArg;
      } else {
        logger.error(`Legislatura inválida: ${arg}. Deve ser um número entre 1 e 58.`);
        process.exit(1);
      }
    }
  }
  
  logger.info(`Configuração: Legislatura=${legislatura || 'atual'}, Exportar=${exportar}, Formato=${opcoesExportacao.formato}, Comprimir=${opcoesExportacao.comprimir}, Detalhamento=${opcoesExportacao.nivelDetalhamento}, Caminho=${opcoesExportacao.caminhoBase}${limiteSenadores ? `, Limite=${limiteSenadores} senadores` : ''}`);
  
  // Processar legislatura específica ou atual com exportação
  processarSenadoresComExportacao({
    legislatura,
    exportar,
    opcoesExportacao,
    limiteSenadores
  })
    .then(() => {
      logger.info('Processamento completo concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de senadores com exportação', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarSenadoresComExportacaoComandos();
}

export { processarSenadoresComExportacao };
