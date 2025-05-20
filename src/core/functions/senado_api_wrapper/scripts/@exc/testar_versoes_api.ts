/**
 * Script para testar diferentes versões da API do Senado
 * Este script tenta acessar o endpoint com várias configurações para
 * determinar a combinação correta de parâmetros.
 */
import { logger } from '../utils/logger';
import axios from 'axios';
import { endpoints } from '../config/endpoints';

// Versões da API para testar
const VERSOES_API = ['1', '2', '3', '4', '5'];

// Parâmetros para testar
const CONFIGURACOES = [
  { params: {}, desc: 'Sem parâmetros' },
  { params: { format: 'json' }, desc: 'Formato JSON' },
  { params: { v: 1 }, desc: 'Versão 1' },
  { params: { v: 2 }, desc: 'Versão 2' },
  { params: { v: 3 }, desc: 'Versão 3' },
  { params: { v: 4 }, desc: 'Versão 4' },
  { params: { v: 5 }, desc: 'Versão 5' },
  { params: { v: 1, format: 'json' }, desc: 'Versão 1 + JSON' },
  { params: { v: 2, format: 'json' }, desc: 'Versão 2 + JSON' },
  { params: { v: 3, format: 'json' }, desc: 'Versão 3 + JSON' },
  { params: { v: 4, format: 'json' }, desc: 'Versão 4 + JSON' },
  { params: { v: 5, format: 'json' }, desc: 'Versão 5 + JSON' },
];

/**
 * Função para testar diversas combinações de parâmetros
 */
async function testarVersoesDaAPI() {
  logger.info('=== Testando diferentes configurações da API do Senado ===');
  
  // Substituir o ID da legislatura
  const legislatura = 54;
  const baseUrl = endpoints.BASE_URL;
  
  // Testar sem extensão
  const endpoint = `/senador/lista/legislatura/${legislatura}`;
  
  logger.info(`Testando endpoint: ${baseUrl}${endpoint}`);
  logger.info('');
  
  for (const config of CONFIGURACOES) {
    logger.info(`Testando: ${config.desc}`);
    try {
      // Criar a URL para exibição
      const queryParams = new URLSearchParams(config.params as Record<string, string>).toString();
      const urlCompleta = `${baseUrl}${endpoint}${queryParams ? '?' + queryParams : ''}`;
      logger.info(`URL: ${urlCompleta}`);
      
      // Fazer a requisição
      const response = await axios.get(urlCompleta, {
        headers: { 'Accept': 'application/json' },
        timeout: 10000
      });
      
      if (response.status === 200) {
        logger.info(`✅ SUCESSO (${response.status}): ${config.desc}`);
        
        // Verificar se a resposta contém a estrutura esperada
        const temLista = response.data.ListaParlamentarLegislatura && 
                        response.data.ListaParlamentarLegislatura.Parlamentares;
        
        if (temLista) {
          const parlamentares = response.data.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
          const qtdSenadores = Array.isArray(parlamentares) ? parlamentares.length : 1;
          
          logger.info(`   Encontrados ${qtdSenadores} senadores`);
          
          // Mostrar um exemplo se tiver
          if (qtdSenadores > 0) {
            const primeiroSenador = Array.isArray(parlamentares) ? parlamentares[0] : parlamentares;
            const identificacao = primeiroSenador.IdentificacaoParlamentar;
            
            logger.info(`   Primeiro senador: ${identificacao.NomeParlamentar}`);
          }
        } else {
          logger.info('   ⚠️ Resposta não contém a estrutura esperada para lista de parlamentares');
        }
      } else {
        logger.warn(`❌ FALHA (${response.status}): ${config.desc}`);
      }
    } catch (error: any) {
      const status = error.response?.status || 'Erro de conexão';
      const message = error.response?.statusText || error.message;
      
      logger.error(`❌ ERRO (${status}): ${config.desc} - ${message}`);
      
      // Se for 400, tentar verificar a resposta de erro
      if (error.response && error.response.status === 400) {
        logger.debug('Detalhes do erro:', error.response.data);
      }
    }
    
    // Aguardar um pouco entre as requisições para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
    logger.info('');
  }
  
  // Testar com extensão JSON
  logger.info('');
  logger.info('Testando endpoint com extensão .json:');
  
  const endpointJson = `/senador/lista/legislatura/${legislatura}.json`;
  logger.info(`Endpoint: ${baseUrl}${endpointJson}`);
  
  try {
    const response = await axios.get(`${baseUrl}${endpointJson}`, {
      headers: { 'Accept': 'application/json' },
      timeout: 10000
    });
    
    if (response.status === 200) {
      logger.info(`✅ SUCESSO (${response.status}): Endpoint com extensão .json`);
      
      // Verificar a estrutura
      const temLista = response.data.ListaParlamentarLegislatura && 
                      response.data.ListaParlamentarLegislatura.Parlamentares;
      
      if (temLista) {
        const parlamentares = response.data.ListaParlamentarLegislatura.Parlamentares.Parlamentar || [];
        const qtdSenadores = Array.isArray(parlamentares) ? parlamentares.length : 1;
        
        logger.info(`   Encontrados ${qtdSenadores} senadores`);
      } else {
        logger.info('   ⚠️ Resposta não contém a estrutura esperada');
      }
    }
  } catch (error: any) {
    const status = error.response?.status || 'Erro de conexão';
    const message = error.response?.statusText || error.message;
    
    logger.error(`❌ ERRO (${status}): Endpoint com extensão .json - ${message}`);
  }
  
  logger.info('');
  logger.info('=== Teste concluído ===');
}

// Executar o teste
testarVersoesDaAPI()
  .then(() => {
    logger.info('Script concluído com sucesso');
    process.exit(0);
  })
  .catch(error => {
    logger.error('Erro na execução do script', error);
    process.exit(1);
  });
