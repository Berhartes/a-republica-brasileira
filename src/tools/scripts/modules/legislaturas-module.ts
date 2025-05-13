/**
 * Módulo para gerenciamento de legislaturas
 */
import { logger } from '@/shared/utils/logger';

/**
 * Interface para representação de uma legislatura
 */
export interface Legislatura {
  numero: number;
  inicio: Date;
  fim: Date;
  descricao: string;
}

/**
 * Calcula o número da legislatura atual com base na data atual
 */
export function calcularLegislaturaAtual(): number {
  const dataAtual = new Date();
  const ano = dataAtual.getFullYear();
  
  // Cálculo simplificado: a primeira legislatura começou em 1826
  // A cada 4 anos, uma nova legislatura é iniciada
  // Fonte: https://www25.senado.leg.br/web/senadores/legislaturas-anteriores
  
  const primeiraLegislatura = 1826;
  const anosDesdeInicio = ano - primeiraLegislatura;
  const legislaturasCompletas = Math.floor(anosDesdeInicio / 4);
  
  // A legislatura atual é a próxima após as completas + 1 (começamos a contar da primeira)
  return legislaturasCompletas + 1;
}

/**
 * Obtém a data de início de uma legislatura específica
 */
export function obterDataInicioLegislatura(numeroLegislatura: number): Date {
  // A legislatura 1 começou em 1826, e cada legislatura dura 4 anos
  const anoInicio = 1826 + (numeroLegislatura - 1) * 4;
  return new Date(anoInicio, 0, 1); // 1º de janeiro do ano inicial
}

/**
 * Obtém a data de fim de uma legislatura específica
 */
export function obterDataFimLegislatura(numeroLegislatura: number): Date {
  // A legislatura termina em 31 de dezembro do ano de início + 3
  const anoInicio = 1826 + (numeroLegislatura - 1) * 4;
  return new Date(anoInicio + 3, 11, 31); // 31 de dezembro do ano final
}

/**
 * Importa os dados de uma legislatura específica
 */
export async function importarLegislatura(numeroLegislatura: number): Promise<Legislatura> {
  try {
    logger.info(`Importando dados da legislatura ${numeroLegislatura}`);
    
    const dataInicio = obterDataInicioLegislatura(numeroLegislatura);
    const dataFim = obterDataFimLegislatura(numeroLegislatura);
    
    const legislatura: Legislatura = {
      numero: numeroLegislatura,
      inicio: dataInicio,
      fim: dataFim,
      descricao: `${numeroLegislatura}ª Legislatura (${dataInicio.getFullYear()}-${dataFim.getFullYear()})`
    };
    
    // Aqui poderia haver código para salvar os dados no banco de dados
    logger.info(`Legislatura ${numeroLegislatura} importada com sucesso`);
    
    return legislatura;
  } catch (error) {
    logger.error(`Erro ao importar legislatura ${numeroLegislatura}:`, error);
    throw error;
  }
}

/**
 * Obtém a lista de legislaturas dentro de um intervalo
 */
export function obterLegislaturas(inicio: number, fim: number): Legislatura[] {
  const legislaturas: Legislatura[] = [];
  
  for (let numero = inicio; numero <= fim; numero++) {
    const dataInicio = obterDataInicioLegislatura(numero);
    const dataFim = obterDataFimLegislatura(numero);
    
    legislaturas.push({
      numero,
      inicio: dataInicio,
      fim: dataFim,
      descricao: `${numero}ª Legislatura (${dataInicio.getFullYear()}-${dataFim.getFullYear()})`
    });
  }
  
  return legislaturas;
}

/**
 * Obtém a legislatura atual
 */
export function obterLegislaturaAtual(): Legislatura {
  const numeroLegislaturaAtual = calcularLegislaturaAtual();
  const dataInicio = obterDataInicioLegislatura(numeroLegislaturaAtual);
  const dataFim = obterDataFimLegislatura(numeroLegislaturaAtual);
  
  return {
    numero: numeroLegislaturaAtual,
    inicio: dataInicio,
    fim: dataFim,
    descricao: `${numeroLegislaturaAtual}ª Legislatura (${dataInicio.getFullYear()}-${dataFim.getFullYear()})`
  };
}
