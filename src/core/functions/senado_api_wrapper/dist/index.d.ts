import { HttpClient, HttpClientConfig } from "./common/httpClient";
import { ComissaoModule } from "./modules/comissao";
import { ComposicaoModule } from "./modules/composicao";
import { ParlamentarModule } from "./modules/parlamentar";
import { PlenarioModule } from "./modules/plenario";
import { VotacaoModule } from "./modules/votacao";
/**
 * Configurações para o SenadoApiWrapper.
 */
export interface SenadoApiWrapperConfig {
    httpClientConfig?: Partial<HttpClientConfig>;
}
/**
 * Ponto de entrada principal para o wrapper da API de Dados Abertos do Senado.
 */
export declare class SenadoApiWrapper {
    private httpClient;
    comissao: ComissaoModule;
    composicao: ComposicaoModule;
    parlamentar: ParlamentarModule;
    plenario: PlenarioModule;
    votacao: VotacaoModule;
    constructor(config?: SenadoApiWrapperConfig);
    /**
     * Permite obter a instância do HttpClient para configurações avançadas ou chamadas diretas (uso com cautela).
     */
    getHttpClient(): HttpClient;
}
export * from "./common/types";
export * from "./common/errors";
export * from "./modules/comissao";
export * from "./modules/composicao";
export * from "./modules/parlamentar";
export * from "./modules/plenario";
export * from "./modules/votacao";
