export interface Comissao {
  id: string;
  sigla: string;
  nome: string;
  cargo: string;
  dataInicio?: Date;
  dataFim?: Date;
} 