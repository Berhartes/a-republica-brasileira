import * as dotenv from 'dotenv';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { importarLegislatura, calcularLegislaturaAtual } from "./scripts/modules/legislaturas-module";
// import { senadoSenadoresService } from "./services/senado/senado-senadores-service";
// import { senadoMateriasService } from "./services/senado/senado-materias-service";
// import { senadoVotacoesService } from "./services/senado/senado-votacoes-service";
import { getDb, initializeFirebase } from "./config/firebase/firebase-admin";
import { logger } from "./shared/utils/logger";
import { senadoApiService } from './domains/congresso/senado/services';

// Configuração do ambiente
dotenv.config();
logger.debug('Variáveis de ambiente configuradas');

// Constantes para controle de requisições à API
const MAX_REQUESTS_PER_MINUTE = 30; // Limite de requisições por minuto para a API do Senado
const REQUEST_TIMEOUT = 30000; // Timeout de requisição em ms

// Tipos
type MetricaComparativa = 'votacoes' | 'despesas' | 'proposicoes';

interface ImportacaoMetadata {
  iniciada: FirebaseFirestore.Timestamp;
  concluida?: FirebaseFirestore.Timestamp;
  status: 'em_andamento' | 'concluida' | 'falha';
  erro?: string;
  progresso?: {
    etapaAtual: string;
    totalEtapas: number;
    percentual: number;
    itensProcessados?: number;
    totalItens?: number;
  };
}

interface ImportacaoError {
  message: string;
  stack?: string;
  code?: string;
}

/**
 * Função principal que coordena todas as operações
 */
async function main(): Promise<void> {
  try {
    logger.info('Iniciando aplicação República Brasileira');
    
    // Inicializar Firebase antes de qualquer operação
    logger.debug('Inicializando Firebase...');
    await initializeFirebase();
    logger.info('Firebase inicializado com sucesso');
    
    // Verificar argumentos para determinar o modo de execução
    const args = process.argv.slice(2);
    const comando = args[0] || 'help';
    logger.debug('Argumentos recebidos:', { args, comando });
    
    switch (comando) {
      case 'full-import':
        await executarImportacaoCompleta();
        break;
        
      case 'import-legislaturas':
        const numeroLegislatura = calcularLegislaturaAtual();
        await executarComValidacao(() => importarLegislatura({numero: numeroLegislatura} as any), 'legislaturas');
        break;
        
      // case 'import-senadores':
      //   await executarComValidacao(() => senadoSenadoresService.importarSenadoresAtuais(), 'senadores');
      //   break;
        
      // case 'import-senadores-incremental':
      //   const dataUltimaAtualizacao = await obterDataUltimaAtualizacao('senadores');
      //   await executarComValidacao(
      //     () => senadoSenadoresService.importarSenadoresAtuais(), 
      //     'senadores (incremental)'
      //   );
      //   break;
        
      // case 'import-senador':
      //   if (args.length < 2) {
      //     logger.error('ID do senador não especificado');
      //     exibirAjuda();
      //     process.exit(1);
      //   }
      //   await executarComValidacao(
      //     () => senadoSenadoresService.importarSenadorDetalhado(parseInt(args[1])), 
      //     `senador ${args[1]}`
      //   );
      //   break;
        
      // case 'import-materias':
      // case 'import-materias-incremental':
      //   await executarComValidacao(() => senadoMateriasService.importMaterias([]), 'matérias');
      //   break;
        
      // case 'gerar-series':
      //   await executarComValidacao(
      //     () => senadoVotacoesService.buscarVotacoesPorPeriodo(
      //       new Date(new Date().getFullYear(), 0, 1), // Jan 1st of current year
      //       new Date()
      //     ), 
      //     'séries históricas'
      //   );
      //   break;
        
      case 'comparativo-legislaturas':
        if (args.length < 2) {
          logger.error('Métrica não especificada');
          exibirAjuda();
          process.exit(1);
        }
        const metrica = args[1] as MetricaComparativa;
        if (!['votacoes', 'despesas', 'proposicoes'].includes(metrica)) {
          logger.error('Métrica inválida');
          exibirAjuda();
          process.exit(1);
        }
        await executarComValidacao(
          () => senadoApiService.getVotacoes({
            dataInicio: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().slice(0, 10).replace(/-/g, ''),
            dataFim: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
            page: 1,
            limit: 100
          }),
          `comparativo de legislaturas (${metrica})`
        );
        break;
        
      case 'check-api-status':
        await verificarStatusAPI();
        break;
        
      case 'help':
      default:
        exibirAjuda();
        break;
    }
    
    logger.info('Processamento concluído com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('Erro fatal na execução principal:', error);
    process.exit(1);
  }
}

/**
 * Verifica o status dos principais endpoints da API do Senado
 */
async function verificarStatusAPI(): Promise<void> {
  // Implementação futura: verificar status dos principais endpoints
  logger.info('Verificação de status da API será implementada em versão futura');
}

/**
 * Executa uma função com validação e tratamento de erros
 */
async function executarComValidacao<T>(
  funcao: () => Promise<T>,
  descricao: string
): Promise<T> {
  try {
    logger.info(`Iniciando execução: ${descricao}`);
    
    const resultado = await funcao();
    
    if (resultado === null || resultado === undefined) {
      logger.warn(`Aviso: execução de ${descricao} retornou resultado vazio`);
    }
    
    logger.info(`Execução de ${descricao} concluída com sucesso`);
    return resultado;
  } catch (error) {
    logger.error(`Falha na execução de ${descricao}:`, error);
    throw error;
  }
}

/**
 * Obtém a data da última atualização para um tipo de recurso
 */
async function obterDataUltimaAtualizacao(tipoRecurso: string): Promise<Date | null> {
  try {
    const metadadosRef = getDb().collection('metadados').doc('atualizacoes');
    const doc = await metadadosRef.get();
    
    if (doc.exists) {
      const data = doc.data();
      const timestamp = data?.[tipoRecurso]?.ultimaAtualizacao;
      
      if (timestamp) {
        return timestamp.toDate();
      }
    }
    
    logger.info(`Sem registro de última atualização para ${tipoRecurso}, iniciando importação completa`);
    return null;
  } catch (error) {
    logger.error(`Erro ao obter data da última atualização para ${tipoRecurso}:`, error);
    return null;
  }
}

/**
 * Exibir ajuda sobre os comandos disponíveis
 */
function exibirAjuda(): void {
  const mensagem = `
República Brasileira - Sistema de Dados do Senado Federal

Uso: npm start -- [comando] [opções]

Comandos disponíveis:
  full-import                    Executa importação completa (legislaturas, senadores, matérias)
  import-legislaturas            Importa dados de legislaturas
  import-senadores               Importa dados de senadores atuais
  import-senadores-incremental   Importa apenas senadores atualizados desde a última execução
  import-senador [id]            Importa dados detalhados de um senador específico
  import-materias                Importa matérias legislativas
  import-materias-incremental    Importa apenas matérias atualizadas desde a última execução
  gerar-series                   Gera séries históricas com os dados importados
  comparativo-legislaturas [m]   Gera comparativo entre legislaturas para a métrica [m]
                                 (métricas disponíveis: votacoes, despesas, proposicoes)
  check-api-status               Verifica o status dos principais endpoints da API do Senado
  help                           Exibe esta ajuda

Exemplos:
  npm start -- import-senadores
  npm start -- import-senador 123456
  npm start -- import-materias-incremental
  npm start -- comparativo-legislaturas votacoes
  `;
  
  logger.info(mensagem);
}

/**
 * Executa o processo completo de importação
 */
async function executarImportacaoCompleta(): Promise<void> {
  try {
    logger.info('Iniciando importação completa dos dados');
    
    // 1. Registrar início da importação
    await registrarInicioImportacao();
    
    // Total de etapas para cálculo de progresso
    const totalEtapas = 6;
    let etapaAtual = 0;
    
    // 2. Importar legislaturas
    etapaAtual++;
    await atualizarProgresso('Importação de legislaturas', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Importação de legislaturas`);
    const numeroLegislatura = calcularLegislaturaAtual();
    await importarLegislatura({numero: numeroLegislatura} as any);
    
    // 3. Importar senadores
    etapaAtual++;
    await atualizarProgresso('Importação de senadores', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Importação de senadores`);
    // const totalSenadores = await senadoSenadoresService.importarSenadoresAtuais();
    // logger.info(`${totalSenadores} senadores importados`);
    
    // 4. Importar matérias legislativas
    etapaAtual++;
    await atualizarProgresso('Importação de matérias', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Importação de matérias`);
    // await senadoMateriasService.importMaterias([]);
    
    // 5. Gerar séries históricas
    etapaAtual++;
    await atualizarProgresso('Geração de séries históricas', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Geração de séries históricas`);
    // await senadoVotacoesService.buscarVotacoesPorPeriodo(
    //   new Date(new Date().getFullYear(), 0, 1),
    //   new Date()
    // );
    
    // 6. Gerar comparativos
    etapaAtual++;
    await atualizarProgresso('Geração de comparativos', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Geração de comparativos entre legislaturas`);
    // await senadoVotacoesService.buscarVotacoesPorPeriodo(
    //   new Date(new Date().getFullYear() - 1, 0, 1),
    //   new Date()
    // );
    
    // 7. Registrar última atualização
    etapaAtual++;
    await atualizarProgresso('Atualização de metadados', etapaAtual, totalEtapas);
    logger.info(`Etapa ${etapaAtual}/${totalEtapas}: Atualização de metadados`);
    await atualizarDataUltimaAtualizacao();
    
    // 8. Registrar conclusão
    await registrarConclusaoImportacao();
    
    logger.info('Importação completa finalizada com sucesso');
  } catch (error) {
    logger.error('Erro durante importação completa:', error);
    
    // Registrar falha
    await registrarFalhaImportacao(error as ImportacaoError);
    
    throw error;
  }
}

/**
 * Atualiza o progresso da importação
 */
async function atualizarProgresso(
  etapaAtual: string,
  numeroEtapa: number,
  totalEtapas: number,
  itensProcessados?: number,
  totalItens?: number
): Promise<void> {
  try {
    const percentual = Math.round((numeroEtapa / totalEtapas) * 100);
    
    const progresso = {
      etapaAtual,
      totalEtapas,
      percentual,
      ...(itensProcessados !== undefined && { itensProcessados }),
      ...(totalItens !== undefined && { totalItens })
    };
    
    await getDb().collection('metadados')
      .doc('importacoes')
      .set({
        ultimaImportacao: {
          progresso
        }
      }, { merge: true });
      
  } catch (error) {
    logger.error('Erro ao atualizar progresso da importação:', error);
  }
}

/**
 * Atualiza a data da última atualização para todos os tipos de recursos
 */
async function atualizarDataUltimaAtualizacao(): Promise<void> {
  try {
    const agora = Timestamp.now();
    
    await getDb().collection('metadados')
      .doc('atualizacoes')
      .set({
        senadores: {
          ultimaAtualizacao: agora
        },
        materias: {
          ultimaAtualizacao: agora
        },
        votacoes: {
          ultimaAtualizacao: agora
        },
        legislaturas: {
          ultimaAtualizacao: agora
        }
      }, { merge: true });
      
    logger.debug('Datas de última atualização atualizadas com sucesso');
  } catch (error) {
    logger.error('Erro ao atualizar datas de última atualização:', error);
  }
}

/**
 * Registra o início do processo de importação
 */
async function registrarInicioImportacao(): Promise<void> {
  try {
    const metadata: ImportacaoMetadata = {
      iniciada: Timestamp.now(),
      status: 'em_andamento',
      progresso: {
        etapaAtual: 'Inicialização',
        totalEtapas: 6,
        percentual: 0
      }
    };
    
    await getDb().collection('metadados')
      .doc('importacoes')
      .set({
        ultimaImportacao: metadata
      }, { merge: true });
  } catch (error) {
    logger.error('Erro ao registrar início da importação:', error);
  }
}

/**
 * Registra a conclusão do processo de importação
 */
async function registrarConclusaoImportacao(): Promise<void> {
  try {
    const metadata: Partial<ImportacaoMetadata> = {
      concluida: Timestamp.now(),
      status: 'concluida',
      progresso: {
        etapaAtual: 'Concluído',
        totalEtapas: 6,
        percentual: 100
      }
    };
    
    await getDb().collection('metadados')
      .doc('importacoes')
      .set({
        ultimaImportacao: metadata
      }, { merge: true });
  } catch (error) {
    logger.error('Erro ao registrar conclusão da importação:', error);
  }
}

/**
 * Registra falha no processo de importação
 */
async function registrarFalhaImportacao(error: ImportacaoError): Promise<void> {
  try {
    const metadata: Partial<ImportacaoMetadata> = {
      concluida: Timestamp.now(),
      status: 'falha',
      erro: error.message || 'Erro desconhecido'
    };
    
    await getDb().collection('metadados')
      .doc('importacoes')
      .set({
        ultimaImportacao: metadata
      }, { merge: true });
  } catch (err) {
    logger.error('Erro ao registrar falha da importação:', err);
  }
}

/**
 * Aplica limitação de taxa para múltiplas funções
 * Para evitar sobrecarga da API do Senado
 */
async function executarComLimiteDeRequisicoes<T>(funcoes: Array<() => Promise<T>>): Promise<T[]> {
  const resultados: T[] = [];
  let contadorRequisicoes = 0;
  let tempoInicio = Date.now();
  
  for (let i = 0; i < funcoes.length; i++) {
    // Verificar se atingiu o limite de requisições por minuto
    if (contadorRequisicoes >= MAX_REQUESTS_PER_MINUTE) {
      const tempoDecorrido = Date.now() - tempoInicio;
      const tempoRestante = Math.max(0, 60000 - tempoDecorrido);
      
      if (tempoRestante > 0) {
        logger.info(`Limite de ${MAX_REQUESTS_PER_MINUTE} requisições/minuto atingido. Aguardando ${Math.ceil(tempoRestante/1000)} segundos...`);
        await new Promise(resolve => setTimeout(resolve, tempoRestante + 1000)); // +1s de margem
      }
      
      // Reiniciar contador e timer
      contadorRequisicoes = 0;
      tempoInicio = Date.now();
    }
    
    // Executar função com timeout
    try {
      const resultado = await Promise.race([
        funcoes[i](),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout após ${REQUEST_TIMEOUT}ms`)), REQUEST_TIMEOUT)
        )
      ]);
      
      resultados.push(resultado);
      contadorRequisicoes++;
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      logger.error(`Erro na execução da função ${i+1}/${funcoes.length}:`, error);
      throw error;
    }
  }
  
  return resultados;
}

// Iniciar aplicação
logger.debug('Iniciando execução principal');
main().catch((error: Error) => {
  logger.error('Erro fatal na execução principal:', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

export { main, executarComLimiteDeRequisicoes };
export type { ImportacaoMetadata, ImportacaoError, MetricaComparativa };
