/**
 * Script para processar perfis de senadores (extração, transformação e carregamento)
 *
 * Este script implementa um fluxo ETL (Extract, Transform, Load) completo para
 * extrair dados de perfis de senadores do Senado Federal, transformá-los em um
 * formato organizado e carregá-los no Firestore.
 *
 * Características principais:
 * - Extrai dados completos de perfis de senadores
 * - Transforma os dados em uma estrutura organizada
 * - Salva os dados no Firestore
 * - Suporta parâmetros como --limite, --legislatura e --pc
 * - Usa a estrutura organizada como padrão
 */
import { logger } from '../utils/logger';
import { handleError } from '../utils/error_handler';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer, SenadorCompletoTransformado } from '../transformacao/perfilsenadores';
import { perfilSenadoresLoader } from '../carregamento/perfilsenadores';
import { perfilSenadoresExporter } from '../exportacao/perfilsenadores';
import { obterNumeroLegislaturaAtual } from '../utils/legislatura';
import { exportarDadosFirestore, exportarDadosBrutos, exportarDadosAvancados } from '../utils/data_exporter';

/**
 * Função para processar o fluxo completo de perfis de senadores
 * @param legislaturaEspecifica - Número de legislatura específica para processamento (opcional)
 * @param salvarNoPC - Se verdadeiro, salva a estrutura exata do Firestore no PC local (opcional)
 * @param limiteSenadores - Limita o processamento a um número específico de senadores (opcional)
 */
async function processarPerfilSenadores(
  legislaturaEspecifica?: number,
  salvarNoPC: boolean = false,
  limiteSenadores?: number
): Promise<void> {
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
    let codigosSenadores = senadoresTransformados.senadores
      .filter(s => s && s.codigo)
      .map(s => s.codigo);

    // Aplicar limite de senadores se especificado
    if (limiteSenadores && limiteSenadores > 0 && limiteSenadores < codigosSenadores.length) {
      logger.info(`Aplicando limite de ${limiteSenadores} senadores (de um total de ${codigosSenadores.length})`);
      codigosSenadores = codigosSenadores.slice(0, limiteSenadores);
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
    await exportarDadosBrutos(perfisExtraidos, {
      caminhoBase: `senadores/extraidos`,
      timestamp: `perfis_extraidos_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}`
    });

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

    if (salvarNoPC) {
      // Se a flag --pc estiver ativa, exportar a estrutura exata que seria enviada para o Firestore
      logger.info('Flag --pc ativa: Salvando dados no PC local com a mesma estrutura do Firestore');

      // Criar função para preparar os dados no formato do Firestore
      const prepararDadosFirestore = () => {
        // Estrutura que simula o Firestore
        const estruturaFirestore: Record<string, any> = {};

        // 1. Preparar lista de senadores da legislatura
        const legislaturaRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaAtual}/senadores/lista`;
        estruturaFirestore[legislaturaRef] = {
          timestamp: new Date().toISOString(),
          legislatura: legislaturaAtual,
          total: senadoresTransformados.senadores.length,
          atualizadoEm: new Date().toISOString(),
          metadados: {}
        };

        // 2. Preparar dados individuais de cada senador na coleção da legislatura
        for (const senador of senadoresTransformados.senadores) {
          if (!senador || !senador.codigo) continue;

          const senadorRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaAtual}/senadores/${senador.codigo}`;
          estruturaFirestore[senadorRef] = {
            ...senador,
            perfilDisponivel: true,
            atualizadoEm: new Date().toISOString()
          };
        }

        // 3. Preparar perfis completos
        for (const perfil of perfisTransformados) {
          if (!perfil || !perfil.codigo) continue;

          const perfilRef = `congressoNacional/senadoFederal/perfis/${perfil.codigo}`;
          estruturaFirestore[perfilRef] = {
            ...perfil,
            atualizadoEm: new Date().toISOString()
          };
        }

        // 4. Não preparamos mais a estrutura de senadores atuais
        logger.info('Estrutura de senadores atuais não é mais implementada');

        return estruturaFirestore;
      };

      // Exportar dados no formato exato do Firestore usando a nova utilidade
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      // Usar a nova função de exportação para Firestore
      await exportarDadosFirestore(
        perfisTransformados,
        {
          salvarNoPC: true,
          caminhoBase: `senadores/perfis`,
          timestamp: `estrutura_firestore_${legislaturaAtual}_${timestamp}`
        },
        prepararDadosFirestore
      );
    } else {
      // Carregamento normal no Firestore

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

      // 3.3 Não implementamos mais informações na pasta "atual"
      logger.info('3.3 Pulando atualização da estrutura de senadores atuais (não mais implementada)');
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
        await processarPerfilSenadores(legislatura, false, undefined);
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
  // Função para exibir ajuda
  function exibirAjuda() {
    console.log(`
Uso: npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts [legislatura] [opções]

Argumentos:
  [legislatura]                Número da legislatura para processamento (opcional)
                              Se não fornecido, usa a legislatura atual

Opções:
  --limite, -l <número>       Limita o processamento a um número específico de senadores
  --exportar, -e              Exporta os dados para arquivos JSON e CSV com estatísticas
  --pc                        Salva a estrutura exata do Firestore no PC local
  --ajuda, -h                 Exibe esta mensagem de ajuda

Exemplos:
  # Processar legislatura atual
  npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts

  # Processar legislatura 56 com limite de 10 senadores
  npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts 56 --limite 10

  # Processar legislatura atual e exportar dados
  npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts --exportar

  # Processar legislatura 57 e salvar estrutura do Firestore no PC
  npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts 57 --pc
    `);
    process.exit(0);
  }
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportarDados = false;
  let limiteSenadores: number | undefined = undefined;
  let salvarNoPC = false;
  let mostrarAjuda = false;

  // Analisar argumentos
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ajuda' || arg === '-h') {
      mostrarAjuda = true;
    } else if (arg === '--exportar' || arg === '-e') {
      exportarDados = true;
    } else if (arg === '--pc') {
      salvarNoPC = true;
      logger.info('Flag --pc ativa: Dados serão salvos no PC local com a estrutura exata do Firestore');

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

  // Exibir ajuda se solicitado
  if (mostrarAjuda) {
    exibirAjuda();
  }

  // Processar legislatura específica ou atual com opção de exportação avançada
  const tempoInicio = Date.now();

  // Processar perfis de senadores
  processarPerfilSenadores(legislatura, salvarNoPC, limiteSenadores)
    .then(async () => {
      // Se o usuário solicitou exportação avançada, executamos após o processamento normal
      if (exportarDados) {
        logger.info('Iniciando exportação avançada dos dados...');

        try {
          // Obter dados dos senadores da legislatura atual ou especificada
          const legislaturaAlvo = legislatura || await obterNumeroLegislaturaAtual();

          // Buscar dados dos senadores (simulação - em um caso real, buscaríamos do Firestore)
          logger.info(`Buscando dados dos senadores da legislatura ${legislaturaAlvo} para exportação avançada`);

          // Opções de exportação
          const opcoesExportacao = {
            formato: 'ambos' as 'ambos',
            comprimir: false,
            nivelDetalhamento: 'ambos' as 'ambos',
            caminhoBase: `senadores_exportados/legislatura_${legislaturaAlvo}`
          };

          // Exportar dados avançados
          await exportarDadosAvancados(
            [], // Aqui você pode passar os dados que deseja exportar
            opcoesExportacao,
            tempoInicio
          );

          logger.info('Exportação avançada concluída com sucesso');
        } catch (error: any) {
          logger.error(`Erro na exportação avançada: ${error.message}`);
        }
      }

      logger.info('Processamento concluído com sucesso.');
      return;
    })
    .then(() => {
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Falha no processamento de perfis de senadores', error);
      process.exit(1);
    });
}


// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecifica();
}

export { processarPerfilSenadores, processarPerfilSenadoresMultiplasLegislaturas };
