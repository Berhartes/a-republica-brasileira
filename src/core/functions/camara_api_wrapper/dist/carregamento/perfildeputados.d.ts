import { DeputadoCompletoTransformado } from '../transformacao/perfildeputados';
export interface ResultadoCarregamento {
    timestamp: string;
    codigo: string;
    sucesso: boolean;
    mensagem: string;
    detalhes?: {
        perfilSalvo: boolean;
        dadosPessoaisSalvos: boolean;
        ultimoStatusSalvo: boolean;
        gabineteSalvo: boolean;
        orgaosSalvos: boolean;
        frentesSalvas: boolean;
        ocupacoesSalvas: boolean;
        mandatosExternosSalvos: boolean;
        historicoSalvo: boolean;
        profissoesSalvas: boolean;
    };
}
/**
 * Classe para carregamento de perfis de deputados no Firestore
 */
export declare class PerfilDeputadosLoader {
    /**
     * Salva a lista de deputados de uma legislatura específica no Firestore
     * Na pasta de legislaturas salvamos apenas dados básicos do endpoint de detalhes
     * @param transformedData - Dados transformados dos deputados
     * @param legislaturaNumero - Número da legislatura
     * @returns Resultado do carregamento
     */
    salvarDeputadosLegislatura(transformedData: {
        deputados: DeputadoCompletoTransformado[];
        legislatura: number;
    }, legislaturaNumero: number): Promise<{
        sucessos: number;
        falhas: number;
    }>;
    /**
     * Carrega um perfil completo de deputado no Firestore
     * @param deputado - Perfil completo transformado
     * @returns Resultado do carregamento
     */
    carregarPerfilCompleto(deputado: DeputadoCompletoTransformado): Promise<ResultadoCarregamento>;
    /**
     * Carrega múltiplos perfis de deputados no Firestore
     * @param deputados - Lista de perfis completos transformados
     * @returns Lista de resultados de carregamento
     */
    carregarMultiplosPerfis(deputados: DeputadoCompletoTransformado[]): Promise<ResultadoCarregamento[]>;
    /**
     * Salva múltiplos perfis de deputados no Firestore
     * @param perfis - Lista de perfis completos transformados
     * @param legislaturaNumero - Número da legislatura (opcional)
     * @returns Resultado do carregamento
     */
    saveMultiplosPerfis(perfis: DeputadoCompletoTransformado[], legislaturaNumero?: number): Promise<{
        sucessos: number;
        falhas: number;
    }>;
    /**
     * Carrega múltiplos perfis de deputados em lotes usando batches
     * @param deputados - Lista de perfis completos transformados
     * @param batchSize - Tamanho do lote para cada batch (máximo 500)
     * @returns Lista de resultados de carregamento
     */
    carregarMultiplosPerfisEmLotes(deputados: DeputadoCompletoTransformado[], batchSize?: number): Promise<ResultadoCarregamento[]>;
    /**
     * Adiciona operações de um deputado ao batch
     * @param batch - Batch do Firestore
     * @param deputado - Perfil completo do deputado
     */
    private adicionarOperacoesBatch;
    private getPerfilRef;
    private getDadosPessoaisRef;
    private getUltimoStatusRef;
    private getGabineteRef;
    private getOrgaosRef;
    private getFrentesRef;
    private getOcupacoesRef;
    private getMandatosExternosRef;
    private getHistoricoRef;
    private getProfissoesRef;
    /**
     * Obtém referência para um deputado em uma legislatura específica
     * @param codigo - Código do deputado
     * @param legislatura - Número da legislatura
     * @returns Referência do documento no Firestore
     */
    private getDeputadoLegislaturaRef;
}
