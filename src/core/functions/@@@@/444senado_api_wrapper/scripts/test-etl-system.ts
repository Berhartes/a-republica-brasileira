/**
 * Script de teste para verificar se o sistema ETL foi instalado corretamente
 * 
 * Este script executa testes básicos em todos os componentes principais
 * para garantir que a instalação está funcionando.
 * 
 * Uso:
 *   npm run test-etl
 */

import { logger } from './utils/logging/logger';
import { etlConfig } from './config/etl.config';
import { ETLCommandParser } from './utils/cli/etl-cli';

/**
 * Testa a configuração do sistema
 */
function testarConfiguracao(): boolean {
  try {
    logger.info('🔧 Testando configuração do sistema...');
    
    // Verificar se as configurações estão carregadas
    if (!etlConfig) {
      throw new Error('Configuração ETL não carregada');
    }
    
    if (!etlConfig.senado) {
      throw new Error('Configuração do Senado não encontrada');
    }
    
    if (!etlConfig.firestore) {
      throw new Error('Configuração do Firestore não encontrada');
    }
    
    logger.info('✅ Configuração carregada com sucesso');
    logger.info(`   - Concorrência do Senado: ${etlConfig.senado.concurrency}`);
    logger.info(`   - Timeout: ${etlConfig.senado.timeout}ms`);
    logger.info(`   - Batch size Firestore: ${etlConfig.firestore.batchSize}`);
    
    return true;
  } catch (error: any) {
    logger.error('❌ Erro na configuração:', error.message);
    return false;
  }
}

/**
 * Testa o sistema de CLI
 */
function testarCLI(): boolean {
  try {
    logger.info('🔧 Testando sistema de CLI...');
    
    // Salvar argumentos originais
    const originalArgv = [...process.argv];
    
    // Criar instância do parser
    const cli = new ETLCommandParser('test', 'Teste do sistema CLI');
    
    // Simular parsing de argumentos básicos
    const argumentosTeste = ['node', 'script.js', '--57', '--limite', '5', '--verbose'];
    process.argv = argumentosTeste;
    
    const options = cli.parse();
    
    // Restaurar argumentos originais
    process.argv = originalArgv;
    
    // Verificar se o parsing funcionou
    if (options.legislatura !== 57) {
      throw new Error('Parsing de legislatura falhou');
    }
    
    if (options.limite !== 5) {
      throw new Error('Parsing de limite falhou');
    }
    
    if (!options.verbose) {
      throw new Error('Parsing de verbose falhou');
    }
    
    logger.info('✅ Sistema CLI funcionando corretamente');
    logger.info(`   - Legislatura: ${options.legislatura}`);
    logger.info(`   - Limite: ${options.limite}`);
    logger.info(`   - Verbose: ${options.verbose}`);
    
    return true;
  } catch (error: any) {
    logger.error('❌ Erro no sistema CLI:', error.message);
    return false;
  }
}

/**
 * Testa o sistema de logging
 */
function testarLogging(): boolean {
  try {
    logger.info('🔧 Testando sistema de logging...');
    
    // Testar diferentes níveis de log
    logger.debug('🐛 Log de debug (pode não aparecer se level > debug)');
    logger.info('ℹ️ Log de informação');
    logger.warn('⚠️ Log de aviso');
    logger.error('❌ Log de erro (teste, não é um erro real)');
    
    logger.info('✅ Sistema de logging funcionando');
    
    return true;
  } catch (error: any) {
    console.error('❌ Erro no sistema de logging:', error.message);
    return false;
  }
}

/**
 * Testa as importações dos processadores
 */
async function testarImportacoes(): Promise<boolean> {
  try {
    logger.info('🔧 Testando importações dos processadores...');
    
    // Testar importação dos processadores principais
    const { PerfilSenadoresProcessor } = await import('./processors/perfil-senadores.processor');
    const { ComissoesProcessor } = await import('./processors/comissoes.processor');
    const { LiderancasProcessor } = await import('./processors/liderancas.processor');
    const { ETLProcessor } = await import('./core/etl-processor');
    const { ETLCommandParser } = await import('./utils/cli/etl-cli');
    
    // Verificar se as classes foram importadas
    if (!PerfilSenadoresProcessor) {
      throw new Error('PerfilSenadoresProcessor não importado');
    }
    
    if (!ComissoesProcessor) {
      throw new Error('ComissoesProcessor não importado');
    }
    
    if (!LiderancasProcessor) {
      throw new Error('LiderancasProcessor não importado');
    }
    
    if (!ETLProcessor) {
      throw new Error('ETLProcessor não importado');
    }
    
    if (!ETLCommandParser) {
      throw new Error('ETLCommandParser não importado');
    }
    
    logger.info('✅ Importações funcionando corretamente');
    logger.info('   - PerfilSenadoresProcessor: OK');
    logger.info('   - ComissoesProcessor: OK');
    logger.info('   - LiderancasProcessor: OK');
    logger.info('   - ETLProcessor: OK');
    logger.info('   - ETLCommandParser: OK');
    
    return true;
  } catch (error: any) {
    logger.error('❌ Erro nas importações:', error.message);
    return false;
  }
}

/**
 * Testa os processadores disponíveis
 */
async function testarProcessadores(): Promise<boolean> {
  try {
    logger.info('🔧 Testando processadores disponíveis...');
    
    const processadores = [
      'perfil-senadores.processor',
      'comissoes.processor',
      'liderancas.processor',
      'mesas.processor',
      'senadores.processor',
      'materias.processor',
      'votacoes.processor',
      'blocos.processor',
      'discursos.processor'
    ];
    
    let sucessos = 0;
    
    for (const processador of processadores) {
      try {
        await import(`./processors/${processador}`);
        logger.info(`   ✅ ${processador}: OK`);
        sucessos++;
      } catch (error: any) {
        logger.warn(`   ⚠️ ${processador}: ${error.message}`);
      }
    }
    
    logger.info(`✅ Processadores testados: ${sucessos}/${processadores.length} funcionando`);
    
    return sucessos >= 6; // Pelo menos 6 processadores devem funcionar
  } catch (error: any) {
    logger.error('❌ Erro ao testar processadores:', error.message);
    return false;
  }
}

/**
 * Executa todos os testes
 */
async function executarTestes(): Promise<void> {
  logger.info('🧪 INICIANDO TESTES DO SISTEMA ETL v2.0');
  logger.info('='.repeat(60));
  
  const resultados = {
    configuracao: false,
    cli: false,
    logging: false,
    importacoes: false,
    processadores: false
  };
  
  // Executar testes
  resultados.configuracao = testarConfiguracao();
  resultados.cli = testarCLI();
  resultados.logging = testarLogging();
  resultados.importacoes = await testarImportacoes();
  resultados.processadores = await testarProcessadores();
  
  // Resumo
  logger.info('='.repeat(60));
  logger.info('📊 RESUMO DOS TESTES DO SISTEMA ETL v2.0');
  logger.info('='.repeat(60));
  
  const totalTestes = Object.keys(resultados).length;
  const testesPassaram = Object.values(resultados).filter(Boolean).length;
  
  Object.entries(resultados).forEach(([teste, passou]) => {
    const status = passou ? '✅ PASSOU' : '❌ FALHOU';
    logger.info(`   ${teste.padEnd(15)}: ${status}`);
  });
  
  logger.info('='.repeat(60));
  logger.info(`📈 RESULTADO: ${testesPassaram}/${totalTestes} testes passaram`);
  
  if (testesPassaram === totalTestes) {
    logger.info('🎉 TODOS OS TESTES PASSARAM! Sistema ETL v2.0 está funcionando perfeitamente.');
    logger.info('');
    logger.info('🚀 Sistema completamente refatorado e modular!');
    logger.info('📦 9 processadores disponíveis com arquitetura unificada');
    logger.info('');
    logger.info('💡 Próximos passos:');
    logger.info('   1. Configure o .env com suas credenciais');
    logger.info('   2. Teste um processador: npm run senado:perfil -- --dry-run --limite 1');
    logger.info('   3. Execute com dados reais: npm run senado:perfil -- --pc --limite 5');
    logger.info('   4. Use diferentes processadores: npm run senado:comissoes -- --help');
    logger.info('');
    logger.info('📋 Processadores disponíveis:');
    logger.info('   • senado:perfil      - Perfis completos de senadores');
    logger.info('   • senado:comissoes   - Comissões parlamentares');
    logger.info('   • senado:liderancas  - Lideranças parlamentares');
    logger.info('   • senado:mesas       - Mesas diretoras');
    logger.info('   • senado:senadores   - Senadores em exercício');
    logger.info('   • senado:materias    - Matérias legislativas');
    logger.info('   • senado:votacoes    - Votações (requer legislatura)');
    logger.info('   • senado:blocos      - Blocos parlamentares');
    logger.info('   • senado:discursos   - Discursos de senadores');
  } else {
    logger.error('⚠️ Alguns testes falharam. Verifique a instalação.');
    logger.error(`${totalTestes - testesPassaram} de ${totalTestes} testes falharam.`);
    process.exit(1);
  }
}

// Executar testes se este arquivo for chamado diretamente
if (require.main === module) {
  executarTestes().catch(error => {
    console.error('Erro crítico nos testes:', error);
    process.exit(1);
  });
}

export { executarTestes };
