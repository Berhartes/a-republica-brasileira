{
    "title": "Voto",
    "type": "object",
    "properties": {
        "codigoParlamentar": {
            "type": "integer",
            "description": "Código do parlamentar",
            "format": "int64",
            "examples": [
                825
            ]
        },
        "nomeParlamentar": {
            "type": "string",
            "description": "Nome do parlamentar",
            "examples": [
                "Paulo Paim"
            ]
        },
        "sexoParlamentar": {
            "type": "string",
            "description": "Sexo do parlamentar",
            "examples": [
                "M"
            ]
        },
        "siglaPartidoParlamentar": {
            "type": "string",
            "description": "Sigla do partido do parlamentar",
            "examples": [
                "PT"
            ]
        },
        "siglaUFParlamentar": {
            "type": "string",
            "description": "Sigla da UF do parlamentar",
            "examples": [
                "RS"
            ]
        },
        "siglaVotoParlamentar": {
            "type": "string",
            "description": "Sigla do voto do parlamentar",
            "examples": [
                "Sim"
            ]
        },
        "descricaoVotoParlamentar": {
            "type": "string",
            "description": "Descrição do voto do parlamentar"
        }
    },
    "description": "Descreve o voto de um parlamentar a uma proposição em uma sessão",
    "xml": {
        "name": "voto"
    },
    "x-apidog-orders": [
        "codigoParlamentar",
        "nomeParlamentar",
        "sexoParlamentar",
        "siglaPartidoParlamentar",
        "siglaUFParlamentar",
        "siglaVotoParlamentar",
        "descricaoVotoParlamentar"
    ]
}