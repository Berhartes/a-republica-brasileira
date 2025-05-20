/**
 * Exemplo de uso do módulo de perfis de senadores
 * Este script demonstra como utilizar as funções de extração, transformação
 * e processamento de perfis completos de senadores.
 */
import { logger } from '../utils/logger';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer } from '../transformacao/perfilsenadores';
import { obterNumeroLegislaturaAtual } from '../utils/legislatura';

/**
 * Função principal para demonstrar o uso do módulo
 */
async function demonstrarPerfilSenadores() {
  try {
    logger.info('=== Iniciando demonstração do módulo de perfis de senadores ===');
    
    // 1. Obter a legislatura atual
    logger.info('1. Obtendo informações da legislatura atual');
    const legislaturaAtual = await obterNumeroLegislaturaAtual();
    
    if (!legislaturaAtual) {
      throw new Error('Não foi possível obter a legislatura atual');
    }
    
    logger.info(`Legislatura atual: ${legislaturaAtual}`);
    
    // 2. Extrair lista de senadores da legislatura atual
    logger.info('2. Extraindo lista de senadores da legislatura atual');
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislaturaAtual);
    logger.info(`Extração concluída: ${senadoresExtraidos.senadores.length} senadores extraídos`);
    
    // 3. Transformar dados básicos
    logger.info('3. Transformando dados básicos dos senadores');
    const senadoresTransformados = perfilSenadoresTransformer.transformSenadoresLegislatura(senadoresExtraidos);
    logger.info(`Transformação concluída: ${senadoresTransformados.senadores.length} senadores transformados`);
    
    // 4. Mostrar alguns senadores para exemplo
    logger.info('4. Exemplos de senadores transformados:');
    for (let i = 0; i < Math.min(3, senadoresTransformados.senadores.length); i++) {
      const senador = senadoresTransformados.senadores[i];
      logger.info(`Senador ${i + 1}:`);
      logger.info(`  - Código: ${senador.codigo}`);
      logger.info(`  - Nome: ${senador.nome}`);
      logger.info(`  - UF: ${senador.uf}`);
      logger.info(`  - Partido: ${senador.partido.sigla}`);
    }
    
    // 5. Extrair o perfil completo de um senador específico
    logger.info('5. Extraindo perfil completo de um senador específico');
    
    // Escolher um senador aleatório da lista
    const indiceAleatorio = Math.floor(Math.random() * senadoresTransformados.senadores.length);
    const senadorAleatorio = senadoresTransformados.senadores[indiceAleatorio];
    
    logger.info(`Senador escolhido: ${senadorAleatorio.nome} (Código: ${senadorAleatorio.codigo})`);
    
    // Extrair perfil completo
    const perfilExtraido = await perfilSenadoresExtractor.extractPerfilCompleto(senadorAleatorio.codigo);
    logger.info('Perfil extraído com sucesso');
    
    // 6. Transformar o perfil completo
    logger.info('6. Transformando perfil completo');
    const perfilTransformado = perfilSenadoresTransformer.transformPerfilCompleto(perfilExtraido);
    
    if (perfilTransformado) {
      logger.info('Perfil transformado com sucesso. Exemplo de dados:');
      logger.info(`  - Nome completo: ${perfilTransformado.nomeCompleto}`);
      logger.info(`  - Data de nascimento: ${perfilTransformado.dadosPessoais.dataNascimento || 'Não informada'}`);
      logger.info(`  - Naturalidade: ${perfilTransformado.dadosPessoais.naturalidade}, ${perfilTransformado.dadosPessoais.ufNaturalidade}`);
      
      logger.info(`  - Número de mandatos: ${perfilTransformado.mandatos.length}`);
      if (perfilTransformado.mandatos.length > 0) {
        const mandatoMaisRecente = perfilTransformado.mandatos[0];
        logger.info(`  - Mandato mais recente: Legislatura ${mandatoMaisRecente.legislatura}`);
        logger.info(`    Início: ${mandatoMaisRecente.dataInicio || 'Não informado'}`);
        logger.info(`    Fim: ${mandatoMaisRecente.dataFim || 'Em andamento'}`);
      }
      
      logger.info(`  - Número de comissões: ${perfilTransformado.comissoes.length}`);
      
      logger.info(`  - Filiações partidárias: ${perfilTransformado.filiacoes.length}`);
      if (perfilTransformado.filiacoes.length > 0) {
        const filiacaoAtual = perfilTransformado.filiacoes.find(f => f.atual);
        if (filiacaoAtual) {
          logger.info(`  - Filiação atual: ${filiacaoAtual.partido.sigla} - ${filiacaoAtual.partido.nome}`);
          logger.info(`    Desde: ${filiacaoAtual.dataFiliacao || 'Não informado'}`);
        }
      }
      
      logger.info(`  - Formação acadêmica: ${perfilTransformado.formacao.historicoAcademico.length} cursos`);
      if (perfilTransformado.formacao.historicoAcademico.length > 0) {
        const primeirosCursos = perfilTransformado.formacao.historicoAcademico.slice(0, 2);
        primeirosCursos.forEach((curso, i) => {
          logger.info(`    * Curso ${i+1}: ${curso.curso} (${curso.grau}) - ${curso.instituicao}`);
        });
      }
      
      logger.info(`  - Profissões: ${perfilTransformado.formacao.profissao.length}`);
      if (perfilTransformado.formacao.profissao.length > 0) {
        const profissaoPrincipal = perfilTransformado.formacao.profissao.find(p => p.principal);
        if (profissaoPrincipal) {
          logger.info(`  - Profissão principal: ${profissaoPrincipal.nome}`);
        } else {
          logger.info(`  - Primeira profissão: ${perfilTransformado.formacao.profissao[0].nome}`);
        }
      }
    } else {
      logger.warn('Não foi possível transformar o perfil do senador');
    }
    
    logger.info('=== Demonstração do módulo de perfis de senadores concluída ===');
  } catch (error: any) {
    logger.error(`Erro na demonstração: ${error.message}`);
    throw error;
  }
}

// Executar a demonstração
demonstrarPerfilSenadores()
  .then(() => {
    logger.info('Exemplo executado com sucesso.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Falha na execução do exemplo', error);
    process.exit(1);
  });
