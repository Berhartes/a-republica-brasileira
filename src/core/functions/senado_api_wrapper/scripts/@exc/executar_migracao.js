/**
 * Script para executar a migração da estrutura de dados do Senado Federal
 * 
 * Este script facilita a execução da migração, oferecendo uma interface
 * interativa para o usuário escolher as opções de migração.
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

// Função principal
async function main() {
  console.log('=== MIGRAÇÃO DA ESTRUTURA DE DADOS DO SENADO FEDERAL ===');
  console.log('Este script irá migrar os dados da estrutura antiga para a nova estrutura normalizada.');
  console.log('');
  
  // Perguntar sobre o modo de simulação
  const simulacao = await perguntar('Executar em modo de simulação (sem alterar o Firestore)? (S/N): ');
  const modoSimulacao = simulacao.toLowerCase() === 's' || simulacao.toLowerCase() === 'sim';
  
  // Perguntar sobre exportação
  const exportar = await perguntar('Exportar dados normalizados para o PC? (S/N): ');
  const modoExportar = exportar.toLowerCase() === 's' || exportar.toLowerCase() === 'sim';
  
  // Perguntar sobre limite
  const limite = await perguntar('Limitar o número de senadores a serem migrados? (0 para todos): ');
  const numeroLimite = parseInt(limite, 10) || 0;
  
  // Perguntar sobre remoção da estrutura antiga
  let modoRemover = false;
  if (!modoSimulacao) {
    const remover = await perguntar('Remover dados da estrutura antiga após a migração? (S/N): ');
    modoRemover = remover.toLowerCase() === 's' || remover.toLowerCase() === 'sim';
  }
  
  // Confirmar configurações
  console.log('\nConfiguração da migração:');
  console.log(`- Modo de simulação: ${modoSimulacao ? 'SIM' : 'NÃO'}`);
  console.log(`- Exportar dados: ${modoExportar ? 'SIM' : 'NÃO'}`);
  console.log(`- Limite de senadores: ${numeroLimite > 0 ? numeroLimite : 'Todos'}`);
  console.log(`- Remover estrutura antiga: ${modoRemover ? 'SIM' : 'NÃO'}`);
  
  const confirmar = await perguntar('\nConfirmar e iniciar a migração? (S/N): ');
  
  if (confirmar.toLowerCase() !== 's' && confirmar.toLowerCase() !== 'sim') {
    console.log('Migração cancelada pelo usuário.');
    rl.close();
    return;
  }
  
  // Construir comando
  let comando = 'npx ts-node -P tsconfig.scripts.json scripts/migrar_estrutura_senadores.ts';
  
  if (modoSimulacao) {
    comando += ' --simulacao=true';
  }
  
  if (modoExportar) {
    comando += ' --exportar=true';
  }
  
  if (numeroLimite > 0) {
    comando += ` --limite=${numeroLimite}`;
  }
  
  if (modoRemover) {
    comando += ' --remover=true';
  }
  
  console.log(`\nExecutando comando: ${comando}`);
  
  // Fechar interface de linha de comando
  rl.close();
  
  // Executar comando
  const [cmd, ...args] = comando.split(' ');
  
  const processo = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true
  });
  
  processo.on('close', (code) => {
    if (code === 0) {
      console.log('\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO ===');
    } else {
      console.error(`\n=== ERRO NA MIGRAÇÃO (código ${code}) ===`);
    }
  });
}

// Executar função principal
main().catch((erro) => {
  console.error('Erro ao executar migração:', erro);
  rl.close();
  process.exit(1);
});
