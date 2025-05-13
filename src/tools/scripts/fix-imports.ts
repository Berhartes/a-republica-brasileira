/**
 * Script para encontrar e corrigir referências de importação após refatoração
 * 
 * Este script busca todas as importações no código fonte que apontam para diretórios obsoletos
 * e oferece opções para atualizá-las para os novos caminhos.
 * 
 * Uso: ts-node fix-imports.ts [--dry-run] [--path=./src]
 */

import { promises as fs } from 'fs';
const path = require('path');
let chalk: any;
try {
  chalk = require('chalk');
} catch {
  chalk = { blue: (s: string) => s, gray: (s: string) => s, yellow: (s: string) => s, green: (s: string) => s, red: (s: string) => s };
}
import { glob } from 'glob';

interface PathMapping {
  oldPattern: RegExp;
  newPath: string;
  description: string;
}

// Mapeamento de caminhos antigos para novos
const PATH_MAPPINGS: PathMapping[] = [
  {
    oldPattern: /['"]@\/core\/functions\/(.+?)['"]/g,
    newPath: "'@/services/firebase/functions/$1'",
    description: 'Funções Firebase movidas para services/firebase/functions'
  },
  {
    oldPattern: /['"]\.\.\/\.\.\/\.\.\/core\/functions\/(.+?)['"]/g,
    newPath: "'../../../services/firebase/functions/$1'",
    description: 'Funções Firebase movidas para services/firebase/functions'
  },
  {
    oldPattern: /['"]@\/utils\/logger['"]/g,
    newPath: "'@/core/monitoring/logger'",
    description: 'Logger consolidado em core/monitoring/logger'
  },
  {
    oldPattern: /['"]@\/shared\/utils\/logger['"]/g,
    newPath: "'@/core/monitoring/logger'",
    description: 'Logger consolidado em core/monitoring/logger'
  },
  {
    oldPattern: /['"]@\/app\/monitoring\/logger['"]/g,
    newPath: "'@/core/monitoring/logger'",
    description: 'Logger consolidado em core/monitoring/logger'
  },
  {
    oldPattern: /['"]@\/domains\/congresso-nacional\/senado\/components\/Dashboards\/(.+?)['"]/g,
    newPath: "'@/domains/congresso/components/Dashboards/$1'",
    description: 'Componentes de Dashboard consolidados em domains/congresso/components/Dashboards'
  }
];

// Extensões de arquivos a verificar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Diretórios a ignorar
const IGNORE_DIRS = ['node_modules', 'dist', 'build', 'lib', '.git'];

// Arquivo de saída para resultados
const OUTPUT_FILE = 'arquivos-com-importacoes-antigas.txt';

interface FileMatch {
  path: string;
  matches: string[];
}

/**
 * Verifica se um arquivo contém importações depreciadas
 */
async function checkFile(filePath: string): Promise<FileMatch | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    for (const pattern of PATH_MAPPINGS) {
      if (pattern.oldPattern.test(content)) {
        return {
          path: filePath,
          matches: content.split('\n')
            .filter(line => pattern.oldPattern.test(line))
            .map(line => line.trim())
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao verificar o arquivo ${filePath}:`, (error as Error).message);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const targetPath = args.find(arg => arg.startsWith('--path='))?.split('=')[1] || './src';

  console.log(chalk.blue('Iniciando verificação de importações...'));
  console.log(chalk.gray(`Diretório alvo: ${targetPath}`));
  if (dryRun) console.log(chalk.yellow('Modo dry-run ativado - nenhuma alteração será feita'));

  try {
    const files = await glob(`${targetPath}/**/*{${FILE_EXTENSIONS.join(',')}}`, {
      ignore: IGNORE_DIRS.map(dir => `**/${dir}/**`)
    });

    const results: FileMatch[] = [];
    
    for (const file of files) {
      const result = await checkFile(file);
      if (result) results.push(result);
    }

    if (results.length > 0) {
      const output = results.map(result => `
Arquivo: ${result.path}
Importações encontradas:
${result.matches.map(match => `  ${match}`).join('\n')}
`).join('\n');

      await fs.writeFile(OUTPUT_FILE, output);
      
      console.log(chalk.yellow(`\nEncontradas ${results.length} arquivos com importações antigas`));
      console.log(chalk.gray(`Detalhes salvos em: ${OUTPUT_FILE}`));
    } else {
      console.log(chalk.green('\nNenhuma importação antiga encontrada!'));
    }
  } catch (error) {
    console.error(chalk.red('Erro ao processar arquivos:'), (error as Error).message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(chalk.red('Erro fatal:'), error);
  process.exit(1);
}); 