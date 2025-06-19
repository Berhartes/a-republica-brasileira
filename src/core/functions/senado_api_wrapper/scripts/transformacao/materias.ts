/**
 * Módulo para transformação de dados de matérias legislativas (autorias e relatorias) de senadores
 *
 * Este módulo implementa funções para transformar dados brutos de matérias legislativas
 * extraídos da API do Senado Federal em um formato estruturado e padronizado.
 */
import { logger } from '../utils/logging';
import { MateriaResult } from '../extracao/materias';

/**
 * Interface para matéria legislativa transformada
 */
export interface MateriaTransformada {
  codigo: string;
  senador: {
    codigo: string;
    nome: string;
    partido: {
      sigla: string;
      nome?: string;
    };
    uf: string;
  };
  // Campo específico para autorias individuais
  autoriasIndividuais: {
    id: string;
    tipo: string;
    numero: string;
    ano: string;
    ementa: string;
    data: string;
    url?: string;
    autoria?: string;
    nomeSenador?: string;
  }[];
  // Campo específico para coautorias
  coautorias: {
    id: string;
    tipo: string;
    numero: string;
    ano: string;
    ementa: string;
    data: string;
    url?: string;
    autoria?: string;
    nomeSenador?: string;
  }[];
  // Campo específico para autorias coletivas
  autoriasColetivas?: {
    id: string;
    tipo: string;
    numero: string;
    ano: string;
    ementa: string;
    data: string;
    url?: string;
    autoria?: string;
    nomeSenador?: string;
  }[];
  relatorias: {
    id: string;
    tipo: string;
    numero: string;
    ano: string;
    ementa: string;
    data: string;
    comissao: string;
    resultado?: string;
  }[];
  estatisticasAutorias?: {
    total: number;
    individual: number;
    coautoria: number;
    coletiva: number;
    outro?: number;
    desconhecido?: number;
    percentualIndividual?: number;
    percentualCoautoria?: number;
    percentualColetiva?: number;
    // Estatísticas por tipo de matéria
    porTipo?: {
      [tipo: string]: {
        total: number;
        percentual: number;
      };
    };
    // Parceiros frequentes em coautorias
    parceirosFrequentes?: {
      nome: string;
      ocorrencias: number;
      percentual: number;
    }[];
  };
  timestamp: string;
  atualizadoEm?: string;
  autoriasLimitadas?: boolean;
  relatoriasLimitadas?: boolean;
  totalAutorias?: number;
  totalRelatorias?: number;
}

/**
 * Classe para transformação de dados de matérias legislativas
 */
export class MateriasTransformer {
  /**
   * Transforma dados brutos de matérias legislativas em formato padronizado
   * @param materiaResult - Resultado da extração de matérias
   * @returns Matéria transformada
   */
  transformMateria(materiaResult: MateriaResult): MateriaTransformada | null {
    try {
      logger.info(`Transformando matérias do senador ${materiaResult.codigo}`);

      // Verificar se temos dados válidos
      if (!materiaResult || materiaResult.erro || !materiaResult.dadosBasicos || !materiaResult.dadosBasicos.dados) {
        logger.warn(`Dados inválidos para o senador ${materiaResult.codigo}, pulando transformação`);
        return null;
      }

      // Extrair informações básicas do senador
      const dadosBasicos = materiaResult.dadosBasicos.dados;

      // Log para depuração da estrutura completa
      logger.info(`Estrutura completa dos dados básicos do senador ${materiaResult.codigo}: ${JSON.stringify(Object.keys(dadosBasicos), null, 2)}`);

      // Verificar diferentes caminhos possíveis para os dados do parlamentar
      let parlamentar: any = {};
      let identificacao: any = {};

      // Caminho 1: DetalheParlamentar.Parlamentar
      if (dadosBasicos.DetalheParlamentar?.Parlamentar) {
        parlamentar = dadosBasicos.DetalheParlamentar.Parlamentar;
        identificacao = parlamentar.IdentificacaoParlamentar || {};
        logger.info(`Dados do parlamentar encontrados no caminho DetalheParlamentar.Parlamentar`);
      }
      // Caminho 2: Parlamentar
      else if (dadosBasicos.Parlamentar) {
        parlamentar = dadosBasicos.Parlamentar;
        identificacao = parlamentar.IdentificacaoParlamentar || {};
        logger.info(`Dados do parlamentar encontrados no caminho Parlamentar`);
      }
      // Caminho 3: IdentificacaoParlamentar diretamente
      else if (dadosBasicos.IdentificacaoParlamentar) {
        identificacao = dadosBasicos.IdentificacaoParlamentar;
        logger.info(`Dados do parlamentar encontrados no caminho IdentificacaoParlamentar`);
      }

      // Log para depuração dos dados de identificação
      logger.info(`Dados de identificação do senador ${materiaResult.codigo}: ${JSON.stringify(identificacao, null, 2)}`);

      // Verificar se temos o nome do senador
      if (!identificacao.NomeParlamentar) {
        logger.warn(`Nome do senador ${materiaResult.codigo} não encontrado nos dados básicos. Tentando extrair de outras fontes.`);
      }

      // Transformar autorias
      const autorias = this.transformarAutorias(materiaResult.autorias);

      // Tentar extrair o nome do senador de várias fontes
      let nomeSenador = identificacao.NomeParlamentar;

      if (!nomeSenador) {
        logger.warn(`Nome do senador ${materiaResult.codigo} não encontrado nos dados básicos. Tentando extrair de outras fontes.`);

        // Verificar em diferentes caminhos na estrutura de dados
        if (dadosBasicos.DetalheParlamentar?.Parlamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.DetalheParlamentar.Parlamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de DetalheParlamentar.Parlamentar.NomeParlamentar: ${nomeSenador}`);
        }
        else if (dadosBasicos.DetalheParlamentar?.Parlamentar?.IdentificacaoParlamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.DetalheParlamentar.Parlamentar.IdentificacaoParlamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de DetalheParlamentar.Parlamentar.IdentificacaoParlamentar.NomeParlamentar: ${nomeSenador}`);
        }
        else if (dadosBasicos.Parlamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.Parlamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de Parlamentar.NomeParlamentar: ${nomeSenador}`);
        }
        else if (dadosBasicos.Parlamentar?.IdentificacaoParlamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.Parlamentar.IdentificacaoParlamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de Parlamentar.IdentificacaoParlamentar.NomeParlamentar: ${nomeSenador}`);
        }
        else if (dadosBasicos.IdentificacaoParlamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.IdentificacaoParlamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de IdentificacaoParlamentar.NomeParlamentar: ${nomeSenador}`);
        }
        else if (dadosBasicos.DadosBasicosParalamentar?.NomeParlamentar) {
          nomeSenador = dadosBasicos.DadosBasicosParalamentar.NomeParlamentar;
          logger.info(`Nome do senador extraído de DadosBasicosParalamentar.NomeParlamentar: ${nomeSenador}`);
        }
      } else {
        logger.info(`Nome do senador extraído de identificacao.NomeParlamentar: ${nomeSenador}`);
      }

      // Se ainda não encontrou, usar um valor padrão
      if (!nomeSenador) {
        nomeSenador = 'Nome não disponível';
        logger.warn(`Não foi possível extrair o nome do senador ${materiaResult.codigo} de nenhuma fonte`);
      }

      // Separar autorias por tipo
      const autoriasIndividuais = autorias.filter(a => a && a.tipoAutoria === 'individual');
      const coautorias = autorias.filter(a => a && a.tipoAutoria === 'coautoria');
      const autoriasColetivas = autorias.filter(a => a && a.tipoAutoria === 'coletiva');

      // Log para depuração
      logger.info(`Autorias separadas por tipo:`);
      logger.info(`- Individuais: ${autoriasIndividuais.length}`);
      logger.info(`- Coautorias: ${coautorias.length}`);
      logger.info(`- Coletivas: ${autoriasColetivas.length}`);

      // Calcular estatísticas de autorias
      const estatisticasAutorias = this.calcularEstatisticasAutorias(autorias, coautorias, nomeSenador);

      // Mostrar estatísticas por tipo de matéria
      if (estatisticasAutorias.porTipo) {
        logger.info(`Estatísticas por tipo de matéria:`);
        Object.entries(estatisticasAutorias.porTipo).forEach(([tipo, stats]: [string, any]) => {
          logger.info(`- ${tipo}: ${stats.total} (${stats.percentual}%)`);
        });
      }

      // Mostrar parceiros frequentes
      if (estatisticasAutorias.parceirosFrequentes && estatisticasAutorias.parceirosFrequentes.length > 0) {
        logger.info(`Parceiros frequentes em coautorias:`);
        estatisticasAutorias.parceirosFrequentes.forEach((parceiro: any, index: number) => {
          logger.info(`${index + 1}. ${parceiro.nome}: ${parceiro.ocorrencias} ocorrências (${parceiro.percentual}%)`);
        });
      }

      // Transformar relatorias
      const relatorias = this.transformarRelatorias(materiaResult.relatorias);

      // Criar objeto transformado
      const materiaTransformada: MateriaTransformada = {
        codigo: String(materiaResult.codigo),
        senador: {
          codigo: String(materiaResult.codigo),
          nome: nomeSenador,
          partido: {
            sigla: identificacao.SiglaPartidoParlamentar || '',
            nome: identificacao.NomePartidoParlamentar
          },
          uf: identificacao.UfParlamentar || ''
        },
        // Adicionar campos separados por tipo de autoria (sem redundância)
        autoriasIndividuais,
        coautorias,
        autoriasColetivas: autoriasColetivas.length > 0 ? autoriasColetivas : undefined,
        relatorias,
        estatisticasAutorias,
        timestamp: new Date().toISOString()
      };

      return materiaTransformada;
    } catch (error: any) {
      logger.error(`Erro ao transformar matérias do senador ${materiaResult.codigo}: ${error.message}`);
      return null;
    }
  }

  /**
   * Transforma múltiplas matérias legislativas
   * @param materiasResults - Array de resultados de extração de matérias
   * @returns Array de matérias transformadas
   */
  async transformMultiplasMaterias(materiasResults: MateriaResult[]): Promise<MateriaTransformada[]> {
    try {
      logger.info(`Transformando ${materiasResults.length} matérias de senadores`);

      const materiasTransformadas: MateriaTransformada[] = [];

      for (const materiaResult of materiasResults) {
        try {
          const materiaTransformada = this.transformMateria(materiaResult);
          if (materiaTransformada) {
            materiasTransformadas.push(materiaTransformada);
          }
        } catch (error: any) {
          logger.warn(`Erro ao transformar matéria do senador ${materiaResult.codigo}: ${error.message}`);
        }
      }

      logger.info(`Transformação concluída: ${materiasTransformadas.length} matérias transformadas`);
      return materiasTransformadas;
    } catch (error: any) {
      logger.error(`Erro ao transformar múltiplas matérias: ${error.message}`);
      return [];
    }
  }

  /**
   * Extrai parceiros de coautorias
   * @param coautorias - Array de coautorias
   * @param nomeSenador - Nome do senador principal
   * @returns Array de parceiros com contagem de ocorrências
   */
  private extrairParceirosCoautorias(coautorias: any[], nomeSenador: string): any[] {
    if (!coautorias || coautorias.length === 0) {
      return [];
    }

    // Mapa para contar ocorrências de cada parceiro
    const parceirosMap: Map<string, number> = new Map();

    // Expressão regular para extrair nomes de senadores
    // Formato típico: "Senador Nome do Senador (PARTIDO/UF)"
    const regexSenador = /Senador[a]?\s+([^(]+?)(?:\s+\([^)]+\))?(?:,|e|$)/gi;

    // Processar cada coautoria
    for (const coautoria of coautorias) {
      if (!coautoria || !coautoria.autoria) continue;

      // Extrair todos os nomes de senadores da autoria
      const autoria = coautoria.autoria;
      let match;
      const senadores: string[] = [];

      // Reset do regex para cada autoria
      regexSenador.lastIndex = 0;

      // Encontrar todos os senadores mencionados
      while ((match = regexSenador.exec(autoria)) !== null) {
        const nomeParceiro = match[1].trim();
        senadores.push(nomeParceiro);
      }

      // Se não encontrou senadores com o regex, tentar outras abordagens
      if (senadores.length === 0) {
        // Tentar dividir por vírgulas e "e"
        const partes = autoria
          .replace(/ e /g, ', ')
          .split(',')
          .map((p: string) => p.trim())
          .filter((p: string) => p && !p.includes('outros'));

        senadores.push(...partes);
      }

      // Adicionar cada senador ao mapa, exceto o próprio senador
      for (const senador of senadores) {
        // Verificar se não é o próprio senador (comparação aproximada)
        if (senador && !this.nomesSimilares(senador, nomeSenador)) {
          const nomeNormalizado = this.normalizarNome(senador);
          parceirosMap.set(nomeNormalizado, (parceirosMap.get(nomeNormalizado) || 0) + 1);
        }
      }
    }

    // Converter o mapa para array e ordenar por número de ocorrências
    const parceiros = Array.from(parceirosMap.entries())
      .map(([nome, ocorrencias]) => ({ nome, ocorrencias }))
      .sort((a, b) => b.ocorrencias - a.ocorrencias);

    // Calcular percentuais
    const total = coautorias.length;
    return parceiros.map(p => ({
      ...p,
      percentual: Math.round((p.ocorrencias / total) * 100)
    }));
  }

  /**
   * Verifica se dois nomes são similares (para evitar contar o próprio senador)
   * @param nome1 - Primeiro nome
   * @param nome2 - Segundo nome
   * @returns true se os nomes forem similares
   */
  private nomesSimilares(nome1: string, nome2: string): boolean {
    const n1 = this.normalizarNome(nome1);
    const n2 = this.normalizarNome(nome2);

    // Verificar se um nome contém o outro
    return n1.includes(n2) || n2.includes(n1);
  }

  /**
   * Normaliza um nome para comparação
   * @param nome - Nome a ser normalizado
   * @returns Nome normalizado
   */
  private normalizarNome(nome: string): string {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/senador[a]?\s+/i, '') // Remover "Senador" ou "Senadora"
      .replace(/\([^)]*\)/g, '') // Remover parênteses e seu conteúdo
      .trim();
  }

  /**
   * Categoriza autorias por tipo de matéria
   * @param autorias - Array de autorias
   * @returns Objeto com contagem por tipo
   */
  private categorizarPorTipo(autorias: any[]): any {
    if (!autorias || autorias.length === 0) {
      return {};
    }

    // Mapa para contar ocorrências de cada tipo
    const tiposMap: Map<string, number> = new Map();

    // Processar cada autoria
    for (const autoria of autorias) {
      if (!autoria || !autoria.tipo) continue;

      // Normalizar o tipo (ex: "PEC", "PL", "REQ")
      let tipo = autoria.tipo.toUpperCase().trim();

      // Agrupar alguns tipos similares
      if (tipo.includes('REQ')) tipo = 'REQ';
      if (tipo.includes('PEC')) tipo = 'PEC';
      if (tipo.includes('PL')) tipo = 'PL';
      if (tipo.includes('PLS')) tipo = 'PLS';
      if (tipo.includes('MPV')) tipo = 'MPV';

      // Incrementar contador
      tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
    }

    // Converter o mapa para objeto
    const tipos: {[tipo: string]: {total: number, percentual: number}} = {};
    const total = autorias.length;

    for (const [tipo, count] of tiposMap.entries()) {
      tipos[tipo] = {
        total: count,
        percentual: Math.round((count / total) * 100)
      };
    }

    return tipos;
  }

  /**
   * Calcula estatísticas de autorias
   * @param autorias - Array de autorias transformadas
   * @param coautorias - Array de coautorias
   * @param nomeSenador - Nome do senador
   * @returns Objeto com estatísticas de autorias
   */
  private calcularEstatisticasAutorias(autorias: any[], coautorias?: any[], nomeSenador?: string): any {
    if (!autorias || autorias.length === 0) {
      return {
        total: 0,
        individual: 0,
        coautoria: 0,
        coletiva: 0
      };
    }

    // Contar autorias por tipo
    const total = autorias.length;
    const individual = autorias.filter(a => a && a.tipoAutoria === 'individual').length;
    const coautoria = autorias.filter(a => a && a.tipoAutoria === 'coautoria').length;
    const coletiva = autorias.filter(a => a && a.tipoAutoria === 'coletiva').length;
    const outro = autorias.filter(a => a && a.tipoAutoria === 'outro').length;
    const desconhecido = autorias.filter(a => a && a.tipoAutoria === 'desconhecido').length;

    // Calcular percentuais
    const percentualIndividual = Math.round((individual / total) * 100);
    const percentualCoautoria = Math.round((coautoria / total) * 100);
    const percentualColetiva = Math.round((coletiva / total) * 100);

    // Categorizar por tipo de matéria
    const porTipo = this.categorizarPorTipo(autorias);

    // Extrair parceiros frequentes (se houver coautorias e nome do senador)
    const parceirosFrequentes = (coautorias && coautorias.length > 0 && nomeSenador)
      ? this.extrairParceirosCoautorias(coautorias, nomeSenador)
      : undefined;

    return {
      total,
      individual,
      coautoria,
      coletiva,
      outro: outro > 0 ? outro : undefined,
      desconhecido: desconhecido > 0 ? desconhecido : undefined,
      percentualIndividual,
      percentualCoautoria,
      percentualColetiva,
      porTipo: Object.keys(porTipo).length > 0 ? porTipo : undefined,
      parceirosFrequentes: parceirosFrequentes && parceirosFrequentes.length > 0
        ? parceirosFrequentes.slice(0, 10) // Limitar aos 10 parceiros mais frequentes
        : undefined
    };
  }

  /**
   * Determina o tipo de autoria com base no texto da autoria
   * @param autoria - Texto da autoria
   * @returns Tipo de autoria: 'individual', 'coautoria', 'coletiva' ou 'outro'
   */
  private determinarTipoAutoria(autoria: string): string {
    if (!autoria) return 'desconhecido';

    // Contar o número de senadores mencionados
    const regexSenador = /Senador[a]?\s+([^(]+?)(?:\s+\([^)]+\))?(?:,|e|$)/gi;
    const matches = autoria.match(regexSenador) || [];
    const numSenadores = matches.length;

    // Verificar se é uma autoria coletiva (comissão, bancada, etc.)
    if (
      autoria.includes('Comissão') ||
      autoria.includes('Bancada') ||
      autoria.includes('Liderança') ||
      autoria.includes('Mesa Diretora') ||
      autoria.includes('Bloco') ||
      autoria.includes('Frente') ||
      autoria.includes('Grupo')
    ) {
      return 'coletiva';
    }

    // Verificar se contém "e outros" ou similar, indicando mais de 3 senadores
    if (
      autoria.includes(' e outros') ||
      autoria.includes(' E OUTROS') ||
      autoria.includes(' e mais') ||
      autoria.includes(' E MAIS')
    ) {
      return 'coletiva';
    }

    // Se temos mais de 3 senadores, é uma autoria coletiva
    if (numSenadores > 3) {
      return 'coletiva';
    }

    // Se temos entre 2 e 3 senadores, é uma coautoria
    if (numSenadores >= 2 && numSenadores <= 3) {
      return 'coautoria';
    }

    // Se temos apenas 1 senador ou o texto contém "Senador" sem outros indicadores, é individual
    if (numSenadores === 1 || autoria.includes('Senador') || autoria.includes('Senadora')) {
      return 'individual';
    }

    // Verificar se contém múltiplos senadores por outros indicadores
    if (
      autoria.includes(',') ||
      autoria.includes(' e ') ||
      autoria.includes(' E ')
    ) {
      // Contar vírgulas e "e" para estimar o número de autores
      const virgulas = (autoria.match(/,/g) || []).length;
      const es = (autoria.match(/ e /gi) || []).length;

      // Se temos mais de 3 autores estimados, é coletiva
      if (virgulas + es + 1 > 3) {
        return 'coletiva';
      }

      // Senão, é coautoria
      return 'coautoria';
    }

    // Caso não seja possível determinar
    return 'outro';
  }

  /**
   * Transforma dados brutos de autorias
   * @param autoriasResult - Resultado da extração de autorias
   * @returns Array de autorias transformadas
   */
  private transformarAutorias(autoriasResult: any): any[] {
    try {
      if (!autoriasResult || !autoriasResult.dados) {
        logger.warn('Dados de autorias não encontrados ou inválidos');
        return [];
      }

      // Log para depuração
      logger.info(`Estrutura de dados de autorias: ${JSON.stringify(Object.keys(autoriasResult.dados), null, 2)}`);

      // Verificar diferentes caminhos possíveis para os processos
      let processos = null;

      // Caminho 1: ProcessosResultset.Processos.Processo
      if (autoriasResult.dados.ProcessosResultset?.Processos?.Processo) {
        processos = autoriasResult.dados.ProcessosResultset.Processos.Processo;
        logger.info('Processos encontrados no caminho ProcessosResultset.Processos.Processo');
      }
      // Caminho 2: Processos.Processo
      else if (autoriasResult.dados.Processos?.Processo) {
        processos = autoriasResult.dados.Processos.Processo;
        logger.info('Processos encontrados no caminho Processos.Processo');
      }
      // Caminho 3: processos
      else if (autoriasResult.dados.processos) {
        processos = autoriasResult.dados.processos;
        logger.info('Processos encontrados no caminho processos');
      }
      // Caminho 4: processo
      else if (autoriasResult.dados.processo) {
        processos = autoriasResult.dados.processo;
        logger.info('Processos encontrados no caminho processo');
      }
      // Caminho 5: Array direto
      else if (Array.isArray(autoriasResult.dados)) {
        processos = autoriasResult.dados;
        logger.info('Processos encontrados como array direto');
      }
      // Caminho 6: Objeto com array
      else if (typeof autoriasResult.dados === 'object' && autoriasResult.dados !== null) {
        // Verificar se o objeto tem alguma propriedade que é um array
        for (const key in autoriasResult.dados) {
          if (Array.isArray(autoriasResult.dados[key])) {
            processos = autoriasResult.dados[key];
            logger.info(`Processos encontrados na propriedade ${key}`);
            break;
          }
        }
      }

      if (!processos) {
        logger.warn('Nenhum processo encontrado nos dados de autorias. Estrutura completa:', autoriasResult.dados);
        return [];
      }

      // Garantir que processos seja um array
      const processosArray = Array.isArray(processos) ? processos : [processos];
      logger.info(`Encontrados ${processosArray.length} processos de autoria`);

      // Obter o código do senador dos metadados
      const codigoSenador = autoriasResult.metadados?.senadorCodigo || '';
      if (codigoSenador) {
        logger.info(`Processando autorias para o senador código ${codigoSenador}`);
      } else {
        logger.warn('Código do senador não encontrado nos metadados');
      }

      // Transformar cada autoria
      const autoriasTransformadas = processosArray.map(processo => {
        try {
          // Log para depuração
          logger.debug(`Processando processo: ${JSON.stringify(processo, null, 2)}`);

          // Extrair campos diretamente do processo ou da matéria
          const id = processo.id || processo.codigoMateria || processo.CodigoMateria || '';
          const tipo = processo.tipoDocumento || processo.identificacao?.split(' ')[0] || '';
          const numero = processo.identificacao?.split(' ')[1]?.split('/')[0] || '';
          const ano = processo.identificacao?.split('/')[1] || '';
          const ementa = processo.ementa || '';
          const data = processo.dataApresentacao || '';
          const url = processo.urlDocumento || '';
          const autoria = processo.autoria || '';

          // Extrair informações da autoria para depuração
          if (autoria) {
            logger.debug(`Autoria do processo ${id}: "${autoria}"`);
          }

          // Determinar o tipo de autoria
          const tipoAutoria = this.determinarTipoAutoria(autoria);

          // Log para depuração do tipo de autoria
          if (autoria) {
            logger.debug(`Tipo de autoria do processo ${id}: ${tipoAutoria}`);
          }

          return {
            id,
            tipo,
            numero,
            ano,
            ementa,
            data,
            url,
            autoria,
            tipoAutoria
          };
        } catch (error: any) {
          logger.warn(`Erro ao processar autoria: ${error.message}`);
          return null;
        }
      }).filter(autoria => autoria && autoria.id); // Filtrar autorias sem ID ou nulas

      // Gerar estatísticas sobre os tipos de autoria
      if (autoriasTransformadas.length > 0) {
        const estatisticas = {
          total: autoriasTransformadas.length,
          individual: autoriasTransformadas.filter(a => a && a.tipoAutoria === 'individual').length,
          coautoria: autoriasTransformadas.filter(a => a && a.tipoAutoria === 'coautoria').length,
          coletiva: autoriasTransformadas.filter(a => a && a.tipoAutoria === 'coletiva').length,
          outro: autoriasTransformadas.filter(a => a && a.tipoAutoria === 'outro').length,
          desconhecido: autoriasTransformadas.filter(a => a && a.tipoAutoria === 'desconhecido').length
        };

        logger.info(`Estatísticas de autorias para o senador ${codigoSenador || 'desconhecido'}:`);
        logger.info(`- Total: ${estatisticas.total}`);
        logger.info(`- Individuais: ${estatisticas.individual} (${Math.round(estatisticas.individual / estatisticas.total * 100)}%)`);
        logger.info(`- Coautorias: ${estatisticas.coautoria} (${Math.round(estatisticas.coautoria / estatisticas.total * 100)}%)`);
        logger.info(`- Coletivas: ${estatisticas.coletiva} (${Math.round(estatisticas.coletiva / estatisticas.total * 100)}%)`);

        if (estatisticas.outro > 0) {
          logger.info(`- Outros tipos: ${estatisticas.outro} (${Math.round(estatisticas.outro / estatisticas.total * 100)}%)`);
        }

        if (estatisticas.desconhecido > 0) {
          logger.info(`- Desconhecidos: ${estatisticas.desconhecido} (${Math.round(estatisticas.desconhecido / estatisticas.total * 100)}%)`);
        }
      }

      return autoriasTransformadas;
    } catch (error: any) {
      logger.error(`Erro ao transformar autorias: ${error.message}`);
      return [];
    }
  }

  /**
   * Transforma dados brutos de relatorias
   * @param relatoriasResult - Resultado da extração de relatorias
   * @returns Array de relatorias transformadas
   */
  private transformarRelatorias(relatoriasResult: any): any[] {
    try {
      if (!relatoriasResult || !relatoriasResult.dados) {
        logger.warn('Dados de relatorias não encontrados ou inválidos');
        return [];
      }

      // Log para depuração
      logger.info(`Estrutura de dados de relatorias: ${JSON.stringify(Object.keys(relatoriasResult.dados), null, 2)}`);

      // Verificar diferentes caminhos possíveis para as relatorias
      let relatorias = null;

      // Caminho 1: Array direto (como no arquivo relatoria.json)
      if (Array.isArray(relatoriasResult.dados)) {
        relatorias = relatoriasResult.dados;
        logger.info('Relatorias encontradas como array direto');
      }
      // Caminho 2: RelatoriasResultset.Relatorias.Relatoria
      else if (relatoriasResult.dados.RelatoriasResultset?.Relatorias?.Relatoria) {
        relatorias = relatoriasResult.dados.RelatoriasResultset.Relatorias.Relatoria;
        logger.info('Relatorias encontradas no caminho RelatoriasResultset.Relatorias.Relatoria');
      }
      // Caminho 3: Relatorias.Relatoria
      else if (relatoriasResult.dados.Relatorias?.Relatoria) {
        relatorias = relatoriasResult.dados.Relatorias.Relatoria;
        logger.info('Relatorias encontradas no caminho Relatorias.Relatoria');
      }
      // Caminho 4: relatorias
      else if (relatoriasResult.dados.relatorias) {
        relatorias = relatoriasResult.dados.relatorias;
        logger.info('Relatorias encontradas no caminho relatorias');
      }
      // Caminho 5: relatoria
      else if (relatoriasResult.dados.relatoria) {
        relatorias = relatoriasResult.dados.relatoria;
        logger.info('Relatorias encontradas no caminho relatoria');
      }

      if (!relatorias) {
        logger.warn('Nenhuma relatoria encontrada nos dados');
        return [];
      }

      // Garantir que relatorias seja um array
      const relatoriasArray = Array.isArray(relatorias) ? relatorias : [relatorias];
      logger.info(`Encontradas ${relatoriasArray.length} relatorias`);

      // Transformar cada relatoria
      return relatoriasArray.map(relatoria => {
        try {
          // Log para depuração
          logger.debug(`Processando relatoria: ${JSON.stringify(relatoria, null, 2)}`);

          // Extrair campos conforme o formato do arquivo de exemplo
          const id = relatoria.id || relatoria.codigoMateria || '';
          const identificacaoProcesso = relatoria.identificacaoProcesso || '';

          // Extrair tipo e número da identificação do processo (ex: "PL 1000/2024")
          let tipo = '';
          let numero = '';
          let ano = '';

          if (identificacaoProcesso) {
            const partes = identificacaoProcesso.split(' ');
            if (partes.length >= 1) {
              tipo = partes[0];
            }
            if (partes.length >= 2 && partes[1].includes('/')) {
              const numeroAno = partes[1].split('/');
              numero = numeroAno[0] || '';
              ano = numeroAno[1] || '';
            }
          }

          const ementa = relatoria.ementaProcesso || '';
          const autoria = relatoria.autoriaProcesso || '';
          const dataApresentacao = relatoria.dataApresentacaoProcesso || '';
          const tramitando = relatoria.tramitando || '';

          // Dados do relator
          const tipoRelator = relatoria.descricaoTipoRelator || '';
          const dataDesignacao = relatoria.dataDesignacao || '';
          const dataDestituicao = relatoria.dataDestituicao || '';
          const tipoEncerramento = relatoria.descricaoTipoEncerramento || '';

          // Dados da comissão
          const comissao = {
            codigo: relatoria.codigoColegiado || '',
            sigla: relatoria.siglaColegiado || '',
            nome: relatoria.nomeColegiado || '',
            casa: relatoria.siglaCasa || ''
          };

          return {
            id,
            identificacao: identificacaoProcesso,
            tipo,
            numero,
            ano,
            ementa,
            autoria,
            dataApresentacao,
            tramitando,
            relator: {
              tipo: tipoRelator,
              dataDesignacao,
              dataDestituicao,
              tipoEncerramento
            },
            comissao
          };
        } catch (error: any) {
          logger.warn(`Erro ao processar relatoria: ${error.message}`);
          return null;
        }
      }).filter(relatoria => relatoria && relatoria.id); // Filtrar relatorias sem ID ou nulas
    } catch (error: any) {
      logger.error(`Erro ao transformar relatorias: ${error.message}`);
      return [];
    }
  }
}

// Instância singleton para uso em toda a aplicação
export const materiasTransformer = new MateriasTransformer();
