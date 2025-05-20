/**
 * Utilitários para formatação de dados
 */

/**
 * Formata uma data para exibição no formato brasileiro (DD/MM/YYYY)
 * @param date Data a ser formatada (Date, string ou timestamp)
 * @param options Opções de formatação
 * @returns String formatada
 */
export function formatarData(
  date: Date | string | number | undefined | null,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return '';
  
  try {
    const dataObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
      
    if (!(dataObj instanceof Date) || isNaN(dataObj.getTime())) {
      return '';
    }
    
    return new Intl.DateTimeFormat('pt-BR', options).format(dataObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
}

/**
 * Formata um valor monetário para exibição
 * @param valor Valor a ser formatado
 * @param options Opções de formatação
 * @returns String formatada
 */
export function formatarMoeda(
  valor: number | string | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (valor === undefined || valor === null) return '';
  
  try {
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (isNaN(valorNumerico)) return '';
    
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options
    };
    
    return new Intl.NumberFormat('pt-BR', defaultOptions).format(valorNumerico);
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return '';
  }
}

/**
 * Formata um número para exibição
 * @param numero Número a ser formatado
 * @param options Opções de formatação
 * @returns String formatada
 */
export function formatarNumero(
  numero: number | string | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (numero === undefined || numero === null) return '';
  
  try {
    const numeroNumerico = typeof numero === 'string' ? parseFloat(numero) : numero;
    
    if (isNaN(numeroNumerico)) return '';
    
    return new Intl.NumberFormat('pt-BR', options).format(numeroNumerico);
  } catch (error) {
    console.error('Erro ao formatar número:', error);
    return '';
  }
}

/**
 * Formata um percentual para exibição
 * @param valor Valor a ser formatado (0-100 ou 0-1)
 * @param options Opções de formatação
 * @returns String formatada
 */
export function formatarPercentual(
  valor: number | string | undefined | null,
  options: Intl.NumberFormatOptions = {}
): string {
  if (valor === undefined || valor === null) return '';
  
  try {
    let valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (isNaN(valorNumerico)) return '';
    
    // Se o valor estiver entre 0 e 1, multiplicar por 100
    if (valorNumerico > 0 && valorNumerico < 1) {
      valorNumerico *= 100;
    }
    
    const defaultOptions: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options
    };
    
    // Para percentuais, dividimos por 100 pois o formatter já multiplica por 100
    return new Intl.NumberFormat('pt-BR', defaultOptions).format(valorNumerico / 100);
  } catch (error) {
    console.error('Erro ao formatar percentual:', error);
    return '';
  }
}

/**
 * Trunca um texto para um tamanho máximo
 * @param texto Texto a ser truncado
 * @param tamanhoMaximo Tamanho máximo do texto
 * @param sufixo Sufixo a ser adicionado quando truncado
 * @returns Texto truncado
 */
export function truncarTexto(
  texto: string | undefined | null,
  tamanhoMaximo: number = 100,
  sufixo: string = '...'
): string {
  if (!texto) return '';
  
  if (texto.length <= tamanhoMaximo) {
    return texto;
  }
  
  return texto.substring(0, tamanhoMaximo) + sufixo;
}

/**
 * Formata um nome para exibição (capitaliza cada palavra)
 * @param nome Nome a ser formatado
 * @returns Nome formatado
 */
export function formatarNome(nome: string | undefined | null): string {
  if (!nome) return '';
  
  return nome
    .toLowerCase()
    .split(' ')
    .map(palavra => {
      // Não capitalizar artigos, preposições, etc.
      const palavrasMinusculas = ['de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'as', 'os'];
      if (palavrasMinusculas.includes(palavra)) {
        return palavra;
      }
      
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

export default {
  formatarData,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  truncarTexto,
  formatarNome
};
