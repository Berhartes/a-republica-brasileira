import { DeputadosLegislaturaResult, PerfilCompletoResult } from '../extracao/perfildeputados';
export interface DeputadoBasicoTransformado {
    codigo: string;
    nome: string;
    nomeCompleto: string;
    genero: string;
    partido: {
        sigla: string;
        nome: string | null;
    };
    uf: string;
    foto: string;
    email: string;
    situacao: {
        emExercicio: boolean;
        afastado: boolean;
    };
    legislaturaAtual?: {
        codigo: string;
        legislatura: string;
    } | null;
    atualizadoEm: string;
}
export interface DeputadoCompletoTransformado extends DeputadoBasicoTransformado {
    erro?: string;
    dadosPessoais: {
        nomeCivil: string;
        cpf: string;
        sexo: string;
        dataNascimento: string | null;
        dataFalecimento: string | null;
        naturalidade: string;
        ufNaturalidade: string;
        escolaridade: string;
        urlWebsite: string;
        redeSocial: string;
    };
    ultimoStatus: {
        id: string;
        nome: string;
        nomeEleitoral: string;
        siglaPartido: string;
        uriPartido: string;
        siglaUf: string;
        idLegislatura: string;
        situacao: string;
        condicaoEleitoral: string;
        descricaoStatus: string;
        data: string;
    };
    gabinete: {
        nome: string;
        predio: string;
        sala: string;
        andar: string;
        telefone: string;
        email: string;
    };
    orgaos?: Array<{
        codigo: string;
        uri: string;
        sigla: string;
        nome: string;
        nomePublicacao: string;
        cargo: string;
        codTitulo: string;
        dataInicio?: string;
        dataFim?: string | null;
        atual: boolean;
    }>;
    frentes?: Array<{
        codigo: string;
        uri: string;
        titulo: string;
        idLegislatura: string;
    }>;
    ocupacoes?: Array<{
        titulo: string;
        entidade: string;
        entidadeUF: string;
        entidadePais: string;
        anoInicio: string;
        anoFim: string;
    }>;
    mandatosExternos?: Array<{
        cargo: string;
        siglaUf: string;
        municipio: string;
        anoInicio: string;
        anoFim: string;
        siglaPartidoEleicao: string;
        uriPartidoEleicao?: string;
    }>;
    historico?: Array<{
        id: string;
        uri: string;
        nome: string;
        nomeEleitoral: string;
        siglaPartido: string;
        uriPartido: string;
        siglaUf: string;
        idLegislatura: string;
        email: string;
        urlFoto: string;
        dataHora: string;
        situacao: string;
        condicaoEleitoral: string;
        descricaoStatus: string;
    }>;
    profissoes?: Array<{
        titulo: string;
        codTipoProfissao: string;
        dataHora: string;
    }>;
    situacaoAtual: {
        emExercicio: boolean;
        afastado: boolean;
        motivoAfastamento?: string | null;
        legislaturaAtual?: {
            codigo: string;
            legislatura: string;
        } | null;
    };
    metadados: {
        atualizadoEm: string;
        fontes: {
            [key: string]: string;
        };
        statusDados?: string;
    };
}
export interface ResultadoTransformacaoLista {
    timestamp: string;
    deputados: DeputadoBasicoTransformado[];
    legislatura: number;
}
/**
 * Classe para transformação de dados de perfis de deputados
 */
export declare class PerfilDeputadosTransformer {
    /**
     * Transforma os dados brutos de deputados de uma legislatura específica
     * @param extractionResult - Resultado da extração
     * @param legislaturaNumero - Número da legislatura (opcional)
     */
    transformDeputadosLegislatura(extractionResult: DeputadosLegislaturaResult, legislaturaNumero?: number): ResultadoTransformacaoLista;
    /**
     * Transforma dados básicos de um deputado
     * @param deputado - Dados básicos do deputado
     */
    transformDeputadoBasico(deputado: any): DeputadoBasicoTransformado | null;
    /**
     * Transforma o perfil completo de um deputado
     * @param perfilCompleto - Perfil completo extraído
     */
    transformPerfilCompleto(perfilCompleto: PerfilCompletoResult): DeputadoCompletoTransformado | null;
}
