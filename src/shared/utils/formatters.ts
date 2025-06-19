export const toTitleCase = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
};

export const formatarData = (dataString?: string | Date): string => {
  if (!dataString) return 'Data não disponível';
  const data = typeof dataString === 'string' ? new Date(dataString) : dataString;
  if (isNaN(data.getTime())) {
    return 'Data inválida';
  }
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(data);
};
