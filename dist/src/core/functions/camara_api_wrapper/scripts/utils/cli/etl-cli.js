"use strict";
/**
 * Parser CLI unificado e profissional para o sistema ETL
 *
 * Este módulo fornece uma interface consistente para parsing
 * de argumentos de linha de comando em todos os scripts ETL.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETLCommandParser = void 0;
exports.createETLParser = createETLParser;
const logging_1 = require("../logging");
const etl_config_1 = require("../../config/etl.config");
/**
 * Parser de linha de comando para scripts ETL
 */
class ETLCommandParser {
    constructor(scriptName, description) {
        this.customOptions = new Map();
        this.scriptName = scriptName;
        this.description = description;
        this.args = process.argv.slice(2);
    }
    /**
     * Adiciona uma opção customizada
     */
    addCustomOption(name, config) {
        this.customOptions.set(name, config);
        return this;
    }
    /**
     * Faz o parse dos argumentos e retorna as opções
     */
    parse() {
        // Verificar se deve exibir ajuda
        if (this.shouldShowHelp()) {
            this.showHelp();
            process.exit(0);
        }
        const options = {};
        // Parse dos argumentos
        for (let i = 0; i < this.args.length; i++) {
            const arg = this.args[i];
            const nextArg = this.args[i + 1];
            // Opções de legislatura
            if (this.isLegislaturaShortcut(arg)) {
                options.legislatura = this.parseLegislaturaShortcut(arg);
            }
            else if (arg === '--legislatura' || arg === '-l') {
                options.legislatura = this.parseNumber(nextArg, 'legislatura');
                i++;
            }
            // Limite
            else if (arg === '--limite') {
                options.limite = this.parseNumber(nextArg, 'limite');
                i++;
            }
            // Senador específico
            else if (arg === '--senador' || arg === '-s') {
                options.senador = nextArg;
                i++;
            }
            // Destino
            else if (arg === '--firestore') {
                this.validateDestino(options.destino);
                options.destino = 'firestore';
            }
            else if (arg === '--emulator') {
                this.validateDestino(options.destino);
                options.destino = 'emulator';
            }
            else if (arg === '--pc' || arg === '--local') {
                this.validateDestino(options.destino);
                options.destino = 'pc';
            }
            // Opções de execução
            else if (arg === '--verbose' || arg === '-v') {
                options.verbose = true;
            }
            else if (arg === '--dry-run') {
                options.dryRun = true;
            }
            else if (arg === '--force') {
                options.forceUpdate = true;
            }
            // Filtros de data
            else if (arg === '--data-inicio') {
                options.dataInicio = this.parseDate(nextArg, 'data de início');
                i++;
            }
            else if (arg === '--data-fim') {
                options.dataFim = this.parseDate(nextArg, 'data de fim');
                i++;
            }
            // Outros filtros
            else if (arg === '--partido') {
                options.partido = nextArg?.toUpperCase();
                i++;
            }
            else if (arg === '--uf') {
                options.uf = nextArg?.toUpperCase();
                i++;
            }
            // Opções customizadas
            else if (this.customOptions.has(arg)) {
                const config = this.customOptions.get(arg);
                const optionName = arg.replace('--', '');
                if (typeof config === 'function') {
                    // Comportamento antigo: apenas um parser
                    if (nextArg) {
                        options[optionName] = config(nextArg);
                        i++;
                    }
                    else {
                        options[optionName] = true;
                    }
                }
                else if (config) {
                    // Novo comportamento: objeto de configuração
                    let value = nextArg;
                    if (value === undefined && config.defaultValue !== undefined) {
                        value = config.defaultValue;
                    }
                    else if (nextArg) {
                        i++; // Consumir o próximo argumento se ele existir
                    }
                    if (config.validator && !config.validator(value)) {
                        throw new Error(`Valor inválido para a opção --${optionName}: ${value}`);
                    }
                    options[optionName] = config.transformer ? config.transformer(value) : value;
                }
                else {
                    // Se não há parser nem config, apenas define como true
                    options[optionName] = true;
                }
            }
            // Primeiro argumento numérico como legislatura
            else if (i === 0 && !isNaN(parseInt(arg, 10))) {
                options.legislatura = this.parseNumber(arg, 'legislatura');
            }
        }
        // Validações finais
        this.validateOptions(options);
        // Aplicar defaults e valores de opções customizadas não fornecidas
        const finalOptions = {
            destino: options.destino || 'firestore',
            ...options
        };
        // Aplicar default values para opções customizadas não passadas na CLI
        this.customOptions.forEach((config, name) => {
            const optionName = name.replace('--', '');
            if (typeof config !== 'function' && config.defaultValue !== undefined && finalOptions[optionName] === undefined) {
                finalOptions[optionName] = config.defaultValue;
            }
        });
        // Configurar logger se verbose
        if (finalOptions.verbose) {
            logging_1.logger.setLevel(logging_1.LogLevel.DEBUG);
        }
        return finalOptions;
    }
    /**
     * Verifica se deve exibir ajuda
     */
    shouldShowHelp() {
        return this.args.includes('--help') ||
            this.args.includes('-h') ||
            this.args.includes('--ajuda');
    }
    /**
     * Exibe a mensagem de ajuda
     */
    showHelp() {
        console.log(`
${this.description}

USO:
  npm run ${this.scriptName} [legislatura] [opções]

ARGUMENTOS:
  [legislatura]              Número da legislatura (1-${etl_config_1.etlConfig.senado.legislatura.max})
                            Se não informado, usa a legislatura atual

OPÇÕES DE DESTINO (escolha apenas uma):
  --firestore               Salva no Firestore (produção) - PADRÃO
  --emulator                Usa o Firestore Emulator
  --pc, --local            Salva localmente no PC

FILTROS:
  --limite <número>         Limita o processamento a N itens
  --senador, -s <código>    Processa apenas o senador especificado
  --partido <sigla>         Filtra por partido (ex: PT, PSDB)
  --uf <sigla>             Filtra por estado (ex: SP, RJ)
  --data-inicio <data>      Data de início (YYYY-MM-DD)
  --data-fim <data>         Data de fim (YYYY-MM-DD)

ATALHOS DE LEGISLATURA:
  --57                      Atalho para legislatura 57
  --58                      Atalho para legislatura 58

OPÇÕES DE EXECUÇÃO:
  --verbose, -v             Modo verboso com logs detalhados
  --dry-run                 Simula execução sem salvar dados
  --force                   Força atualização mesmo se já processado
  --help, -h, --ajuda       Exibe esta mensagem de ajuda

VARIÁVEIS DE AMBIENTE:
  SENADO_CONCURRENCY        Requisições simultâneas (padrão: ${etl_config_1.etlConfig.senado.concurrency})
  SENADO_MAX_RETRIES        Tentativas máximas (padrão: ${etl_config_1.etlConfig.senado.maxRetries})
  SENADO_TIMEOUT            Timeout em ms (padrão: ${etl_config_1.etlConfig.senado.timeout})
  FIRESTORE_EMULATOR_HOST   Host do emulator (padrão: ${etl_config_1.etlConfig.firestore.emulatorHost})
  LOG_LEVEL                 Nível de log: error, warn, info, debug (padrão: ${etl_config_1.etlConfig.logging.level})

EXEMPLOS:
  # Processar legislatura atual
  npm run ${this.scriptName}

  # Processar legislatura 57 com limite
  npm run ${this.scriptName} -- 57 --limite 10

  # Salvar no PC local
  npm run ${this.scriptName} -- --pc --verbose

  # Usar emulador com filtros
  npm run ${this.scriptName} -- --emulator --partido PT --uf SP

  # Modo dry-run para teste
  npm run ${this.scriptName} -- --dry-run --limite 5
`);
    }
    /**
     * Verifica se é um atalho de legislatura
     */
    isLegislaturaShortcut(arg) {
        return /^--\d{1,2}$/.test(arg);
    }
    /**
     * Faz parse de atalho de legislatura
     */
    parseLegislaturaShortcut(arg) {
        const num = parseInt(arg.replace('--', ''), 10);
        if (num < etl_config_1.etlConfig.senado.legislatura.min || num > etl_config_1.etlConfig.senado.legislatura.max) {
            throw new Error(`Legislatura inválida: ${num}. Deve estar entre ${etl_config_1.etlConfig.senado.legislatura.min} e ${etl_config_1.etlConfig.senado.legislatura.max}`);
        }
        return num;
    }
    /**
     * Faz parse de número com validação
     */
    parseNumber(value, campo) {
        if (!value) {
            throw new Error(`Valor não fornecido para ${campo}`);
        }
        const num = parseInt(value, 10);
        if (isNaN(num)) {
            throw new Error(`Valor inválido para ${campo}: ${value}. Deve ser um número.`);
        }
        if (campo === 'legislatura') {
            if (num < etl_config_1.etlConfig.senado.legislatura.min || num > etl_config_1.etlConfig.senado.legislatura.max) {
                throw new Error(`Legislatura inválida: ${num}. Deve estar entre ${etl_config_1.etlConfig.senado.legislatura.min} e ${etl_config_1.etlConfig.senado.legislatura.max}`);
            }
        }
        if (campo === 'limite' && num <= 0) {
            throw new Error(`Limite inválido: ${num}. Deve ser maior que zero.`);
        }
        return num;
    }
    /**
     * Faz parse de data com validação
     */
    parseDate(value, campo) {
        if (!value) {
            throw new Error(`Data não fornecida para ${campo}`);
        }
        // Validar formato YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            throw new Error(`Formato de data inválido para ${campo}: ${value}. Use YYYY-MM-DD`);
        }
        // Validar se é uma data válida
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            throw new Error(`Data inválida para ${campo}: ${value}`);
        }
        return value;
    }
    /**
     * Valida se apenas um destino foi escolhido
     */
    validateDestino(destino) {
        if (destino) {
            throw new Error('Especifique apenas um destino: --firestore, --emulator ou --pc');
        }
    }
    /**
     * Valida as opções parseadas
     */
    validateOptions(options) {
        // Validar datas se ambas foram fornecidas
        if (options.dataInicio && options.dataFim) {
            const inicio = new Date(options.dataInicio);
            const fim = new Date(options.dataFim);
            if (inicio > fim) {
                throw new Error('Data de início não pode ser posterior à data de fim');
            }
        }
        // Validar UF se fornecido
        if (options.uf) {
            const ufsValidas = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
            if (!ufsValidas.includes(options.uf)) {
                throw new Error(`UF inválida: ${options.uf}. Use uma sigla válida de estado brasileiro.`);
            }
        }
    }
}
exports.ETLCommandParser = ETLCommandParser;
/**
 * Função helper para criar parser com configurações padrão
 */
function createETLParser(scriptName, description) {
    return new ETLCommandParser(scriptName, description);
}
//# sourceMappingURL=etl-cli.js.map