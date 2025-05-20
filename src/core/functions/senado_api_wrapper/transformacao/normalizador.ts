/**
 * Normalizador de dados do Senado Federal
 * 
 * Este módulo contém funções para transformar os dados da estrutura antiga (aninhada)
 * para a nova estrutura normalizada, seguindo boas práticas do Firestore.
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import {
  Senador,
  Mandato,
  Exercicio,
  Comissao,
  Cargo,
  ParticipacaoComissao,
  FiliacaoPartidaria,
  Licenca,
  Lideranca,
  Metadados
} from '../models/estrutura_normalizada';

/**
 * Versão atual da estrutura de dados
 */
const VERSAO_ESTRUTURA = '2.0';

/**
 * Cria metadados padrão para um documento
 * @param origem - Origem dos dados
 * @param processadoPor - Script que processou os dados
 * @returns Objeto de metadados
 */
export function criarMetadados(origem: string, processadoPor: string): Metadados {
  return {
    origem,
    versaoEstrutura: VERSAO_ESTRUTURA,
    ultimaAtualizacao: new Date().toISOString(),
    processadoPor
  };
}

/**
 * Interface para o resultado da normalização de um senador
 */
export interface ResultadoNormalizacaoSenador {
  senador: Senador;
  mandatos: Mandato[];
  exercicios: { mandatoId: string; exercicio: Exercicio }[];
  cargos: Cargo[];
  participacoesComissoes: ParticipacaoComissao[];
  filiacoes: FiliacaoPartidaria[];
  licencas: Licenca[];
  liderancas: Lideranca[];
  comissoes: Comissao[];
}

/**
 * Normaliza os dados de um senador da estrutura antiga para a nova estrutura
 * @param perfilAntigo - Perfil do senador na estrutura antiga
 * @returns Resultado da normalização com todas as entidades separadas
 */
export function normalizarSenador(perfilAntigo: any): ResultadoNormalizacaoSenador {
  try {
    logger.info(`Normalizando dados do senador ${perfilAntigo.nome} (${perfilAntigo.codigo})`);
    
    // Coleção de comissões únicas
    const comissoesMap = new Map<string, Comissao>();
    
    // 1. Normalizar dados básicos do senador
    const senador: Senador = {
      codigo: perfilAntigo.codigo,
      nome: perfilAntigo.nome,
      nomeCompleto: perfilAntigo.nomeCompleto,
      genero: perfilAntigo.genero,
      foto: perfilAntigo.foto,
      paginaOficial: perfilAntigo.paginaOficial,
      paginaParticular: perfilAntigo.paginaParticular,
      email: perfilAntigo.email,
      partido: {
        sigla: perfilAntigo.partido?.sigla || '',
        nome: perfilAntigo.partido?.nome || null
      },
      uf: perfilAntigo.uf,
      telefones: (perfilAntigo.telefones || []).map((tel: any) => ({
        numero: tel.numero,
        tipo: tel.tipo
      })),
      situacaoAtual: perfilAntigo.situacaoAtual || {
        emExercicio: perfilAntigo.situacao?.emExercicio || false,
        afastado: perfilAntigo.situacao?.afastado || false,
        titular: perfilAntigo.situacao?.titular || false,
        suplente: perfilAntigo.situacao?.suplente || false,
        cargoMesa: perfilAntigo.situacao?.cargoMesa || false,
        cargoLideranca: perfilAntigo.situacao?.cargoLideranca || false,
        motivoAfastamento: null
      },
      dadosPessoais: perfilAntigo.dadosPessoais || {
        dataNascimento: '',
        naturalidade: '',
        ufNaturalidade: '',
        enderecoParlamentar: ''
      },
      mandatoAtualId: perfilAntigo.mandatoAtual?.codigo || null,
      metadados: criarMetadados(
        'API Senado Federal - Perfil Parlamentar',
        'processar_perfilsenadores.ts'
      )
    };
    
    // 2. Normalizar mandatos
    const mandatos: Mandato[] = (perfilAntigo.mandatos || []).map((mandatoAntigo: any) => {
      const mandatoId = mandatoAntigo.codigo || uuidv4();
      
      return {
        id: mandatoId,
        codigo: mandatoAntigo.codigo || '',
        participacao: mandatoAntigo.participacao || '',
        legislatura: mandatoAntigo.legislatura || '',
        dataInicio: mandatoAntigo.dataInicio || '',
        dataFim: mandatoAntigo.dataFim || null,
        uf: mandatoAntigo.uf || perfilAntigo.uf || '',
        titularId: mandatoAntigo.titular?.codigo || null,
        suplentesIds: mandatoAntigo.suplentes ? 
          mandatoAntigo.suplentes.map((s: any) => s.codigo).filter(Boolean) : 
          null,
        primeiraLegislatura: mandatoAntigo.primeiraLegislatura || {
          numero: '',
          dataInicio: '',
          dataFim: ''
        },
        segundaLegislatura: mandatoAntigo.segundaLegislatura || {
          numero: '',
          dataInicio: '',
          dataFim: ''
        },
        metadados: criarMetadados(
          'API Senado Federal - Mandatos',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // 3. Normalizar exercícios
    const exercicios: { mandatoId: string; exercicio: Exercicio }[] = [];
    
    (perfilAntigo.mandatos || []).forEach((mandatoAntigo: any) => {
      const mandatoId = mandatoAntigo.codigo || '';
      
      (mandatoAntigo.exercicios || []).forEach((exercicioAntigo: any) => {
        exercicios.push({
          mandatoId,
          exercicio: {
            id: exercicioAntigo.codigo || uuidv4(),
            codigo: exercicioAntigo.codigo || '',
            dataInicio: exercicioAntigo.dataInicio || '',
            dataFim: exercicioAntigo.dataFim || null,
            causaAfastamento: exercicioAntigo.causaAfastamento || null,
            descricaoCausaAfastamento: exercicioAntigo.descricaoCausaAfastamento || null,
            metadados: criarMetadados(
              'API Senado Federal - Exercícios',
              'processar_perfilsenadores.ts'
            )
          }
        });
      });
    });
    
    // 4. Normalizar cargos e extrair comissões
    const cargos: Cargo[] = (perfilAntigo.cargos || []).map((cargoAntigo: any) => {
      // Extrair comissão para a coleção separada
      if (cargoAntigo.comissao) {
        const comissao: Comissao = {
          codigo: cargoAntigo.comissao.codigo,
          sigla: cargoAntigo.comissao.sigla,
          nome: cargoAntigo.comissao.nome,
          casa: cargoAntigo.comissao.casa,
          metadados: criarMetadados(
            'API Senado Federal - Comissões',
            'processar_perfilsenadores.ts'
          )
        };
        
        comissoesMap.set(comissao.codigo, comissao);
      }
      
      return {
        id: uuidv4(),
        tipo: {
          codigo: cargoAntigo.cargo?.codigo || '',
          descricao: cargoAntigo.cargo?.descricao || ''
        },
        comissaoId: cargoAntigo.comissao?.codigo || '',
        dataInicio: cargoAntigo.dataInicio || '',
        dataFim: cargoAntigo.dataFim || null,
        atual: cargoAntigo.atual || false,
        metadados: criarMetadados(
          'API Senado Federal - Cargos',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // 5. Normalizar participações em comissões e extrair comissões
    const participacoesComissoes: ParticipacaoComissao[] = (perfilAntigo.comissoes || []).map((comissaoAntiga: any) => {
      // Extrair comissão para a coleção separada
      const comissao: Comissao = {
        codigo: comissaoAntiga.codigo,
        sigla: comissaoAntiga.sigla,
        nome: comissaoAntiga.nome,
        casa: comissaoAntiga.casa,
        metadados: criarMetadados(
          'API Senado Federal - Comissões',
          'processar_perfilsenadores.ts'
        )
      };
      
      comissoesMap.set(comissao.codigo, comissao);
      
      return {
        id: uuidv4(),
        comissaoId: comissaoAntiga.codigo,
        participacao: comissaoAntiga.participacao || '',
        dataInicio: comissaoAntiga.dataInicio || '',
        dataFim: comissaoAntiga.dataFim || null,
        atual: comissaoAntiga.atual || false,
        metadados: criarMetadados(
          'API Senado Federal - Participações em Comissões',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // 6. Normalizar filiações partidárias
    const filiacoes: FiliacaoPartidaria[] = (perfilAntigo.filiacoes || []).map((filiacaoAntiga: any) => {
      return {
        id: uuidv4(),
        partido: {
          codigo: filiacaoAntiga.partido?.codigo || '',
          sigla: filiacaoAntiga.partido?.sigla || '',
          nome: filiacaoAntiga.partido?.nome || ''
        },
        dataFiliacao: filiacaoAntiga.dataFiliacao || '',
        dataDesfiliacao: filiacaoAntiga.dataDesfiliacao || null,
        atual: filiacaoAntiga.atual || false,
        metadados: criarMetadados(
          'API Senado Federal - Filiações Partidárias',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // 7. Normalizar licenças
    const licencas: Licenca[] = (perfilAntigo.licencas || []).map((licencaAntiga: any) => {
      return {
        id: uuidv4(),
        codigo: licencaAntiga.codigo || '',
        tipo: {
          sigla: licencaAntiga.tipo?.sigla || '',
          descricao: licencaAntiga.tipo?.descricao || ''
        },
        dataInicio: licencaAntiga.dataInicio || '',
        dataFim: licencaAntiga.dataFim || '',
        atual: licencaAntiga.atual || false,
        metadados: criarMetadados(
          'API Senado Federal - Licenças',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // 8. Normalizar lideranças
    const liderancas: Lideranca[] = (perfilAntigo.liderancas || []).map((liderancaAntiga: any) => {
      return {
        id: uuidv4(),
        codigo: liderancaAntiga.codigo || 0,
        casa: liderancaAntiga.casa || '',
        tipoUnidade: {
          codigo: liderancaAntiga.tipoUnidade?.codigo || 0,
          sigla: liderancaAntiga.tipoUnidade?.sigla || '',
          descricao: liderancaAntiga.tipoUnidade?.descricao || ''
        },
        tipoLideranca: {
          codigo: liderancaAntiga.tipoLideranca?.codigo || '',
          sigla: liderancaAntiga.tipoLideranca?.sigla || '',
          descricao: liderancaAntiga.tipoLideranca?.descricao || ''
        },
        dataDesignacao: liderancaAntiga.dataDesignacao || '',
        dataTermino: liderancaAntiga.dataTermino || null,
        atual: liderancaAntiga.atual || false,
        partido: {
          codigo: liderancaAntiga.partido?.codigo || 0,
          sigla: liderancaAntiga.partido?.sigla || '',
          nome: liderancaAntiga.partido?.nome || ''
        },
        metadados: criarMetadados(
          'API Senado Federal - Lideranças',
          'processar_perfilsenadores.ts'
        )
      };
    });
    
    // Converter o Map de comissões para array
    const comissoes = Array.from(comissoesMap.values());
    
    logger.info(`Normalização concluída para o senador ${perfilAntigo.nome} (${perfilAntigo.codigo})`);
    logger.info(`Entidades normalizadas: ${mandatos.length} mandatos, ${exercicios.length} exercícios, ${cargos.length} cargos, ${participacoesComissoes.length} participações em comissões, ${filiacoes.length} filiações, ${licencas.length} licenças, ${liderancas.length} lideranças, ${comissoes.length} comissões únicas`);
    
    return {
      senador,
      mandatos,
      exercicios,
      cargos,
      participacoesComissoes,
      filiacoes,
      licencas,
      liderancas,
      comissoes
    };
  } catch (error: any) {
    logger.error(`Erro ao normalizar dados do senador ${perfilAntigo?.nome || 'desconhecido'} (${perfilAntigo?.codigo || 'desconhecido'}): ${error.message}`);
    throw error;
  }
}
