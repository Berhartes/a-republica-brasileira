{
    "title": "Decisao",
    "type": "object",
    "properties": {
        "data": {
            "type": "string",
            "description": "Data da decisão",
            "examples": [
                "2016-06-15"
            ]
        },
        "idTipo": {
            "type": "integer",
            "description": "Id do tipo da decisão",
            "format": "int64",
            "examples": [
                1
            ]
        },
        "descricaoTipo": {
            "type": "string",
            "description": "Descrição do tipo da decisão",
            "examples": [
                "Aprovada"
            ]
        },
        "codigoColegiado": {
            "type": "integer",
            "description": "Código do colegiado",
            "format": "int64",
            "examples": [
                34
            ]
        },
        "casa": {
            "type": "string",
            "description": "Sigla da casa legislativa",
            "examples": [
                "SF"
            ]
        },
        "siglaColegiado": {
            "type": "string",
            "description": "Sigla do colegiado",
            "examples": [
                "CCJ"
            ]
        },
        "nomeColegiado": {
            "type": "string",
            "description": "Nome do colegiado",
            "examples": [
                "Comissão de Constituição, Justiça e Cidadania"
            ]
        }
    },
    "description": "Descreve uma decisao tomada sobre um documento ou emenda",
    "xml": {
        "name": "decisao"
    },
    "x-apidog-orders": [
        "data",
        "idTipo",
        "descricaoTipo",
        "codigoColegiado",
        "casa",
        "siglaColegiado",
        "nomeColegiado"
    ]
}