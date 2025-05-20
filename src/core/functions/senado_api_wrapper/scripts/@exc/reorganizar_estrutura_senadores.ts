/**
 * Script para reorganizar a estrutura de dados de senadores no Firestore
 * 
 * Este script mantém os dados em um único documento, mas melhora a organização interna,
 * padroniza a nomenclatura e adiciona metadados consistentes.
 */

import { logger } from './utils/logger';
import { handleError } from './utils/error_handler';
import { createBatchManager } from './utils/firestore';
import { parseArgs } from './utils/args_parser';

/**
 * Interface para opções de reorganização
 */
interface OpcoesReorganizacao {
  /** Limita o número de senadores a serem processados */
  limite?: number;
  /** Se verdadeiro, apenas simula a reorganização sem salvar no Firestore */
  simulacao?: boolean;
  /** Se verdadeiro, exporta os dados reorganizados para o PC */
  exportar?: boolean;
}

/**
 * Reorganiza a estrutura de um perfil de senador
 * @param perfilOriginal - Perfil original do senador
 * @returns Perfil reorganizado
 */
function reorganizarPerfilSenador(perfilOriginal: any): any {
  try {
    logger.info(`Reorganizando perfil do senador ${perfilOriginal.nome} (${perfilOriginal.codigo})`);
    
    // Criar estrutura reorganizada
    const perfilReorganizado: any = {
      // Dados básicos
      identificacao: {
        codigo: perfilOriginal.codigo,
        nome: perfilOriginal.nome,
        nomeCompleto: perfilOriginal.nomeCompleto,
        genero: perfilOriginal.genero,
        foto: perfilOriginal.foto,
        paginaOficial: perfilOriginal.paginaOficial,
        paginaParticular: perfilOriginal.paginaParticular,
        email: perfilOriginal.email,
        partido: perfilOriginal.partido || { sigla: '', nome: null },
        uf: perfilOriginal.uf,
        telefones: (perfilOriginal.telefones || []).map((tel: any) => ({
          numero: tel.numero,
          tipo: tel.tipo
        }))
      },
      
      // Dados pessoais
      dadosPessoais: perfilOriginal.dadosPessoais || {
        dataNascimento: '',
        naturalidade: '',
        ufNaturalidade: '',
        enderecoParlamentar: ''
      },
      
      // Formação
      formacao: perfilOriginal.formacao || {
        historicoAcademico: [],
        profissao: []
      },
      
      // Situação atual
      situacaoAtual: perfilOriginal.situacaoAtual || {
        emExercicio: perfilOriginal.situacao?.emExercicio || false,
        afastado: perfilOriginal.situacao?.afastado || false,
        titular: perfilOriginal.situacao?.titular || false,
        suplente: perfilOriginal.situacao?.suplente || false,
        cargoMesa: perfilOriginal.situacao?.cargoMesa || false,
        cargoLideranca: perfilOriginal.situacao?.cargoLideranca || false,
        motivoAfastamento: null,
        mandatoAtual: perfilOriginal.mandatoAtual || null,
        licencaAtual: null,
        ultimaLegislatura: perfilOriginal.mandatos && perfilOriginal.mandatos.length > 0 
          ? perfilOriginal.mandatos[0].legislatura 
          : ''
      },
      
      // Mandatos (organizados por legislatura)
      mandatos: (perfilOriginal.mandatos || []).map((mandato: any) => ({
        codigo: mandato.codigo || '',
        participacao: mandato.participacao || '',
        legislatura: mandato.legislatura || '',
        dataInicio: mandato.dataInicio || '',
        dataFim: mandato.dataFim || null,
        uf: mandato.uf || perfilOriginal.uf || '',
        exercicios: (mandato.exercicios || []).map((exercicio: any) => ({
          codigo: exercicio.codigo || '',
          dataInicio: exercicio.dataInicio || '',
          dataFim: exercicio.dataFim || null,
          causaAfastamento: exercicio.causaAfastamento || null,
          descricaoCausaAfastamento: exercicio.descricaoCausaAfastamento || null
        })),
        suplentes: (mandato.suplentes || []).map((suplente: any) => ({
          codigo: suplente.codigo || '',
          nome: suplente.nome || '',
          participacao: suplente.participacao || ''
        })),
        titular: mandato.titular ? {
          codigo: mandato.titular.codigo || '',
          nome: mandato.titular.nome || '',
          participacao: mandato.titular.participacao || ''
        } : undefined,
        primeiraLegislatura: mandato.primeiraLegislatura || {
          numero: '',
          dataInicio: '',
          dataFim: ''
        },
        segundaLegislatura: mandato.segundaLegislatura || {
          numero: '',
          dataInicio: '',
          dataFim: ''
        }
      })),
      
      // Cargos (organizados por tipo e comissão)
      cargos: (perfilOriginal.cargos || []).map((cargo: any) => ({
        tipo: {
          codigo: cargo.cargo?.codigo || '',
          descricao: cargo.cargo?.descricao || ''
        },
        comissao: cargo.comissao ? {
          codigo: cargo.comissao.codigo || '',
          sigla: cargo.comissao.sigla || '',
          nome: cargo.comissao.nome || '',
          casa: cargo.comissao.casa || ''
        } : null,
        dataInicio: cargo.dataInicio || '',
        dataFim: cargo.dataFim || null,
        atual: cargo.atual || false
      })),
      
      // Comissões (organizadas por casa e tipo de participação)
      comissoes: (perfilOriginal.comissoes || []).map((comissao: any) => ({
        codigo: comissao.codigo || '',
        sigla: comissao.sigla || '',
        nome: comissao.nome || '',
        casa: comissao.casa || '',
        participacao: comissao.participacao || '',
        dataInicio: comissao.dataInicio || '',
        dataFim: comissao.dataFim || null,
        atual: comissao.atual || false
      })),
      
      // Filiações partidárias (organizadas cronologicamente)
      filiacoes: (perfilOriginal.filiacoes || []).map((filiacao: any) => ({
        partido: {
          codigo: filiacao.partido?.codigo || '',
          sigla: filiacao.partido?.sigla || '',
          nome: filiacao.partido?.nome || ''
        },
        dataFiliacao: filiacao.dataFiliacao || '',
        dataDesfiliacao: filiacao.dataDesfiliacao || null,
        atual: filiacao.atual || false
      })),
      
      // Licenças (organizadas cronologicamente)
      licencas: (perfilOriginal.licencas || []).map((licenca: any) => ({
        codigo: licenca.codigo || '',
        tipo: {
          sigla: licenca.tipo?.sigla || '',
          descricao: licenca.tipo?.descricao || ''
        },
        dataInicio: licenca.dataInicio || '',
        dataFim: licenca.dataFim || '',
        atual: licenca.atual || false
      })),
      
      // Lideranças (organizadas por casa e tipo)
      liderancas: (perfilOriginal.liderancas || []).map((lideranca: any) => ({
        codigo: lideranca.codigo || 0,
        casa: lideranca.casa || '',
        tipoUnidade: {
          codigo: lideranca.tipoUnidade?.codigo || 0,
          sigla: lideranca.tipoUnidade?.sigla || '',
          descricao: lideranca.tipoUnidade?.descricao || ''
        },
        tipoLideranca: {
          codigo: lideranca.tipoLideranca?.codigo || '',
          sigla: lideranca.tipoLideranca?.sigla || '',
          descricao: lideranca.tipoLideranca?.descricao || ''
        },
        dataDesignacao: lideranca.dataDesignacao || '',
        dataTermino: lideranca.dataTermino || null,
        atual: lideranca.atual || false,
        partido: {
          codigo: lideranca.partido?.codigo || 0,
          sigla: lideranca.partido?.sigla || '',
          nome: lideranca.partido?.nome || ''
        }
      })),
      
      // Metadados
      metadados: {
        atualizadoEm: new Date().toISOString(),
        fontes: perfilOriginal.metadados?.fontes || {
          dadosBasicos: `/senador/${perfilOriginal.codigo}`,
          mandatos: `/senador/${perfilOriginal.codigo}/mandatos`,
          cargos: `/senador/${perfilOriginal.codigo}/cargos`,
          comissoes: `/senador/${perfilOriginal.codigo}/comissoes`,
          filiacoes: `/senador/${perfilOriginal.codigo}/filiacoes`,
          historicoAcademico: `/senador/${perfilOriginal.codigo}/historicoAcademico`,
          licencas: `/senador/${perfilOriginal.codigo}/licencas`,
          profissao: `/senador/${perfilOriginal.codigo}/profissao`,
          liderancas: `/composicao/lideranca`
        },
        versaoEstrutura: '1.1',
        processadoPor: 'reorganizar_estrutura_senadores.ts'
      }
    };
    
    logger.info(`Reorganização concluída para o senador ${perfilOriginal.nome} (${perfilOriginal.codigo})`);
    
    return perfilReorganizado;
  } catch (error: any) {
    logger.error(`Erro ao reorganizar perfil do senador ${perfilOriginal?.nome || 'desconhecido'} (${perfilOriginal?.codigo || 'desconhecido'}): ${error.message}`);
    throw error;
  }
}

/**
 * Função para reorganizar a estrutura de dados de senadores no Firestore
 * @param opcoes - Opções de reorganização
 */
async function reorganizarEstruturaSenadores(opcoes: OpcoesReorganizacao = {}): Promise<void> {
  try {
    logger.info('=== Iniciando reorganização da estrutura de dados de senadores ===');
    
    // Configurar opções
    const limite = opcoes.limite || 0;
    const simulacao = opcoes.simulacao || false;
    const exportar = opcoes.exportar || false;
    
    if (simulacao) {
      logger.info('MODO DE SIMULAÇÃO: Nenhuma alteração será feita no Firestore');
    }
    
    if (limite > 0) {
      logger.info(`Limitando reorganização a ${limite} senadores`);
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
    
    // Obter todos os perfis de senadores
    const perfilRef = db.collection('congressoNacional/senadoFederal/perfis');
    const snapshot = await perfilRef.get();
    
    if (snapshot.empty) {
      logger.warn('Nenhum perfil de senador encontrado');
      return;
    }
    
    logger.info(`Encontrados ${snapshot.size} perfis de senadores`);
    
    // Limitar o número de senadores se necessário
    let perfisOriginais = snapshot.docs;
    
    if (limite > 0 && limite < perfisOriginais.length) {
      perfisOriginais = perfisOriginais.slice(0, limite);
      logger.info(`Limitando reorganização aos primeiros ${limite} senadores`);
    }
    
    // 2. Reorganizar dados
    logger.info('2. Reorganizando dados');
    
    const perfisReorganizados = [];
    let sucessosReorganizacao = 0;
    let falhasReorganizacao = 0;
    
    for (const [index, doc] of perfisOriginais.entries()) {
      try {
        const perfilOriginal = doc.data();
        logger.info(`Reorganizando perfil do senador ${perfilOriginal.nome} (${perfilOriginal.codigo}) - ${index + 1}/${perfisOriginais.length}`);
        
        const perfilReorganizado = reorganizarPerfilSenador(perfilOriginal);
        perfisReorganizados.push({
          id: doc.id,
          dados: perfilReorganizado
        });
        
        sucessosReorganizacao++;
      } catch (error: any) {
        logger.error(`Erro ao reorganizar perfil do senador ${doc.id}: ${error.message}`);
        falhasReorganizacao++;
      }
    }
    
    logger.info(`Reorganização concluída: ${sucessosReorganizacao} perfis reorganizados com sucesso, ${falhasReorganizacao} falhas`);
    
    // 3. Exportar dados reorganizados se solicitado
    if (exportar) {
      logger.info('3. Exportando dados reorganizados para o PC');
      
      const { exportToJson } = require('./utils/file_exporter');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Exportar todos os perfis reorganizados em um único arquivo
      exportToJson(perfisReorganizados.map(p => p.dados), `senadores/reorganizados/perfis_reorganizados_${timestamp}.json`);
      
      // Exportar cada perfil reorganizado em um arquivo separado
      for (const perfil of perfisReorganizados) {
        const senadorFilePath = `senadores/reorganizados/reorganizado_senador_${perfil.dados.identificacao.codigo}_${timestamp}.json`;
        exportToJson(perfil.dados, senadorFilePath);
      }
      
      logger.info(`${perfisReorganizados.length} arquivos de perfis reorganizados exportados com sucesso`);
    }
    
    // 4. Salvar dados reorganizados no Firestore
    if (!simulacao) {
      logger.info('4. Salvando dados reorganizados no Firestore');
      
      const batchManager = createBatchManager();
      let sucessosSalvamento = 0;
      let falhasSalvamento = 0;
      
      for (const perfil of perfisReorganizados) {
        try {
          const perfilRef = `congressoNacional/senadoFederal/perfis/${perfil.id}`;
          batchManager.set(perfilRef, perfil.dados);
          sucessosSalvamento++;
        } catch (error: any) {
          logger.error(`Erro ao salvar perfil reorganizado do senador ${perfil.id}: ${error.message}`);
          falhasSalvamento++;
        }
      }
      
      // Commit das operações
      await batchManager.commit();
      
      logger.info(`Salvamento concluído: ${sucessosSalvamento} perfis salvos com sucesso, ${falhasSalvamento} falhas`);
    } else {
      logger.info('Modo de simulação: Pulando etapa de salvamento');
    }
    
    logger.info('=== Reorganização da estrutura de dados de senadores concluída com sucesso ===');
  } catch (error: any) {
    handleError('Erro na reorganização da estrutura de dados de senadores', error);
    throw error;
  }
}

/**
 * Função principal para executar a reorganização
 */
function executarReorganizacao(): void {
  // Analisar argumentos da linha de comando
  const args = parseArgs();
  
  // Configurar opções de reorganização
  const opcoes: OpcoesReorganizacao = {
    limite: args.limite ? parseInt(args.limite as string, 10) : 0,
    simulacao: args.simulacao === 'true' || args.simulacao === true,
    exportar: args.exportar === 'true' || args.exportar === true
  };
  
  // Executar reorganização
  reorganizarEstruturaSenadores(opcoes)
    .then(() => {
      logger.info('Reorganização concluída com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha na reorganização da estrutura de dados de senadores', error);
      process.exit(1);
    });
}

// Executa a reorganização se este arquivo for chamado diretamente
if (require.main === module) {
  executarReorganizacao();
}

export { reorganizarEstruturaSenadores, reorganizarPerfilSenador };
