{
    "title": "Prazo",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id do prazo",
            "format": "int64",
            "examples": [
                7454940
            ]
        },
        "idProcesso": {
            "type": "integer",
            "description": "Id do processo",
            "format": "int64",
            "examples": [
                1158177
            ]
        },
        "idTipoPrazo": {
            "type": "integer",
            "description": "Id do tipo de prazo regulado",
            "format": "int64",
            "examples": [
                41969853
            ]
        },
        "tipoPrazo": {
            "type": "string",
            "description": "Tipo de prazo regulado",
            "examples": [
                "Apresentação de Emendas a PDS de radiodifusão"
            ]
        },
        "fundamentoLegal": {
            "type": "string",
            "description": "Fundamento legal",
            "examples": [
                "Art. 122, II, \"b\", combinado com o art. 375, I, do RISF; e art. 64, § 1º da CF (antes da criação da CCT)"
            ]
        },
        "codigoColegiado": {
            "type": "integer",
            "description": "Código do colegiado",
            "format": "int64",
            "examples": [
                47
            ]
        },
        "siglaColegiado": {
            "type": "string",
            "description": "Sigla do colegiado",
            "examples": [
                "CE"
            ]
        },
        "nomeColegiado": {
            "type": "string",
            "description": "Nome do colegiado",
            "examples": [
                "Comissão de Educação e Cultura"
            ]
        },
        "casa": {
            "type": "string",
            "description": "Casa do colegiado",
            "examples": [
                "SF"
            ]
        },
        "siglaTipoFase": {
            "type": "string",
            "description": "Sigla do tipo de fase",
            "examples": [
                "E"
            ]
        },
        "descricaoTipoFase": {
            "type": "string",
            "description": "Descrição do tipo de fase",
            "examples": [
                "Encerrado"
            ]
        },
        "prorrogado": {
            "type": "string",
            "description": "Indica se o prazo foi prorrogado",
            "examples": [
                "Não"
            ]
        },
        "inicioPrazo": {
            "type": "string",
            "description": "Data de início do prazo",
            "examples": [
                "2004-02-17"
            ]
        },
        "fimPrazo": {
            "type": "string",
            "description": "Data de fim do prazo",
            "examples": [
                "2004-02-20"
            ]
        }
    },
    "description": "Prazo estabelecido para um processo legislativo",
    "xml": {
        "name": "prazo"
    },
    "x-apidog-orders": [
        "id",
        "idProcesso",
        "idTipoPrazo",
        "tipoPrazo",
        "fundamentoLegal",
        "codigoColegiado",
        "siglaColegiado",
        "nomeColegiado",
        "casa",
        "siglaTipoFase",
        "descricaoTipoFase",
        "prorrogado",
        "inicioPrazo",
        "fimPrazo"
    ]
}