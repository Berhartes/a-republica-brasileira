{
    "title": "ProcessoResumido",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id do processo",
            "format": "int64",
            "examples": [
                8147067
            ]
        },
        "codigoMateria": {
            "type": "integer",
            "description": "Código legado da matéria do MATE",
            "format": "int64",
            "examples": [
                151547
            ]
        },
        "identificacao": {
            "type": "string",
            "description": "Identificação do processo",
            "examples": [
                "PL 21/2020"
            ]
        },
        "apelido": {
            "type": "string",
            "description": "Apelido do processo"
        },
        "objetivo": {
            "type": "string",
            "description": "Objetivo do processo",
            "examples": [
                "Revisora"
            ]
        },
        "casaIdentificadora": {
            "type": "string",
            "description": "Casa identificadora do processo",
            "examples": [
                "SF"
            ]
        },
        "enteIdentificador": {
            "type": "string",
            "description": "Ente identificador do processo",
            "examples": [
                "SF"
            ]
        },
        "tipoConteudo": {
            "type": "string",
            "description": "Tipo de conteúdo do processo",
            "examples": [
                "Norma Geral"
            ]
        },
        "ementa": {
            "type": "string",
            "description": "Ementa do processo",
            "examples": [
                "Estabelece fundamentos, princípios e diretrizes para o desenvolvimento e a aplicação da inteligência artificial no Brasil; e dá outras providências."
            ]
        },
        "idDocumento": {
            "type": "integer",
            "format": "int64",
            "writeOnly": true
        },
        "tipoDocumento": {
            "type": "string",
            "description": "Tipo de documento do processo",
            "examples": [
                "Projeto de Lei Ordinária"
            ]
        },
        "dataApresentacao": {
            "type": "string",
            "description": "Data de apresentação do processo",
            "format": "date",
            "examples": [
                "2021-09-30"
            ]
        },
        "idItemDigital": {
            "type": "integer",
            "format": "int64",
            "writeOnly": true
        },
        "autoria": {
            "type": "string",
            "description": "Autoria do processo",
            "examples": [
                "Câmara dos Deputados"
            ]
        },
        "tramitando": {
            "type": "string",
            "description": "Indica se o processo está tramitando",
            "examples": [
                "Sim"
            ]
        },
        "normaGerada": {
            "type": "string",
            "description": "Norma gerada pelo processo"
        },
        "ultimaInformacaoAtualizada": {
            "type": "string",
            "description": "Última informação atualizada do processo",
            "examples": [
                "EVENTO_LEGISLATIVO"
            ]
        },
        "dataUltimaAtualizacao": {
            "type": "string",
            "description": "Data da última atualização do processo",
            "format": "date-time"
        },
        "urlDocumento": {
            "type": "string",
            "description": "URL do documento inicial do processo",
            "examples": [
                "https://legis.senado.gov.br/sdleg-getter/documento?dm=9023442"
            ]
        }
    },
    "description": "Informações básicas do processo, como sigla, número, ano, ementa, etc.",
    "xml": {
        "name": "processo"
    },
    "x-apidog-orders": [
        "id",
        "codigoMateria",
        "identificacao",
        "apelido",
        "objetivo",
        "casaIdentificadora",
        "enteIdentificador",
        "tipoConteudo",
        "ementa",
        "idDocumento",
        "tipoDocumento",
        "dataApresentacao",
        "idItemDigital",
        "autoria",
        "tramitando",
        "normaGerada",
        "ultimaInformacaoAtualizada",
        "dataUltimaAtualizacao",
        "urlDocumento"
    ]
}