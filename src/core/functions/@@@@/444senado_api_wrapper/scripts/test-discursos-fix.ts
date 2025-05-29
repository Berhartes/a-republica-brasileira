/**
 * Teste rápido para verificar se as correções do processador de discursos estão funcionando
 */

// IMPORTANTE: Configurar variáveis de ambiente ANTES de qualquer import do Firestore
import { configurarVariaveisAmbiente } from './config/environment.config';
configurarVariaveisAmbiente();

import { DiscursosProcessor } from './processors/discursos.processor';
import { logger, LogLevel } from './utils/logging';

async function testarCorrecoes() {
  try {
    console.log('🧪 Testando correções do processador de discursos...\n');

    // Configurar log para debug
    logger.setLevel(LogLevel.DEBUG);

    // Criar processador com opções de teste
    const options = {
      legislatura: 56,
      limite: 2,
      destino: 'pc',
      verbose: true,
      dryRun: true
    };

    const processor = new DiscursosProcessor(options);

    // Registrar callback de progresso
    processor.onProgress((event) => {
      console.log(`📊 Progresso: ${event.mensagem}`);
    });

    console.log('🔧 Iniciando teste de validação...');
    const validacao = await processor.validate();
    
    if (!validacao.valido) {
      console.error('❌ Validação falhou:', validacao.erros);
      return;
    }

    console.log('✅ Validação passou!');
    console.log('📋 Avisos:', validacao.avisos);

    console.log('\n🔧 Iniciando teste de extração...');
    
    // Testar apenas a extração para verificar se as correções funcionam
    const extractedData = await processor['extract']();
    
    console.log('\n📊 Resultado da extração:');
    console.log(`- Legislatura: ${extractedData.legislatura}`);
    console.log(`- Período: ${extractedData.periodo.dataInicio} a ${extractedData.periodo.dataFim}`);
    console.log(`- Discursos encontrados: ${extractedData.discursos.length}`);

    if (extractedData.discursos.length > 0) {
      console.log('✅ Extração funcionando! Encontrados discursos.');
      console.log('\n📝 Exemplo de discurso:');
      console.log(JSON.stringify(extractedData.discursos[0], null, 2));
    } else {
      console.log('⚠️ Nenhum discurso encontrado. Isso pode ser normal dependendo da legislatura/período.');
    }

    console.log('\n🎉 Teste concluído com sucesso!');
    
  } catch (error: any) {
    console.error('❌ Erro durante o teste:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Executar teste
if (require.main === module) {
  testarCorrecoes()
    .then(() => {
      console.log('\n✨ Teste finalizado!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Erro não tratado:', error);
      process.exit(1);
    });
}

export { testarCorrecoes };
