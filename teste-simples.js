// teste-simples.js - Script mínimo para testar o wrapper
import { SenadoApiWrapper } from './src/core/functions/senado_api_wrapper/home/ubuntu/senado_api_wrapper/dist/index.js';

// Instanciar o wrapper
console.log("Criando instância do wrapper...");
const wrapper = new SenadoApiWrapper();

// Função de teste simples
async function testarAPI() {
  try {
    console.log("Buscando lista de senadores em exercício...");
    const senadores = await wrapper.parlamentar.listarParlamentares({ emExercicio: true });
    console.log(`Sucesso! Encontrados ${senadores.length} senadores em exercício.`);
    console.log("O wrapper está funcionando corretamente!");
  } catch (error) {
    console.error("ERRO:", error);
  }
}

// Executar o teste
testarAPI();
