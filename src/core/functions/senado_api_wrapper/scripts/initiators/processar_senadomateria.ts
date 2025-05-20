/**
 * Script para processar matérias legislativas de senadores (extração, transformação e carregamento)
 *
 * Este script implementa um fluxo ETL (Extract, Transform, Load) completo e independente
 * para extrair dados de matérias legislativas (autorias e relatorias) de senadores do Senado Federal,
 * transformá-los em um formato estruturado e carregá-los no Firestore.
 *
 * Características principais:
 * - Extrai matérias por períodos de 360 dias ao longo de todo o mandato do senador
 * - Consolida os resultados em um único objeto estruturado
 * - Salva os dados na coleção "materias" no Firestore
 * - Suporta parâmetros como --limite e --senador para processamento seletivo
 *
 * Este script é completamente independente do processar_perfilsenadores.ts e processar_discursos.ts,
 * com lógica ETL 100% distinta, embora utilize algumas funções utilitárias comuns.
 */
import { logger } from '../utils/logger';
import { handleError } from '../utils/error_handler';
import { perfilSenadoresExtractor, PerfilSenadorResult } from '../extracao/perfilsenadores';
import { materiasExtractor, MateriaResult } from '../extracao/materias';
import { materiasTransformer, MateriaTransformada } from '../transformacao/materias';
import { materiasLoader } from '../carregamento/materias';
import { materiasExporter } from '../exportacao/materias';
import { obterNumeroLegislaturaAtual } from '../utils/legislatura';
import { parseArgs } from '../utils/args_parser';

/**
 * Função principal para processar matérias legislativas de senadores
 * @param legislaturaEspecifica - Número da legislatura específica (opcional)
 */
async function processarSenadorMateria(legislaturaEspecifica?: number): Promise<void> {
  try {
    logger.info('Iniciando processamento de matérias legislativas de senadores');

    // 0. Obter legislatura atual se não foi especificada
    let legislaturaAtual: number;
    if (legislaturaEspecifica) {
      legislaturaAtual = legislaturaEspecifica;
    } else {
      const legislatura = await obterNumeroLegislaturaAtual();
      if (!legislatura) {
        throw new Error('Não foi possível obter a legislatura atual');
      }
      legislaturaAtual = legislatura;
    }
    logger.info(`Processando matérias legislativas para a legislatura ${legislaturaAtual}`);

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

    // 1.2 Obter argumentos da linha de comando
    const opcoes = parseArgs();
    const limite = opcoes.limite ? parseInt(opcoes.limite, 10) : undefined;
    const senadorEspecifico = opcoes.senador;

    // 1.3 Filtrar senadores conforme parâmetros
    let codigosSenadores = senadoresExtraidos.senadores
      .map(s => s.IdentificacaoParlamentar?.CodigoParlamentar)
      .filter(Boolean) as string[];

    logger.info(`Encontrados ${codigosSenadores.length} códigos de senadores válidos`);

    // Filtrar por senador específico se fornecido
    if (senadorEspecifico) {
      logger.info(`Filtrando apenas o senador com código ${senadorEspecifico}`);
      codigosSenadores = codigosSenadores.filter(codigo => codigo === senadorEspecifico);
    }

    // Aplicar limite se fornecido
    if (limite && limite > 0 && limite < codigosSenadores.length) {
      logger.info(`Limitando processamento aos primeiros ${limite} senadores`);
      codigosSenadores = codigosSenadores.slice(0, limite);
    }

    logger.info(`Processando matérias legislativas de ${codigosSenadores.length} senadores`);

    // 1.4 Extrair matérias legislativas para cada senador
    logger.info('1.4 Extraindo matérias legislativas dos senadores');
    const materiasExtraidas: MateriaResult[] = [];

    for (const [index, codigoSenador] of codigosSenadores.entries()) {
      logger.info(`Processando senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);

      try {
        // 1.4.1 Extrair dados básicos e mandatos do senador
        const perfilBasico = await perfilSenadoresExtractor.extractDadosBasicos(codigoSenador);
        const mandatosSenador = await perfilSenadoresExtractor.extractMandatos(codigoSenador);

        if (!mandatosSenador || !mandatosSenador.dados) {
          logger.warn(`Não foi possível obter informações de mandatos para o senador ${codigoSenador}. Usando método padrão.`);

          // Usar método padrão se não conseguir obter mandatos
          const materiaSenador = await materiasExtractor.extractMaterias(codigoSenador);
          materiasExtraidas.push(materiaSenador);
          continue;
        }

        // 1.4.2 Extrair matérias por períodos de mandato
        logger.info(`Extraindo matérias por períodos de mandato para o senador ${codigoSenador}`);

        // Obter array de mandatos
        const mandatosObj = mandatosSenador.dados;
        const mandatosArray = Array.isArray(mandatosObj.Mandato) ? mandatosObj.Mandato : [mandatosObj.Mandato];

        // Arrays para armazenar resultados por período
        let autoriasPorPeriodo: PerfilSenadorResult[] = [];
        let relatoriasPorPeriodo: PerfilSenadorResult[] = [];

        // Processar cada mandato
        for (const [idxMandato, mandato] of mandatosArray.entries()) {
          // Extrair datas de início e fim do mandato
          let dataInicio = mandato?.DataInicio;
          let dataFim = mandato?.DataFim;

          // Se não encontrou datas, usar datas padrão (últimos 4 anos)
          if (!dataInicio) {
            const hoje = new Date();
            const quatroAnosAtras = new Date();
            quatroAnosAtras.setFullYear(hoje.getFullYear() - 4);

            dataInicio = quatroAnosAtras.toISOString().slice(0, 10);
            dataFim = hoje.toISOString().slice(0, 10);
            logger.warn(`Não foi possível encontrar datas de mandato. Usando período padrão de 4 anos: ${dataInicio} a ${dataFim}`);
          }

          logger.info(`Processando mandato ${idxMandato + 1}/${mandatosArray.length}: ${dataInicio} a ${dataFim}`);

          // Extrair autorias por período de mandato
          const autoriasMandato = await materiasExtractor.extractAutoriasPorPeriodoMandato(
            codigoSenador,
            dataInicio,
            dataFim
          );

          // Adicionar resultados ao array
          autoriasPorPeriodo = [...autoriasPorPeriodo, ...autoriasMandato];

          // Extrair relatorias por período de mandato
          const relatoriasMandato = await materiasExtractor.extractRelatoriasPorPeriodoMandato(
            codigoSenador,
            dataInicio,
            dataFim
          );

          // Adicionar resultados ao array
          relatoriasPorPeriodo = [...relatoriasPorPeriodo, ...relatoriasMandato];
        }

        // 1.4.3 Consolidar resultados
        logger.info(`Consolidando resultados de matérias para o senador ${codigoSenador}`);

        // Consolidar autorias
        const autoriasConsolidadas = autoriasPorPeriodo.length > 0
          ? materiasExtractor.consolidarResultadosAutorias(autoriasPorPeriodo)
          : null;

        // Consolidar relatorias
        const relatoriasConsolidadas = relatoriasPorPeriodo.length > 0
          ? materiasExtractor.consolidarResultadosRelatorias(relatoriasPorPeriodo)
          : null;

        // Verificar se encontrou alguma matéria
        if (autoriasConsolidadas || relatoriasConsolidadas) {
          // Criar objeto consolidado
          const materiaConsolidada: MateriaResult = {
            timestamp: new Date().toISOString(),
            codigo: codigoSenador,
            dadosBasicos: perfilBasico,
            autorias: autoriasConsolidadas ? {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${autoriasPorPeriodo.length} períodos`,
              dados: autoriasConsolidadas,
              metadados: {}
            } : undefined,
            relatorias: relatoriasConsolidadas ? {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${relatoriasPorPeriodo.length} períodos`,
              dados: relatoriasConsolidadas,
              metadados: {}
            } : undefined
          };

          materiasExtraidas.push(materiaConsolidada);
        } else {
          logger.warn(`Nenhuma matéria encontrada nos períodos de mandato do senador ${codigoSenador}. Usando método padrão.`);

          // Usar método padrão se não encontrar matérias nos períodos
          const materiaSenador = await materiasExtractor.extractMaterias(codigoSenador);
          materiasExtraidas.push(materiaSenador);
        }
      } catch (error: any) {
        logger.error(`Erro ao processar matérias do senador ${codigoSenador}: ${error.message}`);

        // Adicionar objeto de erro para manter a consistência
        materiasExtraidas.push({
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: {
            timestamp: new Date().toISOString(),
            origem: `Processamento de matérias do senador ${codigoSenador}`,
            dados: null,
            metadados: {},
            erro: error.message
          },
          erro: error.message
        });
      }

      // Pausa entre senadores para não sobrecarregar a API
      if (index < codigosSenadores.length - 1) {
        logger.info(`Aguardando 3 segundos antes de processar o próximo senador...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // 1.5 Exportar dados brutos extraídos
    logger.info('1.5 Exportando dados brutos extraídos para arquivos JSON');
    await materiasExporter.exportMateriasExtraidas(materiasExtraidas, legislaturaAtual);

    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');

    // 2.1 Transformar matérias
    logger.info('2.1 Transformando matérias legislativas');
    const materiasTransformadas: MateriaTransformada[] = await materiasTransformer.transformMultiplasMaterias(materiasExtraidas);

    logger.info(`Transformação de matérias concluída: ${materiasTransformadas.length} senadores com matérias transformadas`);

    // 2.2 Exportar matérias transformadas
    logger.info('2.2 Exportando matérias transformadas para arquivos JSON');
    await materiasExporter.exportMateriasTransformadas(materiasTransformadas, legislaturaAtual);

    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');

    // 3.1 Carregar matérias
    logger.info('3.1 Carregando matérias dos senadores');
    const resultadoCarregamento = await materiasLoader.saveMultiplasMaterias(
      materiasTransformadas,
      legislaturaAtual
    );

    logger.info(`Carregamento de matérias concluído: ${resultadoCarregamento.sucessos} salvos com sucesso, ${resultadoCarregamento.falhas} falhas`);

    logger.info('Processamento de matérias legislativas concluído com sucesso');
  } catch (error: any) {
    handleError('Erro no processamento de matérias legislativas', error);
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  console.log('Iniciando script de processamento de matérias legislativas');

  // Obter argumentos da linha de comando
  const opcoes = parseArgs();
  console.log('Opções recebidas:', opcoes);

  const legislaturaEspecifica = opcoes.legislatura ? parseInt(opcoes.legislatura, 10) : undefined;
  console.log('Legislatura específica:', legislaturaEspecifica);

  // Executar processamento
  processarSenadorMateria(legislaturaEspecifica)
    .then(() => {
      logger.info('Script de processamento de matérias legislativas finalizado');
      process.exit(0);
    })
    .catch(error => {
      handleError('Erro fatal no script de processamento de matérias legislativas', error);
      process.exit(1);
    });
}

export { processarSenadorMateria };
