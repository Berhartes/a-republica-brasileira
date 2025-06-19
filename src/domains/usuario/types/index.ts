/**
 * Tipos para o domínio de usuário
 */

import { 
    PeticaoFormValues, 
    AssinaturaPeticaoValues, 
    ComentarioPeticaoValues,
    PerfilFormValues,
    PerfilConfigValues,
    SenhaAlteracaoValues
  } from '../schemas';
  
// Tipo de Usuário
export interface Usuario {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  interests?: string[];
  createdAt: string;
  updatedAt: string;
  // Configurações do usuário
  theme?: 'light' | 'dark' | 'system';
  language?: 'pt-BR' | 'en-US';
  estadoEleitoral?: string;
  privacy?: {
    showEmail: boolean;
    showLocation: boolean;
    showInterests: boolean;
  };
  accessibility?: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reduceMotion: boolean;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}
  
  // Tipo de Petição
  export interface Peticao {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    tags?: string[];
    materiaRelacionada?: {
      id?: string;
      tipo?: string;
      numero?: number;
      ano?: number;
    };
    anexos?: {
      nome: string;
      tipo: string;
      tamanho: number;
      url: string;
    }[];
    criador: {
      id: string;
      nome: string;
    };
    assinaturas: number;
    meta: number;
    status: 'aberta' | 'fechada' | 'concluida' | 'expirada';
    createdAt: string;
    updatedAt: string;
  }
  
  // Tipo de Assinatura
  export interface Assinatura {
    id: string;
    peticaoId: string;
    nome: string;
    email: string;
    cpf: string;
    cidade: string;
    estado: string;
    anonimo: boolean;
    receberAtualizacoes: boolean;
    createdAt: string;
  }
  
  // Tipo de Comentário
  export interface Comentario {
    id: string;
    peticaoId: string;
    usuario: {
      id: string;
      nome: string;
      photoURL?: string;
    };
    texto: string;
    anonimo: boolean;
    createdAt: string;
  }
  
  // Re-exportando os tipos dos schemas para conveniência
  export type {
    PeticaoFormValues,
    AssinaturaPeticaoValues,
    ComentarioPeticaoValues,
    PerfilFormValues,
    PerfilConfigValues,
    SenhaAlteracaoValues
  };
