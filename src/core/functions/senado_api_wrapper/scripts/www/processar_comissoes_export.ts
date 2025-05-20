/**
 * Script para processar comissões do Senado (extração, transformação, carregamento e exportação)
 * Este script integra os módulos de extração de dados da API do Senado e exportação nos formatos especificados
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { comissaoExtractor } from './extracao/comissoes';
import { comissoesTransformer } from './transformacao/comissoes';
import { comissaoLoader } from './carregamento/comissoes';
import { comissoesExporter } from './exportacao/comissoes';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';
import { OpcoesExportacao, exportarDados } from './utils/exportacao_avanc';

/**
 * Interface para opções de processamento
 */
interface OpcoesProcessamento {
  legislatura?: number;
  exportar: boolean;
  opcoesExportacao: OpcoesExportacao;
  limiteComissoes?: number; // Limite de comissões a processar (para testes)
}

/**
 * Função para processar o fluxo completo de comissões com exportação automática
 * @param opcoes - Opções de processamento
 */
async function processarComissoesComExportacao(opcoes: OpcoesProcessamento): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de comissões do Senado com exportação ===');
    
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
    const dadosExtraidos = await comissaoExtractor.extractAll();
    logger.info(`Extração concluída: ${dadosExtraidos.lista?.total || 0} comissões extraídas`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    // Adaptar os dados para o formato esperado pelo transformador
    const dadosParaTransformar = {
      timestamp: new Date().toISOString(),
      lista: dadosExtraidos.lista,
      detalhes: dadosExtraidos.detalhes,
      composicoes: dadosExtraidos.composicoes,
      tipos: dadosExtraidos.tipos
    };
    
    const dadosTransformados = comissoesTransformer.transformComissoes(dadosParaTransformar);
    
    // Criar array plano de todas as comissões para facilitar a exportação
    const comissoesPlanas: any[] = [];
    
    // Adicionar comissões do Senado
    Object.values(dadosTransformados.comissoes.senado).forEach(comissoesArray => {
      if (Array.isArray(comissoesArray)) {
        comissoesPlanas.push(...comissoesArray);
      }
    });
    
    // Adicionar comissões do Congresso
    Object.values(dadosTransformados.comissoes.congresso).forEach(comissoesArray => {
      if (Array.isArray(comissoesArray)) {
        comissoesPlanas.push(...comissoesArray);
      }
    });
    
    logger.info(`Total de comissões planas: ${comissoesPlanas.length}`);
    
    // Aplicar limite de comissões se definido (para testes rápidos)
    if (opcoes.limiteComissoes && opcoes.limiteComissoes > 0 && opcoes.limiteComissoes < comissoesPlanas.length) {
      logger.info(`Aplicando limite de ${opcoes.limiteComissoes} comissões para teste rápido`);
      comissoesPlanas.splice(opcoes.limiteComissoes);
    }
    
    logger.info(`Transformação concluída: ${dadosTransformados.total} comissões transformadas`);
    
    // 2.1.A Exportar dados transformados para arquivos locais para análise
    logger.info('2.1.A Exportando comissões transformadas para arquivos JSON');
    await comissoesExporter.exportComissoes(dadosTransformados, legislaturaAtual);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await comissaoLoader.saveComissoes(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalSalvos} novas comissões e ${resultadoCarregamento.totalAtualizados} atualizadas no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await comissaoLoader.saveComissoesHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    // 4.A Exportar histórico
    logger.info('4.A Exportando histórico para arquivos JSON');
    await comissoesExporter.exportHistorico(dadosTransformados, legislaturaAtual);
    
    // 5. Exportação avançada (nova etapa)
    if (opcoes.exportar) {
      logger.info('5. Iniciando etapa de exportação avançada');
      await exportarDados(comissoesPlanas, legislaturaAtual, opcoes.opcoesExportacao, tempoInicio);
      logger.info('Exportação avançada concluída com sucesso');
    } else {
      logger.info('Exportação avançada desativada pelas opções de linha de comando');
    }
    
    const tempoTotal = (Date.now() - tempoInicio) / 1000; // em segundos
    logger.info(`=== Processamento de comissões concluído com sucesso em ${tempoTotal.toFixed(2)}s ===`);
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarComissoesComExportacao');
    throw error;
  }
}

/**
 * Função para processar a comissões com opções de exportação definidas pela linha de comando
 */
function processarComissoesComExportacaoComandos(): void {
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportar: boolean = false;
  let limiteComissoes: number | undefined = undefined;
  
  // Opções de exportação com valores padrão
  const opcoesExportacao: OpcoesExportacao = {
    formato: 'ambos',
    comprimir: false,
    nivelDetalhamento: 'ambos',
    caminhoBase: 'comissoes_exportadas'
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
        limiteComissoes = limite;
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
  
  logger.info(`Configuração: Legislatura=${legislatura || 'atual'}, Exportar=${exportar}, Formato=${opcoesExportacao.formato}, Comprimir=${opcoesExportacao.comprimir}, Detalhamento=${opcoesExportacao.nivelDetalhamento}, Caminho=${opcoesExportacao.caminhoBase}${limiteComissoes ? `, Limite=${limiteComissoes} comissões` : ''}`);
  
  // Processar legislatura específica ou atual com exportação
  processarComissoesComExportacao({
    legislatura,
    exportar,
    opcoesExportacao,
    limiteComissoes
  })
    .then(() => {
      logger.info('Processamento completo concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de comissões com exportação', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarComissoesComExportacaoComandos();
}

export { processarComissoesComExportacao };
