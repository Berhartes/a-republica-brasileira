{
    "title": "Documento",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id do documento",
            "format": "int64",
            "examples": [
                9901176
            ]
        },
        "identificacao": {
            "type": "string",
            "description": "Identificação do documento",
            "examples": [
                "Ofício - SF255067303738"
            ]
        },
        "dataDocumento": {
            "type": "string",
            "description": "Data do documento",
            "examples": [
                "2025-02-12"
            ]
        },
        "dataRecebimento": {
            "type": "string",
            "description": "Data de recebimento do documento no legislativo",
            "examples": [
                "2025-02-12"
            ]
        },
        "siglaTipo": {
            "type": "string",
            "description": "Sigla do tipo de documento",
            "examples": [
                "OFICIO"
            ]
        },
        "descricaoTipo": {
            "type": "string",
            "description": "Descrição do tipo de documento",
            "examples": [
                "Ofício"
            ]
        },
        "autoria": {
            "type": "string",
            "description": "Autoria do documento",
            "examples": [
                "Primeiro-Secretário do Senado Federal"
            ]
        },
        "descricao": {
            "type": "string",
            "description": "Descrição do documento",
            "examples": [
                "Recibo eletrônico da Câmara dos Deputados referente ao Ofício SF nº 26/2025 (assinado e remetido eletronicamente)."
            ]
        },
        "urlDocumento": {
            "type": "string",
            "description": "URL do documento",
            "examples": [
                "http://legis.senado.leg.br/sdleg-getter/documento?dm=9901176"
            ]
        },
        "codigoColegiadoRecebedor": {
            "type": "integer",
            "description": "Código do colegiado recebedor",
            "format": "int32",
            "examples": [
                2015
            ]
        },
        "casaRecebedora": {
            "type": "string",
            "description": "Casa do colegiado recebedor",
            "examples": [
                "SF"
            ]
        },
        "siglaColegiadoRecebedor": {
            "type": "string",
            "description": "Sigla do colegiado recebedor",
            "examples": [
                "CDIR"
            ]
        },
        "nomeColegiadoRecebedor": {
            "type": "string",
            "description": "Nome do colegiado recebedor",
            "examples": [
                "Comissão Diretora do Senado Federal"
            ]
        },
        "idEnteRecebedor": {
            "type": "integer",
            "description": "ID do ente recebedor",
            "format": "int64",
            "examples": [
                55304
            ]
        },
        "casaEnteRecebedor": {
            "type": "string",
            "description": "Casa do ente recebedor",
            "examples": [
                "SF"
            ]
        },
        "siglaEnteRecebedor": {
            "type": "string",
            "description": "Sigla do ente recebedor",
            "examples": [
                "SEXPE"
            ]
        },
        "nomeEnteRecebedor": {
            "type": "string",
            "description": "Nome do ente recebedor",
            "examples": [
                "Secretaria de Expediente"
            ]
        },
        "autores": {
            "type": "array",
            "description": "Autores do documento",
            "xml": {
                "wrapped": true
            },
            "items": {
                "$ref": "#/definitions/6347061"
            }
        },
        "apresentadoNosProcessos": {
            "type": "array",
            "description": "Processos nos quais o documento foi apresentado",
            "xml": {
                "wrapped": true
            },
            "items": {
                "$ref": "#/definitions/6347060"
            }
        }
    },
    "description": "Documento apresentado em um ou mais processo(s) legislativo(s)",
    "xml": {
        "name": "documento"
    },
    "x-apidog-orders": [
        "id",
        "identificacao",
        "dataDocumento",
        "dataRecebimento",
        "siglaTipo",
        "descricaoTipo",
        "autoria",
        "descricao",
        "urlDocumento",
        "codigoColegiadoRecebedor",
        "casaRecebedora",
        "siglaColegiadoRecebedor",
        "nomeColegiadoRecebedor",
        "idEnteRecebedor",
        "casaEnteRecebedor",
        "siglaEnteRecebedor",
        "nomeEnteRecebedor",
        "autores",
        "apresentadoNosProcessos"
    ]
}