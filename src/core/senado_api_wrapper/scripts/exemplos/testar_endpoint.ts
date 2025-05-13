/**
 * Script para testar a conexão com a API do Senado
 * Testa especificamente o endpoint de lista de senadores por legislatura
 */
import { logger } from '../utils/logger';
import * as api from '../utils/api';
import { endpoints } from '../config/endpoints';
import axios from 'axios';

async function testarEndpointSenadores() {
  try {
    logger.info('=== Testando endpoint de senadores por legislatura ===');
    
    // Testando a legislatura 54
    const legislatura = 54;
    logger.info(`Testando com legislatura ${legislatura}`);
    
    // Montar o endpoint
    const endpoint = api.replacePath(endpoints.SENADORES.LISTA_LEGISLATURA.PATH, { 
      legislatura: legislatura.toString() 
    });
    
    logger.info(`Endpoint montado: ${endpoint}`);
    logger.info(`URL completa: ${endpoints.BASE_URL}${endpoint}`);
    
    // Detalhes da configuração
    logger.info('Configuração da requisição:');
    logger.info(`- URL: ${endpoints.BASE_URL}${endpoint}`);
    logger.info(`- Parâmetros: ${JSON.stringify(endpoints.SENADORES.LISTA_LEGISLATURA.PARAMS)}`);
    logger.info(`- Headers: ${'Accept: application/json'}`);
    
    // Fazer a requisição
    logger.info('Fazendo a requisição...');
    try {
      const response = await api.get(endpoint, endpoints.SENADORES.LISTA_LEGISLATURA.PARAMS);
      
      // Verificar a resposta
      if (response) {
        logger.info('Requisição bem-sucedida!');
        
        // Verificar a estrutura da resposta
        const temLista = response.ListaParlamentarLegislatura && 
                        response.ListaParlamentarLegislatura.Parlamentares;
        
        if (temLista) {
          const parlamentares = response.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
          const qtdSenadores = Array.isArray(parlamentares) ? parlamentares.length : 1;
          
          logger.info(`Foram encontrados ${qtdSenadores} senadores na legislatura ${legislatura}`);
          
          // Mostrar o primeiro senador como exemplo
          if (qtdSenadores > 0) {
            const primeiroSenador = Array.isArray(parlamentares) ? parlamentares[0] : parlamentares;
            const identificacao = primeiroSenador.IdentificacaoParlamentar;
            
            logger.info('Exemplo do primeiro senador:');
            logger.info(`  - Nome: ${identificacao.NomeParlamentar}`);
            logger.info(`  - Nome completo: ${identificacao.NomeCompletoParlamentar}`);
            logger.info(`  - Código: ${identificacao.CodigoParlamentar}`);
            logger.info(`  - Partido: ${identificacao.SiglaPartidoParlamentar || 'Não informado'}`);
            logger.info(`  - UF: ${identificacao.UfParlamentar || primeiroSenador.Mandatos?.Mandato[0]?.UfParlamentar || 'Não informado'}`);
          }
        } else {
          logger.warn('A resposta não contém a estrutura esperada para lista de parlamentares');
          logger.debug('Estrutura da resposta:', response);
        }
      } else {
        logger.warn('A resposta está vazia');
      }
    } catch (error: any) {
      logger.error(`Erro ao fazer requisição com a API interna: ${error.message}`);
      
      if (error.response) {
        logger.error(`Status: ${error.response.status} - ${error.response.statusText}`);
        logger.debug('Resposta de erro:', error.response.data);
      }
      
      // Tentar fazer uma requisição diretamente com axios para diagnóstico
      logger.info('Tentando requisição direta com axios para diagnóstico...');
      
      try {
        const url = `${endpoints.BASE_URL}${endpoint}`;
        const params = endpoints.SENADORES.LISTA_LEGISLATURA.PARAMS;
        
        logger.info(`URL: ${url}`);
        logger.info(`Parâmetros: ${JSON.stringify(params)}`);
        
        const axiosResponse = await axios.get(url, {
          params,
          headers: {
            'Accept': 'application/json'
          }
        });
        
        logger.info(`Requisição axios bem-sucedida: ${axiosResponse.status}`);
        logger.info(`Dados recebidos: ${axiosResponse.data ? 'Sim' : 'Não'}`);
      } catch (axiosError: any) {
        logger.error(`Erro na requisição axios: ${axiosError.message}`);
        if (axiosError.response) {
          logger.error(`Status: ${axiosError.response.status} - ${axiosError.response.statusText}`);
        }
      }
    }
    
    logger.info('=== Teste do endpoint concluído ===');
  } catch (error: any) {
    logger.error(`Erro geral no teste: ${error.message}`);
    if (error.stack) {
      logger.debug(`Stack: ${error.stack}`);
    }
  }
}

// Executar o teste
testarEndpointSenadores()
  .then(() => {
    logger.info('Teste concluído.');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Falha no teste', error);
    process.exit(1);
  });
