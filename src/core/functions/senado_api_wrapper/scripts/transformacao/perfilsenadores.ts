/**
 * Transformador especializado para perfis de senadores
 * Este módulo transforma especificamente perfis completos de senadores,
 * tratando as peculiaridades da resposta da API.
 */
import { logger } from '../utils/logger';
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
  apartes?: Array<{
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
    
    const { senadores, timestamp, metadados } = extractionResult;
    
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
          comissoes: [],
          filiacoes: [],
          formacao: {
            historicoAcademico: [],
            profissao: []
          },
          licencas: [],
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
      const apartes = perfilCompleto.apartes?.dados || null;
      
      // Verificar se temos dados parlamentares
      const parlamentar = dadosBasicos.Parlamentar || 
                        dadosBasicos.DetalheParlamentar?.Parlamentar || {};
      
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
          comissoes: [],
          filiacoes: [],
          formacao: {
            historicoAcademico: [],
            profissao: []
          },
          licencas: [],
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
      const identificacao = this.transformIdentificacao(
        parlamentar.IdentificacaoParlamentar || 
        parlamentar.Identificacao || {}
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
      
      // 11. Determinar situação atual
      const situacaoAtual = this.determinarSituacaoAtual(mandatosTransformados, licencasTransformadas);
      
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
        comissoes: comissoesTransformadas,
        filiacoes: filiacoesTransformadas,
        formacao: {
          historicoAcademico: historicoAcademicoTransformado,
          profissao: profissaoTransformada
        },
        licencas: licencasTransformadas,
        apartes: apartesTransformados && apartesTransformados.length > 0 
          ? apartesTransformados.slice(0, 10) // Limitar a 10 apartes mais recentes
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
            apartes: perfilCompleto.apartes?.origem
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
        comissoes: [],
        filiacoes: [],
        formacao: {
          historicoAcademico: [],
          profissao: []
        },
        licencas: [],
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
  private transformTelefones(telefones: any): Array<{ numero: string; tipo: string }> {
    if (!telefones || !telefones.Telefone) {
      return [];
    }
    
    const telefonesArray = Array.isArray(telefones.Telefone) 
      ? telefones.Telefone 
      : [telefones.Telefone];
    
    return telefonesArray.map((tel: any) => ({
      numero: tel.NumeroTelefone || '',
      tipo: tel.IndicadorFax === 'Sim' ? 'Fax' : 'Telefone'
    }));
  }
  
  /**
   * Transforma identificação do parlamentar
   * @param identificacao - Dados de identificação da API
   */
  private transformIdentificacao(identificacao: any): SenadorBasicoTransformado {
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
    
    return {
      codigo: identificacao.CodigoParlamentar || identificacao.Codigo || 'desconhecido',
      nome: identificacao.NomeParlamentar || identificacao.Nome || 'Não informado',
      nomeCompleto: identificacao.NomeCompletoParlamentar || identificacao.NomeCompleto || identificacao.Nome || 'Não informado',
      genero: identificacao.SexoParlamentar || identificacao.Sexo || '',
      foto: identificacao.UrlFotoParlamentar || identificacao.UrlFoto || '',
      paginaOficial: identificacao.UrlPaginaParlamentar || identificacao.UrlPagina || '',
      paginaParticular: identificacao.UrlPaginaParticular || '',
      email: identificacao.EmailParlamentar || identificacao.Email || '',
      partido: {
        sigla: identificacao.SiglaPartidoParlamentar || identificacao.SiglaPartido || '',
        nome: null
      },
      uf: identificacao.UfParlamentar || identificacao.Uf || '',
      telefones: this.transformTelefones(identificacao.Telefones),
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
      
      // Mandato básico
      const mandatoTransformado = {
        codigo: mandato.CodigoMandato || '',
        participacao: mandato.DescricaoParticipacao || '',
        legislatura: mandato.PrimeiraLegislaturaDoMandato?.NumeroLegislatura || 
                   mandato.NumeroLegislatura || '',
        dataInicio: mandato.DataInicio || undefined,
        dataFim: mandato.DataFim || null,
        // Informações adicionais
        exercicios: this.transformExercicios(mandato.Exercicios),
        suplentes: this.transformSuplentes(mandato.Suplentes),
        titular: mandato.Titular ? {
          codigo: mandato.Titular.CodigoParlamentar || '',
          nome: mandato.Titular.NomeParlamentar || '',
          participacao: mandato.Titular.DescricaoParticipacao || ''
        } : undefined
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
    if (!historicoAcademico || !historicoAcademico.Parlamentar || !historicoAcademico.Parlamentar.HistoricoAcademico) {
      logger.warn('Dados de histórico acadêmico do parlamentar não encontrados ou vazios');
      return [];
    }
    
    const historicoObj = historicoAcademico.Parlamentar.HistoricoAcademico;
    if (!historicoObj.Curso) {
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
}

// Exporta uma instância do transformador
export const perfilSenadoresTransformer = new PerfilSenadoresTransformer();
