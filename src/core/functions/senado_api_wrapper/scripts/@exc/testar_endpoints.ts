/**
 * Script para testar endpoints específicos da API do Senado
 * Valida se os endpoints estão configurados corretamente e testando diferentes versões
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';

/**
 * Função auxiliar para testar um endpoint específico
 */
async function testarEndpoint(
  nome: string,
  config: { PATH: string; PARAMS: any },
  params: Record<string, string>
): Promise<boolean> {
  try {
    const endpoint = api.replacePath(config.PATH, params);
    logger.info(`Testando ${nome} com versão ${config.PARAMS.v}...`);
    logger.info(`URL: ${endpoints.BASE_URL}${endpoint}`);
    logger.info(`Parâmetros: ${JSON.stringify(config.PARAMS)}`);
    
    const response = await api.get(endpoint, config.PARAMS);
    logger.info(`Endpoint ${nome} responde com sucesso!`);
    
    // Mostrar as primeiras chaves da resposta para verificar a estrutura
    const primeiraChave = Object.keys(response)[0];
    logger.info(`Primeira chave da resposta: ${primeiraChave}`);
    
    return true;
  } catch (error: any) {
    logger.error(`Erro ao testar ${nome}: ${error.message}`);
    return false;
  }
}

async function testarEndpointsSenadores() {
  try {
    logger.info('=== Teste de endpoints da API do Senado ===');
    
    // Testar todos os endpoints relevantes com suas versões
    logger.info('\n=== Testando a compatibilidade de todos os endpoints ===');
    
    try {
      // Usar o código 5000 para todos os testes
      const codigoSenador = 5000;
      
      // 1. Dados básicos do senador
      logger.info('Testando dados básicos...');
      await testarEndpoint(
        'PERFIL',
        endpoints.SENADORES.PERFIL,
        { codigo: codigoSenador.toString() }
      );
      
      // 2. Mandatos
      logger.info('\nTestando mandatos...');
      await testarEndpoint(
        'MANDATOS',
        endpoints.SENADORES.MANDATOS,
        { codigo: codigoSenador.toString() }
      );
      
      // 3. Comissões
      logger.info('\nTestando comissões...');
      await testarEndpoint(
        'COMISSOES',
        endpoints.SENADORES.COMISSOES,
        { codigo: codigoSenador.toString() }
      );
      
      // 4. Filiações
      logger.info('\nTestando filiações...');
      await testarEndpoint(
        'FILIACOES',
        endpoints.SENADORES.FILIACOES,
        { codigo: codigoSenador.toString() }
      );
      
      // 5. Licenças
      logger.info('\nTestando licenças...');
      await testarEndpoint(
        'LICENCAS',
        endpoints.SENADORES.LICENCAS,
        { codigo: codigoSenador.toString() }
      );
    } catch (error: any) {
      logger.error(`Erro ao testar todos os endpoints: ${error.message}`);
    }
    
    // Testar a URL completa de lista de senadores por legislatura
    const legislatura = 54;
    const endpointConfig = endpoints.SENADORES.LISTA_LEGISLATURA;
    const endpointSenadores = api.replacePath(endpointConfig.PATH, { legislatura: legislatura.toString() });
    const urlCompleta = `${endpoints.BASE_URL}${endpointSenadores}`;
    
    logger.info(`URL completa para lista de senadores da legislatura ${legislatura}: ${urlCompleta}`);
    logger.info(`Parâmetros: ${JSON.stringify(endpointConfig.PARAMS)}`);
    
    // Verificar se a API responde
    try {
      logger.info(`Testando o endpoint de lista de senadores com versão ${endpointConfig.PARAMS.v}...`);
      const response = await api.get(endpointSenadores, endpointConfig.PARAMS);
      logger.info('Endpoint da lista de senadores responde com sucesso!');
      
      // Verificar a estrutura da resposta 
      if (response?.ListaParlamentarLegislatura) {
        logger.info(`Estrutura da resposta válida! Versão da API: ${response.ListaParlamentarLegislatura.Metadados?.VersaoServico || 'não informada'}`);
        const total = response.ListaParlamentarLegislatura.Parlamentares?.Parlamentar?.length || 0;
        logger.info(`Total de senadores na legislatura ${legislatura}: ${total}`);
      } else {
        logger.warn('Estrutura da resposta inesperada');
        logger.debug('Primeiras chaves da resposta:', Object.keys(response).slice(0, 5));
      }
    } catch (error: any) {
      logger.error(`Erro ao testar endpoint de lista de senadores: ${error.message}`);
    }

    // Testar o endpoint de perfil do senador
    try {
      const codigoSenador = 5000; // Exemplo de código de senador para teste
      const endpointConfig = endpoints.SENADORES.PERFIL;
      const endpointPerfil = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
      
      logger.info(`\nTestando o endpoint de perfil de senador com versão ${endpointConfig.PARAMS.v}...`);
      logger.info(`URL: ${endpoints.BASE_URL}${endpointPerfil}`);
      
      const responsePerfil = await api.get(endpointPerfil, endpointConfig.PARAMS);
      logger.info('Endpoint de perfil responde com sucesso!');
      
      if (responsePerfil?.DetalheParlamentar) {
        logger.info('Estrutura da resposta de perfil válida!');
        const nomeSenador = responsePerfil.DetalheParlamentar.Parlamentar?.IdentificacaoParlamentar?.NomeParlamentar || 'Não informado';
        logger.info(`Nome do senador: ${nomeSenador}`);
      } else {
        logger.warn('Estrutura da resposta de perfil inesperada');
        logger.debug('Primeiras chaves da resposta:', Object.keys(responsePerfil).slice(0, 5));
      }
    } catch (error: any) {
      logger.error(`Erro ao testar endpoint de perfil de senador: ${error.message}`);
      
      // Testar com uma versão alternativa
      try {
        const codigoSenador = 5000; // Mesmo código para teste
        const endpointConfig = endpoints.SENADORES.PERFIL;
        const endpointPerfil = api.replacePath(endpointConfig.PATH, { codigo: codigoSenador.toString() });
        const paramsAlternativos = { v: 4, format: 'json' }; // Testar com versão 4
        
        logger.info(`\nTentando novamente com a versão 4 da API...`);
        logger.info(`URL: ${endpoints.BASE_URL}${endpointPerfil}`);
        logger.info(`Parâmetros: ${JSON.stringify(paramsAlternativos)}`);
        
        const responsePerfilV2 = await api.get(endpointPerfil, paramsAlternativos);
        logger.info('Endpoint de perfil responde com sucesso usando a versão 4!');
        logger.info('Primeiras chaves da resposta:', Object.keys(responsePerfilV2).slice(0, 5));
      } catch (alternativeError: any) {
        logger.error(`Também falhou com a versão 4: ${alternativeError.message}`);
      }
    }
    
    logger.info('=== Teste de endpoints concluído ===');
    
    // Testar todos os endpoints relevantes com suas versões
    logger.info('\n=== Testando a compatibilidade de todos os endpoints ===');
    
    try {
      // Usar o código 5000 para todos os testes
      const codigoSenador = 5000;
      
      // 1. Dados básicos do senador
      logger.info('Testando dados básicos...');
      await testarEndpoint(
        'PERFIL',
        endpoints.SENADORES.PERFIL,
        { codigo: codigoSenador.toString() }
      );
      
      // 2. Mandatos
      logger.info('\nTestando mandatos...');
      await testarEndpoint(
        'MANDATOS',
        endpoints.SENADORES.MANDATOS,
        { codigo: codigoSenador.toString() }
      );
      
      // 3. Comissões
      logger.info('\nTestando comissões...');
      await testarEndpoint(
        'COMISSOES',
        endpoints.SENADORES.COMISSOES,
        { codigo: codigoSenador.toString() }
      );
      
      // 4. Filiações
      logger.info('\nTestando filiações...');
      await testarEndpoint(
        'FILIACOES',
        endpoints.SENADORES.FILIACOES,
        { codigo: codigoSenador.toString() }
      );
      
      // 5. Licenças
      logger.info('\nTestando licenças...');
      await testarEndpoint(
        'LICENCAS',
        endpoints.SENADORES.LICENCAS,
        { codigo: codigoSenador.toString() }
      );
    } catch (error: any) {
      logger.error(`Erro ao testar todos os endpoints: ${error.message}`);
    }
  } catch (error: any) {
    logger.error(`Erro geral no teste: ${error.message}`);
  }
}

// Executar o teste
testarEndpointsSenadores()
  .then(() => {
    logger.info('Script de teste concluído.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Falha no script de teste', error);
    process.exit(1);
  });
