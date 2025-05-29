/**
 * Script de debug para fazer upload da estrutura organizada para o Firestore
 * com tratamento de erros detalhado
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Iniciando script de upload com debug...');

// Inicializar o Firebase Admin com credenciais explícitas
try {
  console.log('Inicializando Firebase Admin SDK...');
  
  admin.initializeApp({
    projectId: 'a-republica-brasileira'
  });
  
  console.log('Firebase Admin SDK inicializado com sucesso.');
} catch (error) {
  console.error('Erro ao inicializar Firebase Admin SDK:', error);
  process.exit(1);
}

// Configurar para usar o emulador
try {
  console.log('Configurando para usar o emulador do Firestore...');
  
  admin.firestore().settings({
    host: 'localhost:8080',
    ssl: false
  });
  
  console.log('Emulador do Firestore configurado com sucesso.');
} catch (error) {
  console.error('Erro ao configurar emulador do Firestore:', error);
  process.exit(1);
}

// Obter referência ao Firestore
let db;
try {
  console.log('Obtendo referência ao Firestore...');
  
  db = admin.firestore();
  
  console.log('Referência ao Firestore obtida com sucesso.');
} catch (error) {
  console.error('Erro ao obter referência ao Firestore:', error);
  process.exit(1);
}

// Ler o arquivo JSON
let senadorData;
try {
  console.log('Lendo arquivo JSON...');
  
  const filePath = resolve(__dirname, '../dados_extraidos/senadores/perfis/exemplo_estrutura_organizada_completa.json');
  console.log('Caminho do arquivo:', filePath);
  
  const fileContent = readFileSync(filePath, 'utf8');
  console.log('Arquivo lido com sucesso, tamanho:', fileContent.length, 'bytes');
  
  senadorData = JSON.parse(fileContent);
  console.log('Arquivo JSON parseado com sucesso.');
} catch (error) {
  console.error('Erro ao ler ou parsear arquivo JSON:', error);
  process.exit(1);
}

// Fazer upload para o Firestore
async function uploadToFirestore() {
  try {
    const codigoSenador = senadorData.identificacao.codigo;
    console.log(`Fazendo upload dos dados do senador ${senadorData.identificacao.nome} (${codigoSenador})...`);
    
    // Definir a referência para o documento no Firestore
    console.log('Criando referência ao documento...');
    const docRef = db.collection('estrutura_organizada').doc(codigoSenador);
    
    // Fazer o upload dos dados
    console.log('Iniciando upload dos dados...');
    await docRef.set(senadorData);
    
    console.log(`Upload concluído com sucesso! Os dados foram salvos em 'estrutura_organizada/${codigoSenador}'`);
    
    // Também salvar em uma coleção que simula a estrutura atual
    console.log('Salvando também na estrutura atual para comparação...');
    
    const docRefAtual = db.collection('congressoNacional').doc('senadoFederal').collection('perfis').doc(codigoSenador);
    
    const dadosSimplificados = {
      codigo: senadorData.identificacao.codigo,
      nome: senadorData.identificacao.nome,
      nomeCompleto: senadorData.identificacao.nomeCompleto,
      genero: senadorData.identificacao.genero,
      foto: senadorData.identificacao.foto,
      partido: senadorData.identificacao.partido,
      uf: senadorData.identificacao.uf,
      atualizadoEm: senadorData.metadados.atualizadoEm
    };
    
    console.log('Iniciando upload dos dados simplificados...');
    await docRefAtual.set(dadosSimplificados);
    
    console.log(`Dados também salvos na estrutura atual em 'congressoNacional/senadoFederal/perfis/${codigoSenador}'`);
    
    console.log('\nAgora você pode comparar as estruturas no console do Firebase:');
    console.log('1. Estrutura organizada: estrutura_organizada/' + codigoSenador);
    console.log('2. Estrutura atual: congressoNacional/senadoFederal/perfis/' + codigoSenador);
    
    console.log('\nProcesso concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao fazer upload para o Firestore:', error);
    
    // Mostrar detalhes adicionais do erro
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    if (error.details) {
      console.error('Detalhes do erro:', error.details);
    }
    
    process.exit(1);
  }
}

// Executar a função de upload
uploadToFirestore();
