{
    "title": "InformeLegislativo",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "ID do informe",
            "format": "int64",
            "examples": [
                2014510
            ]
        },
        "idEvento": {
            "type": "integer",
            "description": "ID do evento",
            "format": "int64",
            "examples": [
                10058149
            ]
        },
        "numeroAutuacao": {
            "type": "integer",
            "description": "Número de autuação",
            "format": "int32",
            "examples": [
                1
            ]
        },
        "data": {
            "type": "string",
            "description": "Data do informe",
            "examples": [
                "2019-06-12"
            ]
        },
        "texto": {
            "type": "string",
            "description": "Texto do informe",
            "examples": [
                "Aprovada com a Emenda nº 3-PLEN, de redação, em primeiro e segundo turnos.\r\nÀ promulgação."
            ]
        },
        "codigoColegiado": {
            "type": "integer",
            "description": "Código do colegiado do informe",
            "format": "int64",
            "examples": [
                1998
            ]
        },
        "casaColegiado": {
            "type": "string",
            "description": "Casa do colegiado do informe",
            "examples": [
                "SF"
            ]
        },
        "siglaColegiado": {
            "type": "string",
            "description": "Sigla do colegiado do informe",
            "examples": [
                "PLEN"
            ]
        },
        "nomeColegiado": {
            "type": "string",
            "description": "Nome do colegiado do informe",
            "examples": [
                "Plenário do Senado Federal"
            ]
        },
        "idEnteAdm": {
            "type": "integer",
            "description": "ID do ente administrativo do informe",
            "format": "int64",
            "examples": [
                13594
            ]
        },
        "casaEnteAdm": {
            "type": "string",
            "description": "Casa do ente administrativo do informe",
            "examples": [
                "SF"
            ]
        },
        "siglaEnteAdm": {
            "type": "string",
            "description": "Sigla do ente administrativo do informe",
            "examples": [
                "SEADI"
            ]
        },
        "nomeEnteAdm": {
            "type": "string",
            "description": "Nome do ente administrativo do informe",
            "examples": [
                "Secretaria de Atas e Diários"
            ]
        }
    },
    "description": "Informe sobre a tramitação de um processo legislativa",
    "xml": {
        "name": "informeLegislativo"
    },
    "x-apidog-orders": [
        "id",
        "idEvento",
        "numeroAutuacao",
        "data",
        "texto",
        "codigoColegiado",
        "casaColegiado",
        "siglaColegiado",
        "nomeColegiado",
        "idEnteAdm",
        "casaEnteAdm",
        "siglaEnteAdm",
        "nomeEnteAdm"
    ]
}