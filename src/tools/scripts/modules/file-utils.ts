import { promises as fs } from 'fs';
import path from 'path';

/**
 * Copia um arquivo ou diretório recursivamente
 * @param source Caminho do arquivo ou diretório de origem
 * @param destination Caminho do arquivo ou diretório de destino
 */
export async function copyRecursive(source: string, destination: string): Promise<void> {
  // Verifica se a origem existe
  if (!await fs.access(source).then(() => true).catch(() => false)) {
    throw new Error(`Caminho de origem não existe: ${source}`);
  }

  // Verifica se a origem é um diretório ou arquivo
  const stats = await fs.stat(source);
  
  if (stats.isDirectory()) {
    // Cria o diretório de destino se não existir
    await fs.mkdir(destination, { recursive: true }).catch(() => {});
    
    // Lista os itens no diretório
    const items = await fs.readdir(source);
    
    // Copia cada item recursivamente
    for (const item of items) {
      const sourcePath = path.join(source, item);
      const destPath = path.join(destination, item);
      await copyRecursive(sourcePath, destPath);
    }
  } else {
    // Cria o diretório pai do destino se não existir
    const destDir = path.dirname(destination);
    await fs.mkdir(destDir, { recursive: true }).catch(() => {});
    
    // Copia o arquivo
    await fs.copyFile(source, destination);
  }
}

/**
 * Procura por arquivos que correspondem a um padrão de nome
 * @param directory Diretório para iniciar a busca
 * @param pattern Padrão regex para o nome do arquivo
 * @param recursive Se deve buscar em subdiretórios
 * @returns Caminhos dos arquivos encontrados
 */
export async function findFiles(directory: string, pattern: RegExp, recursive = true): Promise<string[]> {
  const results: string[] = [];
  
  // Verifica se o diretório existe
  if (!await fs.access(directory).then(() => true).catch(() => false)) {
    return results;
  }
  
  // Lista os itens no diretório
  const items = await fs.readdir(directory);
  
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = await fs.stat(itemPath);
    
    if (stats.isDirectory() && recursive) {
      // Busca recursivamente em subdiretórios
      const subResults = await findFiles(itemPath, pattern, recursive);
      results.push(...subResults);
    } else if (stats.isFile() && pattern.test(item)) {
      // Adiciona o arquivo se corresponder ao padrão
      results.push(itemPath);
    }
  }
  
  return results;
} 