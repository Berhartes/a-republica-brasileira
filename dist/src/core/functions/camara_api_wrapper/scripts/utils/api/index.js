"use strict";
/**
 * Exportações centralizadas do módulo de API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.processingConfigs = exports.endpointUtils = exports.endpoints = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("./client"), exports);
var endpoints_1 = require("../../config/endpoints");
Object.defineProperty(exports, "endpoints", { enumerable: true, get: function () { return endpoints_1.endpoints; } });
Object.defineProperty(exports, "endpointUtils", { enumerable: true, get: function () { return endpoints_1.endpointUtils; } });
Object.defineProperty(exports, "processingConfigs", { enumerable: true, get: function () { return endpoints_1.processingConfigs; } });
//# sourceMappingURL=index.js.map