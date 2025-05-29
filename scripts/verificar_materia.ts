/**
 * Script para verificar os dados de matérias de um senador no Firestore
 * 
 * Uso: npx ts-node -P tsconfig.scripts.json scripts/verificar_materia.ts --senador 6331
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';

// Configurar argumentos da linha de comando
const argv = yargs
  .option('senador', {
    description: 'Código do senador',
    type: 'string',
    demandOption: true
  })
  .help()
  .alias('help', 'h')
  .parseSync();

// Inicializar Firebase Admin SDK
const serviceAccountPath = path.resolve(__dirname, '../src/core/functions/firebase_functions/serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://a-republica-brasileira.firebaseio.com'
});

// Verificar se estamos usando o emulador
const useEmulator = process.env.FIRESTORE_EMULATOR_HOST || false;
if (useEmulator) {
  console.log(`Usando emulador do Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
}

const db = getFirestore();

// Função principal
async function verificarMateria() {
  try {
    const codigoSenador = argv.senador;
    console.log(`Verificando matérias do senador ${codigoSenador}`);

    // Obter documento da matéria
    const materiaRef = db.doc(`congressoNacional/senadoFederal/materias/${codigoSenador}`);
    const materiaDoc = await materiaRef.get();

    if (!materiaDoc.exists) {
      console.error(`Matéria do senador ${codigoSenador} não encontrada`);
      process.exit(1);
    }

    const materiaData = materiaDoc.data();
    
    // Exibir informações básicas
    console.log(`\nInformações básicas do senador ${codigoSenador}:`);
    console.log(`Nome: ${materiaData?.senador?.nome}`);
    console.log(`Partido: ${materiaData?.senador?.partido?.sigla}`);
    console.log(`UF: ${materiaData?.senador?.uf}`);
    
    // Exibir estatísticas
    console.log(`\nEstatísticas de autorias:`);
    console.log(`Total: ${materiaData?.estatisticasAutorias?.total}`);
    console.log(`Individuais: ${materiaData?.estatisticasAutorias?.individual} (${materiaData?.estatisticasAutorias?.percentualIndividual}%)`);
    console.log(`Coautorias: ${materiaData?.estatisticasAutorias?.coautoria} (${materiaData?.estatisticasAutorias?.percentualCoautoria}%)`);
    console.log(`Coletivas: ${materiaData?.estatisticasAutorias?.coletiva} (${materiaData?.estatisticasAutorias?.percentualColetiva}%)`);
    
    // Verificar campos de autorias
    console.log(`\nCampos de autorias:`);
    console.log(`autorias: ${materiaData?.autorias?.length || 0} itens`);
    console.log(`autoriasIndividuais: ${materiaData?.autoriasIndividuais?.length || 0} itens`);
    console.log(`coautorias: ${materiaData?.coautorias?.length || 0} itens`);
    console.log(`autoriasColetivas: ${materiaData?.autoriasColetivas?.length || 0} itens`);
    
    // Exibir exemplos de cada tipo
    if (materiaData?.autoriasIndividuais?.length > 0) {
      console.log(`\nExemplo de autoria individual:`);
      console.log(JSON.stringify(materiaData.autoriasIndividuais[0], null, 2));
    }
    
    if (materiaData?.coautorias?.length > 0) {
      console.log(`\nExemplo de coautoria:`);
      console.log(JSON.stringify(materiaData.coautorias[0], null, 2));
    }
    
    if (materiaData?.autoriasColetivas?.length > 0) {
      console.log(`\nExemplo de autoria coletiva:`);
      console.log(JSON.stringify(materiaData.autoriasColetivas[0], null, 2));
    }
    
    console.log(`\nVerificação concluída com sucesso`);
  } catch (error) {
    console.error(`Erro ao verificar matéria: ${error.message}`);
    process.exit(1);
  }
}

// Executar função principal
verificarMateria();
