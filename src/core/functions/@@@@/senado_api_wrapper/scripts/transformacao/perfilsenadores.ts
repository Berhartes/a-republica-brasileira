/**
 * Transformador especializado para perfis de senadores
 * Este módulo transforma especificamente perfis completos de senadores,
 * tratando as peculiaridades da resposta da API.
 */
import { logger } from '../utils/logging';
import { SenadoresLegislaturaResult, PerfilCompletoResult } from '../extracao/perfilsenadores';

// Interface para Senador básico transformado
export interface SenadorBasicoTransformado {
  codigo: string;
  nome: string;
  nomeCompleto: string;
  genero: string;
  partido: {
    sigla: string;
    nome: string | null;
  };
  uf: string;
  foto: string;
  email: string;
  telefones: Array<{
    numero: string;
    tipo: string;
    ordem?: number;
  }>;
  paginaOficial?: string;
  paginaParticular?: string;
  situacao: {
    emExercicio: boolean;
    afastado: boolean;
    titular: boolean;
    suplente: boolean;
    cargoMesa?: boolean;
    cargoLideranca?: boolean;
  };
  mandatoAtual?: {
    codigo: string;
    participacao: string;
    legislatura: string;
  } | null;
  atualizadoEm: string;
}

// Interface para Senador completo transformado
export interface SenadorCompletoTransformado extends SenadorBasicoTransformado {
  // Campo opcional para mensagens de erro
  erro?: string;
  dadosPessoais: {
    dataNascimento: string | null;
    naturalidade: string;
    ufNaturalidade: string;
    enderecoParlamentar?: string;
  };
  mandatos: Array<{
    codigo: string;
    participacao: string;
    legislatura: string;
    dataInicio?: string;
    dataFim?: string | null;
    exercicios?: any[];
    suplentes?: any[];
    titular?: any;
  }>;
  cargos?: Array<{
    cargo: {
      codigo: string;
      descricao: string;
    };
    comissao: {
      codigo: string;
      sigla: string;
      nome: string;
      casa: string;
    } | null;
    dataInicio: string | null;
    dataFim: string | null;
    atual?: boolean;
  }>;
  comissoes: Array<{
    codigo: string;
    sigla: string;
    nome: string;
    casa: string;
    participacao: string;
    dataInicio?: string;
    dataFim?: string | null;
    atual: boolean;
  }>;
  filiacoes: Array<{
    partido: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    dataFiliacao?: string;
    dataDesfiliacao?: string | null;
    atual: boolean;
  }>;
  formacao: {
    historicoAcademico: Array<{
      curso: string;
      grau: string;
      instituicao: string;
      local?: string;
    }>;
    profissao: Array<{
      nome: string;
      principal: boolean;
    }>;
  };
  licencas: Array<{
    codigo: string;
    tipo: {
      sigla: string;
      descricao: string;
    };
    dataInicio?: string;
    dataFim?: string | null;
    atual: boolean;
  }>;
  liderancas?: Array<{
    codigo: string;
    casa: string;
    tipoUnidade: {
      codigo: string;
      sigla: string;
      descricao: string;
    };
    tipoLideranca: {
      codigo: string;
      sigla: string;
      descricao: string;
    };
    dataDesignacao: string;
    dataTermino: string | null;
    atual: boolean;
    bloco?: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    partido?: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    partidoFiliacao: {
      codigo: string;
      sigla: string;
      nome: string;
    };
  }>;
  situacaoAtual: {
    emExercicio: boolean;
    titular: boolean;
    suplente: boolean;
    afastado: boolean;
    motivoAfastamento?: string | null;
    mandatoAtual?: {
      codigo: string;
      participacao: string;
      legislatura: string;
    } | null;
    licencaAtual?: {
      codigo: string;
      tipo: {
        sigla: string;
        descricao: string;
      };
      dataInicio: string;
      dataFim: string | null;
    } | null;
    ultimaLegislatura?: string | null;
  };
  metadados: {
    atualizadoEm: string;
    fontes: {
      [key: string]: string;
    };
    statusDados?: string;
  };
}

// Interface para resultado da transformação de lista de senadores
export interface ResultadoTransformacaoLista {
  timestamp: string;
  senadores: SenadorBasicoTransformado[];
  legislatura: number;
}

/**
 * Classe para transformação de dados de perfis de senadores
 */
export class PerfilSenadoresTransformer {
  /**
   * Transforma os dados brutos de senadores de uma legislatura específica
   * @param extractionResult - Resultado da extração
   * @param legislaturaNumero - Número da legislatura (opcional)
   */
  transformSenadoresLegislatura(extractionResult: SenadoresLegislaturaResult, legislaturaNumero?: number): ResultadoTransformacaoLista {
    logger.info('Transformando dados de senadores de legislatura específica');

    const { senadores, metadados } = extractionResult;

    if (!senadores || !Array.isArray(senadores) || senadores.length === 0) {
      logger.warn('Dados de senadores inválidos ou vazios para transformação');
      return {
        timestamp: new Date().toISOString(),
        senadores: [],
        legislatura: 0
      };
    }

    // Extrair número da legislatura do metadata (se disponível) ou usar o parâmetro
    let legislatura = legislaturaNumero || 0;
    if (!legislatura && metadados && metadados.Legislatura) {
      // Tentar extrair do metadados apenas se não fornecido via parâmetro
      legislatura = parseInt(metadados.Legislatura, 10) || 0;
    }

    // Transformar cada senador
    const senadoresTransformados = senadores.map(senador => {
      try {
        return this.transformSenadorBasico(senador);
      } catch (error: any) {
        logger.warn(`Erro ao transformar senador básico: ${error.message}`);
        // Retornar objeto mínimo se não for possível transformar
        return senador && senador.IdentificacaoParlamentar ? {
          codigo: senador.IdentificacaoParlamentar.CodigoParlamentar || 'desconhecido',
          nome: senador.IdentificacaoParlamentar.NomeParlamentar || 'Nome não disponível',
          nomeCompleto: senador.IdentificacaoParlamentar.NomeCompletoParlamentar || senador.IdentificacaoParlamentar.NomeParlamentar || 'Nome não disponível',
          genero: '',
          partido: {
            sigla: senador.IdentificacaoParlamentar.SiglaPartidoParlamentar || '',
            nome: null
          },
          uf: senador.IdentificacaoParlamentar.UfParlamentar || '',
          foto: '',
          email: '',
          telefones: [],
          situacao: {
            emExercicio: true,
            afastado: false,
            titular: true,
            suplente: false
          },
          atualizadoEm: new Date().toISOString()
        } : null;
      }
    }).filter(Boolean) as SenadorBasicoTransformado[]; // Remove itens nulos

    logger.info(`Transformados ${senadoresTransformados.length} senadores da legislatura ${legislatura}`);

    return {
      timestamp: new Date().toISOString(),
      senadores: senadoresTransformados,
      legislatura
    };
  }

  /**
   * Transforma dados básicos de um senador
   * @param senador - Dados básicos do senador
   */
  transformSenadorBasico(senador: any): SenadorBasicoTransformado | null {
    // Verificar se temos dados válidos
    if (!senador || !senador.IdentificacaoParlamentar) {
      logger.warn('Dados incompletos de senador para transformação básica');
      return null;
    }

    const identificacao = senador.IdentificacaoParlamentar;
    const mandato = senador.Mandato || {};

    // Extrair dados principais
    const senadorTransformado: SenadorBasicoTransformado = {
      codigo: identificacao.CodigoParlamentar,
      nome: identificacao.NomeParlamentar || '',
      nomeCompleto: identificacao.NomeCompletoParlamentar || identificacao.NomeParlamentar || '',
      genero: identificacao.SexoParlamentar || '',
      foto: identificacao.UrlFotoParlamentar || '',
      paginaOficial: identificacao.UrlPaginaParlamentar || '',
      paginaParticular: identificacao.UrlPaginaParticular || undefined,
      email: identificacao.EmailParlamentar || '',
      partido: {
        sigla: identificacao.SiglaPartidoParlamentar || '',
        nome: null // Será preenchido com dados detalhados
      },
      uf: identificacao.UfParlamentar || '',
      telefones: this.transformTelefones(identificacao.Telefones),
      situacao: {
        emExercicio: true, // Por padrão, assumimos que está em exercício
        afastado: false, // Será atualizado com base nos exercícios
        titular: !mandato.DescricaoParticipacao || mandato.DescricaoParticipacao === 'Titular',
        suplente: mandato.DescricaoParticipacao ? mandato.DescricaoParticipacao.includes('Suplente') : false,
        cargoMesa: identificacao.MembroMesa === 'Sim',
        cargoLideranca: identificacao.MembroLideranca === 'Sim'
      },
      mandatoAtual: mandato && mandato.CodigoMandato ? {
        codigo: mandato.CodigoMandato,
        participacao: mandato.DescricaoParticipacao || '',
        legislatura: mandato.NumeroLegislatura || ''
      } : null,
      atualizadoEm: new Date().toISOString()
    };

    return senadorTransformado;
  }

  /**
   * Transforma o perfil completo de um senador
   * @param perfilCompleto - Perfil completo extraído
   */
  transformPerfilCompleto(perfilCompleto: PerfilCompletoResult): SenadorCompletoTransformado | null {
    try {
      // Verificação se o perfil existe
      if (!perfilCompleto) {
        logger.error(`Perfil completo é nulo ou indefinido`);
        return null;
      }

      // Verificação para dados básicos
      if (!perfilCompleto.dadosBasicos ||
          !perfilCompleto.dadosBasicos.dados ||
          Object.keys(perfilCompleto.dadosBasicos.dados).length === 0) {
        logger.warn(`Dados básicos incompletos ou vazios para o senador ${perfilCompleto.codigo || 'desconhecido'}`);

        // Retornar objeto mínimo para evitar falha total
        return {
          codigo: perfilCompleto.codigo?.toString() || 'desconhecido',
          nome: 'Dados indisponíveis',
          nomeCompleto: 'Dados indisponíveis',
          genero: '',
          partido: { sigla: '', nome: null },
          uf: '',
          foto: '',
          email: '',
          telefones: [],
          situacao: {
            emExercicio: false,
            afastado: false,
            titular: false,
            suplente: false
          },
          dadosPessoais: {
            dataNascimento: null,
            naturalidade: '',
            ufNaturalidade: ''
          },
          mandatos: [],
          cargos: [],
          comissoes: [],
          filiacoes: [],
          formacao: {
            historicoAcademico: [],
            profissao: []
          },
          licencas: [],
          liderancas: [],
          situacaoAtual: {
            emExercicio: false,
            afastado: false,
            titular: false,
            suplente: false
          },
          metadados: {
            atualizadoEm: new Date().toISOString(),
            statusDados: 'incompleto',
            fontes: {}
          },
          atualizadoEm: new Date().toISOString()
        };
      }

      logger.info(`Transformando perfil completo do senador ${perfilCompleto.codigo}`);

      // Extrair componentes principais do perfil com verificações tolerantes
      const dadosBasicos = perfilCompleto.dadosBasicos.dados || {};
      const mandatos = perfilCompleto.mandatos?.dados || null;
      const cargos = perfilCompleto.cargos?.dados || null;
      const comissoes = perfilCompleto.comissoes?.dados || null;
      const filiacoes = perfilCompleto.filiacoes?.dados || null;
      const historicoAcademico = perfilCompleto.historicoAcademico?.dados || null;
      const licencas = perfilCompleto.licencas?.dados || null;
      const profissao = perfilCompleto.profissao?.dados || null;
      // Removido campo apartes que não existe mais na interface PerfilCompletoResult
      const apartes = null;

      // Verificar se temos dados parlamentares
      const parlamentar = dadosBasicos.Parlamentar ||
                        dadosBasicos.DetalheParlamentar?.Parlamentar || {};

      // Log detalhado da estrutura completa dos dados básicos para depuração
      logger.debug(`Estrutura completa dos dados básicos: ${JSON.stringify(dadosBasicos)}`);

      // Verificar se temos telefones no objeto parlamentar
      if (parlamentar.Telefones) {
        logger.debug(`Telefones encontrados diretamente no parlamentar: ${JSON.stringify(parlamentar.Telefones)}`);
      }

      // Adicionar log para verificar a estrutura dos dados parlamentares
      logger.debug(`Estrutura de dados parlamentares: ${JSON.stringify(Object.keys(parlamentar))}`);

      // Verificar se temos telefones no nível superior
      let telefonesNivelSuperior: Array<{numero: string; tipo: string; ordem?: number}> = [];
      if (dadosBasicos.Telefones) {
        logger.debug(`Telefones encontrados no nível superior: ${JSON.stringify(dadosBasicos.Telefones)}`);
        telefonesNivelSuperior = this.transformTelefones(dadosBasicos.Telefones);
      }

      // Verificar se temos dados de identificação
      if (parlamentar.IdentificacaoParlamentar) {
        logger.debug(`Estrutura de identificação: ${JSON.stringify(Object.keys(parlamentar.IdentificacaoParlamentar))}`);

        // Verificar se temos dados de telefone
        if (parlamentar.IdentificacaoParlamentar.Telefones) {
          logger.debug(`Telefones encontrados em parlamentar.IdentificacaoParlamentar.Telefones`);
        }

        // Verificar se temos dados de gênero
        if (parlamentar.IdentificacaoParlamentar.SexoParlamentar) {
          logger.debug(`Gênero encontrado: ${parlamentar.IdentificacaoParlamentar.SexoParlamentar}`);
        }
      }

      if (!parlamentar || Object.keys(parlamentar).length === 0) {
        logger.warn(`Dados parlamentares insuficientes para o senador ${perfilCompleto.codigo}`);

        // Retornar objeto mínimo
        return {
          codigo: perfilCompleto.codigo?.toString() || 'desconhecido',
          nome: 'Dados indisponíveis',
          nomeCompleto: 'Dados indisponíveis',
          genero: '',
          partido: { sigla: '', nome: null },
          uf: '',
          foto: '',
          email: '',
          telefones: [],
          situacao: {
            emExercicio: false,
            afastado: false,
            titular: false,
            suplente: false
          },
          dadosPessoais: {
            dataNascimento: null,
            naturalidade: '',
            ufNaturalidade: ''
          },
          mandatos: [],
          cargos: [],
          comissoes: [],
          filiacoes: [],
          formacao: {
            historicoAcademico: [],
            profissao: []
          },
          licencas: [],
          liderancas: [],
          situacaoAtual: {
            emExercicio: false,
            afastado: false,
            titular: false,
            suplente: false
          },
          metadados: {
            atualizadoEm: new Date().toISOString(),
            statusDados: 'parcial',
            fontes: {
              dadosBasicos: perfilCompleto.dadosBasicos.origem || 'desconhecida'
            }
          },
          atualizadoEm: new Date().toISOString()
        };
      }

      // 1. Transformar identificação básica
      // Verificar se temos telefones no parlamentar para passar para o método transformIdentificacao
      let telefonesParaTransformar = [...telefonesNivelSuperior];

      // Se temos telefones diretamente no parlamentar, adicioná-los
      if (parlamentar.Telefones) {
        logger.debug(`Adicionando telefones do parlamentar para transformação: ${JSON.stringify(parlamentar.Telefones)}`);
        const telefonesTransformados = this.transformTelefones(parlamentar.Telefones);
        if (telefonesTransformados.length > 0) {
          telefonesParaTransformar = [...telefonesParaTransformar, ...telefonesTransformados];
          logger.debug(`Adicionados ${telefonesTransformados.length} telefones do parlamentar`);
        }
      }

      // Log para verificar a estrutura completa do parlamentar
      logger.debug(`Estrutura completa do parlamentar: ${JSON.stringify(parlamentar)}`);

      // Verificar se temos a estrutura DetalheParlamentar.Parlamentar.Telefones
      if (dadosBasicos.DetalheParlamentar && dadosBasicos.DetalheParlamentar.Parlamentar && dadosBasicos.DetalheParlamentar.Parlamentar.Telefones) {
        logger.debug(`Telefones encontrados em DetalheParlamentar.Parlamentar.Telefones: ${JSON.stringify(dadosBasicos.DetalheParlamentar.Parlamentar.Telefones)}`);
        const telefonesDetalheParlamentar = this.transformTelefones(dadosBasicos.DetalheParlamentar.Parlamentar.Telefones);
        if (telefonesDetalheParlamentar.length > 0) {
          telefonesParaTransformar = [...telefonesParaTransformar, ...telefonesDetalheParlamentar];
          logger.debug(`Adicionados ${telefonesDetalheParlamentar.length} telefones de DetalheParlamentar.Parlamentar.Telefones`);
        }
      }

      const identificacao = this.transformIdentificacao(
        parlamentar.IdentificacaoParlamentar ||
        parlamentar.Identificacao || {},
        telefonesParaTransformar
      );

      // 2. Transformar dados pessoais
      const dadosPessoais = this.transformDadosPessoais(
        parlamentar.DadosBasicosParlamentar || {}
      );

      // 3. Transformar mandatos
      const mandatosTransformados = this.transformMandatosCompletos(mandatos);

      // 4. Transformar cargos
      const cargosTransformados = this.transformCargos(cargos);

      // 5. Transformar comissões
      const comissoesTransformadas = this.transformComissoes(comissoes);

      // 6. Transformar filiações
      const filiacoesTransformadas = this.transformFiliacoes(filiacoes);

      // 7. Transformar histórico acadêmico
      const historicoAcademicoTransformado = this.transformHistoricoAcademico(historicoAcademico);

      // 8. Transformar licenças
      const licencasTransformadas = this.transformLicencas(licencas);

      // 9. Transformar profissão
      const profissaoTransformada = this.transformProfissao(profissao);

      // 10. Transformar apartes
      const apartesTransformados = this.transformApartes(apartes);

      // 11. Transformar lideranças
      const liderancasTransformadas = this.transformLiderancas(perfilCompleto.liderancas?.dados);

      // 12. Determinar situação atual
      const situacaoAtual = this.determinarSituacaoAtual(mandatosTransformados, licencasTransformadas);

      // Processar cargos para adicionar flag 'atual'
      const cargosProcessados = cargosTransformados.map(cargo => {
        // Verificar se o cargo está ativo (sem data de fim ou data futura)
        const dataFim = cargo.dataFim;
        const atual = !dataFim || new Date(dataFim) > new Date();
        return {
          ...cargo,
          atual
        };
      });

      // Consolidar perfil completo
      const perfilTransformado: SenadorCompletoTransformado = {
        ...identificacao,
        dadosPessoais,
        situacao: {
          emExercicio: situacaoAtual.emExercicio,
          afastado: situacaoAtual.afastado,
          titular: situacaoAtual.titular,
          suplente: situacaoAtual.suplente,
          cargoMesa: identificacao.situacao?.cargoMesa || false,
          cargoLideranca: identificacao.situacao?.cargoLideranca || false
        },
        mandatoAtual: situacaoAtual.mandatoAtual,
        mandatos: mandatosTransformados,
        cargos: cargosProcessados,
        comissoes: comissoesTransformadas,
        filiacoes: filiacoesTransformadas,
        formacao: {
          historicoAcademico: historicoAcademicoTransformado,
          profissao: profissaoTransformada
        },
        licencas: licencasTransformadas,
        liderancas: liderancasTransformadas && liderancasTransformadas.length > 0
          ? liderancasTransformadas
          : [],
        situacaoAtual,
        metadados: {
          atualizadoEm: new Date().toISOString(),
          fontes: {
            dadosBasicos: perfilCompleto.dadosBasicos.origem,
            mandatos: perfilCompleto.mandatos?.origem,
            cargos: perfilCompleto.cargos?.origem,
            comissoes: perfilCompleto.comissoes?.origem,
            filiacoes: perfilCompleto.filiacoes?.origem,
            historicoAcademico: perfilCompleto.historicoAcademico?.origem,
            licencas: perfilCompleto.licencas?.origem,
            profissao: perfilCompleto.profissao?.origem,
            liderancas: perfilCompleto.liderancas?.origem
          }
        },
        atualizadoEm: new Date().toISOString()
      };

      return perfilTransformado;
    } catch (error: any) {
      logger.error(`Erro ao transformar perfil completo do senador ${perfilCompleto?.codigo || 'desconhecido'}: ${error.message}`);
      // Retornar objeto mínimo para evitar falha completa
      return {
        codigo: perfilCompleto?.codigo?.toString() || 'desconhecido',
        nome: 'Erro ao processar dados',
        nomeCompleto: 'Erro ao processar dados',
        genero: '',
        partido: { sigla: '', nome: null },
        uf: '',
        foto: '',
        email: '',
        telefones: [],
        situacao: {
          emExercicio: false,
          afastado: false,
          titular: false,
          suplente: false
        },
        dadosPessoais: {
          dataNascimento: null,
          naturalidade: '',
          ufNaturalidade: ''
        },
        mandatos: [],
        cargos: [],
        comissoes: [],
        filiacoes: [],
        formacao: {
          historicoAcademico: [],
          profissao: []
        },
        licencas: [],
        liderancas: [],
        situacaoAtual: {
          emExercicio: false,
          afastado: false,
          titular: false,
          suplente: false
        },
        metadados: {
          atualizadoEm: new Date().toISOString(),
          statusDados: 'erro',
          fontes: {}
        },
        // Informações do erro
        erro: error.message,
        atualizadoEm: new Date().toISOString()
      };
    }
  }

  /**
   * Transforma telefones em formato padronizado
   * @param telefones - Objeto de telefones da API
   */
  private transformTelefones(telefones: any): Array<{ numero: string; tipo: string; ordem?: number }> {
    if (!telefones) {
      logger.debug('Dados de telefones não encontrados ou vazios');
      return [];
    }

    // Log detalhado da estrutura de telefones para depuração
    logger.debug(`Estrutura de telefones recebida: ${JSON.stringify(telefones)}`);

    // Verificar se temos a estrutura esperada (conforme XML: <Telefones><Telefone>...</Telefone></Telefones>)
    if (!telefones.Telefone) {
      logger.debug('Estrutura de telefones não contém o campo Telefone');

      // Tentar encontrar telefones em uma estrutura alternativa
      if (Array.isArray(telefones)) {
        logger.debug('Tentando processar array de telefones diretamente');
        return telefones.map((tel: any) => this.transformTelefoneIndividual(tel));
      }

      // Verificar se os telefones estão em uma estrutura aninhada
      for (const key in telefones) {
        if (typeof telefones[key] === 'object' && telefones[key] !== null) {
          if (telefones[key].Telefone) {
            logger.debug(`Encontrado campo Telefone em ${key}`);
            return this.transformTelefones(telefones[key]);
          }
        }
      }

      // Verificar se o próprio objeto é um telefone (tem NumeroTelefone)
      if (telefones.NumeroTelefone) {
        logger.debug(`O próprio objeto parece ser um telefone: ${JSON.stringify(telefones)}`);
        return [this.transformTelefoneIndividual(telefones)];
      }

      return [];
    }

    // Converter para array se necessário
    const telefonesArray = Array.isArray(telefones.Telefone)
      ? telefones.Telefone
      : [telefones.Telefone];

    logger.debug(`Encontrados ${telefonesArray.length} telefones para transformação`);

    // Log detalhado de cada telefone
    telefonesArray.forEach((tel: any, index: number) => {
      logger.debug(`Telefone ${index + 1} para transformação: ${JSON.stringify(tel)}`);
    });

    // Transformar cada telefone e filtrar os inválidos
    const telefonesTransformados = telefonesArray
      .map((tel: any) => this.transformTelefoneIndividual(tel))
      .filter((tel: { numero: string; tipo: string; ordem?: number }) => tel && tel.numero); // Filtrar telefones sem número

    logger.debug(`Transformados ${telefonesTransformados.length} telefones válidos`);

    return telefonesTransformados;
  }

  /**
   * Transforma um telefone individual
   * @param tel - Objeto de telefone individual
   */
  private transformTelefoneIndividual(tel: any): { numero: string; tipo: string; ordem?: number } {
    // Adicionar log para depuração
    logger.debug(`Transformando telefone individual: ${JSON.stringify(tel)}`);

    // Se o objeto for uma string, assumir que é o número do telefone
    if (typeof tel === 'string') {
      logger.debug(`Telefone recebido como string: ${tel}`);
      return {
        numero: this.formatarNumeroTelefone(tel),
        tipo: 'Telefone',
        ordem: undefined
      };
    }

    // Se o objeto for nulo ou vazio, retornar objeto vazio
    if (!tel || Object.keys(tel).length === 0) {
      logger.debug('Objeto de telefone vazio ou nulo');
      return {
        numero: '',
        tipo: 'Telefone',
        ordem: undefined
      };
    }

    // Verificar diferentes possíveis estruturas conforme o XML/JSON
    // Estrutura esperada: <NumeroTelefone>33036333</NumeroTelefone><OrdemPublicacao>1</OrdemPublicacao><IndicadorFax>Não</IndicadorFax>
    const numero = tel.NumeroTelefone || tel.numeroTelefone || tel.numero || '';
    const indicadorFax = tel.IndicadorFax || tel.indicadorFax || '';
    const ordemPublicacao = tel.OrdemPublicacao || tel.ordemPublicacao || tel.ordem;

    // Formatar o número de telefone
    const numeroFormatado = this.formatarNumeroTelefone(numero);

    return {
      numero: numeroFormatado,
      tipo: indicadorFax === 'Sim' ? 'Fax' : 'Telefone',
      ordem: ordemPublicacao ? parseInt(ordemPublicacao.toString(), 10) : undefined
    };
  }

  /**
   * Formata um número de telefone
   * @param numero - Número de telefone a ser formatado
   */
  private formatarNumeroTelefone(numero: string): string {
    if (!numero) return '';

    // Remover caracteres não numéricos para análise
    const apenasNumeros = numero.replace(/\D/g, '');

    // Se já estiver formatado, retornar como está
    if (numero.includes('(') && numero.includes(')')) {
      return numero;
    }

    // Se for um número de Brasília (61) sem código de área
    if (apenasNumeros.length === 8) {
      return `(61) ${apenasNumeros.substring(0, 4)}-${apenasNumeros.substring(4)}`;
    }

    // Se for um número com DDD mas sem formatação
    if (apenasNumeros.length === 10 || apenasNumeros.length === 11) {
      const ddd = apenasNumeros.substring(0, 2);
      const parte1 = apenasNumeros.length === 10
        ? apenasNumeros.substring(2, 6)
        : apenasNumeros.substring(2, 7);
      const parte2 = apenasNumeros.length === 10
        ? apenasNumeros.substring(6)
        : apenasNumeros.substring(7);

      return `(${ddd}) ${parte1}-${parte2}`;
    }

    // Se for um número sem DDD, adicionar o DDD de Brasília (61)
    if (apenasNumeros.length > 0 && apenasNumeros.length < 10) {
      return `(61) ${numero}`;
    }

    // Caso não se encaixe em nenhum padrão, retornar o número original
    return numero;
  }

  /**
   * Transforma identificação do parlamentar
   * @param identificacao - Dados de identificação da API
   * @param telefonesAdicionais - Telefones encontrados no nível superior do objeto
   */
  private transformIdentificacao(identificacao: any, telefonesAdicionais: Array<{numero: string; tipo: string; ordem?: number}> = []): SenadorBasicoTransformado {
    if (!identificacao || Object.keys(identificacao).length === 0) {
      logger.warn('Dados de identificação do parlamentar não encontrados ou vazios');
      return {
        codigo: 'desconhecido',
        nome: 'Dados indisponíveis',
        nomeCompleto: 'Dados indisponíveis',
        genero: '',
        partido: { sigla: '', nome: null },
        uf: '',
        foto: '',
        email: '',
        telefones: [],
        situacao: {
          emExercicio: false,
          afastado: false,
          titular: false,
          suplente: false
        },
        atualizadoEm: new Date().toISOString()
      };
    }

    // Extrair gênero do parlamentar
    const genero = identificacao.SexoParlamentar || identificacao.Sexo || '';
    logger.debug(`Gênero do parlamentar: ${genero}`);

    // Extrair telefones
    let telefones: Array<{numero: string; tipo: string; ordem?: number}> = [...telefonesAdicionais]; // Iniciar com telefones do nível superior

    try {
      // Verificar diferentes caminhos possíveis para os telefones na estrutura da API
      // Primeiro, verificar todos os caminhos possíveis para encontrar telefones
      const possiveisCaminhos = [
        // Caminho direto (este é o caminho correto na API atual)
        { path: 'Telefones', desc: 'identificacao.Telefones' },

        // Caminhos aninhados em Parlamentar
        { path: 'Parlamentar.Telefones', desc: 'identificacao.Parlamentar.Telefones' },
        { path: 'Parlamentar.IdentificacaoParlamentar.Telefones', desc: 'identificacao.Parlamentar.IdentificacaoParlamentar.Telefones' },

        // Caminhos aninhados em IdentificacaoParlamentar
        { path: 'IdentificacaoParlamentar.Telefones', desc: 'identificacao.IdentificacaoParlamentar.Telefones' }
      ];

      // Log da estrutura completa de identificação para depuração
      logger.debug(`Estrutura completa de identificação: ${JSON.stringify(identificacao)}`);

      // Verificar diretamente se temos telefones no caminho principal
      if (identificacao.Telefones && identificacao.Telefones.Telefone) {
        logger.debug(`Telefones encontrados diretamente em identificacao.Telefones: ${JSON.stringify(identificacao.Telefones)}`);
      }

      // Função auxiliar para acessar propriedades aninhadas de forma segura
      const getNestedProperty = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => {
          return prev && prev[curr] ? prev[curr] : null;
        }, obj);
      };

      // Verificar cada caminho possível
      let telefonesEncontrados = false;
      for (const caminho of possiveisCaminhos) {
        const telefonesObj = getNestedProperty(identificacao, caminho.path);
        if (telefonesObj) {
          logger.debug(`Dados de telefones encontrados em ${caminho.desc}`);
          const telefonesTransformados = this.transformTelefones(telefonesObj);
          if (telefonesTransformados.length > 0) {
            telefones = [...telefones, ...telefonesTransformados];
            telefonesEncontrados = true;
            logger.debug(`Adicionados ${telefonesTransformados.length} telefones de ${caminho.desc}`);
          }
        }
      }

      // Se não encontrou telefones em nenhum caminho conhecido, registrar
      if (!telefonesEncontrados && telefones.length === 0) {
        logger.debug(`Nenhum dado de telefone encontrado nas estruturas conhecidas além dos telefones adicionais`);

        // Tentar encontrar telefones em qualquer propriedade do objeto
        for (const key in identificacao) {
          if (typeof identificacao[key] === 'object' && identificacao[key] !== null) {
            // Verificar se a propriedade contém a palavra "telefone" no nome
            if (key.toLowerCase().includes('telefone')) {
              logger.debug(`Possível campo de telefone encontrado em identificacao.${key}`);
              const possiveisTelefones = this.transformTelefones(identificacao[key]);
              if (possiveisTelefones.length > 0) {
                telefones = [...telefones, ...possiveisTelefones];
                logger.debug(`Adicionados ${possiveisTelefones.length} telefones de identificacao.${key}`);
              }
            }
          }
        }
      }

      // Remover duplicatas baseado no número
      const telefonesUnicos = telefones.reduce((acc, current) => {
        // Ignorar telefones vazios
        if (!current.numero) {
          return acc;
        }

        const x = acc.find(item => item.numero === current.numero);
        if (!x) {
          return acc.concat([current]);
        } else {
          return acc;
        }
      }, [] as Array<{numero: string; tipo: string; ordem?: number}>);

      telefones = telefonesUnicos;

    } catch (error: any) {
      logger.warn(`Erro ao processar telefones: ${error.message}`);
    }

    return {
      codigo: identificacao.CodigoParlamentar || identificacao.Codigo || 'desconhecido',
      nome: identificacao.NomeParlamentar || identificacao.Nome || 'Não informado',
      nomeCompleto: identificacao.NomeCompletoParlamentar || identificacao.NomeCompleto || identificacao.Nome || 'Não informado',
      genero: genero,
      foto: identificacao.UrlFotoParlamentar || identificacao.UrlFoto || '',
      paginaOficial: identificacao.UrlPaginaParlamentar || identificacao.UrlPagina || '',
      paginaParticular: identificacao.UrlPaginaParticular || '',
      email: identificacao.EmailParlamentar || identificacao.Email || '',
      partido: {
        sigla: identificacao.SiglaPartidoParlamentar || identificacao.SiglaPartido || '',
        nome: null
      },
      uf: identificacao.UfParlamentar || identificacao.Uf || '',
      telefones: telefones,
      situacao: {
        emExercicio: true, // Valor padrão, será atualizado depois
        afastado: false,
        titular: true, // Valor padrão, será atualizado depois
        suplente: false,
        cargoMesa: identificacao.MembroMesa === 'Sim',
        cargoLideranca: identificacao.MembroLideranca === 'Sim'
      },
      atualizadoEm: new Date().toISOString()
    };
  }

  /**
   * Transforma dados pessoais do parlamentar
   * @param dadosBasicos - Dados pessoais da API
   */
  private transformDadosPessoais(dadosBasicos: any): {
    dataNascimento: string | null;
    naturalidade: string;
    ufNaturalidade: string;
    enderecoParlamentar?: string;
  } {
    if (!dadosBasicos || Object.keys(dadosBasicos).length === 0) {
      logger.warn('Dados pessoais do parlamentar não encontrados ou vazios');
      return {
        dataNascimento: null,
        naturalidade: '',
        ufNaturalidade: ''
      };
    }

    return {
      dataNascimento: dadosBasicos.DataNascimento || null,
      naturalidade: dadosBasicos.Naturalidade || '',
      ufNaturalidade: dadosBasicos.UfNaturalidade || '',
      enderecoParlamentar: dadosBasicos.EnderecoParlamentar || undefined
    };
  }

  /**
   * Transforma mandatos completos
   * @param mandatos - Dados de mandatos da API
   */
  private transformMandatosCompletos(mandatos: any): Array<{
    codigo: string;
    participacao: string;
    legislatura: string;
    dataInicio?: string;
    dataFim?: string | null;
    exercicios?: any[];
    suplentes?: any[];
    titular?: any;
    uf?: string;
    primeiraLegislatura?: {
      numero: string;
      dataInicio: string;
      dataFim: string;
    };
    segundaLegislatura?: {
      numero: string;
      dataInicio: string;
      dataFim: string;
    };
  }> {
    // Se não temos dados válidos, retornar array vazio
    if (!mandatos || !mandatos.Parlamentar || !mandatos.Parlamentar.Mandatos) {
      logger.warn('Dados de mandatos do parlamentar não encontrados ou vazios');
      return [];
    }

    const mandatosObj = mandatos.Parlamentar.Mandatos;
    if (!mandatosObj.Mandato) {
      return [];
    }

    // Converter para array se necessário
    const mandatosArray = Array.isArray(mandatosObj.Mandato)
      ? mandatosObj.Mandato
      : [mandatosObj.Mandato];

    // Transformar cada mandato
    return mandatosArray.map((mandato: any) => {
      if (!mandato) return null;

      // Verificar se é atual com base na dataFim
      // Código para verificar se o mandato é atual foi movido para outra parte do código

      // Determinar data de início
      const dataInicio = mandato.DataInicio ||
                        mandato.PrimeiraLegislaturaDoMandato?.DataInicio ||
                        undefined;

      // Processar primeira legislatura
      const primeiraLegislatura = mandato.PrimeiraLegislaturaDoMandato ? {
        numero: mandato.PrimeiraLegislaturaDoMandato.NumeroLegislatura || '',
        dataInicio: mandato.PrimeiraLegislaturaDoMandato.DataInicio || '',
        dataFim: mandato.PrimeiraLegislaturaDoMandato.DataFim || ''
      } : undefined;

      // Processar segunda legislatura
      const segundaLegislatura = mandato.SegundaLegislaturaDoMandato ? {
        numero: mandato.SegundaLegislaturaDoMandato.NumeroLegislatura || '',
        dataInicio: mandato.SegundaLegislaturaDoMandato.DataInicio || '',
        dataFim: mandato.SegundaLegislaturaDoMandato.DataFim || ''
      } : undefined;

      // Mandato básico
      const mandatoTransformado = {
        codigo: mandato.CodigoMandato || '',
        participacao: mandato.DescricaoParticipacao || '',
        legislatura: mandato.PrimeiraLegislaturaDoMandato?.NumeroLegislatura ||
                   mandato.NumeroLegislatura || '',
        dataInicio: dataInicio,
        dataFim: mandato.DataFim || null,
        uf: mandato.UfParlamentar || '',
        // Informações adicionais
        exercicios: this.transformExercicios(mandato.Exercicios),
        suplentes: this.transformSuplentes(mandato.Suplentes),
        titular: mandato.Titular ? {
          codigo: mandato.Titular.CodigoParlamentar || '',
          nome: mandato.Titular.NomeParlamentar || '',
          participacao: mandato.Titular.DescricaoParticipacao || ''
        } : undefined,
        primeiraLegislatura,
        segundaLegislatura
      };

      return mandatoTransformado;
    }).filter(Boolean) as any[]; // Remove itens nulos
  }

  /**
   * Transforma exercícios do mandato
   * @param exercicios - Objeto de exercícios da API
   */
  private transformExercicios(exercicios: any): any[] {
    if (!exercicios || !exercicios.Exercicio) {
      return [];
    }

    const exerciciosArray = Array.isArray(exercicios.Exercicio)
      ? exercicios.Exercicio
      : [exercicios.Exercicio];

    return exerciciosArray.map((exercicio: any) => ({
      codigo: exercicio.CodigoExercicio || '',
      dataInicio: exercicio.DataInicio || null,
      dataFim: exercicio.DataFim || null,
      causaAfastamento: exercicio.SiglaCausaAfastamento || null,
      descricaoCausaAfastamento: exercicio.DescricaoCausaAfastamento || null
    }));
  }

  /**
   * Transforma suplentes do mandato
   * @param suplentes - Objeto de suplentes da API
   */
  private transformSuplentes(suplentes: any): any[] {
    if (!suplentes || !suplentes.Suplente) {
      return [];
    }

    const suplentesArray = Array.isArray(suplentes.Suplente)
      ? suplentes.Suplente
      : [suplentes.Suplente];

    return suplentesArray.map((suplente: any) => ({
      codigo: suplente.CodigoParlamentar || '',
      nome: suplente.NomeParlamentar || '',
      participacao: suplente.DescricaoParticipacao || ''
    }));
  }

  /**
   * Transforma cargos do parlamentar
   * @param cargos - Dados de cargos da API
   */
  private transformCargos(cargos: any): any[] {
    if (!cargos || !cargos.Parlamentar || !cargos.Parlamentar.Cargos) {
      logger.warn('Dados de cargos do parlamentar não encontrados ou vazios');
      return [];
    }

    const cargosObj = cargos.Parlamentar.Cargos;
    if (!cargosObj.Cargo) {
      return [];
    }

    // Converter para array se necessário
    const cargosArray = Array.isArray(cargosObj.Cargo)
      ? cargosObj.Cargo
      : [cargosObj.Cargo];

    // Transformar cada cargo
    return cargosArray.map((cargo: any) => {
      if (!cargo) return null;

      return {
        cargo: {
          codigo: cargo.CodigoCargo || '',
          descricao: cargo.DescricaoCargo || ''
        },
        comissao: cargo.IdentificacaoComissao ? {
          codigo: cargo.IdentificacaoComissao.CodigoComissao || '',
          sigla: cargo.IdentificacaoComissao.SiglaComissao || '',
          nome: cargo.IdentificacaoComissao.NomeComissao || '',
          casa: cargo.IdentificacaoComissao.SiglaCasaComissao || ''
        } : null,
        dataInicio: cargo.DataInicio || null,
        dataFim: cargo.DataFim || null
      };
    }).filter(Boolean); // Remove itens nulos
  }

  /**
   * Transforma comissões do parlamentar
   * @param comissoes - Dados de comissões da API
   */
  private transformComissoes(comissoes: any): Array<{
    codigo: string;
    sigla: string;
    nome: string;
    casa: string;
    participacao: string;
    dataInicio?: string;
    dataFim?: string | null;
    atual: boolean;
  }> {
    if (!comissoes || !comissoes.Parlamentar || !comissoes.Parlamentar.MembroComissoes) {
      logger.warn('Dados de comissões do parlamentar não encontrados ou vazios');
      return [];
    }

    const comissoesObj = comissoes.Parlamentar.MembroComissoes;
    if (!comissoesObj.Comissao) {
      return [];
    }

    // Converter para array se necessário
    const comissoesArray = Array.isArray(comissoesObj.Comissao)
      ? comissoesObj.Comissao
      : [comissoesObj.Comissao];

    // Transformar cada comissão
    return comissoesArray.map((comissao: any) => {
      if (!comissao || !comissao.IdentificacaoComissao) {
        logger.warn('Comissão sem identificação encontrada, pulando...');
        return null;
      }

      const dataFim = comissao.DataFim || null;
      // Verificar se a comissão está ativa (sem data de fim ou data futura)
      const atual = !dataFim || new Date(dataFim) > new Date();

      return {
        codigo: comissao.IdentificacaoComissao.CodigoComissao || '',
        sigla: comissao.IdentificacaoComissao.SiglaComissao || '',
        nome: comissao.IdentificacaoComissao.NomeComissao || '',
        casa: comissao.IdentificacaoComissao.SiglaCasaComissao || '',
        participacao: comissao.DescricaoParticipacao || '',
        dataInicio: comissao.DataInicio || undefined,
        dataFim,
        atual
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma filiações partidárias do parlamentar
   * @param filiacoes - Dados de filiações da API
   */
  private transformFiliacoes(filiacoes: any): Array<{
    partido: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    dataFiliacao?: string;
    dataDesfiliacao?: string | null;
    atual: boolean;
  }> {
    if (!filiacoes || !filiacoes.Parlamentar || !filiacoes.Parlamentar.Filiacoes) {
      logger.warn('Dados de filiações do parlamentar não encontrados ou vazios');
      return [];
    }

    const filiacoesObj = filiacoes.Parlamentar.Filiacoes;
    if (!filiacoesObj.Filiacao) {
      return [];
    }

    // Converter para array se necessário
    const filiacoesArray = Array.isArray(filiacoesObj.Filiacao)
      ? filiacoesObj.Filiacao
      : [filiacoesObj.Filiacao];

    // Transformar cada filiação
    return filiacoesArray.map((filiacao: any) => {
      if (!filiacao || !filiacao.Partido) {
        logger.warn('Filiação sem partido encontrada, pulando...');
        return null;
      }

      const dataDesfiliacao = filiacao.DataDesfiliacao || null;
      // Verificar se é a filiação atual
      const atual = !dataDesfiliacao;

      return {
        partido: {
          codigo: filiacao.Partido.CodigoPartido || '',
          sigla: filiacao.Partido.SiglaPartido || '',
          nome: filiacao.Partido.NomePartido || ''
        },
        dataFiliacao: filiacao.DataFiliacao || undefined,
        dataDesfiliacao,
        atual
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma histórico acadêmico do parlamentar
   * @param historicoAcademico - Dados de histórico acadêmico da API
   */
  private transformHistoricoAcademico(historicoAcademico: any): Array<{
    curso: string;
    grau: string;
    instituicao: string;
    local?: string;
  }> {
    // Verificar se temos dados válidos
    if (!historicoAcademico) {
      logger.warn('Dados de histórico acadêmico do parlamentar não encontrados ou vazios');
      return [];
    }

    // Verificar se temos dados do parlamentar
    if (!historicoAcademico.Parlamentar) {
      logger.warn('Dados do parlamentar não encontrados no histórico acadêmico');
      return [];
    }

    // Verificar se temos dados de histórico acadêmico
    if (!historicoAcademico.Parlamentar.HistoricoAcademico) {
      logger.warn('Histórico acadêmico do parlamentar não encontrado');
      return [];
    }

    const historicoObj = historicoAcademico.Parlamentar.HistoricoAcademico;

    // Verificar se temos dados de cursos
    if (!historicoObj.Curso) {
      logger.warn('Nenhum curso encontrado no histórico acadêmico do parlamentar');
      return [];
    }

    // Converter para array se necessário
    const cursosArray = Array.isArray(historicoObj.Curso)
      ? historicoObj.Curso
      : [historicoObj.Curso];

    // Transformar cada curso
    return cursosArray.map((curso: any) => {
      if (!curso) return null;

      return {
        curso: curso.NomeCurso || '',
        grau: curso.GrauInstrucao || '',
        instituicao: curso.Estabelecimento || '',
        local: curso.Local || undefined
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma licenças do parlamentar
   * @param licencas - Dados de licenças da API
   */
  private transformLicencas(licencas: any): Array<{
    codigo: string;
    tipo: {
      sigla: string;
      descricao: string;
    };
    dataInicio?: string;
    dataFim?: string | null;
    atual: boolean;
  }> {
    if (!licencas || !licencas.Parlamentar || !licencas.Parlamentar.Licencas) {
      logger.warn('Dados de licenças do parlamentar não encontrados ou vazios');
      return [];
    }

    const licencasObj = licencas.Parlamentar.Licencas;
    if (!licencasObj.Licenca) {
      return [];
    }

    // Converter para array se necessário
    const licencasArray = Array.isArray(licencasObj.Licenca)
      ? licencasObj.Licenca
      : [licencasObj.Licenca];

    // Data atual para verificar licenças ativas
    const dataAtual = new Date();

    // Transformar cada licença
    return licencasArray.map((licenca: any) => {
      if (!licenca) return null;

      const dataInicio = licenca.DataInicio ? new Date(licenca.DataInicio) : null;
      const dataFim = licenca.DataFim ? new Date(licenca.DataFim) : null;

      // Verificar se a licença está ativa (início <= hoje && (sem fim ou fim >= hoje))
      const atual = dataInicio &&
                  dataInicio <= dataAtual &&
                  (!dataFim || dataFim >= dataAtual);

      return {
        codigo: licenca.Codigo || '',
        tipo: {
          sigla: licenca.SiglaTipoAfastamento || '',
          descricao: licenca.DescricaoTipoAfastamento || ''
        },
        dataInicio: licenca.DataInicio || undefined,
        dataFim: licenca.DataFim || null,
        atual
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma profissão do parlamentar
   * @param profissao - Dados de profissão da API
   */
  private transformProfissao(profissao: any): Array<{
    nome: string;
    principal: boolean;
  }> {
    // A API pode retornar ProfissaoParlamentar ou HistoricoAcademicoParlamentar
    if (!profissao ||
        (!profissao.Parlamentar?.Profissoes && !profissao.Parlamentar?.HistoricoAcademico)) {
      logger.warn('Dados de profissão do parlamentar não encontrados ou vazios');
      return [];
    }

    // Tentar obter de ambas as estruturas possíveis
    const profissoesObj = profissao.Parlamentar.Profissoes || profissao.Parlamentar.HistoricoAcademico;

    if (!profissoesObj || !profissoesObj.Profissao) {
      return [];
    }

    // Converter para array se necessário
    const profissoesArray = Array.isArray(profissoesObj.Profissao)
      ? profissoesObj.Profissao
      : [profissoesObj.Profissao];

    // Transformar cada profissão
    return profissoesArray.map((prof: any) => {
      if (!prof) return null;

      return {
        nome: prof.NomeProfissao || '',
        principal: prof.IndicadorAtividadePrincipal === 'Sim'
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma apartes do parlamentar
   * @param apartes - Dados de apartes da API
   */
  private transformApartes(apartes: any): Array<{
    codigo: string;
    data: string;
    tipo?: {
      codigo: string;
      descricao: string;
    };
    resumo: string;
    urlTexto?: string;
    sessao?: {
      codigo: string;
      tipo: string;
      data: string;
    };
  }> {
    if (!apartes || !apartes.Parlamentar || !apartes.Parlamentar.Apartes) {
      logger.warn('Dados de apartes do parlamentar não encontrados ou vazios');
      return [];
    }

    const apartesObj = apartes.Parlamentar.Apartes;
    if (!apartesObj.Aparte) {
      return [];
    }

    // Converter para array se necessário
    const apartesArray = Array.isArray(apartesObj.Aparte)
      ? apartesObj.Aparte
      : [apartesObj.Aparte];

    // Transformar cada aparte
    return apartesArray.map((aparte: any) => {
      if (!aparte) return null;

      return {
        codigo: aparte.CodigoPronunciamento || '',
        data: aparte.DataPronunciamento || '',
        tipo: aparte.TipoUsoPalavra ? {
          codigo: aparte.TipoUsoPalavra.Codigo || '',
          descricao: aparte.TipoUsoPalavra.Descricao || ''
        } : undefined,
        resumo: aparte.TextoResumo || '',
        urlTexto: aparte.UrlTexto || undefined,
        sessao: aparte.SessaoPlenaria ? {
          codigo: aparte.SessaoPlenaria.CodigoSessao || '',
          tipo: aparte.SessaoPlenaria.SiglaTipoSessao || '',
          data: aparte.SessaoPlenaria.DataSessao || ''
        } : undefined
      };
    }).filter(Boolean) as any[];
  }

  /**
   * Transforma dados de lideranças
   * @param liderancas - Dados de lideranças da API
   */
  private transformLiderancas(liderancas: any): Array<{
    codigo: string;
    casa: string;
    tipoUnidade: {
      codigo: string;
      sigla: string;
      descricao: string;
    };
    tipoLideranca: {
      codigo: string;
      sigla: string;
      descricao: string;
    };
    dataDesignacao: string;
    dataTermino: string | null;
    atual: boolean;
    bloco?: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    partido?: {
      codigo: string;
      sigla: string;
      nome: string;
    };
    partidoFiliacao: {
      codigo: string;
      sigla: string;
      nome: string;
    };
  }> {
    if (!liderancas) {
      logger.warn('Dados de lideranças não encontrados ou vazios');
      return [];
    }

    try {
      // Adicionar log para verificar a estrutura completa da resposta
      logger.debug(`Estrutura completa da resposta de lideranças: ${JSON.stringify(Object.keys(liderancas))}`);

      // Extrair lista de lideranças - verificar diferentes estruturas possíveis
      let listaLiderancas: any[] = [];

      if (liderancas.ListaLiderancas && liderancas.ListaLiderancas.Liderancas && liderancas.ListaLiderancas.Liderancas.Lideranca) {
        logger.debug('Estrutura encontrada: liderancas.ListaLiderancas.Liderancas.Lideranca');
        listaLiderancas = liderancas.ListaLiderancas.Liderancas.Lideranca;
      } else if (liderancas.liderancas && liderancas.liderancas.lideranca) {
        logger.debug('Estrutura encontrada: liderancas.liderancas.lideranca');
        listaLiderancas = liderancas.liderancas.lideranca;
      } else if (liderancas.liderancas) {
        logger.debug('Estrutura encontrada: liderancas.liderancas');
        listaLiderancas = liderancas.liderancas;
      } else {
        // Procurar em todas as chaves possíveis
        const procurarLiderancas = (obj: any): any[] => {
          if (!obj || typeof obj !== 'object') return [];

          // Verificar se o objeto atual contém uma lista de lideranças
          if (obj.lideranca && Array.isArray(obj.lideranca)) {
            return obj.lideranca;
          } else if (obj.Lideranca && Array.isArray(obj.Lideranca)) {
            return obj.Lideranca;
          } else if (obj.lideranca) {
            return [obj.lideranca];
          } else if (obj.Lideranca) {
            return [obj.Lideranca];
          }

          // Procurar em todas as chaves do objeto
          for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const resultado = procurarLiderancas(obj[key]);
              if (resultado.length > 0) {
                return resultado;
              }
            }
          }

          return [];
        };

        listaLiderancas = procurarLiderancas(liderancas);
        logger.debug(`Encontradas ${listaLiderancas.length} lideranças através de busca recursiva`);
      }

      // Garantir que seja um array
      listaLiderancas = Array.isArray(listaLiderancas) ? listaLiderancas : [listaLiderancas];

      // Adicionar log para verificar a estrutura
      if (listaLiderancas.length > 0) {
        logger.debug(`Estrutura de uma liderança: ${JSON.stringify(Object.keys(listaLiderancas[0]))}`);
      }

      // Transformar cada liderança
      return listaLiderancas.map((lideranca: any) => {
        // Função auxiliar para obter valor de diferentes possíveis nomes de campo
        const getField = (obj: any, possibleNames: string[]): string => {
          for (const name of possibleNames) {
            if (obj[name] !== undefined) {
              return obj[name];
            }
          }
          return '';
        };

        // Extrair dados básicos
        const codigo = getField(lideranca, ['Codigo', 'codigo', 'CodigoLideranca', 'codigoLideranca']);
        const casa = getField(lideranca, ['Casa', 'casa']);
        const dataDesignacao = getField(lideranca, ['DataDesignacao', 'dataDesignacao']);
        const dataTermino = getField(lideranca, ['DataTermino', 'dataTermino']) || null;

        // Verificar se a liderança é atual
        const hoje = new Date();
        const dataDesignacaoObj = dataDesignacao ? new Date(dataDesignacao) : null;
        const dataTerminoObj = dataTermino ? new Date(dataTermino) : null;

        // Garantir que o valor seja sempre boolean (nunca null)
        // Usar !! para converter para boolean
        const atual = Boolean(dataDesignacaoObj && dataDesignacaoObj <= hoje && (!dataTerminoObj || dataTerminoObj >= hoje));

        // Extrair tipo de unidade
        const tipoUnidade = {
          codigo: getField(lideranca, ['IdTipoUnidadeLideranca', 'idTipoUnidadeLideranca']),
          sigla: getField(lideranca, ['SiglaTipoUnidadeLideranca', 'siglaTipoUnidadeLideranca']),
          descricao: getField(lideranca, ['DescricaoTipoUnidadeLideranca', 'descricaoTipoUnidadeLideranca'])
        };

        // Extrair tipo de liderança
        const tipoLideranca = {
          codigo: getField(lideranca, ['SiglaTipoLideranca', 'siglaTipoLideranca']),
          sigla: getField(lideranca, ['SiglaTipoLideranca', 'siglaTipoLideranca']),
          descricao: getField(lideranca, ['DescricaoTipoLideranca', 'descricaoTipoLideranca'])
        };

        // Extrair bloco (se existir)
        const codigoBloco = getField(lideranca, ['CodigoBloco', 'codigoBloco']);
        const bloco = codigoBloco ? {
          codigo: codigoBloco,
          sigla: getField(lideranca, ['SiglaBloco', 'siglaBloco']),
          nome: getField(lideranca, ['NomeBloco', 'nomeBloco'])
        } : undefined;

        // Extrair partido (se existir)
        const codigoPartido = getField(lideranca, ['CodigoPartido', 'codigoPartido']);
        const partido = codigoPartido ? {
          codigo: codigoPartido,
          sigla: getField(lideranca, ['SiglaPartido', 'siglaPartido']),
          nome: getField(lideranca, ['NomePartido', 'nomePartido'])
        } : undefined;

        // Extrair partido de filiação
        const partidoFiliacao = {
          codigo: getField(lideranca, ['CodigoPartidoFiliacao', 'codigoPartidoFiliacao']),
          sigla: getField(lideranca, ['SiglaPartidoFiliacao', 'siglaPartidoFiliacao']),
          nome: getField(lideranca, ['NomePartidoFiliacao', 'nomePartidoFiliacao'])
        };

        return {
          codigo,
          casa,
          tipoUnidade,
          tipoLideranca,
          dataDesignacao,
          dataTermino,
          atual,
          bloco,
          partido,
          partidoFiliacao
        };
      });
    } catch (error: any) {
      logger.warn(`Erro ao transformar lideranças: ${error.message}`);
      return [];
    }
  }

  /**
   * Determina a situação atual do parlamentar
   * @param mandatos - Mandatos transformados
   * @param licencas - Licenças transformadas
   */
  private determinarSituacaoAtual(mandatos: any[], licencas: any[]): {
    emExercicio: boolean;
    titular: boolean;
    suplente: boolean;
    afastado: boolean;
    motivoAfastamento?: string | null;
    mandatoAtual?: {
      codigo: string;
      participacao: string;
      legislatura: string;
    } | null;
    licencaAtual?: {
      codigo: string;
      tipo: {
        sigla: string;
        descricao: string;
      };
      dataInicio: string;
      dataFim: string | null;
    } | null;
    ultimaLegislatura?: string | null;
  } {
    // Valores padrão
    const situacao = {
      emExercicio: false,
      titular: false,
      suplente: false,
      afastado: false,
      motivoAfastamento: null as string | null,
      mandatoAtual: null as {
        codigo: string;
        participacao: string;
        legislatura: string;
      } | null,
      licencaAtual: null as {
        codigo: string;
        tipo: {
          sigla: string;
          descricao: string;
        };
        dataInicio: string;
        dataFim: string | null;
      } | null,
      ultimaLegislatura: null as string | null
    };

    // Verificar mandato atual
    if (mandatos && mandatos.length > 0) {
      // Ordenar por dataInicio mais recente primeiro
      const mandatosOrdenados = [...mandatos].sort((a, b) => {
        if (!a.dataInicio) return 1;
        if (!b.dataInicio) return -1;
        return new Date(b.dataInicio) > new Date(a.dataInicio) ? 1 : -1;
      });

      const hoje = new Date();

      // Procurar mandato vigente
      const mandatoAtual = mandatosOrdenados.find(m => {
        const inicio = m.dataInicio ? new Date(m.dataInicio) : null;
        const fim = m.dataFim ? new Date(m.dataFim) : null;

        return inicio && inicio <= hoje && (!fim || fim >= hoje);
      });

      if (mandatoAtual) {
        situacao.titular = mandatoAtual.participacao === 'Titular' || !mandatoAtual.titular;
        situacao.suplente = mandatoAtual.participacao && mandatoAtual.participacao.includes('Suplente');
        situacao.ultimaLegislatura = mandatoAtual.legislatura;

        situacao.mandatoAtual = {
          codigo: mandatoAtual.codigo,
          participacao: mandatoAtual.participacao,
          legislatura: mandatoAtual.legislatura
        };

        // Determinar se está em exercício
        situacao.emExercicio = true; // Por padrão

        // Verificar com base nos exercícios (se disponíveis)
        if (mandatoAtual.exercicios && mandatoAtual.exercicios.length > 0) {
          // Ordenar exercícios do mais recente para o mais antigo
          const exerciciosOrdenados = [...mandatoAtual.exercicios].sort((a, b) => {
            if (!a.dataInicio) return 1;
            if (!b.dataInicio) return -1;
            return new Date(b.dataInicio) > new Date(a.dataInicio) ? 1 : -1;
          });

          const ultimoExercicio = exerciciosOrdenados[0];

          // Se o último exercício tem data de fim e é no passado, não está em exercício
          if (ultimoExercicio.dataFim) {
            const fimExercicio = new Date(ultimoExercicio.dataFim);
            situacao.emExercicio = fimExercicio >= hoje;

            if (!situacao.emExercicio) {
              situacao.afastado = true;
              situacao.motivoAfastamento = ultimoExercicio.descricaoCausaAfastamento;
            }
          }
        }
      } else {
        // Se não tem mandato vigente, considera o último mandato exercido
        const ultimoMandato = mandatosOrdenados[0];
        if (ultimoMandato) {
          situacao.ultimaLegislatura = ultimoMandato.legislatura;
          situacao.titular = ultimoMandato.participacao === 'Titular' || !ultimoMandato.titular;
          situacao.suplente = ultimoMandato.participacao && ultimoMandato.participacao.includes('Suplente');
          situacao.emExercicio = false;
          situacao.afastado = true;
          situacao.motivoAfastamento = 'Fim de mandato';
        }
      }
    }

    // Verificar licença atual
    if (licencas && licencas.length > 0) {
      // Filtrar licenças atuais (que tem campo atual = true)
      const licencasAtuais = licencas.filter(l => l.atual);

      if (licencasAtuais.length > 0) {
        // Ordenar por data de início mais recente
        const licencasOrdenadas = [...licencasAtuais].sort((a, b) => {
          if (!a.dataInicio) return 1;
          if (!b.dataInicio) return -1;
          return new Date(b.dataInicio) > new Date(a.dataInicio) ? 1 : -1;
        });

        const licencaAtual = licencasOrdenadas[0];

        situacao.licencaAtual = {
          codigo: licencaAtual.codigo,
          tipo: licencaAtual.tipo,
          dataInicio: licencaAtual.dataInicio || '',
          dataFim: licencaAtual.dataFim
        };

        // Se tem licença atual, está afastado (temporariamente)
        situacao.afastado = true;
        situacao.emExercicio = false;
        situacao.motivoAfastamento = licencaAtual.tipo.descricao;
      }
    }

    return situacao;
  }

  /**
   * Transforma o perfil completo de um senador para uma estrutura organizada
   * Esta função reorganiza os dados do perfil para uma estrutura mais normalizada e organizada
   * @param perfilCompleto - Perfil completo extraído ou já transformado
   */
  transformPerfilCompletoOrganizado(perfilCompleto: SenadorCompletoTransformado): any {
    try {
      // Verificar se o perfil existe
      if (!perfilCompleto) {
        logger.error(`Perfil completo é nulo ou indefinido`);
        return null;
      }

      // Criar estrutura organizada
      const perfilOrganizado = {
        identificacao: {
          codigo: perfilCompleto.codigo,
          nome: perfilCompleto.nome,
          nomeCompleto: perfilCompleto.nomeCompleto,
          genero: perfilCompleto.genero,
          foto: perfilCompleto.foto,
          paginaOficial: perfilCompleto.paginaOficial,
          paginaParticular: perfilCompleto.paginaParticular,
          email: perfilCompleto.email,
          partido: perfilCompleto.partido,
          uf: perfilCompleto.uf,
          telefones: perfilCompleto.telefones
        },

        situacaoAtual: {
          emExercicio: perfilCompleto.situacaoAtual.emExercicio,
          titular: perfilCompleto.situacaoAtual.titular,
          suplente: perfilCompleto.situacaoAtual.suplente,
          afastado: perfilCompleto.situacaoAtual.afastado,
          cargoMesa: perfilCompleto.situacao.cargoMesa,
          cargoLideranca: perfilCompleto.situacao.cargoLideranca,
          motivoAfastamento: perfilCompleto.situacaoAtual.motivoAfastamento,
          mandatoAtual: perfilCompleto.situacaoAtual.mandatoAtual,
          licencaAtual: perfilCompleto.situacaoAtual.licencaAtual,
          ultimaLegislatura: perfilCompleto.situacaoAtual.ultimaLegislatura
        },

        dadosPessoais: perfilCompleto.dadosPessoais,

        mandatos: perfilCompleto.mandatos.map(mandato => {
          // Reorganizar estrutura de mandatos
          const mandatoOrganizado: any = {
            codigo: mandato.codigo,
            participacao: mandato.participacao,
            legislatura: mandato.legislatura,
            dataInicio: mandato.dataInicio,
            dataFim: mandato.dataFim,
            exercicios: mandato.exercicios || [],
            suplentes: mandato.suplentes || [],
            titular: mandato.titular,
            legislaturas: {}
          };

          // Adicionar UF se existir
          if ('uf' in mandato) {
            mandatoOrganizado.uf = (mandato as any).uf;
          }

          // Adicionar informações de legislaturas se existirem
          if ('primeiraLegislatura' in mandato && (mandato as any).primeiraLegislatura) {
            mandatoOrganizado.legislaturas.primeira = {
              numero: (mandato as any).primeiraLegislatura.numero,
              dataInicio: (mandato as any).primeiraLegislatura.dataInicio,
              dataFim: (mandato as any).primeiraLegislatura.dataFim
            };
          }

          if ('segundaLegislatura' in mandato && (mandato as any).segundaLegislatura) {
            mandatoOrganizado.legislaturas.segunda = {
              numero: (mandato as any).segundaLegislatura.numero,
              dataInicio: (mandato as any).segundaLegislatura.dataInicio,
              dataFim: (mandato as any).segundaLegislatura.dataFim
            };
          }

          return mandatoOrganizado;
        }),

        cargos: perfilCompleto.cargos ? perfilCompleto.cargos.map(cargo => {
          // Reorganizar estrutura de cargos
          return {
            tipo: {
              codigo: cargo.cargo.codigo,
              descricao: cargo.cargo.descricao
            },
            comissao: cargo.comissao,
            periodo: {
              dataInicio: cargo.dataInicio,
              dataFim: cargo.dataFim
            },
            atual: cargo.atual
          };
        }) : [],

        comissoes: perfilCompleto.comissoes,

        filiacoes: perfilCompleto.filiacoes.map(filiacao => {
          // Reorganizar estrutura de filiações
          return {
            partido: filiacao.partido,
            periodo: {
              dataFiliacao: filiacao.dataFiliacao,
              dataDesfiliacao: filiacao.dataDesfiliacao
            },
            atual: filiacao.atual
          };
        }),

        formacao: perfilCompleto.formacao,

        licencas: perfilCompleto.licencas.map(licenca => {
          // Reorganizar estrutura de licenças
          return {
            codigo: licenca.codigo,
            tipo: licenca.tipo,
            periodo: {
              dataInicio: licenca.dataInicio,
              dataFim: licenca.dataFim
            },
            atual: licenca.atual
          };
        }),

        liderancas: perfilCompleto.liderancas ? perfilCompleto.liderancas.map(lideranca => {
          // Reorganizar estrutura de lideranças
          return {
            codigo: lideranca.codigo,
            casa: lideranca.casa,
            tipo: {
              unidade: lideranca.tipoUnidade,
              lideranca: lideranca.tipoLideranca
            },
            periodo: {
              dataDesignacao: lideranca.dataDesignacao,
              dataTermino: lideranca.dataTermino
            },
            partido: lideranca.partido,
            atual: lideranca.atual
          };
        }) : [],

        metadados: {
          atualizadoEm: perfilCompleto.metadados.atualizadoEm,
          fontes: perfilCompleto.metadados.fontes,
          versaoEstrutura: "1.1",
          processadoPor: "transformPerfilCompletoOrganizado"
        }
      };

      return perfilOrganizado;
    } catch (error: any) {
      logger.error(`Erro ao transformar perfil completo organizado: ${error.message}`);
      return null;
    }
  }
}

export const perfilSenadoresTransformer = new PerfilSenadoresTransformer();
