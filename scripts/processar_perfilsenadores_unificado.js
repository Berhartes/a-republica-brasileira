/**
 * Script wrapper unificado para processar perfis de senadores
 *
 * Este script serve como um ponto de entrada único para o processamento de perfis de senadores,
 * substituindo os múltiplos scripts wrapper anteriores (js, ts e bat).
 *
 * Características:
 * - Usa ES Modules para compatibilidade com o projeto
 * - Pode ser chamado diretamente com Node.js ou através de npm scripts
 * - Passa todos os argumentos para o script principal
 * - Fornece mensagens de erro claras
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Caminho absoluto para o script principal
const scriptPath = resolve(__dirname, '../src/core/functions/senado_api_wrapper/scripts/initiators/processar_perfilsenadores.ts');

// Verificar se o arquivo existe
if (!fs.existsSync(scriptPath)) {
  console.error(`Erro: O script principal não foi encontrado em: ${scriptPath}`);
  process.exit(1);
}

// Obter argumentos da linha de comando (excluindo node e o nome do script)
const args = process.argv.slice(2);

// Verificar se o usuário solicitou ajuda
if (args.includes('--ajuda') || args.includes('-h') || args.includes('--help')) {
  console.log(`
Uso: node scripts/processar_perfilsenadores_unificado.js [legislatura] [opções]

Argumentos:
  [legislatura]                Número da legislatura para processamento (opcional)
                              Se não fornecido, usa a legislatura atual

Opções:
  --limite, -l <número>       Limita o processamento a um número específico de senadores
  --exportar, -e              Exporta os dados para arquivos JSON
  --pc                        Salva a estrutura exata do Firestore no PC local
  --ajuda, -h                 Exibe esta mensagem de ajuda
  `);
  process.exit(0);
}

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
  if (code !== 0) {
    console.log(`O processo terminou com código de saída ${code}`);
  }
  process.exit(code);
});

// Lidar com erros
child.on('error', (err) => {
  console.error(`Erro ao executar o script: ${err}`);
  process.exit(1);
});
