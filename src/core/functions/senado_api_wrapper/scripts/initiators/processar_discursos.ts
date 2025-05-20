/**
 * Script para processar discursos de senadores (extração, transformação e carregamento)
 *
 * Este script implementa um fluxo ETL (Extract, Transform, Load) completo e independente
 * para extrair dados de discursos e apartes de senadores do Senado Federal, transformá-los
 * em um formato estruturado e carregá-los no Firestore.
 *
 * Características principais:
 * - Extrai discursos por períodos de 30 dias ao longo de todo o mandato do senador
 * - Consolida os resultados em um único objeto estruturado
 * - Salva os dados na coleção "discursos" no Firestore
 * - Suporta parâmetros como --limite e --senador para processamento seletivo
 *
 * Este script é completamente independente do processar_perfilsenadores.ts,
 * com lógica ETL 100% distinta, embora utilize algumas funções utilitárias comuns.
 */
import { logger } from '../utils/logger';
import { handleError } from '../utils/error_handler';
import { perfilSenadoresExtractor, DiscursoResult, PerfilSenadorResult } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer } from '../transformacao/perfilsenadores';
import { discursosTransformer, DiscursoTransformado } from '../transformacao/perfilsenadores_discursos';
import { discursosLoader } from '../carregamento/discursos';
import { discursosExporter } from '../exportacao/discursos';
import { obterNumeroLegislaturaAtual } from '../utils/legislatura';
import { exportToJson } from '../utils/file_exporter';

/**
 * Função para processar o fluxo completo de discursos de senadores
 * @param legislaturaEspecifica - Número de legislatura específica para processamento (opcional)
 * @param limiteSenadores - Limite de senadores para processamento (opcional)
 * @param codigoSenador - Código específico de um senador para processamento (opcional)
 * @param concorrencia - Número de requisições concorrentes para intervalos (opcional, padrão: 3)
 * @param exportarDados - Se true, exporta os dados para arquivos JSON locais (opcional, padrão: false)
 * @param apenasDiscursos - Se true, processa apenas discursos, ignorando apartes (opcional, padrão: false)
 * @param apenasApartes - Se true, processa apenas apartes, ignorando discursos (opcional, padrão: false)
 */
async function processarDiscursos(
  legislaturaEspecifica?: number,
  limiteSenadores?: number,
  codigoSenador?: string,
  concorrencia?: number,
  exportarDados: boolean = false,
  apenasDiscursos: boolean = false,
  apenasApartes: boolean = false
): Promise<void> {
  // Renomeamos o parâmetro para maior clareza
  const salvarNoPC = exportarDados;

  // Verificar se as opções são mutuamente exclusivas
  if (apenasDiscursos && apenasApartes) {
    logger.warn("As opções --apartes e --discursos são mutuamente exclusivas. Processando ambos.");
    apenasDiscursos = false;
    apenasApartes = false;
  }

  // Informar o modo de processamento
  if (apenasDiscursos) {
    logger.info("Modo de processamento: apenas discursos");
  } else if (apenasApartes) {
    logger.info("Modo de processamento: apenas apartes");
  } else {
    logger.info("Modo de processamento: discursos e apartes");
  }
  try {
    logger.info('=== Iniciando processamento de discursos de senadores ===');

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
    await discursosExporter.exportSenadoresLegislatura(senadoresTransformados, legislaturaAtual);

    // 1.3 Filtrar senadores conforme parâmetros
    let codigosSenadores = senadoresTransformados.senadores
      .filter(s => s && s.codigo)
      .map(s => s.codigo);

    // Filtrar por código específico se fornecido
    if (codigoSenador) {
      logger.info(`Filtrando apenas o senador com código ${codigoSenador}`);
      codigosSenadores = codigosSenadores.filter(codigo => codigo === codigoSenador);

      if (codigosSenadores.length === 0) {
        logger.warn(`Senador com código ${codigoSenador} não encontrado na legislatura ${legislaturaAtual}. Abortando processamento.`);
        return;
      }
    }

    // Aplicar limite se fornecido
    if (limiteSenadores && limiteSenadores > 0 && limiteSenadores < codigosSenadores.length) {
      logger.info(`Limitando processamento aos primeiros ${limiteSenadores} senadores`);
      codigosSenadores = codigosSenadores.slice(0, limiteSenadores);
    }

    logger.info(`Processando discursos para ${codigosSenadores.length} senadores`);

    // 1.4 Extrair mandatos dos senadores para obter períodos
    logger.info('1.4 Extraindo informações de mandatos dos senadores');
    const discursosExtraidos: DiscursoResult[] = [];
    // Para não sobrecarregar a API - processamento de um senador por vez
    const concurrencyIntervalos = concorrencia || 3; // Usar o valor fornecido ou o padrão de 3
    logger.info(`Usando concorrência de ${concurrencyIntervalos} para processamento de intervalos`);

    // Processar cada senador individualmente para extrair discursos por período de mandato
    for (const [index, codigoSenador] of codigosSenadores.entries()) {
      logger.info(`Processando senador ${index + 1}/${codigosSenadores.length}: código ${codigoSenador}`);

      try {
        // 1.4.1 Extrair dados básicos e mandatos do senador
        const perfilBasico = await perfilSenadoresExtractor.extractDadosBasicos(codigoSenador);
        const mandatosSenador = await perfilSenadoresExtractor.extractMandatos(codigoSenador);

        if (!mandatosSenador || !mandatosSenador.dados) {
          logger.warn(`Não foi possível obter informações de mandatos para o senador ${codigoSenador}. Usando método padrão.`);

          // Usar método padrão se não conseguir obter mandatos
          const discursoSenador = await perfilSenadoresExtractor.extractDiscursos(codigoSenador);
          discursosExtraidos.push(discursoSenador);
          continue;
        }

        // 1.4.2 Extrair períodos de mandato
        logger.debug(`Verificando estrutura de mandatos para o senador ${codigoSenador}`);

        // Verificar a estrutura da resposta para debug
        if (mandatosSenador.dados) {
          logger.debug(`Chaves na resposta: ${Object.keys(mandatosSenador.dados).join(', ')}`);
        }

        // Tentar diferentes caminhos possíveis para acessar os mandatos
        let mandatos;

        if (mandatosSenador.dados?.MandatoParlamentar?.Parlamentar?.Mandatos?.Mandato) {
          mandatos = mandatosSenador.dados.MandatoParlamentar.Parlamentar.Mandatos.Mandato;
          logger.debug(`Mandatos encontrados no caminho MandatoParlamentar.Parlamentar.Mandatos.Mandato`);
        } else if (mandatosSenador.dados?.Parlamentar?.Mandatos?.Mandato) {
          mandatos = mandatosSenador.dados.Parlamentar.Mandatos.Mandato;
          logger.debug(`Mandatos encontrados no caminho Parlamentar.Mandatos.Mandato`);
        } else if (mandatosSenador.dados?.Mandatos?.Mandato) {
          mandatos = mandatosSenador.dados.Mandatos.Mandato;
          logger.debug(`Mandatos encontrados no caminho Mandatos.Mandato`);
        } else if (mandatosSenador.dados?.MandatoParlamentar?.Mandatos?.Mandato) {
          mandatos = mandatosSenador.dados.MandatoParlamentar.Mandatos.Mandato;
          logger.debug(`Mandatos encontrados no caminho MandatoParlamentar.Mandatos.Mandato`);
        }

        // Garantir que mandatos seja um array
        const mandatosArray = mandatos ? (Array.isArray(mandatos) ? mandatos : [mandatos]) : [];

        logger.info(`Encontrados ${mandatosArray.length} mandatos para o senador ${codigoSenador}`);

        if (mandatosArray.length === 0) {
          logger.warn(`Nenhum mandato encontrado para o senador ${codigoSenador}. Usando método padrão.`);

          // Usar método padrão se não encontrar mandatos
          const discursoSenador = await perfilSenadoresExtractor.extractDiscursos(codigoSenador);
          discursosExtraidos.push(discursoSenador);
          continue;
        }

        // 1.4.3 Processar cada mandato para extrair discursos e apartes por período
        logger.info(`Encontrados ${mandatosArray.length} mandatos para o senador ${codigoSenador}`);

        let discursosPorPeriodo: PerfilSenadorResult[] = [];
        let apartesPorPeriodo: PerfilSenadorResult[] = [];

        for (const [idxMandato, mandato] of mandatosArray.entries()) {
          // Verificar a estrutura do mandato para debug
          logger.debug(`Estrutura do mandato ${idxMandato + 1}: ${JSON.stringify(Object.keys(mandato))}`);

          // Tentar diferentes caminhos possíveis para acessar as datas
          let dataInicio, dataFim;

          // Verificar se as datas estão diretamente no mandato
          if (mandato.DataInicio) {
            dataInicio = mandato.DataInicio;
            dataFim = mandato.DataFim || new Date().toISOString().slice(0, 10);
            logger.debug(`Datas encontradas diretamente no mandato`);
          }
          // Verificar se as datas estão na primeira legislatura do mandato
          else if (mandato.PrimeiraLegislaturaDoMandato?.DataInicio) {
            dataInicio = mandato.PrimeiraLegislaturaDoMandato.DataInicio;
            dataFim = mandato.PrimeiraLegislaturaDoMandato.DataFim || new Date().toISOString().slice(0, 10);
            logger.debug(`Datas encontradas na primeira legislatura do mandato`);
          }
          // Verificar se as datas estão em outro lugar
          else {
            // Procurar por qualquer propriedade que possa conter as datas
            for (const key of Object.keys(mandato)) {
              if (typeof mandato[key] === 'object' && mandato[key]?.DataInicio) {
                dataInicio = mandato[key].DataInicio;
                dataFim = mandato[key].DataFim || new Date().toISOString().slice(0, 10);
                logger.debug(`Datas encontradas em ${key}`);
                break;
              }
            }
          }

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

          // Extrair discursos e/ou apartes por período de mandato com base nos parâmetros
          let discursosMandato: PerfilSenadorResult[] = [];
          let apartesMandato: PerfilSenadorResult[] = [];

          if (!apenasApartes) {
            // Extrair discursos se não estiver no modo "apenas apartes"
            logger.info(`Extraindo discursos para o período ${dataInicio} a ${dataFim}`);
            discursosMandato = await perfilSenadoresExtractor.extractDiscursosPorPeriodoMandato(
              codigoSenador,
              dataInicio,
              dataFim,
              concurrencyIntervalos
            );
          }

          if (!apenasDiscursos) {
            // Extrair apartes se não estiver no modo "apenas discursos"
            logger.info(`Extraindo apartes para o período ${dataInicio} a ${dataFim}`);
            apartesMandato = await perfilSenadoresExtractor.extractApartesPorPeriodoMandato(
              codigoSenador,
              dataInicio,
              dataFim,
              concurrencyIntervalos
            );
          }

          // Adicionar resultados aos arrays
          discursosPorPeriodo = [...discursosPorPeriodo, ...discursosMandato];
          apartesPorPeriodo = [...apartesPorPeriodo, ...apartesMandato];
        }

        // Verificar se há dados para consolidar com base nos parâmetros
        const temDiscursos = !apenasApartes && discursosPorPeriodo.length > 0;
        const temApartes = !apenasDiscursos && apartesPorPeriodo.length > 0;

        if (temDiscursos || temApartes) {
          logger.info(`Consolidando ${temDiscursos ? discursosPorPeriodo.length : 0} períodos de discursos e ${temApartes ? apartesPorPeriodo.length : 0} períodos de apartes para o senador ${codigoSenador}`);

          // Consolidar discursos e/ou apartes em um único objeto
          const discursoConsolidado: DiscursoResult = {
            timestamp: new Date().toISOString(),
            codigo: codigoSenador,
            dadosBasicos: perfilBasico
          };

          // Adicionar discursos se não estiver no modo "apenas apartes"
          if (temDiscursos) {
            discursoConsolidado.discursos = {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${discursosPorPeriodo.length} períodos`,
              dados: consolidarDiscursosPorPeriodo(discursosPorPeriodo),
              metadados: {}
            };
            logger.info(`Consolidados ${discursosPorPeriodo.length} períodos de discursos para o senador ${codigoSenador}`);
          }

          // Adicionar apartes se não estiver no modo "apenas discursos"
          if (temApartes) {
            discursoConsolidado.apartes = {
              timestamp: new Date().toISOString(),
              origem: `Consolidação de ${apartesPorPeriodo.length} períodos`,
              dados: consolidarApartesPorPeriodo(apartesPorPeriodo),
              metadados: {}
            };
            logger.info(`Consolidados ${apartesPorPeriodo.length} períodos de apartes para o senador ${codigoSenador}`);
          }

          discursosExtraidos.push(discursoConsolidado);
        } else {
          logger.warn(`Nenhum discurso ou aparte encontrado nos períodos de mandato do senador ${codigoSenador}. Usando método padrão.`);

          // Usar método padrão se não encontrar discursos ou apartes nos períodos
          const discursoSenador = await perfilSenadoresExtractor.extractDiscursos(codigoSenador);
          discursosExtraidos.push(discursoSenador);
        }
      } catch (error: any) {
        logger.error(`Erro ao processar discursos do senador ${codigoSenador}: ${error.message}`);

        // Adicionar objeto de erro para manter a consistência
        discursosExtraidos.push({
          timestamp: new Date().toISOString(),
          codigo: codigoSenador,
          dadosBasicos: {
            timestamp: new Date().toISOString(),
            origem: `Processamento de discursos do senador ${codigoSenador}`,
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

    logger.info(`Extração de discursos concluída: ${discursosExtraidos.length} senadores processados`);

    // 1.5 Exportar dados brutos extraídos
    logger.info('1.5 Exportando dados brutos extraídos para arquivos JSON');
    exportToJson(discursosExtraidos, `senadores/extraidos/discursos_extraidos_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');

    // 2.1 Transformar discursos
    const discursosTransformados = discursosExtraidos
      .map((discurso: DiscursoResult) => {
        try {
          return discursosTransformer.transformDiscursos(discurso);
        } catch (error: any) {
          logger.warn(`Erro ao transformar discursos do senador ${discurso?.codigo || 'desconhecido'}: ${error.message}`);
          return null;
        }
      })
      .filter((discurso): discurso is DiscursoTransformado => Boolean(discurso)); // Remove itens nulos

    logger.info(`Transformação de discursos concluída: ${discursosTransformados.length} senadores com discursos transformados`);

    // 2.2 Exportar discursos transformados
    logger.info('2.2 Exportando discursos transformados para arquivos JSON');
    await discursosExporter.exportDiscursosSenadores(discursosTransformados, legislaturaAtual);

    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');

    if (salvarNoPC || exportarDados) {
      // Se a flag --pc ou --exportar estiver ativa, exportar para o PC
      logger.info('Flag de exportação ativa: Salvando dados no PC local');

      // Exportar dados transformados em formato detalhado
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = `senadores/discursos/discursos_detalhados_${legislaturaAtual}_${timestamp}.json`;
      exportToJson(discursosTransformados, filePath);

      logger.info(`Dados salvos com sucesso no PC local: ${filePath}`);

      // Exportar cada senador em um arquivo separado
      logger.info('Exportando dados de cada senador em arquivos separados');
      for (const discurso of discursosTransformados) {
        const senadorFilePath = `senadores/discursos/detalhado_senador_${discurso.codigo}_${timestamp}.json`;
        exportToJson(discurso, senadorFilePath);
      }

      logger.info(`${discursosTransformados.length} arquivos de senadores exportados com sucesso`);
    }

    // Carregar no Firestore se não for apenas exportação local
    if (!salvarNoPC) {
      // 3.1 Carregar discursos no Firestore
      logger.info('3.1 Carregando discursos dos senadores no Firestore');
      const resultadoCarregamento = await discursosLoader.saveMultiplosDiscursos(
        discursosTransformados,
        legislaturaAtual,
        apenasDiscursos,
        apenasApartes
      );

      logger.info(`Carregamento de discursos concluído: ${resultadoCarregamento.sucessos} salvos com sucesso, ${resultadoCarregamento.falhas} falhas`);
    }

    logger.info('=== Processamento de discursos de senadores concluído com sucesso ===');
    logger.info('NOTA: Os dados foram exportados para a pasta "dados_extraidos" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarDiscursos');
    throw error;
  }
}

// Função removida por não ser utilizada

// Função removida por não ser utilizada

/**
 * Função para consolidar apartes de múltiplos períodos em um único objeto
 * Esta função é responsável por combinar os apartes extraídos de diferentes períodos
 * de mandato de um senador em um único objeto estruturado, mantendo a estrutura
 * esperada pela API do Senado Federal.
 *
 * @param apartesPorPeriodo - Array de resultados de apartes por período
 * @returns Objeto consolidado com todos os apartes
 */
function consolidarApartesPorPeriodo(apartesPorPeriodo: PerfilSenadorResult[]): any {
  try {
    // Verificar se há apartes para consolidar
    if (!apartesPorPeriodo || apartesPorPeriodo.length === 0) {
      logger.warn(`Nenhum aparte para consolidar`);
      return null;
    }

    logger.info(`Consolidando ${apartesPorPeriodo.length} períodos de apartes`);

    // Verificar a estrutura do primeiro resultado para debug
    if (apartesPorPeriodo[0]?.dados) {
      logger.debug(`Estrutura do primeiro resultado de apartes: ${Object.keys(apartesPorPeriodo[0].dados).join(', ')}`);
    }

    // Estrutura base para consolidação
    const resultado: any = {
      ApartesParlamentar: {
        Parlamentar: {
          Apartes: {
            Aparte: []
          }
        }
      }
    };

    // Extrair informações do parlamentar do primeiro resultado
    if (apartesPorPeriodo[0]?.dados?.ApartesParlamentar?.Parlamentar) {
      const parlamentarInfo = apartesPorPeriodo[0].dados.ApartesParlamentar.Parlamentar;

      // Copiar informações do parlamentar, exceto os apartes
      // Remover Apartes para evitar duplicação
      const { Apartes, ...restoParlamentar } = parlamentarInfo;
      resultado.ApartesParlamentar.Parlamentar = { ...restoParlamentar };

      // Garantir que a estrutura de apartes esteja inicializada
      if (!resultado.ApartesParlamentar.Parlamentar.Apartes) {
        resultado.ApartesParlamentar.Parlamentar.Apartes = { Aparte: [] };
      }
    }

    // Log detalhado para debug
    logger.debug(`Estrutura base para consolidação: ${JSON.stringify(Object.keys(resultado))}`);
    if (resultado.ApartesParlamentar) {
      logger.debug(`Chaves em ApartesParlamentar: ${JSON.stringify(Object.keys(resultado.ApartesParlamentar))}`);
      if (resultado.ApartesParlamentar.Parlamentar) {
        logger.debug(`Chaves em Parlamentar: ${JSON.stringify(Object.keys(resultado.ApartesParlamentar.Parlamentar))}`);
      }
    }

    // Consolidar apartes de todos os períodos
    for (const [index, periodo] of apartesPorPeriodo.entries()) {
      logger.debug(`Processando período de apartes ${index + 1}/${apartesPorPeriodo.length}`);

      if (!periodo?.dados) {
        logger.warn(`Período de apartes ${index + 1} não possui dados`);
        continue;
      }

      // Verificar diferentes caminhos possíveis para os apartes
      let apartes;

      // Log detalhado para debug
      logger.debug(`Estrutura dos dados do período: ${JSON.stringify(Object.keys(periodo.dados))}`);

      // Verificar o caminho para Apartes (estrutura correta conforme JSON)
      if (periodo.dados.ApartesParlamentar?.Parlamentar?.Apartes?.Aparte) {
        apartes = periodo.dados.ApartesParlamentar.Parlamentar.Apartes.Aparte;
        logger.debug(`Apartes encontrados no caminho ApartesParlamentar.Parlamentar.Apartes.Aparte`);
      }
      // Verificar caminhos alternativos
      else if (periodo.dados.Parlamentar?.Apartes?.Aparte) {
        apartes = periodo.dados.Parlamentar.Apartes.Aparte;
        logger.debug(`Apartes encontrados no caminho Parlamentar.Apartes.Aparte`);
      }
      else if (periodo.dados.Apartes?.Aparte) {
        apartes = periodo.dados.Apartes.Aparte;
        logger.debug(`Apartes encontrados no caminho Apartes.Aparte`);
      }

      // Se ainda não encontrou, tenta outros caminhos possíveis
      if (!apartes && periodo.dados.ApartesParlamentar?.Parlamentar) {
        const parlamentar = periodo.dados.ApartesParlamentar.Parlamentar;
        logger.debug(`Chaves em Parlamentar: ${JSON.stringify(Object.keys(parlamentar))}`);

        // Verificar se os apartes estão diretamente no objeto Parlamentar
        if (Array.isArray(parlamentar.Apartes)) {
          apartes = parlamentar.Apartes;
          logger.debug(`Apartes encontrados como array em Parlamentar.Apartes`);
        }
      }

      // Verificar se há dados de apartes na resposta (para debug)
      if (!apartes) {
        logger.debug(`Estrutura da resposta de apartes: ${JSON.stringify(Object.keys(periodo.dados))}`);
        if (periodo.dados.ApartesParlamentar) {
          logger.debug(`Chaves em ApartesParlamentar: ${JSON.stringify(Object.keys(periodo.dados.ApartesParlamentar))}`);
          if (periodo.dados.ApartesParlamentar.Parlamentar) {
            logger.debug(`Chaves em Parlamentar: ${JSON.stringify(Object.keys(periodo.dados.ApartesParlamentar.Parlamentar))}`);
          }
        }
      }

      if (apartes) {
        // Adicionar apartes ao array consolidado
        if (Array.isArray(apartes)) {
          logger.debug(`Adicionando ${apartes.length} apartes do período ${index + 1}`);
          resultado.ApartesParlamentar.Parlamentar.Apartes.Aparte.push(...apartes);
        } else {
          logger.debug(`Adicionando 1 aparte do período ${index + 1}`);
          resultado.ApartesParlamentar.Parlamentar.Apartes.Aparte.push(apartes);
        }
      } else {
        logger.warn(`Nenhum aparte encontrado no período ${index + 1}`);
      }
    }

    // Verificar se há apartes após consolidação
    if (resultado.ApartesParlamentar.Parlamentar.Apartes.Aparte.length === 0) {
      return null;
    }

    return resultado;
  } catch (error: any) {
    logger.error(`Erro ao consolidar apartes por período: ${error.message}`);
    return null;
  }
}


/**
 * Função para consolidar discursos de múltiplos períodos em um único objeto
 * Esta função é responsável por combinar os discursos extraídos de diferentes períodos
 * de mandato de um senador em um único objeto estruturado, mantendo a estrutura
 * esperada pela API do Senado Federal.
 *
 * @param discursosPorPeriodo - Array de resultados de discursos por período
 * @returns Objeto consolidado com todos os discursos
 */
function consolidarDiscursosPorPeriodo(discursosPorPeriodo: PerfilSenadorResult[]): any {
  try {
    // Verificar se há discursos para consolidar
    if (!discursosPorPeriodo || discursosPorPeriodo.length === 0) {
      logger.warn(`Nenhum discurso para consolidar`);
      return null;
    }

    logger.info(`Consolidando ${discursosPorPeriodo.length} períodos de discursos`);

    // Verificar a estrutura do primeiro resultado para debug
    if (discursosPorPeriodo[0]?.dados) {
      logger.debug(`Estrutura do primeiro resultado: ${Object.keys(discursosPorPeriodo[0].dados).join(', ')}`);
    }

    // Estrutura base para consolidação
    const resultado: any = {
      DiscursosParlamentar: {
        Parlamentar: {
          Pronunciamentos: {
            Pronunciamento: []
          }
        }
      }
    };

    // Extrair informações do parlamentar do primeiro resultado
    if (discursosPorPeriodo[0]?.dados?.DiscursosParlamentar?.Parlamentar) {
      const parlamentarInfo = discursosPorPeriodo[0].dados.DiscursosParlamentar.Parlamentar;

      // Copiar informações do parlamentar, exceto os pronunciamentos
      // Remover Pronunciamentos para evitar duplicação
      const { Pronunciamentos, ...restoParlamentar } = parlamentarInfo;
      resultado.DiscursosParlamentar.Parlamentar = { ...restoParlamentar };

      // Garantir que a estrutura de pronunciamentos esteja inicializada
      if (!resultado.DiscursosParlamentar.Parlamentar.Pronunciamentos) {
        resultado.DiscursosParlamentar.Parlamentar.Pronunciamentos = { Pronunciamento: [] };
      }
    }

    // Consolidar discursos de todos os períodos
    for (const [index, periodo] of discursosPorPeriodo.entries()) {
      logger.debug(`Processando período ${index + 1}/${discursosPorPeriodo.length}`);

      if (!periodo?.dados) {
        logger.warn(`Período ${index + 1} não possui dados`);
        continue;
      }

      // Verificar diferentes caminhos possíveis para os discursos
      let discursos;

      // Verificar o caminho para Pronunciamentos (estrutura correta conforme XML)
      if (periodo.dados.DiscursosParlamentar?.Parlamentar?.Pronunciamentos?.Pronunciamento) {
        discursos = periodo.dados.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento;
        logger.debug(`Discursos encontrados no caminho DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento`);
      }
      // Verificar caminhos alternativos
      else if (periodo.dados.Parlamentar?.Pronunciamentos?.Pronunciamento) {
        discursos = periodo.dados.Parlamentar.Pronunciamentos.Pronunciamento;
        logger.debug(`Discursos encontrados no caminho Parlamentar.Pronunciamentos.Pronunciamento`);
      }
      // Verificar caminhos antigos (para compatibilidade)
      else if (periodo.dados.DiscursosParlamentar?.Parlamentar?.Discursos?.Discurso) {
        discursos = periodo.dados.DiscursosParlamentar.Parlamentar.Discursos.Discurso;
        logger.debug(`Discursos encontrados no caminho DiscursosParlamentar.Parlamentar.Discursos.Discurso`);
      } else if (periodo.dados.Parlamentar?.Discursos?.Discurso) {
        discursos = periodo.dados.Parlamentar.Discursos.Discurso;
        logger.debug(`Discursos encontrados no caminho Parlamentar.Discursos.Discurso`);
      } else if (periodo.dados.Discursos?.Discurso) {
        discursos = periodo.dados.Discursos.Discurso;
        logger.debug(`Discursos encontrados no caminho Discursos.Discurso`);
      }

      // Verificar se há dados de discurso na resposta (para debug)
      if (!discursos) {
        logger.debug(`Estrutura da resposta: ${JSON.stringify(Object.keys(periodo.dados))}`);
        if (periodo.dados.DiscursosParlamentar) {
          logger.debug(`Chaves em DiscursosParlamentar: ${JSON.stringify(Object.keys(periodo.dados.DiscursosParlamentar))}`);
          if (periodo.dados.DiscursosParlamentar.Parlamentar) {
            logger.debug(`Chaves em Parlamentar: ${JSON.stringify(Object.keys(periodo.dados.DiscursosParlamentar.Parlamentar))}`);
          }
        }
      }

      if (discursos) {
        // Adicionar pronunciamentos ao array consolidado
        if (Array.isArray(discursos)) {
          logger.debug(`Adicionando ${discursos.length} pronunciamentos do período ${index + 1}`);
          resultado.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento.push(...discursos);
        } else {
          logger.debug(`Adicionando 1 pronunciamento do período ${index + 1}`);
          resultado.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento.push(discursos);
        }
      } else {
        logger.warn(`Nenhum discurso encontrado no período ${index + 1}`);
      }
    }

    // Verificar se há pronunciamentos após consolidação
    if (resultado.DiscursosParlamentar.Parlamentar.Pronunciamentos.Pronunciamento.length === 0) {
      return null;
    }

    return resultado;
  } catch (error: any) {
    logger.error(`Erro ao consolidar discursos por período: ${error.message}`);
    return null;
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
  let codigoSenador: string | undefined = undefined;
  let concorrencia: number | undefined = undefined;
  let mostrarAjuda = false;
  let apenasDiscursos = false;
  let apenasApartes = false;

  // Função para exibir ajuda
  function exibirAjuda() {
    console.log(`
Uso: npx ts-node -P tsconfig.scripts.json scripts/processar_discursos.ts [legislatura] [opções]

Argumentos:
  [legislatura]                Número da legislatura para processamento (opcional)
                              Se não fornecido, usa a legislatura atual

Opções:
  --limite, -l <número>       Limita o processamento a um número específico de senadores
  --senador, -s <código>      Processa apenas o senador com o código especificado
  --concorrencia, -c <número> Define o número de requisições concorrentes (padrão: 3)
  --exportar, -e              Exporta os dados para arquivos JSON
  --discursos, -d             Processa apenas discursos, ignorando apartes
  --apartes, -a               Processa apenas apartes, ignorando discursos
  --ajuda, -h                 Exibe esta mensagem de ajuda

Exemplos:
  # Processar apenas discursos do senador 6331
  npx ts-node -P tsconfig.scripts.json scripts/processar_discursos.ts --senador 6331 --discursos

  # Processar apenas apartes da legislatura 57 e exportar para JSON
  npx ts-node -P tsconfig.scripts.json scripts/processar_discursos.ts 57 --apartes --exportar
    `);
    process.exit(0);
  }

  // Analisar argumentos
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ajuda' || arg === '-h') {
      mostrarAjuda = true;
    } else if (arg === '--exportar' || arg === '-e') {
      exportarDados = true;
    } else if (arg === '--discursos' || arg === '-d') {
      apenasDiscursos = true;
      logger.info('Configurado para processar apenas discursos');
    } else if (arg === '--apartes' || arg === '-a') {
      apenasApartes = true;
      logger.info('Configurado para processar apenas apartes');
    } else if (arg === '--limite' || arg === '-l') {
      const limite = parseInt(args[++i], 10);
      if (!isNaN(limite) && limite > 0) {
        limiteSenadores = limite;
        logger.info(`Configurado limite de ${limiteSenadores} senadores para processamento`);
      } else {
        logger.warn(`Limite inválido: ${args[i]}. Deve ser um número positivo.`);
      }
    } else if (arg === '--senador' || arg === '-s') {
      codigoSenador = args[++i];
      if (codigoSenador) {
        logger.info(`Configurado para processar apenas o senador com código ${codigoSenador}`);
      } else {
        logger.warn('Código de senador não fornecido após o parâmetro --senador');
      }
    } else if (arg === '--concorrencia' || arg === '-c') {
      const valorConcorrencia = parseInt(args[++i], 10);
      if (!isNaN(valorConcorrencia) && valorConcorrencia > 0) {
        concorrencia = valorConcorrencia;
        logger.info(`Configurado nível de concorrência: ${concorrencia} requisições simultâneas`);
      } else {
        logger.warn(`Nível de concorrência inválido: ${args[i]}. Deve ser um número positivo. Usando valor padrão (3).`);
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

  // Verificar se as opções são mutuamente exclusivas
  if (apenasDiscursos && apenasApartes) {
    logger.warn("As opções --apartes e --discursos são mutuamente exclusivas. Processando ambos.");
    apenasDiscursos = false;
    apenasApartes = false;
  }

  // Exibir ajuda se solicitado
  if (mostrarAjuda) {
    exibirAjuda();
  }

  // Processar legislatura específica ou atual
  processarDiscursos(legislatura, limiteSenadores, codigoSenador, concorrencia, exportarDados, apenasDiscursos, apenasApartes)
    .then(() => {
      logger.info('Processamento concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de discursos de senadores', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecifica();
}

export { processarDiscursos };
