{
    "title": "UnidadeDescricao",
    "type": "object",
    "properties": {
        "codigo": {
            "type": "integer",
            "format": "int64"
        },
        "horaExibicao": {
            "type": "string"
        },
        "dataUnidade": {
            "type": "string"
        },
        "descricao": {
            "type": "string"
        },
        "nomeOrador": {
            "type": "string"
        },
        "descricaoOrador": {
            "type": "string"
        },
        "duracaoVideo": {
            "type": "string"
        },
        "duracaoAudio": {
            "type": "string"
        },
        "enderecoThumbnail": {
            "type": "string"
        },
        "enderecoVideo": {
            "type": "string"
        },
        "enderecoAudio": {
            "type": "string"
        }
    },
    "description": "Descrição de uma unidade de multimídia",
    "xml": {
        "name": "unidade"
    },
    "x-apidog-orders": [
        "codigo",
        "horaExibicao",
        "dataUnidade",
        "descricao",
        "nomeOrador",
        "descricaoOrador",
        "duracaoVideo",
        "duracaoAudio",
        "enderecoThumbnail",
        "enderecoVideo",
        "enderecoAudio"
    ]
}