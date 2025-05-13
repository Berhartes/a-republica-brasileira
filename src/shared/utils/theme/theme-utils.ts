// src/shared/utils/theme/theme-utils.ts
import { z } from 'zod';
import { logger } from '@/core/monitoring';

/**
 * Schema para o mapeamento de cores de partidos políticos
 */
export const partidoColorsSchema = z.record(z.string(), z.string());

/**
 * Cores dos partidos políticos brasileiros
 */
export const PARTIDO_COLORS: Record<string, string> = {
  PT: '#c4122d',    // Vermelho
  PSDB: '#0059AB',  // Azul
  MDB: '#00BB31',   // Verde
  PSD: '#F58220',   // Laranja
  PL: '#293F8E',    // Azul Marinho
  UNIÃO: '#1D71B8', // Azul Claro
  PP: '#203487',    // Azul Escuro
  PDT: '#FF0000',   // Vermelho Brilhante
  PSOL: '#FFFF00',  // Amarelo
  PSB: '#F58220',   // Laranja
  PODE: '#0059AB',  // Azul
  REPUBLICANOS: '#005DAA', // Azul
  // Outros partidos podem ser adicionados aqui
};

/**
 * Schema para categorias do espectro político
 */
export const espectroPoliticoSchema = z.record(z.string(), z.array(z.string()));

/**
 * Categorias do espectro político
 */
export const ESPECTRO_POLITICO: Record<string, string[]> = {
  ESQUERDA: ['PT', 'PSOL', 'PCdoB', 'PDT', 'REDE', 'UP'],
  CENTRO_ESQUERDA: ['PSB', 'CIDADANIA', 'PV', 'SOLIDARIEDADE'],
  CENTRO: ['MDB', 'PODE', 'PSD', 'PSDB'],
  CENTRO_DIREITA: ['UNIÃO', 'REPUBLICANOS', 'PDC', 'PSC', 'PP'],
  DIREITA: ['PL', 'NOVO', 'PATRIOTA', 'PTB']
};

/**
 * Schema para cores do espectro político
 */
export const espectroColorsSchema = z.record(z.string(), z.string());

/**
 * Cores do espectro político
 */
export const ESPECTRO_COLORS: Record<string, string> = {
  ESQUERDA: '#FF0000',         // Vermelho
  CENTRO_ESQUERDA: '#FF7F7F',  // Vermelho Claro
  CENTRO: '#FFFF00',           // Amarelo
  CENTRO_DIREITA: '#7F7FFF',   // Azul Claro
  DIREITA: '#0000FF'           // Azul
};

/**
 * Schema para cores de tipos de votos
 */
export const votoColorsSchema = z.record(z.string(), z.string());

/**
 * Cores para tipos de voto
 */
export const VOTO_COLORS: Record<string, string> = {
  Sim: '#4CAF50',          // Verde
  Não: '#F44336',          // Vermelho
  Abstenção: '#FF9800',    // Laranja
  Obstrução: '#9C27B0',    // Roxo
  Ausente: '#9E9E9E',      // Cinza
  Presidente: '#2196F3'    // Azul
};

/**
 * Obtém a cor para um partido político
 * @param siglaPartido Sigla do partido político
 * @returns Código hexadecimal da cor
 */
export function getPartidoColor(siglaPartido: string): string {
  try {
    if (!siglaPartido) return '#CCCCCC';
    return PARTIDO_COLORS[siglaPartido] || '#CCCCCC'; // Cinza padrão
  } catch (error) {
    logger.error(`Erro ao obter cor do partido ${siglaPartido}:`, error);
    return '#CCCCCC';
  }
}

/**
 * Obtém a cor baseada no espectro político
 * @param siglaPartido Sigla do partido político
 * @returns Código hexadecimal da cor
 */
export function getEspectroColor(siglaPartido: string): string {
  try {
    if (!siglaPartido) return '#CCCCCC';
    
    for (const [espectro, partidos] of Object.entries(ESPECTRO_POLITICO)) {
      if (partidos.includes(siglaPartido)) {
        return ESPECTRO_COLORS[espectro] || '#CCCCCC';
      }
    }
    
    return '#CCCCCC'; // Cinza padrão
  } catch (error) {
    logger.error(`Erro ao obter cor do espectro para ${siglaPartido}:`, error);
    return '#CCCCCC';
  }
}

/**
 * Schema para opções de normalização de voto
 */
export const normalizeVotoOptionsSchema = z.object({
  preserveCasing: z.boolean().default(false)
});

export type NormalizeVotoOptions = z.infer<typeof normalizeVotoOptionsSchema>;

/**
 * Normaliza o texto do voto para um formato padrão
 * @param voto Texto do voto
 * @param options Opções de normalização
 * @returns Texto normalizado do voto
 */
export function normalizeVoto(
  voto: string,
  options: Partial<NormalizeVotoOptions> = {}
): string {
  try {
    if (!voto) return '';
    
    const validatedOptions = normalizeVotoOptionsSchema.parse(options);
    
    // Normaliza o texto do voto
    const normalized = voto
      .replace(/sim/i, validatedOptions.preserveCasing ? voto : 'Sim')
      .replace(/n[aã]o/i, validatedOptions.preserveCasing ? voto : 'Não')
      .replace(/absten[çc][aã]o/i, validatedOptions.preserveCasing ? voto : 'Abstenção')
      .replace(/obstru[çc][aã]o/i, validatedOptions.preserveCasing ? voto : 'Obstrução')
      .replace(/ausente/i, validatedOptions.preserveCasing ? voto : 'Ausente')
      .replace(/presidente/i, validatedOptions.preserveCasing ? voto : 'Presidente');
    
    return normalized;
  } catch (error) {
    logger.error('Erro ao normalizar voto:', error);
    return voto;
  }
}

/**
 * Obtém a cor para um tipo de voto
 * @param voto Texto do voto
 * @returns Código hexadecimal da cor
 */
export function getVotoColor(voto: string): string {
  try {
    if (!voto) return '#CCCCCC';
    
    // Normaliza o texto do voto
    const normalized = normalizeVoto(voto);
    
    return VOTO_COLORS[normalized] || '#CCCCCC'; // Cinza padrão
  } catch (error) {
    logger.error(`Erro ao obter cor do voto ${voto}:`, error);
    return '#CCCCCC';
  }
}

/**
 * Obtém o nome da classe CSS Tailwind para a cor do partido
 * @param siglaPartido Sigla do partido político
 * @returns Nome da classe CSS
 */
export function getPartidoClass(siglaPartido: string): string {
  try {
    if (!siglaPartido) return 'bg-gray-400';
    
    for (const [espectro, partidos] of Object.entries(ESPECTRO_POLITICO)) {
      if (partidos.includes(siglaPartido)) {
        return `bg-partido-${espectro.toLowerCase().replace('_', '-')}`;
      }
    }
    
    return 'bg-gray-400'; // Padrão
  } catch (error) {
    logger.error(`Erro ao obter classe do partido ${siglaPartido}:`, error);
    return 'bg-gray-400';
  }
}

/**
 * Obtém o nome da classe CSS Tailwind para resultado de voto
 * @param voto Texto do voto
 * @returns Nome da classe CSS
 */
export function getVotoClass(voto: string): string {
  try {
    if (!voto) return 'bg-gray-400';
    
    if (/sim/i.test(voto)) return 'bg-voto-sim';
    if (/n[aã]o/i.test(voto)) return 'bg-voto-nao';
    if (/absten[çc][aã]o/i.test(voto)) return 'bg-voto-abstencao';
    if (/obstru[çc][aã]o/i.test(voto)) return 'bg-voto-obstrucao';
    if (/ausente/i.test(voto)) return 'bg-voto-ausente';
    
    return 'bg-gray-400'; // Padrão
  } catch (error) {
    logger.error(`Erro ao obter classe do voto ${voto}:`, error);
    return 'bg-gray-400';
  }
}

/**
 * Cores base para geração de paletas
 */
export const BASE_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];

/**
 * Schema para opções de paleta de cores
 */
export const chartPaletteOptionsSchema = z.object({
  baseColors: z.array(z.string()).optional(),
  variation: z.number().min(0).max(1).default(0.2)
});

export type ChartPaletteOptions = z.infer<typeof chartPaletteOptionsSchema>;

/**
 * Gera uma paleta de cores para gráficos com n cores
 * @param n Número de cores necessárias
 * @param options Opções para geração da paleta
 * @returns Array de códigos hexadecimais de cores
 */
export function generateChartPalette(
  n: number,
  options: Partial<ChartPaletteOptions> = {}
): string[] {
  try {
    if (n <= 0) return [];
    
    const validatedOptions = chartPaletteOptionsSchema.parse(options);
    const baseColors = validatedOptions.baseColors || BASE_COLORS;
    const variation = validatedOptions.variation;
    
    if (n <= baseColors.length) {
      return baseColors.slice(0, n);
    }
    
    // Para mais cores, repete a paleta com variações
    const palette: string[] = [];
    
    for (let i = 0; i < n; i++) {
      const baseColor = baseColors[i % baseColors.length];
      const variant = Math.floor(i / baseColors.length);
      
      if (variant === 0) {
        palette.push(baseColor);
      } else {
        // Clareia ou escurece a cor baseado na variante
        const factor = 1 - (variant * variation);
        const rgb = hexToRgb(baseColor);
        
        if (!rgb) {
          palette.push(baseColor);
          continue;
        }
        
        const adjusted = rgb.map(c => Math.floor(c * factor));
        palette.push(rgbToHex(adjusted[0], adjusted[1], adjusted[2]));
      }
    }
    
    return palette;
  } catch (error) {
    logger.error('Erro ao gerar paleta de cores:', error);
    return BASE_COLORS.slice(0, Math.min(n, BASE_COLORS.length));
  }
}

/**
 * Converte código hexadecimal para RGB
 * @param hex Código hexadecimal
 * @returns Array com valores RGB
 */
function hexToRgb(hex: string): number[] | null {
  try {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  } catch (error) {
    logger.error(`Erro ao converter hex para RGB: ${hex}`, error);
    return null;
  }
}

/**
 * Converte valores RGB para código hexadecimal
 * @param r Componente vermelho (0-255)
 * @param g Componente verde (0-255)
 * @param b Componente azul (0-255)
 * @returns Código hexadecimal
 */
function rgbToHex(r: number, g: number, b: number): string {
  try {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  } catch (error) {
    logger.error(`Erro ao converter RGB para hex: rgb(${r},${g},${b})`, error);
    return '#CCCCCC';
  }
}

export default {
  PARTIDO_COLORS,
  ESPECTRO_POLITICO,
  ESPECTRO_COLORS,
  VOTO_COLORS,
  BASE_COLORS,
  getPartidoColor,
  getEspectroColor,
  normalizeVoto,
  getVotoColor,
  getPartidoClass,
  getVotoClass,
  generateChartPalette
};