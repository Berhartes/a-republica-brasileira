/**
 * Script para iniciar o emulador do Firestore e fazer upload das estruturas para comparação
 */

const { spawn } = require('child_process');
const readline = require('readline');

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para perguntar ao usuário
function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, (resposta) => {
      resolve(resposta);
    });
  });
}

// Função para executar um comando
function executarComando(comando, args = [], opcoes = {}) {
  return new Promise((resolve, reject) => {
    console.log(`Executando: ${comando} ${args.join(' ')}`);
    
    const processo = spawn(comando, args, {
      ...opcoes,
      stdio: 'inherit',
      shell: true
    });
    
    processo.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });
  });
}

// Função principal
async function main() {
  try {
    console.log('=== COMPARAÇÃO DE ESTRUTURAS NO FIRESTORE ===');
    console.log('Este script irá iniciar o emulador do Firestore e fazer upload das estruturas para comparação.');
    console.log('');
    
    // Perguntar se deseja usar o emulador ou o Firestore real
    const usarEmulador = await perguntar('Deseja usar o emulador do Firestore? (S/N): ');
    
    if (usarEmulador.toLowerCase() === 's' || usarEmulador.toLowerCase() === 'sim') {
      console.log('\nIniciando o emulador do Firestore...');
      
      // Definir a variável de ambiente para o emulador
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      
      // Iniciar o emulador em um processo separado
      const emuladorProcesso = spawn('firebase', ['emulators:start', '--only', 'firestore'], {
        stdio: 'inherit',
        shell: true
      });
      
      // Aguardar um pouco para o emulador iniciar
      console.log('\nAguardando o emulador iniciar (10 segundos)...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      console.log('\nEmulador iniciado! Agora vamos fazer o upload das estruturas...');
    } else {
      console.log('\nUsando o Firestore real para a comparação...');
    }
    
    // Fazer o upload das estruturas
    console.log('\nFazendo upload das estruturas para comparação...');
    
    await executarComando('node', ['scripts/upload_estrutura_organizada.js']);
    
    console.log('\n=== UPLOAD CONCLUÍDO COM SUCESSO ===');
    console.log('\nAgora você pode comparar as estruturas no console do Firebase:');
    console.log('1. Estrutura organizada: estrutura_organizada/6358');
    console.log('2. Estrutura atual: congressoNacional/senadoFederal/perfis/6358');
    console.log('3. Estrutura atual/senadores/itens: congressoNacional/senadoFederal/atual/senadores/itens/6358');
    
    // Se estiver usando o emulador, abrir o console do emulador
    if (usarEmulador.toLowerCase() === 's' || usarEmulador.toLowerCase() === 'sim') {
      console.log('\nAbrindo o console do emulador do Firestore...');
      console.log('Acesse: http://localhost:4000/firestore');
      
      // Perguntar se deseja encerrar o emulador
      const encerrar = await perguntar('\nPressione ENTER quando terminar de comparar as estruturas para encerrar o emulador...');
      
      // Encerrar o emulador
      console.log('\nEncerrando o emulador do Firestore...');
      process.exit(0);
    }
    
    rl.close();
  } catch (error) {
    console.error('Erro:', error);
    rl.close();
    process.exit(1);
  }
}

// Executar a função principal
main();
