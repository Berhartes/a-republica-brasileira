/**
 * Transformador especializado para discursos de senadores
 * Este módulo transforma especificamente discursos e apartes de senadores,
 * tratando as peculiaridades da resposta da API.
 */
import { logger } from '../utils/logging';
import { DiscursoResult } from '../extracao/perfilsenadores';

// Interface para discursos transformados
export interface DiscursoTransformado {
  codigo: string;
  senador: {
    codigo: string;
    nome: string;
    partido?: {
      sigla: string;
      nome?: string;
    };
    uf?: string;
  };
  discursos: Array<{
    id: string;
    data: string;
    indexacao?: string;
    url?: string;
    urlTexto?: string;
    resumo?: string;
    tipo?: string;
  }>;
  apartes: Array<{
    id: string;
    data: string;
    discursoId: string;
    orador: {
      codigo: string;
      nome: string;
    };
    url?: string;
    urlTexto?: string;
    resumo?: string;
  }>;
  timestamp: string;
}

/**
 * Classe para transformação de dados de discursos de senadores
 */
export class DiscursosTransformer {
  /**
   * Transforma os discursos e apartes de um senador
   * @param discursoResult - Resultado da extração de discursos
   * @returns Discursos transformados
   */
  transformDiscursos(discursoResult: DiscursoResult): DiscursoTransformado | null {
    try {
      // Verificação se o resultado existe
      if (!discursoResult) {
        logger.error(`Resultado de discursos é nulo ou indefinido`);
        return null;
      }

      // Verificação para dados básicos
      if (!discursoResult.dadosBasicos ||
          !discursoResult.dadosBasicos.dados ||
          Object.keys(discursoResult.dadosBasicos.dados).length === 0) {
        logger.warn(`Dados básicos incompletos ou vazios para o senador ${discursoResult.codigo || 'desconhecido'}`);
        return null;
      }

      logger.info(`Transformando discursos do senador ${discursoResult.codigo}`);

      // Extrair componentes principais
      const dadosBasicos = discursoResult.dadosBasicos.dados || {};
      const apartes = discursoResult.apartes?.dados || null;
      const discursos = discursoResult.discursos?.dados || null;

      // Verificar se temos dados parlamentares
      const parlamentar = dadosBasicos.Parlamentar ||
                        dadosBasicos.DetalheParlamentar?.Parlamentar || {};

      // Verificar se temos dados de identificação
      const identificacao = parlamentar.IdentificacaoParlamentar || {};

      // Transformar discursos
      const discursosTransformados = this.transformDiscursosDetalhados(discursos);

      // Transformar apartes
      const apartesTransformados = this.transformApartes(apartes);

      // Criar objeto de discursos transformados
      const discursoTransformado: DiscursoTransformado = {
        codigo: discursoResult.codigo.toString(),
        senador: {
          codigo: discursoResult.codigo.toString(),
          nome: identificacao.NomeParlamentar || 'Nome não disponível',
          partido: {
            sigla: identificacao.SiglaPartidoParlamentar || '',
            nome: identificacao.NomePartidoParlamentar || undefined
          },
          uf: identificacao.UfParlamentar || ''
        },
        discursos: discursosTransformados,
        apartes: apartesTransformados,
        timestamp: new Date().toISOString()
      };

      return discursoTransformado;
    } catch (error: any) {
      logger.error(`Erro ao transformar discursos: ${error.message}`);
      return null;
    }
  }

  /**
   * Transforma discursos detalhados
   * @param discursos - Dados de discursos
   * @returns Discursos transformados
   */
  private transformDiscursosDetalhados(discursos: any): Array<{
    id: string;
    data: string;
    indexacao?: string;
    url?: string;
    urlTexto?: string;
    resumo?: string;
    tipo?: string;
  }> {
    if (!discursos) {
      logger.debug('Dados de discursos não encontrados ou vazios');
      return [];
    }

    // Verificar estrutura dos discursos
    let discursosArray = [];

    // Verificar estrutura com Pronunciamentos (nova estrutura)
    if (discursos.DiscursosParlamentar && discursos.DiscursosParlamentar.Parlamentar) {
      const parlamentar = discursos.DiscursosParlamentar.Parlamentar;

      // Verificar se temos Pronunciamentos
      if (parlamentar.Pronunciamentos && parlamentar.Pronunciamentos.Pronunciamento) {
        logger.debug(`Encontrada estrutura Pronunciamentos.Pronunciamento`);
        discursosArray = Array.isArray(parlamentar.Pronunciamentos.Pronunciamento)
          ? parlamentar.Pronunciamentos.Pronunciamento
          : [parlamentar.Pronunciamentos.Pronunciamento];
      }
      // Verificar estrutura antiga com Discursos
      else if (parlamentar.Discursos && parlamentar.Discursos.Discurso) {
        logger.debug(`Encontrada estrutura Discursos.Discurso`);
        discursosArray = Array.isArray(parlamentar.Discursos.Discurso)
          ? parlamentar.Discursos.Discurso
          : [parlamentar.Discursos.Discurso];
      }
    }
    // Verificar outras estruturas possíveis
    else if (discursos.Parlamentar && discursos.Parlamentar.Pronunciamentos && discursos.Parlamentar.Pronunciamentos.Pronunciamento) {
      logger.debug(`Encontrada estrutura Parlamentar.Pronunciamentos.Pronunciamento`);
      discursosArray = Array.isArray(discursos.Parlamentar.Pronunciamentos.Pronunciamento)
        ? discursos.Parlamentar.Pronunciamentos.Pronunciamento
        : [discursos.Parlamentar.Pronunciamentos.Pronunciamento];
    }
    else if (discursos.Pronunciamentos && discursos.Pronunciamentos.Pronunciamento) {
      logger.debug(`Encontrada estrutura Pronunciamentos.Pronunciamento`);
      discursosArray = Array.isArray(discursos.Pronunciamentos.Pronunciamento)
        ? discursos.Pronunciamentos.Pronunciamento
        : [discursos.Pronunciamentos.Pronunciamento];
    }
    else if (discursos.Discursos && discursos.Discursos.Discurso) {
      logger.debug(`Encontrada estrutura Discursos.Discurso`);
      discursosArray = Array.isArray(discursos.Discursos.Discurso)
        ? discursos.Discursos.Discurso
        : [discursos.Discursos.Discurso];
    }

    logger.debug(`Encontrados ${discursosArray.length} discursos para transformação`);

    // Transformar cada discurso ou pronunciamento
    return discursosArray.map((discurso: any) => {
      try {
        // Verificar se é um pronunciamento ou um discurso
        const isPronunciamento = discurso.CodigoPronunciamento !== undefined;

        if (isPronunciamento) {
          logger.debug(`Transformando pronunciamento com código ${discurso.CodigoPronunciamento}`);
          return {
            id: discurso.CodigoPronunciamento || '',
            data: discurso.DataPronunciamento || '',
            indexacao: discurso.Indexacao || undefined,
            url: discurso.UrlDiscurso || discurso.url || undefined,
            urlTexto: discurso.UrlTexto || undefined,
            resumo: discurso.TextoResumo || undefined,
            tipo: discurso.TipoUsoPalavra?.Descricao || undefined
          };
        } else {
          logger.debug(`Transformando discurso com código ${discurso.CodigoDiscurso || discurso.codigo || 'desconhecido'}`);
          return {
            id: discurso.CodigoDiscurso || discurso.codigo || '',
            data: discurso.DataDiscurso || discurso.data || '',
            indexacao: discurso.IndexacaoDiscurso || discurso.indexacao || undefined,
            url: discurso.UrlDiscurso || discurso.url || undefined,
            urlTexto: discurso.UrlTexto || discurso.urlTexto || undefined,
            resumo: discurso.TextoDiscurso || discurso.resumo || undefined,
            tipo: discurso.TipoDiscurso?.Descricao || discurso.tipo || undefined
          };
        }
      } catch (error: any) {
        logger.warn(`Erro ao transformar discurso/pronunciamento: ${error.message}`);
        return null;
      }
    }).filter(Boolean) as Array<{
      id: string;
      data: string;
      indexacao?: string;
      url?: string;
      urlTexto?: string;
      resumo?: string;
      tipo?: string;
    }>;
  }

  /**
   * Transforma apartes
   * @param apartes - Dados de apartes
   * @returns Apartes transformados
   */
  private transformApartes(apartes: any): Array<{
    id: string;
    data: string;
    discursoId: string;
    orador: {
      codigo: string;
      nome: string;
      partido?: string;
      uf?: string;
    };
    tipoUsoPalavra?: {
      codigo: string;
      sigla: string;
      descricao: string;
    };
    casa?: {
      sigla: string;
      nome: string;
    };
    sessao?: {
      codigo: string;
      data: string;
      hora: string;
      tipo: string;
      numero: string;
    };
    url?: string;
    urlTexto?: string;
    resumo?: string;
    indexacao?: string;
    publicacoes?: Array<{
      veiculo: string;
      data: string;
      paginaInicio: string;
      paginaFim: string;
      url: string;
    }>;
  }> {
    if (!apartes) {
      logger.debug('Dados de apartes não encontrados ou vazios');
      return [];
    }

    // Verificar estrutura dos apartes
    let apartesArray = [];

    if (apartes.ApartesParlamentar && apartes.ApartesParlamentar.Parlamentar) {
      const parlamentar = apartes.ApartesParlamentar.Parlamentar;

      if (parlamentar.Apartes && parlamentar.Apartes.Aparte) {
        apartesArray = Array.isArray(parlamentar.Apartes.Aparte)
          ? parlamentar.Apartes.Aparte
          : [parlamentar.Apartes.Aparte];
      }
    } else if (apartes.Apartes && apartes.Apartes.Aparte) {
      apartesArray = Array.isArray(apartes.Apartes.Aparte)
        ? apartes.Apartes.Aparte
        : [apartes.Apartes.Aparte];
    }

    logger.debug(`Encontrados ${apartesArray.length} apartes para transformação`);

    // Transformar cada aparte
    return apartesArray.map((aparte: any) => {
      try {
        // Log detalhado para debug
        logger.debug(`Estrutura do aparte: ${JSON.stringify(Object.keys(aparte))}`);

        // Mapear campos corretamente com base na estrutura do JSON de apartes
        return {
          id: aparte.CodigoPronunciamento || aparte.CodigoAparte || aparte.codigo || '',
          data: aparte.DataPronunciamento || aparte.DataAparte || aparte.data || '',
          discursoId: aparte.CodigoPronunciamento || aparte.CodigoDiscurso || aparte.discursoId || '',
          orador: {
            codigo: aparte.Orador?.CodigoParlamentar || aparte.orador?.codigo || '',
            nome: aparte.Orador?.NomeParlamentar || aparte.orador?.nome || '',
            partido: aparte.Orador?.SiglaPartidoParlamentarNaData || aparte.SiglaPartidoParlamentarNaData || aparte.orador?.partido || '',
            uf: aparte.Orador?.UfParlamentarNaData || aparte.UfParlamentarNaData || aparte.orador?.uf || ''
          },
          tipoUsoPalavra: aparte.TipoUsoPalavra ? {
            codigo: aparte.TipoUsoPalavra.Codigo || '',
            sigla: aparte.TipoUsoPalavra.Sigla || '',
            descricao: aparte.TipoUsoPalavra.Descricao || ''
          } : undefined,
          casa: {
            sigla: aparte.SiglaCasaPronunciamento || '',
            nome: aparte.NomeCasaPronunciamento || ''
          },
          sessao: aparte.SessaoPlenaria ? {
            codigo: aparte.SessaoPlenaria.CodigoSessao || '',
            data: aparte.SessaoPlenaria.DataSessao || '',
            hora: aparte.SessaoPlenaria.HoraInicioSessao || '',
            tipo: aparte.SessaoPlenaria.SiglaTipoSessao || '',
            numero: aparte.SessaoPlenaria.NumeroSessao || ''
          } : undefined,
          url: aparte.UrlTexto || aparte.UrlDiscurso || aparte.url || undefined,
          urlTexto: aparte.UrlTextoBinario || aparte.UrlTexto || aparte.urlTexto || undefined,
          resumo: aparte.TextoResumo || aparte.TextoAparte || aparte.resumo || undefined,
          indexacao: aparte.Indexacao || undefined,
          publicacoes: aparte.Publicacoes?.Publicacao ?
            (Array.isArray(aparte.Publicacoes.Publicacao) ?
              aparte.Publicacoes.Publicacao.map((pub: any) => ({
                veiculo: pub.DescricaoVeiculoPublicacao || '',
                data: pub.DataPublicacao || '',
                paginaInicio: pub.NumeroPagInicioPublicacao || '',
                paginaFim: pub.NumeroPagFimPublicacao || '',
                url: pub.UrlDiario || ''
              })) :
              [{
                veiculo: aparte.Publicacoes.Publicacao.DescricaoVeiculoPublicacao || '',
                data: aparte.Publicacoes.Publicacao.DataPublicacao || '',
                paginaInicio: aparte.Publicacoes.Publicacao.NumeroPagInicioPublicacao || '',
                paginaFim: aparte.Publicacoes.Publicacao.NumeroPagFimPublicacao || '',
                url: aparte.Publicacoes.Publicacao.UrlDiario || ''
              }]
            ) : undefined
        };
      } catch (error: any) {
        logger.warn(`Erro ao transformar aparte: ${error.message}`);
        return null;
      }
    }).filter(Boolean) as Array<{
      id: string;
      data: string;
      discursoId: string;
      orador: {
        codigo: string;
        nome: string;
        partido?: string;
        uf?: string;
      };
      tipoUsoPalavra?: {
        codigo: string;
        sigla: string;
        descricao: string;
      };
      casa?: {
        sigla: string;
        nome: string;
      };
      sessao?: {
        codigo: string;
        data: string;
        hora: string;
        tipo: string;
        numero: string;
      };
      url?: string;
      urlTexto?: string;
      resumo?: string;
      indexacao?: string;
      publicacoes?: Array<{
        veiculo: string;
        data: string;
        paginaInicio: string;
        paginaFim: string;
        url: string;
      }>;
    }>;
  }
}

// Exporta uma instância do transformador
export const discursosTransformer = new DiscursosTransformer();
