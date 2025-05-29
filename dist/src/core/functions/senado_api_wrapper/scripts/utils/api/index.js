"use strict";
/**
 * Sistema de API Unificado
 *
 * Este módulo oferece uma interface unificada para comunicação com APIs externas,
 * especialmente a API do Senado Federal.
 *
 * @example
 * ```typescript
 * import { get, replacePath, endpoints, request } from '../utils/api';
 *
 * // Requisição simples
 * const senadores = await get(endpoints.SENADORES.LISTA_ATUAL.PATH);
 *
 * // Requisição com parâmetros no path
 * const path = replacePath(endpoints.SENADORES.PERFIL.PATH, { codigo: '12345' });
 * const perfil = await get(path);
 *
 * // Requisições avançadas com retry
 * const response = await request.get('https://api.example.com/data', {
 *   maxRetries: 5,
 *   retryDelay: 2000
 * });
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestManager = exports.requestManager = exports.request = exports.endpoints = exports.replacePath = exports.get = void 0;
// Cliente de API principal (compatibilidade com código existente)
var client_1 = require("./client");
Object.defineProperty(exports, "get", { enumerable: true, get: function () { return client_1.get; } });
Object.defineProperty(exports, "replacePath", { enumerable: true, get: function () { return client_1.replacePath; } });
// Endpoints da API do Senado
var endpoints_1 = require("./endpoints");
Object.defineProperty(exports, "endpoints", { enumerable: true, get: function () { return endpoints_1.endpoints; } });
// Sistema de requisições avançadas
var request_1 = require("./request");
Object.defineProperty(exports, "request", { enumerable: true, get: function () { return request_1.request; } });
Object.defineProperty(exports, "requestManager", { enumerable: true, get: function () { return request_1.requestManager; } });
Object.defineProperty(exports, "RequestManager", { enumerable: true, get: function () { return request_1.RequestManager; } });
//# sourceMappingURL=index.js.map