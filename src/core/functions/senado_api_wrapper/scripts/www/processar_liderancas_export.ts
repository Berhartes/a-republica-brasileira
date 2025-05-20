import * as path from 'path';

/**
 * Script para processar lideranças parlamentares (extração, transformação, carregamento e exportação)
 * Este script integra os módulos de extração de dados da API do Senado e exportação nos formatos especificados
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { liderancaExtractor } from './extracao/liderancas';
import { liderancaTransformer } from './transformacao/liderancas';
import { liderancaLoader } from './carregamento/liderancas';
import { liderancasExporter } from './exportacao/liderancas';
import { obterNumeroLegislaturaAtual } from './utils/legislatura';
import { OpcoesExportacao, exportarDados } from './utils/exportacao_avanc';

/**
 * Interface para opções de processamento
 */
interface OpcoesProcessamento {
  legislatura?: number;
  exportar: boolean;
  opcoesExportacao: OpcoesExportacao;
  limiteLiderancas?: number; // Limite de lideranças a processar (para testes)
}

/**
 * Função para processar o fluxo completo de lideranças parlamentares com exportação automática
 * @param opcoes - Opções de processamento
 */
async function processarLiderancasComExportacao(opcoes: OpcoesProcessamento): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de lideranças parlamentares com exportação ===');
    
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
    const dadosExtraidos = await liderancaExtractor.extractAll();
    logger.info(`Extração concluída: dados de lideranças e referências extraídos`);
    
    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');
    const dadosTransformados = liderancaTransformer.transformLiderancas(dadosExtraidos);
    
    // Aplicar limite de lideranças se definido (para testes rápidos)
    if (opcoes.limiteLiderancas && opcoes.limiteLiderancas > 0 && 
        opcoes.limiteLiderancas < dadosTransformados.liderancas.itens.length) {
      logger.info(`Aplicando limite de ${opcoes.limiteLiderancas} lideranças para teste rápido`);
      dadosTransformados.liderancas.itens = dadosTransformados.liderancas.itens.slice(0, opcoes.limiteLiderancas);
      dadosTransformados.liderancas.total = dadosTransformados.liderancas.itens.length;
    }
    
    const totalMembros = dadosTransformados.liderancas.itens.reduce(
      (total: number, lideranca: any) => total + (lideranca.membros?.length || 0), 0
    );
    
    logger.info(`Transformação concluída: ${dadosTransformados.liderancas.itens.length} lideranças com ${totalMembros} membros transformados`);
    
    // 2.1.A Exportar dados transformados para arquivos locais para análise
    logger.info('2.1.A Exportando lideranças transformadas para arquivos JSON');
    await liderancasExporter.exportLiderancas(dadosTransformados, legislaturaAtual);
    
    // 2.1.B Exportar tabelas de referência
    logger.info('2.1.B Exportando tabelas de referência');
    await liderancasExporter.exportReferencias(dadosTransformados.referencias);
    
    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');
    const resultadoCarregamento = await liderancaLoader.saveLiderancas(dadosTransformados, legislaturaAtual);
    logger.info(`Carregamento concluído: ${resultadoCarregamento.totalLiderancas} lideranças parlamentares salvas no Firestore`);
    
    // 4. Histórico
    logger.info('4. Salvando histórico');
    await liderancaLoader.saveLiderancasHistorico(dadosTransformados, legislaturaAtual);
    logger.info('Histórico salvo com sucesso');
    
    // 4.A Exportar histórico
    logger.info('4.A Exportando histórico para arquivos JSON');
    await liderancasExporter.exportHistorico(dadosTransformados, legislaturaAtual);
    
    // 5. Exportação detalhada
    logger.info('5. Exportando lideranças detalhadas');
    await liderancasExporter.exportLiderancasDetalhadas(dadosTransformados, legislaturaAtual);
    
    // 5.A Exportar membros em CSV
    logger.info('5.A Exportando membros de lideranças em CSV');
    await liderancasExporter.exportMembrosCSV(dadosTransformados.liderancas, legislaturaAtual);
    
    // 5.B Exportações específicas por tipo
    logger.info('5.B Exportando lideranças filtradas por tipo');
    await liderancasExporter.exportLiderancasFiltradas(
      dadosTransformados.liderancas, 
      'liderancas_maioria', 
      'Maioria'
    );
    
    await liderancasExporter.exportLiderancasFiltradas(
      dadosTransformados.liderancas, 
      'liderancas_minoria', 
      'Minoria'
    );
    
    await liderancasExporter.exportLiderancasFiltradas(
      dadosTransformados.liderancas, 
      'liderancas_governo', 
      'Governo'
    );
    
    // 6. Exportação avançada (nova etapa)
    if (opcoes.exportar) {
      logger.info('6. Iniciando etapa de exportação avançada');
      
      // Preparar dados para exportação avançada - extraindo todos os membros
      const todosMembros: any[] = [];
      
      for (const lideranca of dadosTransformados.liderancas.itens) {
        if (lideranca.membros) {
          for (const membro of lideranca.membros) {
            todosMembros.push({
              ...membro,
              tipoLideranca: lideranca.tipo?.descricao || '',
              nomeLideranca: lideranca.nome,
              siglaLideranca: lideranca.sigla || ''
            });
          }
        }
      }
      
      // Verificar se o array não está vazio antes de chamar exportarDados
      if (todosMembros.length > 0) {
        await exportarDados(todosMembros, legislaturaAtual, opcoes.opcoesExportacao, tempoInicio);
      } else {
        logger.info('Pulando exportação avançada: não há membros para exportar');
        
        // Exportar um resumo básico para não falhar o processo
        const resumoExportacao = {
          timestamp: new Date().toISOString(),
          legislatura: legislaturaAtual,
          status: 'success',
          mensagem: 'Nenhum membro encontrado nas lideranças',
          tempoProcessamento: (Date.now() - tempoInicio) / 1000
        };
        
        // Criar diretório para o resumo
        const fs = require('fs');
        const { mkdir, writeFile } = require('fs/promises');
        const estatisticasDir = path.join(process.cwd(), 'dados_extraidos', opcoes.opcoesExportacao.caminhoBase || 'liderancas_exportadas', 'senadores', `legislatura_${legislaturaAtual}`, new Date().toISOString().split('T')[0], 'estatisticas');
        
        try {
          await mkdir(estatisticasDir, { recursive: true });
          await writeFile(path.join(estatisticasDir, 'resumo.json'), JSON.stringify(resumoExportacao, null, 2));
          logger.info(`Resumo básico exportado para ${estatisticasDir}/resumo.json`);
        } catch (error: any) {
          logger.warn(`Não foi possível salvar o resumo básico: ${error.message}`);
        }
      }
      logger.info('Exportação avançada concluída com sucesso');
    } else {
      logger.info('Exportação avançada desativada pelas opções de linha de comando');
    }
    
    const tempoTotal = (Date.now() - tempoInicio) / 1000; // em segundos
    logger.info(`=== Processamento de lideranças parlamentares concluído com sucesso em ${tempoTotal.toFixed(2)}s ===`);
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarLiderancasComExportacao');
    throw error;
  }
}

/**
 * Função para processar lideranças com opções de exportação definidas pela linha de comando
 */
function processarLiderancasComExportacaoComandos(): void {
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportar: boolean = false;
  let limiteLiderancas: number | undefined = undefined;
  
  // Opções de exportação com valores padrão
  const opcoesExportacao: OpcoesExportacao = {
    formato: 'ambos',
    comprimir: false,
    nivelDetalhamento: 'ambos',
    caminhoBase: 'liderancas_exportadas'
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
        limiteLiderancas = limite;
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
  
  logger.info(`Configuração: Legislatura=${legislatura || 'atual'}, Exportar=${exportar}, Formato=${opcoesExportacao.formato}, Comprimir=${opcoesExportacao.comprimir}, Detalhamento=${opcoesExportacao.nivelDetalhamento}, Caminho=${opcoesExportacao.caminhoBase}${limiteLiderancas ? `, Limite=${limiteLiderancas} lideranças` : ''}`);
  
  // Processar legislatura específica ou atual com exportação
  processarLiderancasComExportacao({
    legislatura,
    exportar,
    opcoesExportacao,
    limiteLiderancas
  })
    .then(() => {
      logger.info('Processamento completo concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de lideranças com exportação', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLiderancasComExportacaoComandos();
}

export { processarLiderancasComExportacao };
