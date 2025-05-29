/**
 * Funções auxiliares para interações com o Firestore na Camara API Wrapper.
 */
import { logger } from '../../logging';

/**
 * Valida e normaliza um caminho de coleção e um ID de documento para uso com o Firestore.
 * Garante que ambos não sejam vazios e remove barras extras.
 *
 * @param collectionPath O caminho da coleção.
 * @param documentId O ID do documento.
 * @returns Um objeto contendo o caminho da coleção e o ID do documento validados.
 * @throws Error se o caminho da coleção ou o ID do documento forem inválidos.
 */
export function parseFirestorePath(
  collectionPath: string,
  documentId: string,
): { collectionPath: string; documentId: string } {
  if (typeof collectionPath !== 'string' || collectionPath.trim() === '') {
    const errorMsg = 'Caminho da coleção inválido. Não pode ser vazio.';
    logger.error(errorMsg, { collectionPath, documentId });
    throw new Error(errorMsg);
  }

  if (typeof documentId !== 'string' || documentId.trim() === '') {
    const errorMsg = 'ID do documento inválido. Não pode ser vazio.';
    logger.error(errorMsg, { collectionPath, documentId });
    throw new Error(errorMsg);
  }

  // Remove barras extras no início ou fim
  const cleanedCollectionPath = collectionPath.replace(/^\/+|\/+$/g, '');
  const cleanedDocumentId = documentId.replace(/^\/+|\/+$/g, '');

  if (cleanedCollectionPath === '') {
    const errorMsg = 'Caminho da coleção resultante inválido após limpeza.';
    logger.error(errorMsg, { originalPath: collectionPath });
    throw new Error(errorMsg);
  }

  if (cleanedDocumentId === '') {
    const errorMsg = 'ID do documento resultante inválido após limpeza.';
    logger.error(errorMsg, { originalId: documentId });
    throw new Error(errorMsg);
  }
  
  // Verifica se o caminho da coleção tem um número ímpar de segmentos
  // Coleções sempre devem ter um número ímpar de segmentos no caminho completo do documento.
  // Ex: /colecao1/{docId1}/colecao2/{docId2} -> colecao2 está no 3º segmento.
  // No entanto, aqui estamos validando o collectionPath fornecido para o batch manager,
  // que é apenas o nome da coleção, não o caminho completo do documento.
  // Portanto, a validação de segmentos ímpares não se aplica diretamente aqui.

  return {
    collectionPath: cleanedCollectionPath,
    documentId: cleanedDocumentId,
  };
}
