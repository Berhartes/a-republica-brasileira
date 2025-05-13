/**
 * Script para processar dados da legislatura do Senado e exportar para diferentes formatos
 * Este script integra os módulos de extração de dados da API do Senado e exportação nos formatos especificados
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { obterLegislaturaAtual } from './utils/legislatura';
import { legislaturaExporter } from './exportacao/legislatura';
import { OpcoesExportacao, exportarDados } from './utils/exportacao_avanc';

/**
 * Interface para opções de processamento
 */
interface OpcoesProcessamento {
  data?: string; // Data no formato YYYYMMDD para obter legislatura específica
  exportar: boolean;
  opcoesExportacao: OpcoesExportacao;
}

/**
 * Função para processar o fluxo completo da legislatura com exportação automática
 * @param opcoes - Opções de processamento
 */
async function processarLegislaturaComExportacao(opcoes: OpcoesProcessamento): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de legislatura com exportação ===');
    
    // Registrar tempo de início para cálculo de estatísticas
    const tempoInicio = Date.now();
    
    // 1. Extração
    logger.info('1. Iniciando etapa de extração');
    const dadosLegislatura = await obterLegislaturaAtual(opcoes.data);
    
    if (!dadosLegislatura) {
      throw new Error('Não foi possível obter dados da legislatura.');
    }
    
    const numeroLegislatura = parseInt(dadosLegislatura.NumeroLegislatura, 10);
    logger.info(`Legislatura extraída: ${numeroLegislatura} (${dadosLegislatura.DataInicio} a ${dadosLegislatura.DataFim})`);
    
    // 2. Exportação dos dados raw
    logger.info('2. Exportando dados brutos da legislatura para arquivos JSON');
    await legislaturaExporter.exportLegislatura(dadosLegislatura);
    
    // 3. Exportação dos dados detalhados
    logger.info('3. Exportando detalhes da legislatura');
    await legislaturaExporter.exportLegislaturaDetalhada(dadosLegislatura);
    
    // 4. Exportação do histórico
    logger.info('4. Exportando histórico da legislatura');
    await legislaturaExporter.exportHistorico(dadosLegislatura);
    
    // 5. Exportação avançada (com opções de formato)
    if (opcoes.exportar) {
      logger.info('5. Iniciando etapa de exportação avançada');
      
      // Preparar dados para exportação
      // Como a legislatura é um único objeto e não um array,
      // criamos um array com as sessões legislativas para exportar no formato tabular
      let dadosParaExportar = [];
      
      if (dadosLegislatura.SessoesLegislativas) {
        const sessoes = dadosLegislatura.SessoesLegislativas.SessaoLegislativa;
        
        if (Array.isArray(sessoes)) {
          dadosParaExportar = sessoes.map(sessao => ({
            numeroLegislatura: dadosLegislatura.NumeroLegislatura,
            dataInicioLegislatura: dadosLegislatura.DataInicio,
            dataFimLegislatura: dadosLegislatura.DataFim,
            numeroSessao: sessao.NumeroSessaoLegislativa,
            tipoSessao: sessao.TipoSessaoLegislativa,
            dataInicioSessao: sessao.DataInicio,
            dataFimSessao: sessao.DataFim,
            dataInicioIntervalo: sessao.DataInicioIntervalo || null,
            dataFimIntervalo: sessao.DataFimIntervalo || null
          }));
        } else {
          dadosParaExportar = [{
            numeroLegislatura: dadosLegislatura.NumeroLegislatura,
            dataInicioLegislatura: dadosLegislatura.DataInicio,
            dataFimLegislatura: dadosLegislatura.DataFim,
            numeroSessao: sessoes.NumeroSessaoLegislativa,
            tipoSessao: sessoes.TipoSessaoLegislativa,
            dataInicioSessao: sessoes.DataInicio,
            dataFimSessao: sessoes.DataFim,
            dataInicioIntervalo: sessoes.DataInicioIntervalo || null,
            dataFimIntervalo: sessoes.DataFimIntervalo || null
          }];
        }
      } else {
        // Se não houver sessões, exportar apenas os dados básicos da legislatura
        dadosParaExportar = [{
          numeroLegislatura: dadosLegislatura.NumeroLegislatura,
          dataInicioLegislatura: dadosLegislatura.DataInicio,
          dataFimLegislatura: dadosLegislatura.DataFim
        }];
      }
      
      await exportarDados(dadosParaExportar, numeroLegislatura, opcoes.opcoesExportacao, tempoInicio);
      logger.info('Exportação avançada concluída com sucesso');
    } else {
      logger.info('Exportação avançada desativada pelas opções de linha de comando');
    }
    
    const tempoTotal = (Date.now() - tempoInicio) / 1000; // em segundos
    logger.info(`=== Processamento de legislatura concluído com sucesso em ${tempoTotal.toFixed(2)}s ===`);
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarLegislaturaComExportacao');
    throw error;
  }
}

/**
 * Função para processar a legislatura com opções de exportação definidas pela linha de comando
 */
function processarLegislaturaComExportacaoComandos(): void {
  const args = process.argv.slice(2);
  let data: string | undefined;
  let exportar: boolean = false;
  
  // Opções de exportação com valores padrão
  const opcoesExportacao: OpcoesExportacao = {
    formato: 'ambos',
    comprimir: false,
    nivelDetalhamento: 'ambos',
    caminhoBase: 'legislatura_exportada'
  };
  
  // Processar argumentos de linha de comando
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--data' || arg === '-d') {
      data = args[++i];
      // Validar formato da data YYYYMMDD
      if (!/^\d{8}$/.test(data)) {
        logger.warn(`Formato de data inválido: ${data}. Use o formato YYYYMMDD.`);
        data = undefined;
      }
    } else if (arg === '--exportar' || arg === '-e') {
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
    } else if (arg === '--detalhamento' || arg === '-t') {
      const detalhamento = args[++i];
      if (detalhamento === 'completo' || detalhamento === 'resumido' || detalhamento === 'ambos') {
        opcoesExportacao.nivelDetalhamento = detalhamento as 'completo' | 'resumido' | 'ambos';
      } else {
        logger.warn(`Nível de detalhamento inválido: ${detalhamento}. Usando padrão 'ambos'.`);
      }
    } else if (arg === '--caminho' || arg === '-p') {
      opcoesExportacao.caminhoBase = args[++i];
    }
  }
  
  logger.info(`Configuração: Data=${data || 'atual'}, Exportar=${exportar}, Formato=${opcoesExportacao.formato}, Comprimir=${opcoesExportacao.comprimir}, Detalhamento=${opcoesExportacao.nivelDetalhamento}, Caminho=${opcoesExportacao.caminhoBase}`);
  
  // Processar legislatura com exportação
  processarLegislaturaComExportacao({
    data,
    exportar,
    opcoesExportacao
  })
    .then(() => {
      logger.info('Processamento completo concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de legislatura com exportação', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaComExportacaoComandos();
}

export { processarLegislaturaComExportacao };
