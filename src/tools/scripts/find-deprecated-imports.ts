/**
 * Script para encontrar importações depreciadas no projeto
 * Este script busca por todas as importações que ainda usam o caminho antigo
 * e gera um relatório com os arquivos que precisam ser atualizados.
 * 
 * Como usar:
 * ts-node scripts/find-deprecated-imports.ts
 */

import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

// Padrões de importação depreciados para buscar
const DEPRECATED_PATTERNS = [
  /from ['"](\.\.\/)*services\/firebase\/functions/,
  /from ['"]@\/services\/firebase\/functions/,
  /import\s*\*\s*as\s*\w+\s*from\s*['"](\.\.\/)*services\/firebase\/functions/,
  /import\s*\*\s*as\s*\w+\s*from\s*['"]@\/services\/firebase\/functions/,
  /require\(['"](\.\.\/)*services\/firebase\/functions/,
  /require\(['"]@\/services\/firebase\/functions/
];

// Extensões de arquivos a verificar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Diretórios a ignorar
const IGNORE_DIRS = ['node_modules', 'dist', 'build', 'lib', '.git'];

// Arquivo de saída para resultados
const OUTPUT_FILE = 'deprecated-imports.txt';

interface FileResult {
  path: string;
  matches: string[];
}

/**
 * Lista arquivos recursivamente em um diretório
 */
async function listFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          await walk(fullPath);
        }
      } else if (FILE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(directory);
  return files;
}

/**
 * Verifica um arquivo por importações depreciadas
 */
async function checkFile(filePath: string): Promise<FileResult | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const matches: string[] = [];
    
    for (const pattern of DEPRECATED_PATTERNS) {
      const lines = content.split('\n');
      for (const line of lines) {
        if (pattern.test(line.trim())) {
          matches.push(line.trim());
        }
      }
    }
    
    return matches.length > 0 ? { path: filePath, matches } : null;
  } catch (error) {
    console.error(`Erro ao verificar arquivo ${filePath}:`, (error as Error).message);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  try {
    console.log('Buscando arquivos com importações depreciadas...');
    
    const files = await listFiles('.');
    const results: FileResult[] = [];
    
    for (const file of files) {
      const result = await checkFile(file);
      if (result) {
        results.push(result);
      }
    }
    
    if (results.length > 0) {
      const output = results.map(result => `
Arquivo: ${result.path}
Importações depreciadas encontradas:
${result.matches.map(match => `  ${match}`).join('\n')}
`).join('\n');
      
      await fs.writeFile(OUTPUT_FILE, output);
      
      console.log(`\nEncontrados ${results.length} arquivos com importações depreciadas`);
      console.log(`Detalhes salvos em: ${OUTPUT_FILE}`);
    } else {
      console.log('\nNenhuma importação depreciada encontrada!');
    }
    
  } catch (error) {
    console.error('Erro ao processar arquivos:', (error as Error).message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
}); 