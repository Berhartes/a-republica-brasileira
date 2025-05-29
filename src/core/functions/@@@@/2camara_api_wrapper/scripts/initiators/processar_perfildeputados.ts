/**
 * Script para processamento de perfis de deputados
 * Este script implementa o fluxo ETL completo para perfis de deputados:
 * 1. Extração de dados da API da Câmara dos Deputados
 * 2. Transformação dos dados para o formato padronizado
 * 3. Carregamento dos dados no Firestore
 */
import { logger } from '../utils/logger';
import { PerfilDeputadosExtractor } from '../extracao/perfildeputados';
import { PerfilDeputadosTransformer } from '../transformacao/perfildeputados';
import { PerfilDeputadosLoader } from '../carregamento/perfildeputados';
import { parseArgs, CommandOptions } from '../utils/args_parser';

// Configurações padrão
const LEGISLATURA_ATUAL = 57; // 57ª Legislatura (2023-2027)
const LIMITE_PADRAO = 0; // 0 = sem limite

/**
 * Detecta e valida a legislatura a partir dos argumentos da linha de comando
 * Suporta múltiplos formatos: --57, --56, --55, 57, --legislatura 57
 * @param args - Argumentos parseados
 * @returns Número da legislatura validado
 */
function detectarLegislatura(args: CommandOptions): number {
  let legislatura = LEGISLATURA_ATUAL; // Padrão: 57
  
  // Método 1: Detectar argumentos numéricos com hífen (ex: --57, --56, --55)
  // Este é o método principal usado no script do senado
  for (const arg of process.argv) {
    const match = arg.match(/^--?(\d+)$/);
    if (match) {
      const numLegislatura = parseInt(match[1], 10);
      
      // Validar range específico para Câmara dos Deputados
      if (numLegislatura >= 50 && numLegislatura <= 60) { 
        legislatura = numLegislatura;
        logger.info(`🏛️ Legislatura detectada via argumento numérico (--${legislatura}): ${legislatura}ª Legislatura`);
        return legislatura;
      } else if (numLegislatura >= 1 && numLegislatura <= 100) {
        // Range mais amplo mas com aviso (para compatibilidade histórica)
        logger.warn(`⚠️ Legislatura ${numLegislatura} fora do range comum (50-60), mas será aceita`);
        legislatura = numLegislatura;
        logger.info(`🏛️ Legislatura detectada via argumento numérico (--${legislatura}): ${legislatura}ª Legislatura`);
        return legislatura;
      } else {
        logger.error(`❌ Legislatura inválida: ${numLegislatura}. Para a Câmara dos Deputados, use valores entre 50 e 60.`);
        process.exit(1);
      }
    }
  }
  
  // Método 2: Usar parâmetro --legislatura tradicional
  if (args.legislatura !== undefined) {
    const legislaturaArg = parseInt(args.legislatura, 10);
    if (legislaturaArg >= 1 && legislaturaArg <= 100) {
      legislatura = legislaturaArg;
      logger.info(`🏛️ Legislatura detectada via parâmetro --legislatura: ${legislatura}ª Legislatura`);
      return legislatura;
    } else {
      logger.error(`❌ Legislatura inválida: ${args.legislatura}. Deve ser um número entre 1 e 100.`);
      process.exit(1);
    }
  }
  
  // Método 3: Primeiro argumento numérico (compatibilidade)
  const primeiroArg = process.argv[2];
  if (primeiroArg && !primeiroArg.startsWith('-') && !isNaN(parseInt(primeiroArg, 10))) {
    const legislaturaArg = parseInt(primeiroArg, 10);
    if (legislaturaArg >= 1 && legislaturaArg <= 100) {
      legislatura = legislaturaArg;
      logger.info(`🏛️ Legislatura detectada via primeiro argumento: ${legislatura}ª Legislatura`);
      return legislatura;
    } else {
      logger.error(`❌ Legislatura inválida: ${legislaturaArg}. Deve ser um número entre 1 e 100.`);
      process.exit(1);
    }
  }
  
  // Se chegou aqui, usar legislatura padrão
  logger.info(`🏛️ Usando legislatura padrão: ${legislatura}ª Legislatura (${LEGISLATURA_ATUAL})`);
  return legislatura;
}

/**
 * Função principal para processamento de perfis de deputados
 */
async function processarPerfilDeputados() {
  try {
    // Obter argumentos da linha de comando
    const args = parseArgs();
    const limite = args.limite !== undefined ? parseInt(args.limite, 10) : LIMITE_PADRAO;
    const legislatura = detectarLegislatura(args);
    const concorrencia = args.concorrencia !== undefined ? parseInt(args.concorrencia, 10) : 3;

    logger.info(`Iniciando processamento de perfis de deputados da legislatura ${legislatura}`);
    logger.info(`Configurações: limite=${limite}, concorrência=${concorrencia}`);
    logger.info(`📋 Processamento de perfis completos de deputados da ${legislatura}ª Legislatura`);

    // Inicializar componentes ETL
    const extractor = new PerfilDeputadosExtractor();
    const transformer = new PerfilDeputadosTransformer();
    const loader = new PerfilDeputadosLoader();

    // 1. Extrair lista de deputados da legislatura
    logger.info('Etapa 1: Extraindo lista de deputados');
    const listaDeputados = await extractor.extractDeputadosLegislatura(legislatura);

    if (!listaDeputados.deputados || listaDeputados.deputados.length === 0) {
      logger.error(`Nenhum deputado encontrado para a legislatura ${legislatura}`);
      return;
    }

    logger.info(`Encontrados ${listaDeputados.deputados.length} deputados na legislatura ${legislatura}`);

    // Aplicar limite se especificado
    let deputadosParaProcessar = listaDeputados.deputados;
    if (limite > 0 && limite < deputadosParaProcessar.length) {
      logger.info(`Aplicando limite de ${limite} deputados`);
      deputadosParaProcessar = deputadosParaProcessar.slice(0, limite);
    }

    // 2. Extrair perfis completos
    logger.info(`Etapa 2: Extraindo perfis completos de ${deputadosParaProcessar.length} deputados`);

    // Extrair apenas os IDs dos deputados
    const idsDeputados = deputadosParaProcessar.map(deputado => deputado.id);

    // Extrair perfis completos com concorrência controlada
    const perfisCompletos = await extractor.extractMultiplosPerfis(idsDeputados, concorrencia);

    logger.info(`Extraídos ${perfisCompletos.length} perfis completos`);

    // 3. Transformar perfis
    logger.info('Etapa 3: Transformando perfis');
    const perfisTransformados = perfisCompletos
      .map(perfil => transformer.transformPerfilCompleto(perfil))
      .filter((perfil): perfil is NonNullable<typeof perfil> => perfil !== null); // Remover nulos com type guard

    logger.info(`Transformados ${perfisTransformados.length} perfis`);

    // 4. Carregar perfis no Firestore seguindo a mesma metodologia dos senadores
    logger.info('Etapa 4: Carregando perfis no Firestore');

    // 4.1 Carregar lista de deputados da legislatura
    logger.info('4.1 Carregando lista básica de deputados');
    const resultadoLista = await loader.salvarDeputadosLegislatura(
      { deputados: perfisTransformados, legislatura: legislatura },
      legislatura
    );

    // 4.2 Carregar perfis completos
    logger.info('4.2 Carregando perfis completos dos deputados');
    const resultadoPerfis = await loader.saveMultiplosPerfis(
      perfisTransformados,
      legislatura
    );

    // 5. Resumo final
    const sucessos = resultadoPerfis.sucessos;
    const falhas = resultadoPerfis.falhas;

    logger.info('====================================================');
    logger.info(`📊 RESUMO DO PROCESSAMENTO DE PERFIS`);
    logger.info('====================================================');
    logger.info(`🏛️ Legislatura processada: ${legislatura}ª Legislatura`);
    logger.info(`✅ Deputados processados: ${perfisCompletos.length}`);
    logger.info(`🔄 Perfis transformados com sucesso: ${perfisTransformados.length}`);
    logger.info(`💾 Perfis carregados com sucesso: ${sucessos}`);
    logger.info(`❌ Falhas no carregamento: ${falhas}`);
    logger.info('====================================================');

    logger.info('Processamento de perfis de deputados concluído com sucesso');
  } catch (error: any) {
    logger.error(`Erro no processamento de perfis de deputados: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Executar função principal
processarPerfilDeputados().catch(error => {
  logger.error(`Erro fatal no processamento: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});
