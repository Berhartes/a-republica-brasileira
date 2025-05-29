/**
 * Script simplificado para fazer upload da estrutura organizada para o Firestore
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicializar o Firebase Admin
admin.initializeApp({
  projectId: 'a-republica-brasileira',
});

// Configurar para usar o emulador
console.log('Usando emulador do Firestore: localhost:8080');
admin.firestore().settings({
  host: 'localhost:8080',
  ssl: false
});

const db = admin.firestore();

async function main() {
  try {
    console.log('Iniciando upload da estrutura organizada para o Firestore...');
    
    // Caminho para o arquivo de exemplo
    const filePath = resolve(__dirname, '../dados_extraidos/senadores/perfis/exemplo_estrutura_organizada_completa.json');
    
    // Ler o arquivo
    const fileContent = readFileSync(filePath, 'utf8');
    const senadorData = JSON.parse(fileContent);
    
    // Obter o código do senador
    const codigoSenador = senadorData.identificacao.codigo;
    
    console.log(`Fazendo upload dos dados do senador ${senadorData.identificacao.nome} (${codigoSenador})...`);
    
    // Definir a referência para o documento no Firestore
    const docRef = db.collection('estrutura_organizada').doc(codigoSenador);
    
    // Fazer o upload dos dados
    await docRef.set(senadorData);
    
    console.log(`Upload concluído com sucesso! Os dados foram salvos em 'estrutura_organizada/${codigoSenador}'`);
    
    // Também salvar em uma coleção que simula a estrutura atual
    console.log('Salvando também na estrutura atual para comparação...');
    
    const docRefAtual = db.collection('congressoNacional/senadoFederal/perfis').doc(codigoSenador);
    await docRefAtual.set({
      codigo: senadorData.identificacao.codigo,
      nome: senadorData.identificacao.nome,
      nomeCompleto: senadorData.identificacao.nomeCompleto,
      genero: senadorData.identificacao.genero,
      foto: senadorData.identificacao.foto,
      partido: senadorData.identificacao.partido,
      uf: senadorData.identificacao.uf,
      mandatos: senadorData.mandatos,
      comissoes: senadorData.comissoes,
      atualizadoEm: senadorData.metadados.atualizadoEm
    });
    
    console.log(`Dados também salvos na estrutura atual em 'congressoNacional/senadoFederal/perfis/${codigoSenador}'`);
    
    console.log('\nAgora você pode comparar as estruturas no console do Firebase:');
    console.log('1. Estrutura organizada: estrutura_organizada/' + codigoSenador);
    console.log('2. Estrutura atual: congressoNacional/senadoFederal/perfis/' + codigoSenador);
    
    console.log('\nProcesso concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao fazer upload da estrutura organizada:', error);
  }
}

main();
