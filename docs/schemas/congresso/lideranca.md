{
    "title": "Lideranca",
    "type": "object",
    "properties": {
        "codigo": {
            "type": "integer",
            "description": "Codigo da lideranca",
            "format": "int64",
            "examples": [
                8147067
            ]
        },
        "casa": {
            "type": "string",
            "description": "Casa legislativa (CN, CD ou SF)",
            "examples": [
                "SF"
            ]
        },
        "idTipoUnidadeLideranca": {
            "type": "integer",
            "description": "ID do tipo de unidade de liderança",
            "format": "int32",
            "examples": [
                3
            ]
        },
        "siglaTipoUnidadeLideranca": {
            "type": "string",
            "description": "Sigla do tipo de unidade de liderança",
            "examples": [
                "G"
            ]
        },
        "descricaoTipoUnidadeLideranca": {
            "type": "string",
            "description": "Descrição do tipo de unidade de liderança",
            "examples": [
                "Liderança do Governo no Senado"
            ]
        },
        "codigoParlamentar": {
            "type": "integer",
            "description": "Código do parlamentar",
            "format": "int64",
            "examples": [
                475
            ]
        },
        "nomeParlamentar": {
            "type": "string",
            "description": "Nome do parlamentar",
            "examples": [
                "Confúcio Moura"
            ]
        },
        "dataDesignacao": {
            "type": "string",
            "description": "Data de designação da liderança",
            "format": "date",
            "examples": [
                "2023-03-23"
            ]
        },
        "dataTermino": {
            "type": "string",
            "description": "Data de término da liderança",
            "format": "date"
        },
        "siglaTipoLideranca": {
            "type": "string",
            "description": "Sigla do tipo de liderança",
            "examples": [
                "V"
            ]
        },
        "descricaoTipoLideranca": {
            "type": "string",
            "description": "Descrição do tipo de liderança",
            "examples": [
                "Vice-líder do Senado"
            ]
        },
        "numeroOrdemViceLider": {
            "type": "integer",
            "description": "Número de ordem do vice-líder",
            "format": "int32",
            "examples": [
                1
            ]
        },
        "codigoBloco": {
            "type": "integer",
            "description": "Código do bloco",
            "format": "int64"
        },
        "siglaBloco": {
            "type": "string",
            "description": "Sigla do bloco"
        },
        "nomeBloco": {
            "type": "string",
            "description": "Nome do bloco"
        },
        "codigoPartido": {
            "type": "integer",
            "description": "Código do partido",
            "format": "int64"
        },
        "siglaPartido": {
            "type": "string",
            "description": "Sigla do partido"
        },
        "nomePartido": {
            "type": "string",
            "description": "Nome do partido"
        },
        "codigoPartidoFiliacao": {
            "type": "integer",
            "description": "Código do partido de filiação",
            "format": "int64",
            "examples": [
                33
            ]
        },
        "siglaPartidoFiliacao": {
            "type": "string",
            "description": "Sigla do partido de filiação",
            "examples": [
                "MDB"
            ]
        },
        "nomePartidoFiliacao": {
            "type": "string",
            "description": "Nome do partido de filiação",
            "examples": [
                "Movimento Democrático Brasileiro"
            ]
        }
    },
    "description": "Descreve uma Liderança parlamentar do Senado, Congresso ou Câmara",
    "xml": {
        "name": "lideranca"
    },
    "x-apidog-orders": [
        "codigo",
        "casa",
        "idTipoUnidadeLideranca",
        "siglaTipoUnidadeLideranca",
        "descricaoTipoUnidadeLideranca",
        "codigoParlamentar",
        "nomeParlamentar",
        "dataDesignacao",
        "dataTermino",
        "siglaTipoLideranca",
        "descricaoTipoLideranca",
        "numeroOrdemViceLider",
        "codigoBloco",
        "siglaBloco",
        "nomeBloco",
        "codigoPartido",
        "siglaPartido",
        "nomePartido",
        "codigoPartidoFiliacao",
        "siglaPartidoFiliacao",
        "nomePartidoFiliacao"
    ]
}