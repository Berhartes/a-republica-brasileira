/**
 * Script para processar votações de senadores (extração, transformação e carregamento)
 * Este script extrai dados de votações de senadores, diferente do
 * processar_perfilsenadores.ts que extrai perfis completos.
 */
import { logger, handleError } from '../../utils/logging';
import { perfilSenadoresExtractor } from '../../extracao/perfilsenadores';
import { obterNumeroLegislaturaAtual } from '../../utils/date';
import * as api from '../../utils/api';
import { exportToJson } from '../../utils/common';

/**
 * Função para processar o fluxo completo de votações de senadores
 * @param legislaturaEspecifica - Número de legislatura específica para processamento (opcional)
 * @param limiteSenadores - Limite de senadores para processamento (opcional)
 */
async function processarVotacoes(legislaturaEspecifica?: number, limiteSenadores?: number): Promise<void> {
  try {
    logger.info('=== Iniciando processamento de votações de senadores ===');

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
    // Transformar a lista de senadores para extrair os códigos
    const senadoresTransformados = {
      timestamp: new Date().toISOString(),
      senadores: senadoresExtraidos.senadores.map((senador: any) => {
        const identificacao = senador.IdentificacaoParlamentar || {};
        return {
          codigo: identificacao.CodigoParlamentar || '',
          nome: identificacao.NomeParlamentar || '',
          partido: {
            sigla: identificacao.SiglaPartidoParlamentar || '',
            nome: identificacao.NomePartidoParlamentar || ''
          },
          uf: identificacao.UfParlamentar || ''
        };
      }),
      legislatura: legislaturaAtual
    };
    logger.info(`Transformação de lista concluída: ${senadoresTransformados.senadores.length} senadores transformados`);

    // 1.2.A Exportar lista básica para arquivos locais para análise
    logger.info('1.2.A Exportando lista de senadores para arquivos JSON');
    exportToJson(senadoresTransformados, `senadores/listas/senadores_legislatura_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 1.3 Extrair votações dos senadores
    logger.info('1.3 Extraindo votações dos senadores');
    const concurrency = 1; // Para não sobrecarregar a API - reduzido para apenas 1 requisição por vez
    const maxRetries = 5; // Aumentado para 5 tentativas

    // Filtrar apenas senadores com código válido
    let codigosSenadores = senadoresTransformados.senadores
      .filter(s => s && s.codigo)
      .map(s => s.codigo);

    // Aplicar limite de senadores se especificado
    if (limiteSenadores && limiteSenadores > 0 && limiteSenadores < codigosSenadores.length) {
      logger.info(`Aplicando limite de ${limiteSenadores} senadores para processamento`);
      codigosSenadores = codigosSenadores.slice(0, limiteSenadores);
    }

    logger.info(`Iniciando extração de votações para ${codigosSenadores.length} senadores`);

    // Aqui vamos extrair apenas as votações diretamente
    // Vamos criar uma função para extrair votações de cada senador
    const votacoesExtraidas = [];

    // Processar em lotes para não sobrecarregar a API
    const chunks = [];
    for (let i = 0; i < codigosSenadores.length; i += concurrency) {
      chunks.push(codigosSenadores.slice(i, i + concurrency));
    }

    // Processar cada chunk
    for (const [index, chunk] of chunks.entries()) {
      logger.info(`Processando lote ${index + 1}/${chunks.length} (${chunk.length} senadores)`);

      // Extrair votações do chunk atual em paralelo
      const chunkVotacoes = await Promise.all(
        chunk.map(async (codigo) => {
          try {
            // Extrair votações do senador
            logger.info(`Extraindo votações do senador ${codigo}`);

            // Extrair dados básicos do senador
            const dadosBasicosEndpoint = api.replacePath('/senador/{codigo}', { codigo: codigo.toString() });
            const dadosBasicos = await api.get(dadosBasicosEndpoint, { v: 6, format: 'json' });

            // Extrair votações do senador
            const votacoesEndpoint = api.replacePath('/senador/{codigo}/votacoes', { codigo: codigo.toString() });
            const votacoes = await api.get(votacoesEndpoint, { v: 7, format: 'json' });

            return {
              codigo,
              dadosBasicos,
              votacoes
            };
          } catch (error: any) {
            logger.error(`Erro ao extrair votações do senador ${codigo}: ${error.message}`);
            return {
              codigo,
              erro: error.message
            };
          }
        })
      );

      // Adicionar resultados do chunk à lista completa
      votacoesExtraidas.push(...chunkVotacoes);

      // Mostrar progresso
      logger.info(`Progresso: ${Math.min(votacoesExtraidas.length, codigosSenadores.length)}/${codigosSenadores.length} senadores`);

      // Pausa entre chunks para não sobrecarregar a API
      if (index < chunks.length - 1) {
        logger.info(`Aguardando 3 segundos antes de processar o próximo lote de senadores...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    logger.info(`Extração de votações concluída: ${votacoesExtraidas.length} senadores processados`);

    // 1.3.A Exportar dados brutos extraídos
    logger.info('1.3.A Exportando dados brutos extraídos para arquivos JSON');
    exportToJson(votacoesExtraidas, `senadores/extraidos/votacoes_extraidas_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 2. Transformação
    logger.info('2. Iniciando etapa de transformação');

    // 2.1 Transformar votações
    const votacoesTransformadas = votacoesExtraidas
      .map(resultado => {
        try {
          // Verificar se temos dados válidos
          if (!resultado || resultado.erro || !resultado.dadosBasicos || !resultado.votacoes) {
            logger.warn(`Dados inválidos para o senador ${resultado?.codigo || 'desconhecido'}, pulando...`);
            return null;
          }

          // Extrair informações básicas do senador
          const dadosBasicos = resultado.dadosBasicos;
          const parlamentar = dadosBasicos.DetalheParlamentar?.Parlamentar || {};
          const identificacao = parlamentar.IdentificacaoParlamentar || {};

          // Extrair votações
          const votacoesData = resultado.votacoes;
          const votacoesParlamentar = votacoesData.VotacaoParlamentar?.Parlamentar || {};
          const votacoesArray = votacoesParlamentar.Votacoes?.Votacao || [];

          // Garantir que votacoesArray seja sempre um array
          const votacoesNormalizadas = Array.isArray(votacoesArray) ? votacoesArray : [votacoesArray];

          // Transformar cada votação
          const votacoesTransformadas = votacoesNormalizadas.map(votacao => {
            const materia = votacao.Materia || {};
            const sessao = votacao.Sessao || {};

            return {
              id: votacao.SequencialVotacao || '',
              materia: {
                tipo: materia.SiglaMateria || '',
                numero: materia.NumeroMateria || '',
                ano: materia.AnoMateria || '',
                ementa: materia.DescricaoMateria || undefined
              },
              sessao: {
                codigo: sessao.CodigoSessao || '',
                data: sessao.DataSessao || '',
                legislatura: parseInt(sessao.NumeroLegislatura || '0', 10),
                sessaoLegislativa: parseInt(sessao.NumeroSessaoLegislativa || '0', 10)
              },
              voto: votacao.DescricaoVoto || '',
              orientacaoBancada: votacao.DescricaoOrientacaoBancada || undefined,
              resultado: votacao.DescricaoResultado || undefined
            };
          });

          return {
            codigo: resultado.codigo,
            senador: {
              codigo: resultado.codigo,
              nome: identificacao.NomeParlamentar || 'Nome não disponível',
              partido: {
                sigla: identificacao.SiglaPartidoParlamentar || '',
                nome: identificacao.NomePartidoParlamentar || undefined
              },
              uf: identificacao.UfParlamentar || ''
            },
            votacoes: votacoesTransformadas,
            timestamp: new Date().toISOString()
          };
        } catch (error: any) {
          logger.warn(`Erro ao transformar votações do senador ${resultado?.codigo || 'desconhecido'}: ${error.message}`);
          return null;
        }
      })
      .filter(Boolean); // Remove itens nulos

    logger.info(`Transformação de votações concluída: ${votacoesTransformadas.length} senadores com votações transformadas`);

    // 2.1.A Exportar votações transformadas
    logger.info('2.1.A Exportando votações transformadas para arquivos JSON');
    exportToJson(votacoesTransformadas, `senadores/transformados/votacoes_transformadas_${legislaturaAtual}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);

    // 3. Carregamento
    logger.info('3. Iniciando etapa de carregamento');

    // 3.1 Carregar votações
    logger.info('3.1 Carregando votações dos senadores');

    // Aqui vamos salvar as votações em uma coleção separada
    const { firestoreBatch } = require('../../utils/storage');
    const batchManager = firestoreBatch.createBatchManager();
    let sucessos = 0;
    let falhas = 0;

    for (const votacao of votacoesTransformadas) {
      try {
        // Verificar se a votação é válida
        if (!votacao || !votacao.codigo) {
          logger.warn('Votação sem dados básicos completos, pulando...');
          falhas++;
          continue;
        }

        // Salvar na coleção de votações
        const votacaoRef = `congressoNacional/senadoFederal/votacoes/${votacao.codigo}`;
        batchManager.set(votacaoRef, {
          ...votacao,
          atualizadoEm: new Date().toISOString()
        });
        sucessos++;
      } catch (error: any) {
        logger.error(`Erro ao salvar votações do senador ${votacao?.codigo || 'desconhecido'}: ${error.message}`);
        falhas++;
      }
    }

    // Commit das operações
    await batchManager.commit();

    logger.info(`Carregamento de votações concluído: ${sucessos} salvos com sucesso, ${falhas} falhas`);

    logger.info('=== Processamento de votações de senadores concluído com sucesso ===');
    logger.info('NOTA: Os dados foram exportados para a pasta "exports" na raiz do projeto.');
  } catch (error: any) {
    handleError(error, 'processarVotacoes');
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

  // Processar legislatura específica ou atual
  processarVotacoes(legislatura, limiteSenadores)
    .then(() => {
      logger.info('Processamento concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha no processamento de votações de senadores', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
if (require.main === module) {
  processarLegislaturaEspecifica();
}

export { processarVotacoes };
