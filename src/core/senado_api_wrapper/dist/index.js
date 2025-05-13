// src/index.ts
import { HttpClient } from "./common/httpClient";
import { senadoApiConfig } from "./config";
import { ComissaoModule } from "./modules/comissao";
import { ComposicaoModule } from "./modules/composicao";
import { ParlamentarModule } from "./modules/parlamentar";
import { PlenarioModule } from "./modules/plenario";
import { VotacaoModule } from "./modules/votacao";
/**
 * Ponto de entrada principal para o wrapper da API de Dados Abertos do Senado.
 */
export class SenadoApiWrapper {
    constructor(config) {
        const baseConfig = {
            baseURL: senadoApiConfig.baseURL,
            timeout: senadoApiConfig.timeout,
            ...(config?.httpClientConfig || {}),
        };
        this.httpClient = new HttpClient(baseConfig);
        // Inicializa os módulos passando a instância do httpClient
        this.comissao = new ComissaoModule(this.httpClient);
        this.composicao = new ComposicaoModule(this.httpClient);
        this.parlamentar = new ParlamentarModule(this.httpClient);
        this.plenario = new PlenarioModule(this.httpClient);
        this.votacao = new VotacaoModule(this.httpClient);
    }
    /**
     * Permite obter a instância do HttpClient para configurações avançadas ou chamadas diretas (uso com cautela).
     */
    getHttpClient() {
        return this.httpClient;
    }
}
// Exportar tipos principais para facilitar o uso do wrapper
export * from "./common/types";
export * from "./common/errors";
export * from "./modules/comissao";
export * from "./modules/composicao";
export * from "./modules/parlamentar";
export * from "./modules/plenario";
export * from "./modules/votacao";
// Exemplo de como o usuário poderia instanciar e usar:
// import { SenadoApiWrapper } from 'senado-api-wrapper'; // Supondo que seja publicado como pacote
// const senadoApi = new SenadoApiWrapper();
// async function fetchData() {
//   try {
//     const comissoes = await senadoApi.comissao.listarComissoes({ tipo: 'permanente' });
//     console.log(comissoes);
//   } catch (error) {
//     console.error('Erro ao buscar comissões:', error);
//   }
// }
// fetchData();
//# sourceMappingURL=index.js.map