import { Timestamp } from 'firebase-admin/firestore';

/**
 * Interface para o documento de um deputado na estrutura otimizada.
 * Coleção: deputados/{deputadoId}
 */
export interface DeputadoOptimizado {
  // Dados básicos
  id: string;
  nome: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto: string;
  
  // Agregações pré-calculadas (atualizadas por Cloud Functions)
  totalGastos?: number;
  totalGastosAnoCorrente?: number;
  mediaGastosMensal?: number;
  
  // Scores e rankings (atualizados por Cloud Functions)
  scoreInvestigativo?: number;
  posicaoRankingGeral?: number;
  posicaoRankingUF?: number;
  
  // Conformidade (atualizada por Cloud Functions)
  numeroAlertas?: number;
  indicadorConformidade?: 'NORMAL' | 'ATENÇÃO' | 'CRÍTICO';
  
  ultimaAtualizacao: Timestamp;
}

/**
 * Interface para o documento de uma despesa na estrutura otimizada.
 * Coleção: despesas/{despesaId}
 */
export interface DespesaOptimizada {
  // Chaves para consultas e filtros
  deputadoId: string;
  deputadoNome: string; // Desnormalizado para evitar joins
  ano: number;
  mes: number;
  anoMes: string; // Formato "YYYY-MM" para facilitar queries
  
  // Dados da despesa
  tipoDespesa: string;
  valorLiquido: number;
  dataDocumento: Timestamp;
  
  // Dados do fornecedor (desnormalizados para evitar joins)
  fornecedorNome: string;
  fornecedorCnpj: string | null; // CNPJ ou CPF
  
  // Metadados para otimização de consultas
  partidoDeputado: string;
  ufDeputado: string;

  // Campos de análise (preenchidos por Cloud Functions)
  indicadorSuspeicao?: 'NORMAL' | 'SUSPEITO' | 'CRÍTICO';
  alertas?: string[];
}

/**
 * Interface para o documento de um fornecedor na estrutura otimizada.
 * Coleção: fornecedores/{cnpj}
 */
export interface FornecedorOptimizado {
  cnpj: string;
  nome: string;
  
  // Métricas agregadas (atualizadas por Cloud Functions)
  totalRecebido: number;
  numeroTransacoes: number;
  numeroDeputados: number;
  
  // Score investigativo (atualizado por Cloud Functions)
  scoreInvestigativo: number;
  categoriaRisco: 'NORMAL' | 'SUSPEITO' | 'ALTO_RISCO';
  
  ultimaAtualizacao: Timestamp;
}
