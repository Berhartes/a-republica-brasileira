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

// Reexportar todas as funcionalidades do Firestore
import * as firestoreModule from './firestore';
export { firestoreModule as firestore };
export { firestoreModule as firestoreBatch }; // Alias para compatibilidade

// Reexportar funcionalidades principais para conveniência
export { 
  createBatchManager, 
  saveToFirestore, 
  getFirestoreConfig,
  BatchManager 
} from './firestore';
