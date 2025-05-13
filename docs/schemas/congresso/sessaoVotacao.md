{
    "title": "SessaoVotacao",
    "type": "object",
    "properties": {
        "codigoSessao": {
            "type": "integer",
            "description": "Código da sessão",
            "format": "int64",
            "examples": [
                105398
            ]
        },
        "casaSessao": {
            "type": "string",
            "description": "Casa da sessão",
            "examples": [
                "SF"
            ]
        },
        "codigoSessaoLegislativa": {
            "type": "integer",
            "description": "Código da sessão legislativa",
            "format": "int64",
            "examples": [
                858
            ]
        },
        "siglaTipoSessao": {
            "type": "string",
            "description": "Sigla do tipo de sessão",
            "examples": [
                "DOR"
            ]
        },
        "numeroSessao": {
            "type": "integer",
            "description": "Número da sessão",
            "format": "int32",
            "examples": [
                94
            ]
        },
        "dataSessao": {
            "type": "string",
            "description": "Data da sessão",
            "examples": [
                "2019-06-12"
            ]
        },
        "idProcesso": {
            "type": "integer",
            "description": "ID do processo",
            "format": "int64",
            "examples": [
                7761651
            ]
        },
        "codigoMateria": {
            "type": "integer",
            "description": "Código da matéria",
            "format": "int64",
            "examples": [
                137178
            ]
        },
        "identificacao": {
            "type": "string",
            "description": "Identificação da proposição",
            "examples": [
                "PEC 91/2019"
            ]
        },
        "sigla": {
            "type": "string",
            "description": "Sigla da proposição",
            "examples": [
                "PEC"
            ]
        },
        "numero": {
            "type": "string",
            "description": "Número da proposição",
            "examples": [
                "91"
            ]
        },
        "ano": {
            "type": "integer",
            "description": "Ano da proposição",
            "format": "int32",
            "examples": [
                2019
            ]
        },
        "dataApresentacao": {
            "type": "string",
            "description": "Data de apresentação",
            "examples": [
                "2019-06-05"
            ]
        },
        "ementa": {
            "type": "string",
            "description": "Ementa da proposição",
            "examples": [
                "Altera o procedimento de apreciação das medidas provisórias pelo Congresso Nacional."
            ]
        },
        "codigoSessaoVotacao": {
            "type": "integer",
            "description": "Código da sessão de votação",
            "format": "int64",
            "examples": [
                5970
            ]
        },
        "codigoVotacaoSve": {
            "type": "integer",
            "description": "Código da votação no SVE",
            "format": "int64",
            "examples": [
                2923
            ]
        },
        "sequencialSessao": {
            "type": "integer",
            "description": "Sequencial da sessão",
            "format": "int32",
            "examples": [
                3
            ]
        },
        "votacaoSecreta": {
            "type": "string",
            "description": "Indica votação se a votação foi secreta (S ou N)",
            "examples": [
                "N"
            ]
        },
        "descricaoVotacao": {
            "type": "string",
            "description": "Descrição da votação",
            "examples": [
                "Proposta de Emenda à Constituição nº 91, de 2019 (2º Turno)"
            ]
        },
        "resultadoVotacao": {
            "type": "string",
            "description": "Resultado da votação",
            "examples": [
                "A"
            ]
        },
        "totalVotosSim": {
            "type": "integer",
            "description": "Total de votos sim",
            "format": "int32",
            "examples": [
                60
            ]
        },
        "totalVotosNao": {
            "type": "integer",
            "description": "Total de votos não",
            "format": "int32",
            "examples": [
                0
            ]
        },
        "totalVotosAbstencao": {
            "type": "integer",
            "description": "Total de abstenções",
            "format": "int32",
            "examples": [
                0
            ]
        },
        "informeLegislativo": {
            "$ref": "#/definitions/6347052"
        },
        "votos": {
            "type": "array",
            "description": "Votos dos parlamentares",
            "xml": {
                "wrapped": true
            },
            "items": {
                "$ref": "#/definitions/6347053"
            }
        }
    },
    "description": "Descreve uma sessão legislativa na qual uma proposição foi votada",
    "xml": {
        "name": "sessaoVotacao"
    },
    "x-apidog-orders": [
        "codigoSessao",
        "casaSessao",
        "codigoSessaoLegislativa",
        "siglaTipoSessao",
        "numeroSessao",
        "dataSessao",
        "idProcesso",
        "codigoMateria",
        "identificacao",
        "sigla",
        "numero",
        "ano",
        "dataApresentacao",
        "ementa",
        "codigoSessaoVotacao",
        "codigoVotacaoSve",
        "sequencialSessao",
        "votacaoSecreta",
        "descricaoVotacao",
        "resultadoVotacao",
        "totalVotosSim",
        "totalVotosNao",
        "totalVotosAbstencao",
        "informeLegislativo",
        "votos"
    ]
}