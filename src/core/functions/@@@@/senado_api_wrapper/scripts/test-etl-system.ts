/**
 * Script de teste para verificar a configuração do sistema ETL
 * 
 * Execute com: npx ts-node -P tsconfig.scripts.json src/core/functions/senado_api_wrapper/scripts/test-etl-system.ts
 */

import { etlConfig, validateConfig } from './config/etl.config';
import { ETLCommandParser } from './utils/cli/etl-cli';
import { logger, LogLevel } from './utils/logging';

async function testSystem(): Promise<void> {
  console.log('🧪 Testando Sistema ETL Modular\n');

  // 1. Testar configuração
  console.log('1️⃣ Verificando Configuração:');
  try {
    validateConfig(etlConfig);
    console.log('✅ Configuração válida');
    console.log(`   - Concorrência: ${etlConfig.senado.concurrency}`);
    console.log(`   - Max Retries: ${etlConfig.senado.maxRetries}`);
    console.log(`   - Timeout: ${etlConfig.senado.timeout}ms`);
    console.log(`   - Batch Size: ${etlConfig.firestore.batchSize}`);
  } catch (error: any) {
    console.error(`❌ Erro na configuração: ${error.message}`);
  }

  // 2. Testar parser CLI
  console.log('\n2️⃣ Testando Parser CLI:');
  const cli = new ETLCommandParser('test-system', 'Teste do sistema ETL');
  
  // Simular argumentos
  const testArgs = ['57', '--limite', '5', '--verbose', '--pc'];
  process.argv = ['node', 'test-script.ts', ...testArgs];
  
  try {
    const options = cli.parse();
    console.log('✅ Parser CLI funcionando');
    console.log(`   - Legislatura: ${options.legislatura}`);
    console.log(`   - Limite: ${options.limite}`);
    console.log(`   - Destino: ${options.destino}`);
    console.log(`   - Verbose: ${options.verbose}`);
  } catch (error: any) {
    console.error(`❌ Erro no parser CLI: ${error.message}`);
  }

  // 3. Testar sistema de logs
  console.log('\n3️⃣ Testando Sistema de Logs:');
  logger.setLevel(LogLevel.DEBUG);
  logger.debug('Mensagem de DEBUG');
  logger.info('Mensagem de INFO');
  logger.warn('Mensagem de WARN');
  logger.error('Mensagem de ERROR');
  console.log('✅ Sistema de logs funcionando');

  // 4. Verificar imports
  console.log('\n4️⃣ Verificando Imports:');
  try {
    const { PerfilSenadoresProcessor } = await import('./processors/perfil-senadores.processor');
    console.log('✅ Processador de perfis importado com sucesso');
    
    const { perfilSenadoresExtractor } = await import('./extracao/perfilsenadores');
    console.log('✅ Extrator importado com sucesso');
    
    const { perfilSenadoresTransformer } = await import('./transformacao/perfilsenadores');
    console.log('✅ Transformador importado com sucesso');
    
    const { perfilSenadoresLoader } = await import('./carregamento/perfilsenadores');
    console.log('✅ Carregador importado com sucesso');
  } catch (error: any) {
    console.error(`❌ Erro ao importar módulos: ${error.message}`);
  }

  console.log('\n✨ Teste do sistema concluído!');
  console.log('\n📝 Para executar o processador de perfis, use:');
  console.log('   npm run senado:perfil -- --help');
}

// Executar teste
if (require.main === module) {
  testSystem().catch(console.error);
}
