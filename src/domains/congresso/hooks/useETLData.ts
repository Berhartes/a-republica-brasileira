import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, getDoc, doc, query, orderBy, Timestamp, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../../shared/services/firebase';
import { logger } from '../../../app/monitoring/logger';

// Constante para o tempo de stale (5 minutos)
const STALE_TIME = 300000;

// Tipos para os dados do ETL
export interface ETLMetadata {
  ultima_atualizacao: Timestamp;
  total_legislaturas?: number;
  total_senadores?: number;
  total_materias?: number;
  total_votacoes?: number;
  total_comissoes?: number;
}

export interface Legislatura {
  id: string;
  numero: number;
  dataInicio: Timestamp;
  dataFim: Timestamp;
  senadores?: number;
}

export interface Senador {
  id: string;
  nome: string;
  nomeCivil: string;
  siglaPartido: string;
  siglaUf: string;
  urlFoto?: string;
  email?: string;
  sexo: 'M' | 'F';
  comissoes?: Array<{
    id: string;
    sigla: string;
    nome: string;
    cargo: string;
    dataInicio: Timestamp;
  }>;
}

export interface Materia {
  id: string;
  sigla: string;
  numero: number;
  ano: number;
  ementa: string;
  autor?: string;
  situacao?: string;
  ultimaAtualizacao: Timestamp;
  votacoesIds?: string[];
}

export interface Votacao {
  id: string;
  data: Timestamp;
  titulo: string;
  descricao?: string;
  resultado: string;
  materia: {
    id: string;
    sigla: string;
    numero: number;
    ano: number;
    ementa: string;
    autor?: string;
  };
  resumoVotos: {
    sim: number;
    nao: number;
    abstencao: number;
    ausente: number;
    total: number;
  };
  votos: Array<{
    senadorId: string;
    nome: string;
    partido: string;
    voto: string;
    orientacaoBancada?: string;
  }>;
  ultimaAtualizacao: Timestamp;
}

export interface Comissao {
  id: string;
  sigla: string;
  nome: string;
  tipo: string;
  descricao?: string;
  dataCriacao: Timestamp;
  dataExtincao?: Timestamp;
  composicao: {
    legislatura: number;
    presidente?: {
      senadorId: string;
      nome: string;
      partido: string;
      uf: string;
      dataInicio: Timestamp;
    };
    vicePresidente?: {
      senadorId: string;
      nome: string;
      partido: string;
      uf: string;
      dataInicio: Timestamp;
    };
    membros: Array<{
      senadorId: string;
      nome: string;
      partido: string;
      uf: string;
      cargo: string;
      dataInicio: Timestamp;
    }>;
  };
  reunioes: Array<{
    id: string;
    data: Timestamp;
    tipo: string;
    pauta?: string;
    resultado?: string;
  }>;
  ultimaAtualizacao: Timestamp;
}

// Hook para buscar metadados gerais do ETL
export function useETLMetadata() {
  return useQuery({
    queryKey: ['etl', 'metadata'],
    queryFn: async () => {
      try {
        const metadataDoc = await getDoc(doc(db, 'congresso/senado/metadados/geral'));
        if (metadataDoc.exists()) {
          return metadataDoc.data() as ETLMetadata;
        }
        
        // Se não existir o documento geral, tenta buscar os metadados individuais
        const legislaturasMetaDoc = await getDoc(doc(db, 'congresso/senado/metadados/legislaturas'));
        const senadoresMetaDoc = await getDoc(doc(db, 'congresso/senado/metadados/senadores'));
        const materiasMetaDoc = await getDoc(doc(db, 'congresso/senado/metadados/materias'));
        const votacoesMetaDoc = await getDoc(doc(db, 'congresso/senado/metadados/votacoes'));
        const comissoesMetaDoc = await getDoc(doc(db, 'congresso/senado/metadados/comissoes'));
        
        const metadata: ETLMetadata = {
          ultima_atualizacao: Timestamp.now(),
          total_legislaturas: legislaturasMetaDoc.exists() ? legislaturasMetaDoc.data().total_legislaturas : 0,
          total_senadores: senadoresMetaDoc.exists() ? senadoresMetaDoc.data().total_senadores : 0,
          total_materias: materiasMetaDoc.exists() ? materiasMetaDoc.data().total_materias : 0,
          total_votacoes: votacoesMetaDoc.exists() ? votacoesMetaDoc.data().total_votacoes : 0,
          total_comissoes: comissoesMetaDoc.exists() ? comissoesMetaDoc.data().total_comissoes : 0,
        };
        
        return metadata;
      } catch (error) {
        logger.error('Erro ao buscar metadados do ETL:', error);
        throw new Error('Falha ao carregar metadados do ETL');
      }
    },
    staleTime: STALE_TIME
  });
}

// Hook para buscar legislaturas
export function useLegislaturas(limit = 10) {
  return useQuery({
    queryKey: ['etl', 'legislaturas', limit],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, 'congresso/senado/legislaturas'),
          orderBy('numero', 'desc'),
          firestoreLimit(typeof limit === 'number' ? limit : parseInt(limit as string, 10))
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Legislatura[];
      } catch (error) {
        logger.error('Erro ao buscar legislaturas:', error);
        throw new Error('Falha ao carregar legislaturas');
      }
    },
    staleTime: STALE_TIME
  });
}

// Hook para buscar senadores
export function useSenadores(limit = 20) {
  return useQuery({
    queryKey: ['etl', 'senadores', limit],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, 'congresso/senado/senadores'),
          orderBy('nome'),
          firestoreLimit(typeof limit === 'number' ? limit : parseInt(limit as string, 10))
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Senador[];
      } catch (error) {
        logger.error('Erro ao buscar senadores:', error);
        throw new Error('Falha ao carregar senadores');
      }
    },
    staleTime: STALE_TIME
  });
}

// Hook para buscar matérias legislativas
export function useMaterias(limit = 20) {
  return useQuery({
    queryKey: ['etl', 'materias', limit],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, 'congresso/senado/materias'),
          orderBy('ultimaAtualizacao', 'desc'),
          firestoreLimit(typeof limit === 'number' ? limit : parseInt(limit as string, 10))
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Materia[];
      } catch (error) {
        logger.error('Erro ao buscar matérias:', error);
        throw new Error('Falha ao carregar matérias');
      }
    },
    staleTime: STALE_TIME
  });
}

// Hook para buscar votações
export function useVotacoes(limit = 20) {
  return useQuery({
    queryKey: ['etl', 'votacoes', limit],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, 'congresso/senado/votacoes'),
          orderBy('data', 'desc'),
          firestoreLimit(typeof limit === 'number' ? limit : parseInt(limit as string, 10))
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Votacao[];
      } catch (error) {
        logger.error('Erro ao buscar votações:', error);
        throw new Error('Falha ao carregar votações');
      }
    },
    staleTime: STALE_TIME
  });
}

// Hook para buscar comissões
export function useComissoes(limit = 20) {
  return useQuery({
    queryKey: ['etl', 'comissoes', limit],
    queryFn: async () => {
      try {
        const q = query(
          collection(db, 'congresso/senado/comissoes'),
          orderBy('sigla'),
          firestoreLimit(typeof limit === 'number' ? limit : parseInt(limit as string, 10))
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comissao[];
      } catch (error) {
        logger.error('Erro ao buscar comissões:', error);
        throw new Error('Falha ao carregar comissões');
      }
    },
    staleTime: 300000, // 5 minutos (5 * 60 * 1000)
  });
}
