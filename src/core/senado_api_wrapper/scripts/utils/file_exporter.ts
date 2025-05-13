/**
 * Utilitário para exportar dados para arquivos locais
 * Permite salvar resultados do ETL em arquivos para inspeção e análise
 */
import * as fs from 'fs';
import * as path from 'path';
import { logger } from './logger';

// Diretório base para armazenar os arquivos exportados
const BASE_OUTPUT_DIR = path.join(process.cwd(), 'dados_extraidos');

/**
 * Garante que um diretório exista, criando-o se necessário
 * @param dirPath - Caminho do diretório
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    logger.info(`Criando diretório: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Exporta dados para um arquivo JSON
 * @param data - Dados a serem exportados
 * @param filePath - Caminho relativo do arquivo (a partir do diretório base)
 */
export function exportToJson<T>(data: T, filePath: string): void {
  try {
    const fullPath = path.join(BASE_OUTPUT_DIR, filePath);
    const dirPath = path.dirname(fullPath);
    
    // Garantir que o diretório exista
    ensureDirectoryExists(dirPath);
    
    // Converter dados para JSON com formatação legível
    const jsonData = JSON.stringify(data, null, 2);
    
    // Escrever arquivo
    fs.writeFileSync(fullPath, jsonData, 'utf8');
    
    logger.info(`Dados exportados com sucesso para ${fullPath}`);
  } catch (error: any) {
    logger.error(`Erro ao exportar dados para ${filePath}: ${error.message}`);
  }
}

/**
 * Exporta uma lista de itens como arquivos JSON individuais
 * @param items - Lista de itens a serem exportados
 * @param dirPath - Caminho relativo do diretório (a partir do diretório base)
 * @param getFileName - Função para obter o nome do arquivo com base no item
 */
export function exportItemsAsIndividualFiles<T>(
  items: T[],
  dirPath: string,
  getFileName: (item: T) => string
): void {
  try {
    const fullDirPath = path.join(BASE_OUTPUT_DIR, dirPath);
    
    // Garantir que o diretório exista
    ensureDirectoryExists(fullDirPath);
    
    // Exportar cada item como um arquivo individual
    let successCount = 0;
    
    for (const item of items) {
      try {
        const fileName = getFileName(item);
        const filePath = path.join(fullDirPath, `${fileName}.json`);
        
        // Converter item para JSON com formatação legível
        const jsonData = JSON.stringify(item, null, 2);
        
        // Escrever arquivo
        fs.writeFileSync(filePath, jsonData, 'utf8');
        
        successCount++;
      } catch (error: any) {
        logger.warn(`Erro ao exportar item individual: ${error.message}`);
      }
    }
    
    logger.info(`${successCount}/${items.length} itens exportados com sucesso para ${fullDirPath}`);
  } catch (error: any) {
    logger.error(`Erro ao exportar itens para ${dirPath}: ${error.message}`);
  }
}

/**
 * Exporta metadados de uma operação
 * @param metadata - Metadados a serem exportados
 * @param operationName - Nome da operação
 */
export function exportMetadata(metadata: any, operationName: string): void {
  try {
    const filePath = path.join('metadata', `${operationName}_${new Date().toISOString().replace(/:/g, '-')}.json`);
    exportToJson(metadata, filePath);
  } catch (error: any) {
    logger.error(`Erro ao exportar metadados para ${operationName}: ${error.message}`);
  }
}
