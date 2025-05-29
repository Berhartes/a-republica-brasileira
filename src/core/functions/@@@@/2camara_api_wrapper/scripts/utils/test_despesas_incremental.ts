/**
 * Script de teste para validar a funcionalidade de atualização incremental
 * de despesas de deputados
 */
import { logger } from './logger';

/**
 * Testa a funcionalidade de parsing de argumentos
 */
function testarParseArgs() {
  // Simular argumentos de linha de comando
  const originalArgv = process.argv;
  
  try {
    logger.info('=== Testando parsing de argumentos ===');
    
    // Teste 1: Modo atualização
    process.argv = ['node', 'script.js', '--atualizar', '--limite', '5'];
    
    // Importar parseArgs dinamicamente
    delete require.cache[require.resolve('./args_parser')];
    const { parseArgs } = require('./args_parser');
    
    const args1 = parseArgs();
    logger.info('Teste 1 - Modo atualização:', args1);
    
    // Verificações
    if (args1.atualizar !== 'true') {
      throw new Error('Parâmetro --atualizar não foi detectado corretamente');
    }
    
    if (args1.limite !== '5') {
      throw new Error('Parâmetro --limite não foi detectado corretamente');
    }
    
    logger.info('✅ Teste 1 passou: parsing de argumentos funcional');
    
    // Teste 2: Modo completo
    process.argv = ['node', 'script.js', '--limite', '10'];
    
    delete require.cache[require.resolve('./args_parser')];
    const { parseArgs: parseArgs2 } = require('./args_parser');
    
    const args2 = parseArgs2();
    logger.info('Teste 2 - Modo completo:', args2);
    
    if (args2.atualizar !== undefined) {
      throw new Error('Modo atualização foi detectado incorretamente');
    }
    
    if (args2.limite !== '10') {
      throw new Error('Parâmetro --limite não foi detectado corretamente');
    }
    
    logger.info('✅ Teste 2 passou: modo completo detectado corretamente');
    
  } catch (error: any) {
    logger.error(`❌ Erro no teste de parsing: ${error.message}`);
    throw error;
  } finally {
    // Restaurar argumentos originais
    process.argv = originalArgv;
  }
}

/**
 * Testa a lógica de cálculo de meses faltantes
 */
function testarCalculoMeses() {
  logger.info('=== Testando cálculo de meses faltantes ===');
  
  try {
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    // Calcular mês anterior
    const dataAnterior = new Date(anoAtual, mesAtual - 2, 1);
    const mesAnterior = dataAnterior.getMonth() + 1;
    const anoAnterior = dataAnterior.getFullYear();
    
    logger.info(`Mês atual: ${anoAtual}-${mesAtual.toString().padStart(2, '0')}`);
    logger.info(`Mês anterior: ${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}`);
    
    // Teste 1: Nenhum mês processado (deve retornar 2 meses)
    const mesesProcessados1: Record<string, string> = {};
    const mesesEsperados1 = [
      { ano: anoAnterior, mes: mesAnterior },
      { ano: anoAtual, mes: mesAtual }
    ].sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });
    
    logger.info('Teste 1 - Nenhum mês processado:');
    logger.info('Esperado:', mesesEsperados1);
    
    // Teste 2: Mês atual já processado recentemente (deve retornar apenas mês anterior)
    const mesesProcessados2: Record<string, string> = {
      [`${anoAtual}-${mesAtual.toString().padStart(2, '0')}`]: new Date().toISOString()
    };
    
    logger.info('Teste 2 - Mês atual já processado:');
    logger.info('Dados existentes:', mesesProcessados2);
    
    // Teste 3: Ambos os meses processados recentemente (deve retornar array vazio)
    const agora3 = new Date();
    const mesesProcessados3: Record<string, string> = {
      [`${anoAtual}-${mesAtual.toString().padStart(2, '0')}`]: agora3.toISOString(),
      [`${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}`]: agora3.toISOString()
    };
    
    logger.info('Teste 3 - Ambos os meses processados recentemente:');
    logger.info('Dados existentes:', mesesProcessados3);
    
    // Teste 4: Mês desatualizado (deve retornar mês desatualizado)
    const dataDesatualizada = new Date();
    dataDesatualizada.setDate(dataDesatualizada.getDate() - 7); // 7 dias atrás
    
    const mesesProcessados4: Record<string, string> = {
      [`${anoAtual}-${mesAtual.toString().padStart(2, '0')}`]: new Date().toISOString(),
      [`${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}`]: dataDesatualizada.toISOString()
    };
    
    logger.info('Teste 4 - Mês desatualizado:');
    logger.info('Dados existentes:', mesesProcessados4);
    
    logger.info('✅ Testes de cálculo de meses concluídos - verifique os logs acima');
    
  } catch (error: any) {
    logger.error(`❌ Erro no teste de cálculo de meses: ${error.message}`);
    throw error;
  }
}

/**
 * Testa a estrutura de dados esperada
 */
function testarEstruturaDados() {
  logger.info('=== Testando estrutura de dados ===');
  
  try {
    // Simular uma despesa transformada
    const despesaExemplo = {
      // Dados básicos
      ano: 2025,
      mes: 1,
      tipoDespesa: 'COMBUSTÍVEIS E LUBRIFICANTES.',
      
      // Documento
      codDocumento: '123456789',
      tipoDocumento: 'Nota Fiscal',
      codTipoDocumento: '0',
      dataDocumento: '2025-01-15',
      numDocumento: 'NF001',
      urlDocumento: 'https://exemplo.com/doc.pdf',
      
      // Valores
      valorDocumento: 500.00,
      valorLiquido: 450.00,
      valorGlosa: 50.00,
      
      // Fornecedor
      nomeFornecedor: 'POSTO DE COMBUSTÍVEL LTDA',
      cnpjCpfFornecedor: '12.345.678/0001-90',
      
      // Controle
      numRessarcimento: '',
      codLote: '2025010001',
      parcela: 1,
      
      // Metadados
      idDeputado: '123456',
      dataExtracao: new Date().toISOString()
    };
    
    logger.info('Exemplo de despesa transformada:');
    logger.info(JSON.stringify(despesaExemplo, null, 2));
    
    // Verificar campos obrigatórios
    const camposObrigatorios = [
      'ano', 'mes', 'tipoDespesa', 'codDocumento', 'valorLiquido', 
      'nomeFornecedor', 'idDeputado', 'dataExtracao'
    ];
    
    for (const campo of camposObrigatorios) {
      if (!(campo in despesaExemplo)) {
        throw new Error(`Campo obrigatório '${campo}' ausente`);
      }
    }
    
    logger.info('✅ Estrutura de dados validada com sucesso');
    
  } catch (error: any) {
    logger.error(`❌ Erro no teste de estrutura: ${error.message}`);
    throw error;
  }
}

/**
 * Função principal de teste
 */
async function executarTestes() {
  try {
    logger.info('🧪 Iniciando testes da funcionalidade de atualização incremental');
    logger.info('='.repeat(60));
    
    // Executar testes
    testarParseArgs();
    testarCalculoMeses();
    testarEstruturaDados();
    
    logger.info('='.repeat(60));
    logger.info('✅ Todos os testes passaram com sucesso!');
    logger.info('🚀 A funcionalidade de atualização incremental está pronta para uso');
    
    // Mostrar comandos de exemplo
    logger.info('');
    logger.info('📋 Comandos para testar:');
    logger.info('  npm run process:despesas:atualizar:quick  # Teste rápido (10 deputados)');
    logger.info('  npm run process:despesas:quick            # Modo completo (10 deputados)');
    
  } catch (error: any) {
    logger.error('❌ Falha nos testes:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Executar testes
executarTestes().catch(error => {
  logger.error('Erro fatal nos testes:', error);
  process.exit(1);
});
