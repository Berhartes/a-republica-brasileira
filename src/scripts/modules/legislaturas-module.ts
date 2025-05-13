/**
 * Módulo para manipulação de dados de Legislaturas
 */

import { logger } from "@/shared/utils/logger";

export interface Legislatura {
  numero: number;
  dataInicio: Date;
  dataFim: Date;
  descricao?: string;
  senadores?: string[];
}

/**
 * Calcula o número da legislatura atual com base na data atual
 * @returns Número da legislatura atual
 */
export function calcularLegislaturaAtual(): number {
  // A lógica oficial do cálculo de legislaturas do Senado é:
  // - Legislaturas começam em 1 de fevereiro do primeiro ano
  // - Duram 4 anos
  // - A primeira legislatura foi de 1826
  
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth() + 1; // Janeiro é 0
  const dia = dataAtual.getDate();
  
  // Se estamos antes de fevereiro, considerar o ano anterior
  const anoBase = (mes < 2 || (mes === 2 && dia < 1)) ? ano - 1 : ano;
  
  // Legislaturas são contadas a partir de 1826 (1ª legislatura)
  // Cada 4 anos iniciamos uma nova legislatura
  const numeroLegislatura = Math.floor((anoBase - 1826) / 4) + 1;
  
  logger.debug(`Legislatura atual calculada: ${numeroLegislatura}`);
  return numeroLegislatura;
}

/**
 * Importa dados da legislatura específica
 * @param legislatura Dados da legislatura a ser importada
 * @returns Dados da legislatura importada
 */
export async function importarLegislatura(legislatura: Legislatura): Promise<Legislatura> {
  try {
    logger.info(`Importando dados da legislatura ${legislatura.numero}`);
    // Aqui seria implementada a lógica para salvar no banco de dados
    // Por simplicidade, apenas retornamos a legislatura recebida
    return legislatura;
  } catch (error) {
    logger.error(`Erro ao importar legislatura ${legislatura.numero}:`, error);
    throw error;
  }
}
