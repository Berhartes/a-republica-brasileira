/**
 * Script wrapper para processar perfis de senadores
 * Este script simplesmente executa o script real usando tsx
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho absoluto para o script real
const scriptPath = resolve(__dirname, '../src/core/functions/senado_api_wrapper/scripts/initiators/processar_perfilsenadores.ts');

// Obter argumentos da linha de comando (excluindo node e o nome do script)
const args = process.argv.slice(2);

// Comando para executar o script
const command = 'npx';
const commandArgs = ['tsx', scriptPath, ...args];

console.log(`Executando: ${command} ${commandArgs.join(' ')}`);

// Executar o comando
const child = spawn(command, commandArgs, {
  stdio: 'inherit', // Redirecionar stdin/stdout/stderr para o processo pai
  shell: true,
  cwd: process.cwd() // Garantir que estamos no diretório correto
});

// Lidar com o término do processo
child.on('close', (code) => {
  process.exit(code);
});

// Lidar com erros
child.on('error', (err) => {
  console.error(`Erro ao executar o script: ${err}`);
  process.exit(1);
});
