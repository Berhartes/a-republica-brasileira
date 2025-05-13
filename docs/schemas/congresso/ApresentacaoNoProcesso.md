{
    "title": "ApresentacaoNoProcesso",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id do processo",
            "format": "int64",
            "examples": [
                8695509
            ]
        },
        "identificacao": {
            "type": "string",
            "description": "Identificação do processo",
            "examples": [
                "PL 2469/2022"
            ]
        },
        "tramitando": {
            "type": "string",
            "description": "Status de tramitação do processo",
            "examples": [
                "Não"
            ]
        },
        "papelNoProcesso": {
            "type": "string",
            "description": "Papel do documento no processo",
            "examples": [
                "Texto final na Comissão"
            ]
        }
    },
    "description": "Descreve a apresentação de um documento em um processo.\nEm qual processo foi apresentado e qual o papel do documento no processo.\n",
    "xml": {
        "name": "apresentacaoNoProcesso"
    },
    "x-apidog-orders": [
        "id",
        "identificacao",
        "tramitando",
        "papelNoProcesso"
    ]
}