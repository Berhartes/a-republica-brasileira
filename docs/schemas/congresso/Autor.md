{
    "title": "Autor",
    "type": "object",
    "properties": {
        "autor": {
            "type": "string",
            "description": "Autor do documento",
            "examples": [
                "Primeiro-Secretário do Senado Federal"
            ]
        },
        "sexo": {
            "type": "string",
            "description": "Sexo do autor",
            "examples": [
                "M"
            ]
        },
        "siglaTipo": {
            "type": "string",
            "description": "Sigla do tipo de autor",
            "examples": [
                "PRIMEIRO_SEC_SF"
            ]
        },
        "descricaoTipo": {
            "type": "string",
            "description": "Descrição do tipo de autor",
            "examples": [
                "Primeiro-Secretário do Senado Federal"
            ]
        },
        "ordem": {
            "type": "integer",
            "description": "Ordem do autor",
            "format": "int32",
            "examples": [
                1
            ]
        },
        "outrosAutoresNaoInformados": {
            "type": "string",
            "description": "Outros autores não informados",
            "examples": [
                "Não"
            ]
        },
        "codigoParlamentar": {
            "type": "integer",
            "description": "Código do parlamentar",
            "format": "int64"
        },
        "uf": {
            "type": "string",
            "description": "UF do autor"
        },
        "siglaPartido": {
            "type": "string",
            "description": "Sigla do partido do autor"
        },
        "partido": {
            "type": "string",
            "description": "Partido do autor"
        },
        "siglaCargo": {
            "type": "string",
            "description": "Sigla do cargo do autor"
        },
        "cargo": {
            "type": "string",
            "description": "Cargo do autor"
        },
        "idEnte": {
            "type": "integer",
            "description": "ID do ente do autor",
            "format": "int64"
        },
        "siglaEnte": {
            "type": "string",
            "description": "Sigla do ente do autor"
        },
        "casaEnte": {
            "type": "string",
            "description": "Casa do ente do autor"
        },
        "nomeEnte": {
            "type": "string",
            "description": "Nome do ente do autor"
        }
    },
    "description": "Autor de um documento",
    "xml": {
        "name": "autor"
    },
    "x-apidog-orders": [
        "autor",
        "sexo",
        "siglaTipo",
        "descricaoTipo",
        "ordem",
        "outrosAutoresNaoInformados",
        "codigoParlamentar",
        "uf",
        "siglaPartido",
        "partido",
        "siglaCargo",
        "cargo",
        "idEnte",
        "siglaEnte",
        "casaEnte",
        "nomeEnte"
    ]
}