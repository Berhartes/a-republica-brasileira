/**
 * Processador especializado para blocos parlamentares
 * 
 * Este processador implementa o fluxo ETL completo para
 * extração, transformação e carregamento de blocos parlamentares.
 */

import { ETLProcessor } from '../core/etl-processor';
import { ValidationResult, BatchResult } from '../types/etl.types';
import { blocoExtractor } from '../extracao/blocos';
import { blocoTransformer } from '../transformacao/blocos';
import { blocoLoader } from '../carregamento/blocos';
import { obterNumeroLegislaturaAtual } from '../utils/date';
import { exportToJson } from '../utils/common';
import { ProcessingStatus } from '../types/etl.types';

/**
 * Estrutura dos dados extraídos
 */
interface ExtractedData {
  // Resultado de blocoExtractor.extractLista()
  listaBlocosResult: {
    timestamp: string;
    total: number;
    blocos: any[];
  };
  // Array dos resultados de blocoExtractor.extractDetalhe()
  detalhesBlocos: Array<{
    timestamp: string;
    codigo: string | number;
    detalhes: any;
  }>;
  // Lista de senadores em exercício para mapeamento
  senadoresAtuais: any[];
  legislatura: number;
}

/**
 * Estrutura dos dados transformados
 */
interface TransformedData {
  blocosTransformados: any[];
  membrosTransformados: Map<string, any[]>;
  estatisticas: {
    totalBlocos: number;
    totalMembros: number;
    blocosPorTipo: Record<string, number>;
  };
  legislatura: number;
}

/**
 * Processador de blocos parlamentares
 */
export class BlocosProcessor extends ETLProcessor<ExtractedData, TransformedData> {
  
  protected getProcessName(): string {
    return 'Processador de Blocos Parlamentares';
  }

  async validate(): Promise<ValidationResult> {
    const erros: string[] = [];
    const avisos: string[] = [];

    // Validar legislatura se especificada
    if (this.context.options.legislatura) {
      const leg = this.context.options.legislatura;
      
      if (leg < this.context.config.senado.legislatura.min || 
          leg > this.context.config.senado.legislatura.max) {
        erros.push(`Legislatura ${leg} fora do intervalo válido`);
      }
    }

    // Avisar sobre possíveis limitações
    if (!this.context.options.limite) {
      avisos.push('Processando todos os blocos pode demorar. Considere usar --limite para testes');
    }

    return {
      valido: erros.length === 0,
      erros,
      avisos
    };
  }

  async extract(): Promise<ExtractedData> {
    const legislatura = await this.determinarLegislatura();
    this.context.logger.info(`📅 Extraindo blocos da legislatura ${legislatura}`);

    // Extrair lista de blocos
    this.context.logger.info('📋 Extraindo lista de blocos parlamentares...');
    // TODO: Implementar filtragem por legislatura se extractLista() retornar todos os blocos
    // Por agora, assume-se que extractLista() retorna blocos relevantes ou que a filtragem será adicionada
    const resultadoExtracaoLista = await blocoExtractor.extractLista();
    
    let blocos = resultadoExtracaoLista.blocos || [];
    
    if (blocos.length === 0) {
      throw new Error(`Nenhum bloco encontrado para a legislatura ${legislatura}`);
    }

    this.context.logger.info(`✓ ${blocos.length} blocos encontrados`);

    // Aplicar limite se especificado
    if (this.context.options.limite && this.context.options.limite > 0) {
      blocos = blocos.slice(0, this.context.options.limite);
      this.context.logger.info(`🔍 Limitado a ${blocos.length} blocos`);
    }

    // Extrair detalhes de cada bloco (incluindo membros)
    this.context.logger.info('👥 Extraindo detalhes dos blocos...');
    const detalhesDosBlocos = await this.extrairDetalhesBlocos(blocos);

    // Extrair lista de senadores atuais para mapear para os blocos
    this.context.logger.info('👥 Extraindo senadores atuais para mapeamento de blocos...');
    const senadoresAtuais = await blocoExtractor.extractSenadoresAtuais();

    this.updateExtractionStats(blocos.length, blocos.length, 0); // Manter estatísticas baseadas na lista inicial de blocos

    return {
      listaBlocosResult: { // Usar a lista de blocos original (pode estar limitada)
        ...resultadoExtracaoLista, // resultadoExtracaoLista foi definido anteriormente no método extract
        blocos: blocos
      },
      detalhesBlocos: detalhesDosBlocos,
      senadoresAtuais: senadoresAtuais,
      legislatura
    };
  }

  async transform(data: ExtractedData): Promise<TransformedData> {
    this.context.logger.info('🔄 Transformando blocos e membros...');

    // Agrupar senadores por bloco a partir da lista de senadores atuais
    const senadoresPorBlocoMap = new Map<string, any[]>();
    for (const senador of data.senadoresAtuais) {
      const bloco = senador.IdentificacaoParlamentar?.Bloco;
      if (bloco && bloco.CodigoBloco) {
        const codigoBloco = String(bloco.CodigoBloco);
        if (!senadoresPorBlocoMap.has(codigoBloco)) {
          senadoresPorBlocoMap.set(codigoBloco, []);
        }
        // O transformador espera um formato específico, vamos adaptar
        senadoresPorBlocoMap.get(codigoBloco)?.push({
          codigoSenador: senador.IdentificacaoParlamentar.CodigoParlamentar,
          nomeSenador: senador.IdentificacaoParlamentar.NomeParlamentar,
          siglaPartido: senador.IdentificacaoParlamentar.SiglaPartidoParlamentar,
          uf: senador.IdentificacaoParlamentar.UfParlamentar,
          codigoBloco: codigoBloco,
        });
      }
    }

    const senadoresPorBloco = {
      timestamp: new Date().toISOString(),
      total: senadoresPorBlocoMap.size,
      senadoresPorBloco: Object.fromEntries(senadoresPorBlocoMap)
    };

    // O BlocoTransformer agora espera um objeto com lista, detalhes e senadores
    const resultadoTransformacao = blocoTransformer.transformBlocos({
      lista: data.listaBlocosResult,
      detalhes: data.detalhesBlocos,
      senadoresPorBloco: senadoresPorBloco
    });

    const blocosTransformadosApi = resultadoTransformacao.blocos;
    
    // O BlocoTransformer já lida com a transformação dos membros internamente
    // e os inclui nos objetos de bloco transformados.
    // A estrutura membrosTransformados separada pode não ser mais necessária
    // ou precisará ser populada de forma diferente se o método salvarNoPC depender dela.
    const membrosTransformadosMap = new Map<string, any[]>(); 

    // Calcular estatísticas a partir dos blocos transformados
    const estatisticas = {
      totalBlocos: blocosTransformadosApi.length,
      totalMembros: 0, 
      blocosPorTipo: {} as Record<string, number>
    };

    for (const bloco of blocosTransformadosApi) {
      // Assumindo que 'tipo' e 'partidos'/'senadores' existem no bloco transformado
      // e que 'codigo' é o identificador do bloco.
      const tipo = bloco.sigla || 'Outros'; // Usar sigla como tipo ou 'Outros'
      estatisticas.blocosPorTipo[tipo] = (estatisticas.blocosPorTipo[tipo] || 0) + 1;
      
      let numMembrosNoBloco = 0;
      if (bloco.partidos && Array.isArray(bloco.partidos)) {
        numMembrosNoBloco += bloco.partidos.length;
      }
      if (bloco.senadores && Array.isArray(bloco.senadores)) {
        // Evitar contagem dupla se senadores já foram contados como partidos/membros
        // Esta lógica pode precisar de refinamento baseado na estrutura exata de BlocoTransformado
        // e como os membros são representados.
        // Por ora, somamos se existir a propriedade senadores.
        numMembrosNoBloco += bloco.senadores.length; 
      }
      estatisticas.totalMembros += numMembrosNoBloco;

      // Popular membrosTransformadosMap se salvarNoPC precisar dele
      // Esta parte é crucial para o método salvarNoPC funcionar como antes.
      // Precisamos extrair os membros do bloco transformado.
      // Assumindo que os membros relevantes para salvarNoPC são os 'partidos' do bloco.
      if (bloco.codigo && bloco.partidos) {
        membrosTransformadosMap.set(String(bloco.codigo), bloco.partidos);
      } else if (bloco.codigo && bloco.senadores) { // Fallback para senadores se partidos não existir
        membrosTransformadosMap.set(String(bloco.codigo), bloco.senadores);
      }
    }
    
    const falhasTransformacao = data.listaBlocosResult.blocos.length - blocosTransformadosApi.length;
    this.updateTransformationStats(
      data.listaBlocosResult.blocos.length, 
      blocosTransformadosApi.length, 
      falhasTransformacao
    );

    this.context.logger.info(`✓ ${blocosTransformadosApi.length} blocos transformados`);
    this.context.logger.info(`✓ ${estatisticas.totalMembros} membros (partidos/senadores) contabilizados nos blocos`);
    this.context.logger.info(`📊 Estatísticas:`, estatisticas);

    return {
      blocosTransformados: blocosTransformadosApi,
      membrosTransformados: membrosTransformadosMap, // Usar o Map populado
      estatisticas,
      legislatura: data.legislatura
    };
  }

  async load(data: TransformedData): Promise<BatchResult> {
    switch (this.context.options.destino) {
      case 'pc':
        return this.salvarNoPC(data);
      
      case 'emulator':
        process.env.FIRESTORE_EMULATOR_HOST = this.context.config.firestore.emulatorHost;
        return this.salvarNoFirestore(data);
        
      case 'firestore':
        return this.salvarNoFirestore(data);
        
      default:
        throw new Error(`Destino inválido: ${this.context.options.destino}`);
    }
  }

  /**
   * Métodos auxiliares privados
   */

  private async determinarLegislatura(): Promise<number> {
    if (this.context.options.legislatura) {
      return this.context.options.legislatura;
    }

    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual');
    }

    return legislaturaAtual;
  }

  private async extrairDetalhesBlocos(blocos: any[]): Promise<Array<{ timestamp: string; codigo: string | number; detalhes: any; }>> {
    const detalhesCompletos: Array<{ timestamp: string; codigo: string | number; detalhes: any; }> = [];
    let processados = 0;

    for (const bloco of blocos) {
      try {
        this.context.logger.debug(`Extraindo detalhes do bloco ${bloco.NomeBloco} (Código: ${bloco.CodigoBloco})`);
        
        const resultadoDetalhe = await blocoExtractor.extractDetalhe(bloco.CodigoBloco);
        
        if (resultadoDetalhe) {
          detalhesCompletos.push(resultadoDetalhe);
        }
        
        processados++;
        
        // Emitir progresso
        const progresso = Math.round((processados / blocos.length) * 100);
        this.emitProgress(
          ProcessingStatus.EXTRAINDO,
          25 + Math.round(progresso * 0.25),
          `Extraídos membros de ${processados}/${blocos.length} blocos`
        );

        // Pausa entre requisições
        if (processados < blocos.length) {
          await new Promise(resolve => 
            setTimeout(resolve, this.context.config.senado.pauseBetweenRequests)
          );
        }
      } catch (error: any) {
        this.context.logger.warn(`Erro ao extrair membros do bloco ${bloco.NomeBloco}: ${error.message}`);
        this.incrementWarnings();
      }
    }

    return detalhesCompletos;
  }

  private async salvarNoPC(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('💾 Salvando blocos no PC local...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseDir = `blocos/legislatura_${data.legislatura}`;
    const detalhes: any[] = [];

    try {
      // Salvar lista de blocos
      const blocosPath = `${baseDir}/blocos_${timestamp}.json`;
      exportToJson(data.blocosTransformados, blocosPath);
      detalhes.push({ id: 'blocos', status: 'sucesso' });
      
      // Salvar estatísticas
      const statsPath = `${baseDir}/estatisticas_${timestamp}.json`;
      exportToJson(data.estatisticas, statsPath);
      detalhes.push({ id: 'estatisticas', status: 'sucesso' });
      
      // Salvar membros por bloco
      const membrosDir = `${baseDir}/membros`;
      data.membrosTransformados.forEach((membros, blocoId) => {
        try {
          const membrosPath = `${membrosDir}/bloco_${blocoId}_${timestamp}.json`;
          exportToJson(membros, membrosPath);
          detalhes.push({ id: `membros_${blocoId}`, status: 'sucesso' });
        } catch (error: any) {
          detalhes.push({ 
            id: `membros_${blocoId}`, 
            status: 'falha', 
            erro: error.message 
          });
        }
      });
      
      const sucessos = detalhes.filter(d => d.status === 'sucesso').length;
      const falhas = detalhes.filter(d => d.status === 'falha').length;
      
      this.updateLoadStats(detalhes.length, sucessos, falhas);
      
      return {
        total: detalhes.length,
        processados: detalhes.length,
        sucessos,
        falhas,
        detalhes
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no PC: ${error.message}`);
      throw error;
    }
  }

  private async salvarNoFirestore(data: TransformedData): Promise<BatchResult> {
    this.context.logger.info('☁️ Salvando blocos no Firestore...');
    
    try {
      // O BlocoLoader.saveBlocos espera um objeto ResultadoTransformacao
      const dadosParaSalvarApi = { // Renomeado para evitar conflito de nome
        timestamp: new Date().toISOString(),
        total: data.blocosTransformados.length,
        blocos: data.blocosTransformados
      };

      // O método saveBlocos já lida com os blocos e seus membros internos.
      const resultadoCarregamento = await blocoLoader.saveBlocos(
        dadosParaSalvarApi,
        data.legislatura
      );
      
      // As estatísticas de carregamento agora vêm diretamente de resultadoCarregamento
      this.updateLoadStats(
        resultadoCarregamento.totalSalvos, // Total de blocos salvos
        resultadoCarregamento.totalSalvos, // Sucessos são o total salvo
        0 // Falhas seriam tratadas dentro de saveBlocos ou por exceção
      );
      
      return {
        total: resultadoCarregamento.totalSalvos,
        processados: resultadoCarregamento.totalSalvos, // Assumindo que todos os processados foram tentados
        sucessos: resultadoCarregamento.totalSalvos,
        falhas: 0, // Ajustar se saveBlocos retornar contagem de falhas
        detalhes: [ // Detalhes simplificados
          { id: 'blocos', status: 'sucesso' }
        ]
      };
      
    } catch (error: any) {
      this.context.logger.error(`Erro ao salvar no Firestore: ${error.message}`);
      // Em caso de erro no batch, podemos assumir que todos falharam
      this.updateLoadStats(
        data.blocosTransformados.length, 
        0, 
        data.blocosTransformados.length 
      );
      throw error;
    }
  }
}
