// Utilitários para estilos
export function createVariant(name: string, variants: Record<string, string>) {
  return {
    [name]: variants
  };
}

export function createThemeColors(colors: Record<string, string>) {
  return colors;
}

export function createBreakpoints(breakpoints: Record<string, string>) {
  return breakpoints;
}

export function createSpacing(spacing: Record<string, string>) {
  return spacing;
}

// Função para converter px em rem
export function pxToRem(px: number): string {
  return `${px / 16}rem`;
}

// Função para gerar box shadow
export function createBoxShadow(
  xOffset: number = 0,
  yOffset: number = 4,
  blur: number = 6,
  spread: number = 0,
  color: string = 'rgba(0, 0, 0, 0.1)'
): string {
  return `${xOffset}px ${yOffset}px ${blur}px ${spread}px ${color}`;
}
