/**
 * Script para processar perfis de senadores (extração, transformação, carregamento e exportação)
 * Este script integra os módulos de extração de dados da API do Senado e exportação nos formatos especificados
 */
import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { perfilSenadoresExtractor } from './extracao/perfilsenadores';
import { perfilSenadoresTransformer, SenadorCompletoTransformado } from './transformacao/perfilsenadores';
import { perfilSenadoresLoader } from './carregamento/perfilsenadores';
import { perfilSenadoresExporter } from './exportacao/perfilsenadores';
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
 * Função para processar o fluxo completo de perfis de senadores com exportação automática
 * @param opcoes - Opções de processamento
 */
async function processarPerfilSenadoresComExportacao(opcoes: OpcoesProcessamento): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de perfis completos de senadores com exportação ===');
    
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
    let codigosSenadores = senadoresTransformados.senadores
      .filter(s => s && s.codigo)
      .map(s => s.codigo);
    
    // Aplicar limite de senadores se definido
    if (opcoes.limiteSenadores && opcoes.limiteSenadores > 0 && opcoes.limiteSenadores < codigosSenadores.length) {
      logger.info(`Aplicando limite de ${opcoes.limiteSenadores} senadores para teste rápido`);
      codigosSenadores = codigosSenadores.slice(0, opcoes.limiteSenadores);
    }
    
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
    if (!opcoes.legislatura || opcoes.legislatura === legislaturaAtual) {
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
    
    // 5. Exportação avançada (nova etapa)
    if (opcoes.exportar) {
      logger.info('5. Iniciando etapa de exportação avançada');
      await exportarDados(perfisTransformados, legislaturaAtual, opcoes.opcoesExportacao, tempoInicio);
      logger.info('Exportação avançada concluída com sucesso');
    } else {
      logger.info('Exportação avançada desativada pelas opções de linha de comando');
    }
    
    const tempoTotal = (Date.now() - tempoInicio) / 1000; // em segundos
    logger.info(`=== Processamento de perfis de senadores concluído com sucesso em ${tempoTotal.toFixed(2)}s ===`);
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarPerfilSenadoresComExportacao');
    throw error;
  }
}

/**
 * Função para processar a legislatura específica de linha de comando com opções de exportação
 */
function processarLegislaturaEspecificaComExportacao(): void {
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
  processarPerfilSenadoresComExportacao({
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
      logger.error('Falha no processamento de perfis de senadores com exportação', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecificaComExportacao();
}

export { processarPerfilSenadoresComExportacao };
