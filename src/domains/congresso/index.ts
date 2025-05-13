// Export Senado and Câmara domains com importações seletivas para evitar conflitos
export * from './senado';
export * from './camara';

// Shared types for Congresso Nacional
export interface Parlamentar {
  id: string;
  nome: string;
  partido: string;
  estado: string;
}

export interface Votacao {
  id: string;
  data: string;
  resultado: string;
}

export interface Casa {
  SENADO: 'senado';
  CAMARA: 'camara';
}

export const CASAS: Casa = {
  SENADO: 'senado',
  CAMARA: 'camara',
} as const;

// Shared utilities
export const formatarNomeParlamentar = (nome: string): string => {
  return nome
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const formatarSiglaPartido = (partido: string): string => {
  return partido.toUpperCase();
};

export const formatarEstado = (estado: string): string => {
  return estado.toUpperCase();
};
