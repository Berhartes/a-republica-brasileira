/**
 * Script para verificar os dados extraídos e transformados das lideranças
 */
import { liderancaExtractor } from './src/core/functions/senado_api_wrapper/scripts/extracao/liderancas';
import { liderancaTransformer } from './src/core/functions/senado_api_wrapper/scripts/transformacao/liderancas';

async function verificarLiderancas() {
  try {
    console.log('=== Verificando dados de lideranças ===');

    // 1. Extração
    console.log('1. Iniciando etapa de extração');
    const dadosExtraidos = await liderancaExtractor.extractAll();
    console.log('Extração concluída');

    // Verificar dados extraídos
    console.log('\n=== Dados extraídos ===');
    console.log(`Lideranças: ${JSON.stringify(dadosExtraidos.liderancas).substring(0, 200)}...`);
    console.log(`Tipos de liderança: ${JSON.stringify(dadosExtraidos.referencias.tiposLideranca).substring(0, 200)}...`);
    console.log(`Tipos de unidade: ${JSON.stringify(dadosExtraidos.referencias.tiposUnidade).substring(0, 200)}...`);
    console.log(`Tipos de cargo: ${JSON.stringify(dadosExtraidos.referencias.tiposCargo).substring(0, 200)}...`);

    // 2. Transformação
    console.log('\n2. Iniciando etapa de transformação');
    const dadosTransformados = liderancaTransformer.transformLiderancas(dadosExtraidos);
    console.log('Transformação concluída');

    // Verificar dados transformados
    console.log('\n=== Dados transformados ===');
    console.log(`Total de lideranças: ${dadosTransformados.liderancas.total}`);
    console.log(`Total de tipos de liderança: ${dadosTransformados.referencias.tiposLideranca.length}`);
    console.log(`Total de tipos de unidade: ${dadosTransformados.referencias.tiposUnidade.length}`);
    console.log(`Total de tipos de cargo: ${dadosTransformados.referencias.tiposCargo.length}`);

    // Mostrar detalhes das lideranças
    if (dadosTransformados.liderancas.itens.length > 0) {
      console.log('\n=== Detalhes das lideranças ===');
      dadosTransformados.liderancas.itens.forEach((lideranca, index) => {
        console.log(`\nLiderança ${index + 1}:`);
        console.log(`Código: ${lideranca.codigo}`);
        console.log(`Nome: ${lideranca.nome}`);
        console.log(`Tipo: ${lideranca.tipo.descricao} (${lideranca.tipo.codigo})`);
        if (lideranca.parlamentar) {
          console.log(`Parlamentar: ${lideranca.parlamentar.nome} (${lideranca.parlamentar.codigo})`);
        }
      });
    } else {
      console.log('\nNenhuma liderança encontrada!');
    }

    // Mostrar detalhes dos tipos de liderança
    if (dadosTransformados.referencias.tiposLideranca.length > 0) {
      console.log('\n=== Detalhes dos tipos de liderança ===');
      dadosTransformados.referencias.tiposLideranca.forEach((tipo, index) => {
        console.log(`Tipo ${index + 1}: ${tipo.descricao} (${tipo.codigo})`);
      });
    } else {
      console.log('\nNenhum tipo de liderança encontrado!');
    }

    // Mostrar detalhes dos tipos de unidade
    if (dadosTransformados.referencias.tiposUnidade.length > 0) {
      console.log('\n=== Detalhes dos tipos de unidade ===');
      dadosTransformados.referencias.tiposUnidade.forEach((tipo, index) => {
        console.log(`Tipo ${index + 1}: ${tipo.descricao} (${tipo.codigo})`);
      });
    } else {
      console.log('\nNenhum tipo de unidade encontrado!');
    }

    // Mostrar detalhes dos tipos de cargo
    if (dadosTransformados.referencias.tiposCargo.length > 0) {
      console.log('\n=== Detalhes dos tipos de cargo ===');
      console.log(`Total de tipos de cargo: ${dadosTransformados.referencias.tiposCargo.length}`);
      // Mostrar apenas os primeiros 5 para não sobrecarregar o console
      dadosTransformados.referencias.tiposCargo.slice(0, 5).forEach((tipo, index) => {
        console.log(`Tipo ${index + 1}: ${tipo.descricao} (${tipo.codigo})`);
      });
      console.log(`... e mais ${dadosTransformados.referencias.tiposCargo.length - 5} tipos de cargo`);
    } else {
      console.log('\nNenhum tipo de cargo encontrado!');
    }

    console.log('\n=== Verificação concluída ===');
  } catch (error) {
    console.error('Erro ao verificar dados de lideranças:', error);
  }
}

// Executar a verificação
verificarLiderancas();
