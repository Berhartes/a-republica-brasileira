import * as functions from 'firebase-functions';
import admin from 'firebase-admin'; // Importar o admin default
// import { initializeAppCheck } from 'firebase-admin/app-check'; // App Check não é usado aqui
import { initializeFirebaseAdmin } from '../../../../config/firebase/firebase-admin-init'; // Corrigido o nome da função
import axios from 'axios';
import { Response } from 'express'; 

// Inicializar o Firebase Admin SDK usando a função centralizada
initializeFirebaseAdmin();
const db = admin.firestore();

// Função de exemplo: busca dados do wrapper e grava no Firestore
export const importarSenado = functions.https.onRequest(async (req: functions.https.Request, res: Response) => {
  try {
    // Altere a URL abaixo para o endpoint do seu wrapper local
    const response = await axios.get('http://localhost:3000/api/senado/exemplo');
    const dados = response.data;

    // Grava no Firestore (coleção de exemplo)
    await db.collection('senado_exemplo').add(dados);

    res.status(200).send({ sucesso: true, dados });
  } catch (error) {
    console.error(error);
    const mensagem = error instanceof Error ? error.message : String(error);
    res.status(500).send({ sucesso: false, erro: mensagem });
  }
});
