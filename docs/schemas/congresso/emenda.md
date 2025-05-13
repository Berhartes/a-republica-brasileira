{
    "title": "Emenda",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id da emenda",
            "format": "int64",
            "examples": [
                4611322
            ]
        },
        "idDocumentoEmenda": {
            "type": "integer",
            "description": "Id do documento da emenda",
            "format": "int64",
            "examples": [
                4611313
            ]
        },
        "urlDocumentoEmenda": {
            "type": "string",
            "description": "URL do documento da emenda",
            "examples": [
                "http://legis.senado.leg.br/sdleg-getter/documento?dm=4611313"
            ]
        },
        "descricaoDocumentoEmenda": {
            "type": "string",
            "description": "Descrição do documento da emenda"
        },
        "idCiEmenda": {
            "type": "integer",
            "description": "Id do conteúdo informacional da emenda",
            "format": "int64",
            "examples": [
                4611319
            ]
        },
        "idCiEmendado": {
            "type": "integer",
            "description": "Id do conteúdo informacional emendado",
            "format": "int64",
            "examples": [
                2964462
            ]
        },
        "idProcesso": {
            "type": "integer",
            "description": "Id do processo emendado",
            "format": "int64",
            "examples": [
                2964457
            ]
        },
        "dataApresentacao": {
            "type": "string",
            "description": "Data de apresentação da emenda",
            "examples": [
                "2016-06-15"
            ]
        },
        "codigoColegiado": {
            "type": "integer",
            "description": "Código do colegiado de apresentação da emenda",
            "format": "int64",
            "examples": [
                34
            ]
        },
        "casa": {
            "type": "string",
            "description": "Casa legislativa de apresentação da emenda",
            "examples": [
                "SF"
            ]
        },
        "siglaColegiado": {
            "type": "string",
            "description": "Sigla do colegiado de apresentação da emenda",
            "examples": [
                "CCJ"
            ]
        },
        "nomeColegiado": {
            "type": "string",
            "description": "Nome do colegiado de apresentação da emenda",
            "examples": [
                "Comissão de Constituição, Justiça e Cidadania"
            ]
        },
        "autoria": {
            "type": "string",
            "description": "Autoria da emenda",
            "examples": [
                "Senador Paulo Paim (PT/RS)"
            ]
        },
        "numero": {
            "type": "string",
            "description": "Número da emenda",
            "examples": [
                "1"
            ]
        },
        "identificacao": {
            "type": "string",
            "description": "Identificação da emenda",
            "examples": [
                "Emenda 1 / CCJ - PLC 130/2009"
            ]
        },
        "tipo": {
            "type": "string",
            "description": "Tipo da emenda",
            "enum": [
                "EMENDA_PARCIAL",
                "EMENDA_TOTAL",
                "SUBEMENDA"
            ],
            "examples": [
                "EMENDA_PARCIAL"
            ]
        },
        "turnoApresentacao": {
            "type": "string",
            "description": "Turno de apresentação da emenda",
            "enum": [
                "NORMAL",
                "PRIMEIRO",
                "SEGUNDO",
                "SUPLEMENTAR"
            ],
            "examples": [
                "NORMAL"
            ]
        },
        "decisoes": {
            "type": "array",
            "description": "Decisões tomadas sobre a emenda",
            "xml": {
                "wrapped": true
            },
            "items": {
                "$ref": "#/definitions/6347058"
            }
        },
        "subemendas": {
            "type": "array",
            "description": "Subemendas da emenda",
            "xml": {
                "wrapped": true
            },
            "items": {
                "$ref": "#/definitions/6347059"
            },
            "examples": [
                "Array do tipo Emenda"
            ]
        }
    },
    "description": "Descreve uma emenda a uma proposição legislativa",
    "xml": {
        "name": "emenda"
    },
    "x-apidog-orders": [
        "id",
        "idDocumentoEmenda",
        "urlDocumentoEmenda",
        "descricaoDocumentoEmenda",
        "idCiEmenda",
        "idCiEmendado",
        "idProcesso",
        "dataApresentacao",
        "codigoColegiado",
        "casa",
        "siglaColegiado",
        "nomeColegiado",
        "autoria",
        "numero",
        "identificacao",
        "tipo",
        "turnoApresentacao",
        "decisoes",
        "subemendas"
    ]
}