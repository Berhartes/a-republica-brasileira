/**
 * Script para testar a obtenção da legislatura atual
 */
import { obterLegislaturaAtual, obterNumeroLegislaturaAtual } from './utils/legislatura';
import { logger } from './utils/logger';

async function testarLegislatura() {
  try {
    // Obter a legislatura completa
    logger.info('Obtendo legislatura atual (objeto completo)');
    const legislatura = await obterLegislaturaAtual();
    
    if (legislatura) {
      logger.info(`Legislatura: ${legislatura.NumeroLegislatura}`);
      logger.info(`Período: ${legislatura.DataInicio} a ${legislatura.DataFim}`);
      
      // Exibir sessões legislativas
      if (legislatura.SessoesLegislativas) {
        const sessoes = Array.isArray(legislatura.SessoesLegislativas.SessaoLegislativa) 
          ? legislatura.SessoesLegislativas.SessaoLegislativa 
          : [legislatura.SessoesLegislativas.SessaoLegislativa];
        
        logger.info(`Total de sessões legislativas: ${sessoes.length}`);
        
        sessoes.forEach(sessao => {
          logger.info(`- Sessão ${sessao.NumeroSessaoLegislativa} (${sessao.TipoSessaoLegislativa}): ${sessao.DataInicio} a ${sessao.DataFim}`);
        });
      }
    } else {
      logger.warn('Nenhuma legislatura encontrada');
    }
    
    // Obter apenas o número da legislatura
    logger.info('\nObtendo apenas o número da legislatura atual');
    const numeroLegislatura = await obterNumeroLegislaturaAtual();
    
    if (numeroLegislatura) {
      logger.info(`Número da legislatura atual: ${numeroLegislatura}`);
    } else {
      logger.warn('Não foi possível obter o número da legislatura atual');
    }
    
  } catch (error) {
    logger.error('Erro ao testar legislatura', error);
  }
}

// Executar o teste
testarLegislatura();
