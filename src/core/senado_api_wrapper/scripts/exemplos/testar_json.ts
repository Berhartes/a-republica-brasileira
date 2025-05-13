/**
 * Script para testar o parse de dados JSON de exemplo das comissões
 */
import { logger } from '../utils/logger';
import { comissoesTransformer } from '../transformacao/comissoes';
import * as fs from 'fs';
import * as path from 'path';

async function testarTransformacaoComissoes() {
  try {
    logger.info('== Testando transformação de comissões com dados de exemplo ==');
    
    // Colegiados do Senado (ListaColegiados.json)
    const colegiadosJson = fs.readFileSync(
      path.join(__dirname, './dados/ListaColegiados.json'),
      'utf8'
    );
    
    // Comissões Mistas (ComissoesMistasCongresso.json)
    const comissoesMistasJson = fs.readFileSync(
      path.join(__dirname, './dados/ComissoesMistasCongresso.json'),
      'utf8'
    );
    
    // Detalhes da Comissão 449 (CCAI)
    const comissao449Json = fs.readFileSync(
      path.join(__dirname, './dados/449.json'),
      'utf8'
    );
    
    // Criar dados de teste
    const dadosTest = {
      timestamp: new Date().toISOString(),
      lista: {
        timestamp: new Date().toISOString(),
        total: 0,
        comissoes: {
          senado: JSON.parse(colegiadosJson).ListaColegiados.Colegiados.Colegiado || [],
          mistas: JSON.parse(comissoesMistasJson).ComissoesMistasCongresso.Colegiados.Colegiado || []
        }
      },
      detalhes: [
        {
          timestamp: new Date().toISOString(),
          codigo: '449',
          detalhes: JSON.parse(comissao449Json).ComissoesCongressoNacional.Colegiados.Colegiado[0]
        }
      ],
      composicoes: [
        {
          timestamp: new Date().toISOString(),
          codigo: '449',
          composicao: JSON.parse(comissao449Json).ComissoesCongressoNacional.Colegiados.Colegiado[0]
        }
      ],
      tipos: JSON.parse(colegiadosJson)
    };
    
    dadosTest.lista.total = 
      dadosTest.lista.comissoes.senado.length + 
      dadosTest.lista.comissoes.mistas.length;
    
    // Transformar os dados
    logger.info('Iniciando transformação dos dados de teste');
    const resultado = comissoesTransformer.transformComissoes(dadosTest);
    
    logger.info(`Transformação concluída: ${resultado.total} comissões no total`);
    
    // Exibir resultados
    logger.info('Comissões do Senado por tipo:');
    Object.entries(resultado.comissoes.senado).forEach(([tipo, comissoes]) => {
      logger.info(`- ${tipo}: ${comissoes.length} comissões`);
    });
    
    logger.info('Comissões do Congresso por tipo:');
    Object.entries(resultado.comissoes.congresso).forEach(([tipo, comissoes]) => {
      logger.info(`- ${tipo}: ${comissoes.length} comissões`);
    });
    
    // Exemplo de índices
    logger.info(`Índices: ${Object.keys(resultado.indices.porCodigo).length} por código, ${Object.keys(resultado.indices.porParlamentar).length} por parlamentar`);
    
    logger.info('Teste concluído com sucesso');
    
    // Salvar resultado para análise
    fs.writeFileSync(
      path.join(__dirname, './saida/resultado_transformacao.json'),
      JSON.stringify(resultado, null, 2)
    );
    logger.info('Resultado salvo em ./saida/resultado_transformacao.json');
  } catch (error) {
    logger.error('Erro ao testar transformação:', error);
    console.error(error);
  }
}

// Executar o teste
if (require.main === module) {
  testarTransformacaoComissoes();
}
