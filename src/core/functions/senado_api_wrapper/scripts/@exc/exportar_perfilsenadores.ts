/**
 * Script de exemplo para exportar perfis de senadores para arquivos JSON
 * 
 * Este script permite exportar os perfis sem precisar realizar o processo
 * completo de ETL, ideal para análise e debugging.
 */
import { logger } from '../utils/logger';
import { handleError } from '../utils/error_handler';
import { perfilSenadoresExtractor } from '../extracao/perfilsenadores';
import { perfilSenadoresTransformer } from '../transformacao/perfilsenadores';
import { perfilSenadoresExporter } from '../exportacao/perfilsenadores';
import { obterNumeroLegislaturaAtual } from '../utils/legislatura';

/**
 * Exporta perfis de senadores de uma legislatura específica
 * @param legislaturaNumero - Número da legislatura (opcional)
 */
async function exportarPerfisSenadores(legislaturaNumero?: number): Promise<void> {
  try {
    logger.info('=== Iniciando exportação de perfis de senadores ===');
    
    // 1. Determinar legislatura
    let legislatura: number;
    
    if (legislaturaNumero) {
      legislatura = legislaturaNumero;
      logger.info(`Usando legislatura especificada: ${legislatura}`);
    } else {
      const legislaturaAtual = await obterNumeroLegislaturaAtual();
      if (!legislaturaAtual) {
        throw new Error('Não foi possível obter a legislatura atual');
      }
      legislatura = legislaturaAtual;
      logger.info(`Usando legislatura atual: ${legislatura}`);
    }
    
    // 2. Extrair lista de senadores
    logger.info('Extraindo lista de senadores');
    const senadoresExtraidos = await perfilSenadoresExtractor.extractSenadoresLegislatura(legislatura);
    
    if (senadoresExtraidos.senadores.length === 0) {
      logger.warn(`Nenhum senador encontrado para a legislatura ${legislatura}`);
      return;
    }
    
    logger.info(`Encontrados ${senadoresExtraidos.senadores.length} senadores`);
    
    // 3. Transformar lista básica
    logger.info('Transformando lista básica de senadores');
    const senadoresTransformados = perfilSenadoresTransformer.transformSenadoresLegislatura(
      senadoresExtraidos,
      legislatura
    );
    
    // 4. Exportar lista básica
    logger.info('Exportando lista básica de senadores');
    await perfilSenadoresExporter.exportSenadoresLegislatura(
      senadoresTransformados,
      legislatura
    );
    
    // 5. Determinar quantos senadores processar
    const args = process.argv.slice(2);
    let limiteSenadores = senadoresTransformados.senadores.length;
    
    // Verificar se o usuário especificou um limite
    if (args.length > 1) {
      const limiteArg = parseInt(args[1], 10);
      if (!isNaN(limiteArg) && limiteArg > 0) {
        limiteSenadores = Math.min(limiteArg, limiteSenadores);
        logger.info(`Limitando a ${limiteSenadores} senadores conforme solicitado`);
      }
    }
    
    // 6. Extrair perfis completos (apenas para o limite especificado)
    const codigosSenadores = senadoresTransformados.senadores
      .slice(0, limiteSenadores)
      .map(s => s.codigo);
    
    logger.info(`Extraindo perfis completos de ${codigosSenadores.length} senadores`);
    
    const perfisExtraidos = await perfilSenadoresExtractor.extractMultiplosPerfis(
      codigosSenadores,
      1, // Baixa concorrência para não sobrecarregar a API
      3
    );
    
    logger.info(`Extração de perfis concluída: ${perfisExtraidos.length} perfis obtidos`);
    
    // 7. Transformar perfis
    logger.info('Transformando perfis completos');
    const perfisTransformados = perfisExtraidos
      .map(perfil => perfilSenadoresTransformer.transformPerfilCompleto(perfil))
      .filter((perfil): perfil is NonNullable<typeof perfil> => perfil !== null);
    
    logger.info(`Transformação concluída: ${perfisTransformados.length} perfis transformados`);
    
    // 8. Exportar perfis completos
    logger.info('Exportando perfis completos');
    await perfilSenadoresExporter.exportPerfisSenadores(
      perfisTransformados,
      legislatura
    );
    
    logger.info('=== Exportação de perfis de senadores concluída com sucesso ===');
    logger.info('Os arquivos foram salvos na pasta "exports" na raiz do projeto.');
    
  } catch (error: any) {
    handleError(error, 'exportarPerfisSenadores');
  }
}

/**
 * Função principal que processa argumentos da linha de comando
 */
function processarArgumentos(): void {
  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  
  if (args.length > 0) {
    const legislaturaArg = parseInt(args[0], 10);
    if (!isNaN(legislaturaArg) && legislaturaArg > 0) {
      legislatura = legislaturaArg;
    } else {
      logger.error(`Legislatura inválida: ${args[0]}. Deve ser um número positivo.`);
      process.exit(1);
    }
  }
  
  exportarPerfisSenadores(legislatura)
    .then(() => {
      logger.info('Exportação concluída com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Falha ao exportar perfis de senadores', error);
      process.exit(1);
    });
}

// Executa o processamento quando chamado diretamente
if (require.main === module) {
  processarArgumentos();
}

export { exportarPerfisSenadores };
