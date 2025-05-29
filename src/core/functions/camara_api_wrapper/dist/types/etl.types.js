/**
 * Tipos centralizados para o sistema ETL do Senado Federal
 *
 * Este arquivo define todas as interfaces e tipos utilizados
 * em todo o sistema ETL, garantindo consistência e type safety.
 */
/**
 * Status de processamento
 */
export var ProcessingStatus;
(function (ProcessingStatus) {
    ProcessingStatus["INICIADO"] = "INICIADO";
    ProcessingStatus["EXTRAINDO"] = "EXTRAINDO";
    ProcessingStatus["TRANSFORMANDO"] = "TRANSFORMANDO";
    ProcessingStatus["CARREGANDO"] = "CARREGANDO";
    ProcessingStatus["FINALIZADO"] = "FINALIZADO";
    ProcessingStatus["ERRO"] = "ERRO";
    ProcessingStatus["CANCELADO"] = "CANCELADO";
})(ProcessingStatus || (ProcessingStatus = {}));
//# sourceMappingURL=etl.types.js.map