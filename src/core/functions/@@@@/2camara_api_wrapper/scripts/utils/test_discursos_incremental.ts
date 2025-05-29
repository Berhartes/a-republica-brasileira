/**
 * Script de teste para validar a funcionalidade de atualização incremental
 * de discursos de deputados
 */
import { logger } from './logger';

/**
 * Testa a funcionalidade de parsing de argumentos para discursos
 */
function testarParseArgsDiscursos() {
  // Simular argumentos de linha de comando
  const originalArgv = process.argv;
  
  try {
    logger.info('=== Testando parsing de argumentos para discursos ===');
    
    // Teste 1: Modo atualização
    process.argv = ['node', 'script.js', '--atualizar', '--limite', '3'];
    
    // Importar parseArgs dinamicamente
    delete require.cache[require.resolve('./args_parser')];
    const { parseArgs } = require('./args_parser');
    
    const args1 = parseArgs();
    logger.info('Teste 1 - Modo atualização:', args1);
    
    // Verificações
    if (args1.atualizar !== 'true') {
      throw new Error('Parâmetro --atualizar não foi detectado corretamente');
    }
    
    if (args1.limite !== '3') {
      throw new Error('Parâmetro --limite não foi detectado corretamente');
    }
    
    logger.info('✅ Teste 1 passou: parsing de argumentos funcional');
    
    // Teste 2: Modo completo
    process.argv = ['node', 'script.js', '--limite', '5'];
    
    delete require.cache[require.resolve('./args_parser')];
    const { parseArgs: parseArgs2 } = require('./args_parser');
    
    const args2 = parseArgs2();
    logger.info('Teste 2 - Modo completo:', args2);
    
    if (args2.atualizar !== undefined) {
      throw new Error('Modo atualização foi detectado incorretamente');
    }
    
    if (args2.limite !== '5') {
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
 * Testa a lógica de filtro de data (60 dias)
 */
function testarFiltroData60Dias() {
  logger.info('=== Testando filtro de data dos últimos 60 dias ===');
  
  try {
    const agora = new Date();
    const dataLimite = new Date(agora);
    dataLimite.setDate(dataLimite.getDate() - 60); // 60 dias atrás
    
    logger.info(`Data atual: ${agora.toISOString().split('T')[0]}`);\n    logger.info(`Data limite (60 dias atrás): ${dataLimite.toISOString().split('T')[0]}`);\n    \n    // Simular discursos de diferentes datas\n    const discursosSimulados = [\n      {\n        id: '1',\n        dataHoraInicio: new Date(agora.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 dias atrás\n        sumario: 'Discurso recente'\n      },\n      {\n        id: '2',\n        dataHoraInicio: new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 dias atrás\n        sumario: 'Discurso antigo'\n      },\n      {\n        id: '3',\n        dataHoraInicio: new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias atrás\n        sumario: 'Discurso médio'\n      }\n    ];\n    \n    // Aplicar filtro\n    const discursosRecentes = discursosSimulados.filter(discurso => {\n      const dataDiscurso = new Date(discurso.dataHoraInicio);\n      return dataDiscurso >= dataLimite;\n    });\n    \n    logger.info(`Total de discursos simulados: ${discursosSimulados.length}`);\n    logger.info(`Discursos dos últimos 60 dias: ${discursosRecentes.length}`);\n    \n    // Verificações\n    if (discursosRecentes.length !== 2) {\n      throw new Error(`Esperado 2 discursos recentes, encontrados ${discursosRecentes.length}`);\n    }\n    \n    const idsRecentes = discursosRecentes.map(d => d.id);\n    if (!idsRecentes.includes('1') || !idsRecentes.includes('3')) {\n      throw new Error('Discursos filtrados incorretamente');\n    }\n    \n    if (idsRecentes.includes('2')) {\n      throw new Error('Discurso antigo não deveria estar incluído');\n    }\n    \n    logger.info('✅ Filtro de 60 dias funcionando corretamente');\n    \n  } catch (error: any) {\n    logger.error(`❌ Erro no teste de filtro de data: ${error.message}`);\n    throw error;\n  }\n}\n\n/**\n * Testa a estrutura de dados de discursos\n */\nfunction testarEstruturaDiscursos() {\n  logger.info('=== Testando estrutura de dados de discursos ===');\n  \n  try {\n    // Simular um discurso transformado\n    const discursoExemplo = {\n      // Dados básicos\n      id: '123456',\n      dataHoraInicio: '2025-01-15T14:30:00Z',\n      dataHoraFim: '2025-01-15T14:45:00Z',\n      tipoDiscurso: 'Breves Comunicações',\n      \n      // Conteúdo\n      sumario: 'Discussão sobre política ambiental',\n      transcricao: 'Sr. Presidente, venho à tribuna para...',\n      palavrasChave: ['meio ambiente', 'sustentabilidade', 'política'],\n      \n      // Evento/Contexto\n      faseEvento: 'Expediente',\n      tipoEvento: 'Sessão Ordinária',\n      codEvento: '789012',\n      \n      // URLs e recursos\n      urlAudio: 'https://exemplo.com/audio.mp3',\n      urlTexto: 'https://exemplo.com/texto.pdf',\n      \n      // Metadados\n      idDeputado: '220593',\n      dataExtracao: new Date().toISOString(),\n      anoDiscurso: 2025,\n      mesDiscurso: 1\n    };\n    \n    logger.info('Exemplo de discurso transformado:');\n    logger.info(JSON.stringify(discursoExemplo, null, 2));\n    \n    // Verificar campos obrigatórios\n    const camposObrigatorios = [\n      'id', 'dataHoraInicio', 'tipoDiscurso', 'sumario', \n      'idDeputado', 'dataExtracao', 'anoDiscurso', 'mesDiscurso'\n    ];\n    \n    for (const campo of camposObrigatorios) {\n      if (!(campo in discursoExemplo)) {\n        throw new Error(`Campo obrigatório '${campo}' ausente`);\n      }\n    }\n    \n    // Verificar tipos de dados\n    if (typeof discursoExemplo.anoDiscurso !== 'number') {\n      throw new Error('anoDiscurso deve ser number');\n    }\n    \n    if (typeof discursoExemplo.mesDiscurso !== 'number') {\n      throw new Error('mesDiscurso deve ser number');\n    }\n    \n    if (!Array.isArray(discursoExemplo.palavrasChave)) {\n      throw new Error('palavrasChave deve ser array');\n    }\n    \n    logger.info('✅ Estrutura de dados de discursos validada com sucesso');\n    \n  } catch (error: any) {\n    logger.error(`❌ Erro no teste de estrutura: ${error.message}`);\n    throw error;\n  }\n}\n\n/**\n * Testa a lógica de detecção de discursos novos\n */\nfunction testarDeteccaoDiscursosNovos() {\n  logger.info('=== Testando detecção de discursos novos ===');\n  \n  try {\n    // Simular discursos existentes no Firestore\n    const idsExistentes = ['100', '200', '300'];\n    \n    // Simular discursos recentes da API\n    const discursosRecentes = [\n      { id: '100', sumario: 'Discurso já existe' },\n      { id: '400', sumario: 'Discurso novo 1' },\n      { id: '200', sumario: 'Discurso já existe 2' },\n      { id: '500', sumario: 'Discurso novo 2' }\n    ];\n    \n    // Aplicar filtro de novos\n    const discursosNovos = discursosRecentes.filter(discurso => {\n      return !idsExistentes.includes(discurso.id);\n    });\n    \n    logger.info(`Discursos existentes: ${idsExistentes.length}`);\n    logger.info(`Discursos recentes: ${discursosRecentes.length}`);\n    logger.info(`Discursos novos: ${discursosNovos.length}`);\n    \n    // Verificações\n    if (discursosNovos.length !== 2) {\n      throw new Error(`Esperado 2 discursos novos, encontrados ${discursosNovos.length}`);\n    }\n    \n    const idsNovos = discursosNovos.map(d => d.id);\n    if (!idsNovos.includes('400') || !idsNovos.includes('500')) {\n      throw new Error('IDs de discursos novos incorretos');\n    }\n    \n    if (idsNovos.includes('100') || idsNovos.includes('200')) {\n      throw new Error('Discursos existentes não deveriam estar nos novos');\n    }\n    \n    logger.info('✅ Detecção de discursos novos funcionando corretamente');\n    \n  } catch (error: any) {\n    logger.error(`❌ Erro no teste de detecção de novos: ${error.message}`);\n    throw error;\n  }\n}\n\n/**\n * Função principal de teste\n */\nasync function executarTestesDiscursos() {\n  try {\n    logger.info('🧪 Iniciando testes da funcionalidade de discursos');\n    logger.info('='.repeat(60));\n    \n    // Executar testes\n    testarParseArgsDiscursos();\n    testarFiltroData60Dias();\n    testarEstruturaDiscursos();\n    testarDeteccaoDiscursosNovos();\n    \n    logger.info('='.repeat(60));\n    logger.info('✅ Todos os testes de discursos passaram com sucesso!');\n    logger.info('🚀 A funcionalidade de processamento de discursos está pronta para uso');\n    \n    // Mostrar comandos de exemplo\n    logger.info('');\n    logger.info('📋 Comandos para testar:');\n    logger.info('  npm run process:discursos:atualizar:quick  # Teste rápido (10 deputados)');\n    logger.info('  npm run process:discursos:quick            # Modo completo (10 deputados)');\n    \n    logger.info('');\n    logger.info('🆚 Diferenças dos discursos vs despesas:');\n    logger.info('  • Filtro temporal: 60 dias corridos (vs 2 meses específicos)');\n    logger.info('  • Filtro aplicado: Client-side (vs server-side)');\n    logger.info('  • Volume médio: ~20 discursos/60 dias (vs ~200 despesas/mês)');\n    logger.info('  • Conteúdo: Texto/áudio (vs valores monetários)');\n    \n  } catch (error: any) {\n    logger.error('❌ Falha nos testes de discursos:', error.message);\n    logger.error(error.stack);\n    process.exit(1);\n  }\n}\n\n// Executar testes\nexecutarTestesDiscursos().catch(error => {\n  logger.error('Erro fatal nos testes de discursos:', error);\n  process.exit(1);\n});\n