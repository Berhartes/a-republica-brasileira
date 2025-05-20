/**
 * Script para migrar dados de senadores da estrutura antiga para a nova estrutura normalizada
 * 
 * Este script lê os dados existentes no Firestore na estrutura antiga,
 * normaliza-os e os salva na nova estrutura, mantendo ambas as versões
 * durante o período de transição.
 */

import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { normalizarSenador } from './transformacao/normalizador';
import { carregadorNormalizado } from './carregamento/carregador_normalizado';
import { parseArgs } from './utils/args_parser';
import { createBatchManager } from './utils/firestore';

/**
 * Interface para opções de migração
 */
interface OpcoesMigracao {
  /** Limita o número de senadores a serem migrados */
  limite?: number;
  /** Se verdadeiro, apenas simula a migração sem salvar no Firestore */
  simulacao?: boolean;
  /** Se verdadeiro, exporta os dados normalizados para o PC */
  exportar?: boolean;
  /** Se verdadeiro, remove os dados da estrutura antiga após a migração */
  remover?: boolean;
}

/**
 * Função para migrar dados de senadores da estrutura antiga para a nova estrutura normalizada
 * @param opcoes - Opções de migração
 */
async function migrarEstruturaSenadores(opcoes: OpcoesMigracao = {}): Promise<void> {
  try {
    logger.info('=== Iniciando migração de dados de senadores para a nova estrutura normalizada ===');
    
    // Configurar opções
    const limite = opcoes.limite || 0;
    const simulacao = opcoes.simulacao || false;
    const exportar = opcoes.exportar || false;
    const remover = opcoes.remover || false;
    
    if (simulacao) {
      logger.info('MODO DE SIMULAÇÃO: Nenhuma alteração será feita no Firestore');
    }
    
    if (limite > 0) {
      logger.info(`Limitando migração a ${limite} senadores`);
    }
    
    // 1. Ler dados existentes no Firestore
    logger.info('1. Lendo dados existentes no Firestore');
    
    // Importar módulos do Firebase Admin
    const admin = require('firebase-admin');
    
    // Verificar se o app já foi inicializado
    if (!admin.apps.length) {
      // Inicializar o app do Firebase Admin
      admin.initializeApp({
        // Se estiver usando o emulador, configurar para usar o emulador
        projectId: 'a-republica-brasileira',
      });
      
      // Configurar para usar o emulador se a variável de ambiente estiver definida
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        logger.info(`Usando emulador do Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
        admin.firestore().settings({
          host: process.env.FIRESTORE_EMULATOR_HOST,
          ssl: false
        });
      }
    }
    
    const db = admin.firestore();
    
    // Obter todos os perfis de senadores da estrutura antiga
    const perfilRef = db.collection('congressoNacional/senadoFederal/perfis');
    const snapshot = await perfilRef.get();
    
    if (snapshot.empty) {
      logger.warn('Nenhum perfil de senador encontrado na estrutura antiga');
      return;
    }
    
    logger.info(`Encontrados ${snapshot.size} perfis de senadores na estrutura antiga`);
    
    // Limitar o número de senadores se necessário
    let perfisAntigos = snapshot.docs;
    
    if (limite > 0 && limite < perfisAntigos.length) {
      perfisAntigos = perfisAntigos.slice(0, limite);
      logger.info(`Limitando migração aos primeiros ${limite} senadores`);
    }
    
    // 2. Normalizar dados
    logger.info('2. Normalizando dados para a nova estrutura');
    
    const perfisNormalizados = [];
    let sucessosNormalizacao = 0;
    let falhasNormalizacao = 0;
    
    for (const [index, doc] of perfisAntigos.entries()) {
      try {
        const perfilAntigo = doc.data();
        logger.info(`Normalizando perfil do senador ${perfilAntigo.nome} (${perfilAntigo.codigo}) - ${index + 1}/${perfisAntigos.length}`);
        
        const perfilNormalizado = normalizarSenador(perfilAntigo);
        perfisNormalizados.push(perfilNormalizado);
        
        sucessosNormalizacao++;
      } catch (error: any) {
        logger.error(`Erro ao normalizar perfil do senador ${doc.id}: ${error.message}`);
        falhasNormalizacao++;
      }
    }
    
    logger.info(`Normalização concluída: ${sucessosNormalizacao} perfis normalizados com sucesso, ${falhasNormalizacao} falhas`);
    
    // 3. Exportar dados normalizados se solicitado
    if (exportar) {
      logger.info('3. Exportando dados normalizados para o PC');
      
      const { exportToJson } = require('./utils/file_exporter');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Exportar todos os perfis normalizados em um único arquivo
      exportToJson(perfisNormalizados, `senadores/migracao/perfis_normalizados_${timestamp}.json`);
      
      // Exportar cada perfil normalizado em um arquivo separado
      for (const perfilNormalizado of perfisNormalizados) {
        const senadorFilePath = `senadores/migracao/normalizado_senador_${perfilNormalizado.senador.codigo}_${timestamp}.json`;
        exportToJson(perfilNormalizado, senadorFilePath);
      }
      
      logger.info(`${perfisNormalizados.length} arquivos de perfis normalizados exportados com sucesso`);
    }
    
    // 4. Salvar dados normalizados no Firestore
    if (!simulacao) {
      logger.info('4. Salvando dados normalizados no Firestore');
      
      const resultadoCarregamento = await carregadorNormalizado.saveMultiplosSenadores(perfisNormalizados);
      
      logger.info(`Carregamento de perfis normalizados concluído: ${resultadoCarregamento.sucessos} salvos com sucesso, ${resultadoCarregamento.falhas} falhas`);
      logger.info(`Total de entidades carregadas: ${resultadoCarregamento.entidadesCarregadas.senadores} senadores, ${resultadoCarregamento.entidadesCarregadas.mandatos} mandatos, ${resultadoCarregamento.entidadesCarregadas.exercicios} exercícios, ${resultadoCarregamento.entidadesCarregadas.cargos} cargos, ${resultadoCarregamento.entidadesCarregadas.participacoesComissoes} participações em comissões, ${resultadoCarregamento.entidadesCarregadas.filiacoes} filiações, ${resultadoCarregamento.entidadesCarregadas.licencas} licenças, ${resultadoCarregamento.entidadesCarregadas.liderancas} lideranças, ${resultadoCarregamento.entidadesCarregadas.comissoes} comissões`);
      
      // 5. Remover dados da estrutura antiga se solicitado
      if (remover) {
        logger.info('5. Removendo dados da estrutura antiga');
        
        // Remover perfis da estrutura antiga
        const batchManager = createBatchManager();
        
        for (const doc of perfisAntigos) {
          const perfilRef = `congressoNacional/senadoFederal/perfis/${doc.id}`;
          batchManager.delete(perfilRef);
        }
        
        // Remover referências na coleção 'atual/senadores/itens'
        const atualRef = db.collection('congressoNacional/senadoFederal/atual/senadores/itens');
        const atualSnapshot = await atualRef.get();
        
        if (!atualSnapshot.empty) {
          for (const doc of atualSnapshot.docs) {
            const atualItemRef = `congressoNacional/senadoFederal/atual/senadores/itens/${doc.id}`;
            batchManager.delete(atualItemRef);
          }
        }
        
        // Commit das operações
        await batchManager.commit();
        
        logger.info(`Remoção de dados da estrutura antiga concluída: ${perfisAntigos.length} perfis removidos`);
      }
    } else {
      logger.info('Modo de simulação: Pulando etapas de salvamento e remoção');
    }
    
    logger.info('=== Migração de dados de senadores para a nova estrutura normalizada concluída com sucesso ===');
  } catch (error: any) {
    handleError('Erro na migração de dados de senadores', error);
    throw error;
  }
}

/**
 * Função principal para executar a migração
 */
function executarMigracao(): void {
  // Analisar argumentos da linha de comando
  const args = parseArgs();
  
  // Configurar opções de migração
  const opcoes: OpcoesMigracao = {
    limite: args.limite ? parseInt(args.limite as string, 10) : 0,
    simulacao: args.simulacao === 'true' || args.simulacao === true,
    exportar: args.exportar === 'true' || args.exportar === true,
    remover: args.remover === 'true' || args.remover === true
  };
  
  // Executar migração
  migrarEstruturaSenadores(opcoes)
    .then(() => {
      logger.info('Migração concluída com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha na migração de dados de senadores', error);
      process.exit(1);
    });
}

// Executa a migração se este arquivo for chamado diretamente
if (require.main === module) {
  executarMigracao();
}

export { migrarEstruturaSenadores };
