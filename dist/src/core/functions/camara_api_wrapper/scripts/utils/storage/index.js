"use strict";
/**
 * Sistema de Armazenamento Unificado
 *
 * Este módulo oferece uma interface unificada para diferentes sistemas de armazenamento,
 * incluindo Firestore, armazenamento local, e outros.
 *
 * @example
 * ```typescript
 * import { firestore, firestoreBatch } from '../utils/storage';
 *
 * // Usar Firestore
 * const batch = firestoreBatch.createBatchManager();
 * await firestore.saveToFirestore('senadores', '123', data);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirestoreConfig = exports.saveToFirestore = exports.createBatchManager = exports.firestoreBatch = exports.firestore = void 0;
const tslib_1 = require("tslib");
// Reexportar todas as funcionalidades do Firestore
const firestoreModule = tslib_1.__importStar(require("./firestore"));
exports.firestore = firestoreModule;
exports.firestoreBatch = firestoreModule;
// Reexportar funcionalidades principais para conveniência
var firestore_1 = require("./firestore");
Object.defineProperty(exports, "createBatchManager", { enumerable: true, get: function () { return firestore_1.createBatchManager; } });
Object.defineProperty(exports, "saveToFirestore", { enumerable: true, get: function () { return firestore_1.saveToFirestore; } });
Object.defineProperty(exports, "getFirestoreConfig", { enumerable: true, get: function () { return firestore_1.getFirestoreConfig; } });
//# sourceMappingURL=index.js.map