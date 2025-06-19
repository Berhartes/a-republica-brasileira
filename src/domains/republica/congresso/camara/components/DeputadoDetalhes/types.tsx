// src/domains/congresso/camara/components/DeputadoDetalhes/types.ts

export interface DeputadoDetalhesProps {
  id: number;
  onClose: () => void;
}

export interface GrupoDespesa {
  tipo: string;
  total: number;
  quantidade: number;
}
