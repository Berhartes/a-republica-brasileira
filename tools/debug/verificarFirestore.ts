/**
 * Script para verificar a estrutura de dados no Firestore
 * Este script verifica se os dados dos senadores estão sendo salvos nos caminhos corretos
 */

import { db } from '@/shared/services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { logger } from '@/app/monitoring/logger';

/**
 * Verifica se os dados dos senadores estão sendo salvos nos caminhos corretos
 */
export async function verificarDadosSenadores() {
  try {
    logger.info('Verificando dados dos senadores no Firestore...');

    // Verificar se o documento congressoNacional/senadoFederal existe
    const senadoRef = doc(db, 'congressoNacional/senadoFederal');
    const senadoDoc = await getDoc(senadoRef);
    
    if (!senadoDoc.exists()) {
      logger.error('Documento congressoNacional/senadoFederal não encontrado');
      return {
        status: 'error',
        message: 'Documento congressoNacional/senadoFederal não encontrado',
        paths: []
      };
    }
    
    logger.info('Documento congressoNacional/senadoFederal encontrado');

    // Verificar os caminhos onde os dados dos senadores podem estar
    const paths = [
      'congressoNacional/senadoFederal/perfis',
      'congressoNacional/senadoFederal/atual/senadores/itens',
      'congressoNacional/senadoFederal/legislaturas/57/senadores'
    ];

    const results = [];

    for (const path of paths) {
      try {
        const collectionRef = collection(db, path);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.empty) {
          logger.warn(`Coleção ${path} está vazia`);
          results.push({
            path,
            exists: true,
            empty: true,
            count: 0
          });
        } else {
          logger.info(`Coleção ${path} contém ${snapshot.size} documentos`);
          
          // Obter o primeiro documento para verificar a estrutura
          const firstDoc = snapshot.docs[0];
          const data = firstDoc.data();
          
          results.push({
            path,
            exists: true,
            empty: false,
            count: snapshot.size,
            sampleDocId: firstDoc.id,
            sampleDocFields: Object.keys(data)
          });
        }
      } catch (error) {
        logger.error(`Erro ao verificar coleção ${path}:`, error);
        results.push({
          path,
          exists: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      status: 'success',
      message: 'Verificação concluída',
      paths: results
    };
  } catch (error) {
    logger.error('Erro ao verificar dados dos senadores:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      paths: []
    };
  }
}

/**
 * Verifica se um senador específico existe no Firestore
 * @param senadorId ID do senador
 */
export async function verificarSenador(senadorId: string) {
  try {
    logger.info(`Verificando dados do senador ${senadorId} no Firestore...`);

    const paths = [
      `congressoNacional/senadoFederal/perfis/${senadorId}`,
      `congressoNacional/senadoFederal/atual/senadores/itens/${senadorId}`,
      `congressoNacional/senadoFederal/legislaturas/57/senadores/${senadorId}`
    ];

    const results = [];

    for (const path of paths) {
      try {
        const docRef = doc(db, path);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          logger.info(`Documento ${path} encontrado`);
          const data = docSnap.data();
          
          results.push({
            path,
            exists: true,
            data: {
              nome: data.nome,
              partido: data.partido?.sigla,
              uf: data.uf
            }
          });
        } else {
          logger.warn(`Documento ${path} não encontrado`);
          results.push({
            path,
            exists: false
          });
        }
      } catch (error) {
        logger.error(`Erro ao verificar documento ${path}:`, error);
        results.push({
          path,
          exists: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return {
      status: 'success',
      message: 'Verificação concluída',
      paths: results
    };
  } catch (error) {
    logger.error(`Erro ao verificar dados do senador ${senadorId}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : String(error),
      paths: []
    };
  }
}

export default {
  verificarDadosSenadores,
  verificarSenador
};
