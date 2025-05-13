/**
 * Script simples para testar se o módulo ETL de perfis de senadores funciona
 * Intencionalmente reduzido em escopo para evitar processamento completo
 */
import { logger } from '../utils/logger';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer } from '../transformacao/perfilsenadores';

/**
 * Teste simplificado apenas da fase de extração e transformação
 */
async function testarModuloPerfilSenadores() {
  logger.info('=== Teste simples do módulo de perfis de senadores ===');

  try {
    // Usar legislatura 54 para testes
    const legislatura = 54;
    logger.info(`Legislatura de teste: ${legislatura}`);

    // Testar apenas a extração da lista de senadores
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
    logger.info(`Lista extraída com ${senadoresExtraidos.senadores.length} senadores`);

    // Testar a transformação da lista básica
    const listaTransformada = perfilSenadoresTransformer.transformSenadoresLegislatura(senadoresExtraidos);
    logger.info(`Lista transformada com ${listaTransformada.senadores.length} senadores`);

    // Testar apenas com um senador de exemplo para evitar muitas chamadas à API
    if (listaTransformada.senadores.length > 0) {
      // Extrair o primeiro senador da lista
      const primeiroSenador = listaTransformada.senadores[0];
      logger.info(`Testando extração e transformação para o senador ${primeiroSenador.nome} (${primeiroSenador.codigo})`);

      // Extrair perfil completo desse senador
      const perfilExtraido = await perfilSenadoresExtractor.extractPerfilCompleto(primeiroSenador.codigo);
      logger.info('Perfil extraído com sucesso');

      // Transformar perfil
      const perfilTransformado = perfilSenadoresTransformer.transformPerfilCompleto(perfilExtraido);
      logger.info('Perfil transformado com sucesso');

      if (perfilTransformado) {
        logger.info(`Nome completo: ${perfilTransformado.nomeCompleto}`);
        logger.info(`Número de mandatos: ${perfilTransformado.mandatos.length}`);
        logger.info(`Número de comissões: ${perfilTransformado.comissoes.length}`);
      } else {
        logger.warn('Transformação do perfil falhou');
      }
    }

    logger.info('=== Teste finalizado com sucesso ===');
  } catch (error: any) {
    logger.error(`Erro no teste: ${error.message}`);
    throw error;
  }
}

// Executar o teste
testarModuloPerfilSenadores()
  .then(() => {
    logger.info('Script de teste concluído com sucesso.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Falha na execução do teste', error);
    process.exit(1);
  });
