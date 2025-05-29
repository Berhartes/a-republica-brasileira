"use strict";
/**
 * Tipos centralizados para o sistema ETL do Senado Federal
 *
 * Este arquivo define todas as interfaces e tipos utilizados
 * em todo o sistema ETL, garantindo consistência e type safety.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingStatus = void 0;
/**
 * Status de processamento
 */
var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["INICIADO"] = "INICIADO";
    ProcessingStatus["EXTRAINDO"] = "EXTRAINDO";
    ProcessingStatus["TRANSFORMANDO"] = "TRANSFORMANDO";
    ProcessingStatus["CARREGANDO"] = "CARREGANDO";
    ProcessingStatus["FINALIZADO"] = "FINALIZADO";
    ProcessingStatus["ERRO"] = "ERRO";
    ProcessingStatus["CANCELADO"] = "CANCELADO";
})(ProcessingStatus || (exports.ProcessingStatus = ProcessingStatus = {}));
//# sourceMappingURL=etl.types.js.map