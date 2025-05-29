/**
 * Script para processar perfis de senadores
 *
 * Este script utiliza o sistema modular ETL para extrair,
 * transformar e carregar perfis completos de senadores.
 *
 * Uso:
 *   npm run senado:perfil -- [legislatura] [opções]
 *
 * Exemplos:
 *   npm run senado:perfil                       # Processa legislatura atual
 *   npm run senado:perfil -- 57 --limite 10     # Legislatura 57, limitado a 10
 *   npm run senado:perfil -- --pc --verbose     # Salva no PC com logs detalhados
 *   npm run senado:perfil -- --emulator         # Usa Firestore Emulator
 *
 * Para mais opções, use: npm run senado:perfil -- --help
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from '../config/environment.config';
configurarVariaveisAmbiente();

import { ETLCommandParser } from '../utils/cli/etl-cli';
import { PerfilSenadoresProcessor } from '../processors/perfil-senadores.processor';
import { logger, LogLevel } from '../utils/logging';
import { ProcessingStatus } from '../types/etl.types';

/**
 * Função principal do script
 */
async function main(): Promise<void> {
  const startTime = Date.now();

  try {
    // Configurar parser de linha de comando
    const cli = new ETLCommandParser(
      'senado:perfil',
      'Processa perfis completos de senadores do Senado Federal'
    );

    // Adicionar opções customizadas específicas deste script
    cli.addCustomOption('--historico', () => true);
    cli.addCustomOption('--fotos', () => true);

    // Fazer parse dos argumentos
    const options = cli.parse();

    // Configurar nível de log baseado nas opções
    if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    }

    // Exibir banner inicial
    exibirBanner();

    // Criar processador
    const processor = new PerfilSenadoresProcessor(options);

    // Registrar callbacks de progresso se em modo verbose
    if (options.verbose) {
      processor.onProgress((event) => {
        if (event.status !== ProcessingStatus.FINALIZADO) {
          logger.debug(`Progresso: ${event.mensagem}`);
        }
      });
    }

    // Executar processamento
    logger.info('Iniciando processamento de perfis de senadores...');
    const resultado = await processor.process();

    // Exibir resumo final
    exibirResumo(resultado, startTime);

    // Sair com sucesso
    process.exit(0);

  } catch (error: any) {
    // Tratar erros
    logger.error('❌ Erro fatal no processamento:', error);

    if (error.stack && logger.getLevel() === LogLevel.DEBUG) {
      logger.debug('Stack trace:', error.stack);
    }

    // Exibir tempo decorrido mesmo em caso de erro
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.error(`⏱️ Tempo decorrido antes do erro: ${elapsed}s`);

    // Sair com erro
    process.exit(1);
  }
}

/**
 * Exibe o banner inicial do script
 */
function exibirBanner(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     🏛️  PROCESSADOR DE PERFIS DE SENADORES  🏛️               ║
║                                                               ║
║     Sistema ETL para dados do Senado Federal                 ║
║     Versão 2.0 - Arquitetura Modular                        ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);
}

/**
 * Exibe o resumo do processamento
 */
function exibirResumo(resultado: any, startTime: number): void {
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    RESUMO DO PROCESSAMENTO                    ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ✅ Processados com sucesso: ${String(resultado.sucessos).padEnd(30)} ║
║  ❌ Falhas no processamento: ${String(resultado.falhas).padEnd(30)} ║
║  ⚠️  Avisos durante processo: ${String(resultado.avisos || 0).padEnd(29)} ║
║                                                               ║
║  ⏱️  Tempo total: ${String(totalTime + 's').padEnd(41)} ║
║  💾 Destino dos dados: ${String(resultado.destino).padEnd(36)} ║
${resultado.legislatura ? `║  🏛️  Legislatura processada: ${String(resultado.legislatura).padEnd(30)} ║\n` : ''}║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✨ Processamento concluído com sucesso!
`);

  // Detalhes adicionais se verbose
  if (resultado.tempoExtracao || resultado.tempoTransformacao || resultado.tempoCarregamento) {
    console.log('📊 Detalhamento de tempo:');
    if (resultado.tempoExtracao) {
      console.log(`   • Extração: ${resultado.tempoExtracao.toFixed(2)}s`);
    }
    if (resultado.tempoTransformacao) {
      console.log(`   • Transformação: ${resultado.tempoTransformacao.toFixed(2)}s`);
    }
    if (resultado.tempoCarregamento) {
      console.log(`   • Carregamento: ${resultado.tempoCarregamento.toFixed(2)}s`);
    }
  }
}

// Executar o script se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('Erro não tratado:', error);
    process.exit(1);
  });
}

// Exportar para uso como módulo
export { main as processarPerfilSenadores };
export default main;
