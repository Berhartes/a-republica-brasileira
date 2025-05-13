{
    "title": "Relatoria",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer",
            "description": "Id da relatoria",
            "format": "int64",
            "examples": [
                9878123
            ]
        },
        "casaRelator": {
            "type": "string",
            "description": "Casa do relator",
            "examples": [
                "SF"
            ]
        },
        "idTipoRelator": {
            "type": "integer",
            "description": "Id do tipo de relator",
            "format": "int64",
            "examples": [
                1
            ]
        },
        "descricaoTipoRelator": {
            "type": "string",
            "description": "Descrição do tipo de relator",
            "examples": [
                "Relator"
            ]
        },
        "dataDesignacao": {
            "type": "string",
            "description": "Data de designação",
            "examples": [
                "2024-12-17"
            ]
        },
        "dataDestituicao": {
            "type": "string",
            "description": "Data de destituição",
            "examples": [
                "2024-12-18"
            ]
        },
        "descricaoTipoEncerramento": {
            "type": "string",
            "description": "Descrição do tipo de encerramento",
            "examples": [
                "Deliberação da matéria"
            ]
        },
        "idProcesso": {
            "type": "integer",
            "description": "Id do processo",
            "format": "int64",
            "examples": [
                8774796
            ]
        },
        "numeroAutuacao": {
            "type": "string",
            "description": "Número de autuação",
            "examples": [
                "1"
            ]
        },
        "codigoMateria": {
            "type": "integer",
            "description": "Código da matéria",
            "format": "int64",
            "examples": [
                166705
            ]
        },
        "identificacaoProcesso": {
            "type": "string",
            "description": "Identificação do processo",
            "examples": [
                "PDL 361/2024"
            ]
        },
        "ementaProcesso": {
            "type": "string",
            "description": "Ementa do processo",
            "examples": [
                "Aprova o texto do Protocolo Complementar sobre o Desenvolvimento Conjunto do..."
            ]
        },
        "autoriaProcesso": {
            "type": "string",
            "description": "Autoria do processo",
            "examples": [
                "Câmara dos Deputados"
            ]
        },
        "dataApresentacaoProcesso": {
            "type": "string",
            "description": "Data de apresentação do processo",
            "examples": [
                "2024-12-13"
            ]
        },
        "tramitando": {
            "type": "string",
            "description": "Indica se o processo está tramitando",
            "examples": [
                "N"
            ]
        },
        "codigoParlamentar": {
            "type": "integer",
            "description": "Código do parlamentar",
            "format": "int64",
            "examples": [
                6009
            ]
        },
        "nomeParlamentar": {
            "type": "string",
            "description": "Nome do parlamentar",
            "examples": [
                "Astronauta Marcos Pontes"
            ]
        },
        "nomeCompleto": {
            "type": "string",
            "description": "Nome completo do parlamentar",
            "examples": [
                "Marcos Cesar Pontes"
            ]
        },
        "sexoParlamentar": {
            "type": "string",
            "description": "Sexo do parlamentar",
            "examples": [
                "M"
            ]
        },
        "formaTratamentoParlamentar": {
            "type": "string",
            "description": "Forma de tratamento do parlamentar",
            "examples": [
                "Senador"
            ]
        },
        "urlFotoParlamentar": {
            "type": "string",
            "description": "URL da foto do parlamentar",
            "examples": [
                "http://www.senado.leg.br/senadores/img/fotos-oficiais/senador6009.jpg"
            ]
        },
        "urlPaginaParlamentar": {
            "type": "string",
            "description": "URL da página do parlamentar",
            "examples": [
                "http://www25.senado.leg.br/web/senadores/senador/-/perfil/6009"
            ]
        },
        "emailParlamentar": {
            "type": "string",
            "description": "Email do parlamentar",
            "examples": [
                "sen.astronautamarcospontes@senado.leg.br"
            ]
        },
        "siglaPartidoParlamentar": {
            "type": "string",
            "description": "Sigla do partido do parlamentar",
            "examples": [
                "PL"
            ]
        },
        "ufParlamentar": {
            "type": "string",
            "description": "UF do parlamentar",
            "examples": [
                "SP"
            ]
        },
        "codigoColegiado": {
            "type": "integer",
            "description": "Código do colegiado",
            "format": "int64",
            "examples": [
                1998
            ]
        },
        "siglaCasa": {
            "type": "string",
            "description": "Sigla da casa",
            "examples": [
                "SF"
            ]
        },
        "siglaColegiado": {
            "type": "string",
            "description": "Sigla do colegiado",
            "examples": [
                "PLEN"
            ]
        },
        "nomeColegiado": {
            "type": "string",
            "description": "Nome do colegiado",
            "examples": [
                "Plenário do Senado Federal"
            ]
        },
        "codigoTipoColegiado": {
            "type": "integer",
            "description": "Código do tipo de colegiado",
            "format": "int64",
            "examples": [
                128
            ]
        },
        "dataFimColegiado": {
            "type": "string",
            "description": "Data de fim do colegiado"
        }
    },
    "description": "Relatoria de um processo legislativo por um parlamentar em um colegiado",
    "xml": {
        "name": "relatoria"
    },
    "x-apidog-orders": [
        "id",
        "casaRelator",
        "idTipoRelator",
        "descricaoTipoRelator",
        "dataDesignacao",
        "dataDestituicao",
        "descricaoTipoEncerramento",
        "idProcesso",
        "numeroAutuacao",
        "codigoMateria",
        "identificacaoProcesso",
        "ementaProcesso",
        "autoriaProcesso",
        "dataApresentacaoProcesso",
        "tramitando",
        "codigoParlamentar",
        "nomeParlamentar",
        "nomeCompleto",
        "sexoParlamentar",
        "formaTratamentoParlamentar",
        "urlFotoParlamentar",
        "urlPaginaParlamentar",
        "emailParlamentar",
        "siglaPartidoParlamentar",
        "ufParlamentar",
        "codigoColegiado",
        "siglaCasa",
        "siglaColegiado",
        "nomeColegiado",
        "codigoTipoColegiado",
        "dataFimColegiado"
    ]
}