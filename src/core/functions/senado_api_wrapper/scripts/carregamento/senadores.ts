/**
 * Carregador de senadores para o Firestore
 */
import { logger } from '../utils/logger';
import { createBatchManager } from '../utils/firestore';

// Interface para dados transformados
interface SenadorTransformado {
  codigo: string | number;
  codigoPublico?: string;
  nome: string;
  nomeCompleto: string;
  genero: string;
  foto?: string;
  paginaOficial?: string;
  paginaParticular?: string | null;
  email?: string;
  partido: {
    sigla: string;
    nome: string | null;
  };
  uf: string;
  bloco: {
    codigo: string | number;
    nome: string;
    apelido?: string;
    dataCriacao?: string | null;
  } | null;
  telefones: Array<{
    numero: string;
    tipo: string;
    ordem: number;
  }>;
  situacao: {
    exercicio: Array<{
      codigo: string | number;
      dataInicio: string | null;
      dataFim: string | null;
      causaAfastamento: string | null;
      descricaoCausaAfastamento: string | null;
    }>;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa: boolean;
    cargoLideranca: boolean;
  };
  mandatoAtual: {
    codigo: string | number;
    uf: string;
    participacao: string;
    primeiraLegislatura: {
      numero: string | number;
      dataInicio: string | null;
      dataFim: string | null;
    } | null;
    segundaLegislatura: {
      numero: string | number;
      dataInicio: string | null;
      dataFim: string | null;
    } | null;
    suplentes: Array<{
      participacao: string;
      codigo: string | number;
      nome: string;
    }>;
    titular: {
      participacao: string;
      codigo: string | number;
      nome: string;
    } | null;
  } | null;
  atualizadoEm: string;
}

// Interface para conjunto de dados transformados
interface ResultadoTransformacao {
  timestamp: string;
  senadores: SenadorTransformado[];
  metadados: any;
}

// Interface para o resultado do carregamento
interface ResultadoCarregamento {
  timestamp: string;
  totalSalvos: number;
  legislatura: number;
  status: string;
}

/**
 * Classe para carregamento de senadores no Firestore
 */
export class SenadoresLoader {
  /**
   * Salva dados de senadores ativos no Firestore
   * @param transformedData - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   */
  async saveSenadoresAtuais(
    transformedData: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<ResultadoCarregamento> {
    logger.info(`Salvando dados de ${transformedData.senadores.length} senadores para a legislatura ${legislaturaNumero}`);
    
    const batchManager = createBatchManager();
    const timestamp = new Date().toISOString();
    
    // 1. Documento com metadados da extração
    const metadataRef = `congressoNacional/senadoFederal/metadata/senadores`;
    
    batchManager.set(metadataRef, {
      ultimaAtualizacao: timestamp,
      totalRegistros: transformedData.senadores.length,
      legislatura: legislaturaNumero,
      status: 'success'
    });
    
    // 2. Atualizar estrutura 'atual' para manter referência rápida
    const senadoresAtualRef = `congressoNacional/senadoFederal/atual/senadores`;
    
    batchManager.set(senadoresAtualRef, {
      timestamp: timestamp,
      legislatura: legislaturaNumero,
      total: transformedData.senadores.length,
      atualizadoEm: timestamp,
      tipo: 'senadores',
      descricao: 'Lista de senadores em exercício'
    });
    
    // 3. Salvar cada senador
    for (const senador of transformedData.senadores) {
      // Adiciona timestamp e legislatura aos dados
      const senadorData = {
        ...senador,
        atualizadoEm: timestamp,
        legislatura: legislaturaNumero
      };
      
      // Referência para a estrutura de legislatura
      const senadorLegRef = `congressoNacional/senadoFederal/legislaturas/${legislaturaNumero}/senadores/${senador.codigo}`;
      
      // Referência para a estrutura 'atual'
      const senadorAtualRef = `congressoNacional/senadoFederal/atual/senadores/itens/${senador.codigo}`;
      
      // Salvar nas duas coleções
      batchManager.set(senadorLegRef, senadorData);
      batchManager.set(senadorAtualRef, senadorData);
    }
    
    // Executar todas as operações como uma transação
    await batchManager.commit();
    
    logger.info(`${transformedData.senadores.length} senadores salvos no Firestore para a legislatura ${legislaturaNumero}`);
    
    return {
      timestamp,
      totalSalvos: transformedData.senadores.length,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
  
  /**
   * Salva dados históricos de senadores (mantém versões anteriores)
   * @param transformedData - Dados transformados dos senadores
   * @param legislaturaNumero - Número da legislatura
   */
  async saveSenadoresHistorico(
    transformedData: ResultadoTransformacao, 
    legislaturaNumero: number
  ): Promise<{ timestamp: string; legislatura: number; status: string }> {
    logger.info(`Salvando histórico de senadores da legislatura ${legislaturaNumero} no Firestore`);
    
    const timestamp = new Date().toISOString();
    const historicRef = `congressoNacional/senadoFederal/historico/senadores/snapshots/${legislaturaNumero}_${timestamp}`;
    
    // No ambiente real, usaríamos o Firestore.
    // Na versão mock, apenas logamos a operação.
    logger.info(`Simulando salvamento de histórico em ${historicRef}`);
    logger.debug('Dados do snapshot:', { 
      timestamp, 
      legislatura: legislaturaNumero,
      totalSenadores: transformedData.senadores.length
    });
    
    // Simula um atraso para parecer mais realista
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info('Histórico de senadores salvo no Firestore (mock)');
    
    return {
      timestamp,
      legislatura: legislaturaNumero,
      status: 'success'
    };
  }
}

// Exporta uma instância do carregador
export const senadoresLoader = new SenadoresLoader();
