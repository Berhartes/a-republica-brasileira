/**
 * Configuração de ambiente - DEVE SER IMPORTADO PRIMEIRO!
 * 
 * Este módulo configura variáveis de ambiente baseadas nas flags
 * ANTES de qualquer outro import do sistema.
 */

/**
 * Configura variáveis de ambiente baseadas nos argumentos da linha de comando
 * DEVE ser executado ANTES de qualquer import do Firestore
 */
export function configurarVariaveisAmbiente(): void {
  const args = process.argv.slice(2);
  
  // Log inicial
  console.log('🔧 Configurando variáveis de ambiente baseadas nas flags...');
  console.log('📋 Argumentos recebidos:', args);
  
  // Detectar flags de destino
  const hasFirestore = args.includes('--firestore');
  const hasEmulator = args.includes('--emulator'); 
  const hasPC = args.includes('--pc');
  const hasMock = args.includes('--mock');
  
  // Validar exclusividade
  const destinos = [hasFirestore, hasEmulator, hasPC, hasMock].filter(Boolean);
  if (destinos.length > 1) {
    console.error('❌ Erro: Especifique apenas um destino: --firestore, --emulator, --pc ou --mock');
    process.exit(1);
  }
  
  // Configurar baseado nas flags
  if (hasEmulator) {
    console.log('🔌 Configurando para usar Firestore Emulator');
    process.env.USE_FIRESTORE_EMULATOR = 'true';
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
    console.log(`   Host do emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  } else if (hasFirestore) {
    console.log('☁️ Configurando para usar Firestore Real (Produção)');
    process.env.USE_REAL_FIRESTORE = 'true';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    delete process.env.FIRESTORE_EMULATOR_HOST; // Remove para garantir
  } else if (hasPC) {
    console.log('💾 Configurando para salvar no PC local');
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    process.env.SAVE_TO_PC = 'true';
    // Configurar diretório base para salvamento no PC
    process.env.PC_SAVE_DIR = 'C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica-brasileira\\src\\core';
  } else if (hasMock) {
    console.log('🎭 Configurando para usar Mock do Firestore');
    process.env.USE_REAL_FIRESTORE = 'false';
    process.env.USE_FIRESTORE_EMULATOR = 'false';
    process.env.USE_MOCK_FIRESTORE = 'true';
  } else {
    // Padrão: Firestore Real em produção, Mock em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      console.log('☁️ Ambiente de produção detectado - usando Firestore Real');
      process.env.USE_REAL_FIRESTORE = 'true';
    } else {
      console.log('🏗️ Ambiente de desenvolvimento - usando Mock por padrão');
      console.log('   Use --firestore para forçar Firestore real');
      console.log('   Use --emulator para usar o emulador');
      process.env.USE_REAL_FIRESTORE = 'false';
      process.env.USE_MOCK_FIRESTORE = 'true';
    }
  }
  
  // Log final da configuração
  console.log('✅ Configuração de ambiente concluída:');
  console.log(`   USE_REAL_FIRESTORE: ${process.env.USE_REAL_FIRESTORE}`);
  console.log(`   USE_FIRESTORE_EMULATOR: ${process.env.USE_FIRESTORE_EMULATOR}`);
  console.log(`   USE_MOCK_FIRESTORE: ${process.env.USE_MOCK_FIRESTORE}`);
  console.log(`   SAVE_TO_PC: ${process.env.SAVE_TO_PC}`);
  console.log('─'.repeat(60));
}

/**
 * Obtém a configuração de destino atual
 */
export function getDestinoConfig(): {
  useRealFirestore: boolean;
  useEmulator: boolean;
  useMock: boolean;
  saveToPC: boolean;
  pcSaveDir?: string;
} {
  return {
    useRealFirestore: process.env.USE_REAL_FIRESTORE === 'true',
    useEmulator: process.env.USE_FIRESTORE_EMULATOR === 'true',
    useMock: process.env.USE_MOCK_FIRESTORE === 'true',
    saveToPC: process.env.SAVE_TO_PC === 'true',
    pcSaveDir: process.env.PC_SAVE_DIR
  };
}
