/**
 * Script para fazer upload da estrutura organizada para o Firestore
 * 
 * Este script lê o arquivo de exemplo com a estrutura organizada e
 * faz o upload para o Firestore em uma coleção separada para comparação.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';

// Inicializar o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'a-republica-brasileira',
  });

  // Configurar para usar o emulador se a variável de ambiente estiver definida
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`Usando emulador do Firestore: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    admin.firestore().settings({
      host: process.env.FIRESTORE_EMULATOR_HOST,
      ssl: false
    });
  }
}

const db = admin.firestore();

/**
 * Faz o upload da estrutura organizada para o Firestore
 */
async function uploadEstruturaOrganizada() {
  try {
    console.log('Iniciando upload da estrutura organizada para o Firestore...');
    
    // Caminho para o arquivo de exemplo
    const filePath = path.resolve(__dirname, '../dados_extraidos/senadores/perfis/exemplo_estrutura_organizada_completa.json');
    
    // Ler o arquivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const senadorData = JSON.parse(fileContent);
    
    // Obter o código do senador
    const codigoSenador = senadorData.identificacao.codigo;
    
    console.log(`Fazendo upload dos dados do senador ${senadorData.identificacao.nome} (${codigoSenador})...`);
    
    // Definir a referência para o documento no Firestore
    // Usando uma coleção separada para comparação
    const docRef = db.collection('estrutura_organizada').doc(codigoSenador);
    
    // Fazer o upload dos dados
    await docRef.set(senadorData);
    
    console.log(`Upload concluído com sucesso! Os dados foram salvos em 'estrutura_organizada/${codigoSenador}'`);
    console.log('Você pode visualizar e comparar as estruturas no console do Firebase.');
    
    // Também salvar em uma coleção que simula a estrutura atual para facilitar a comparação
    console.log('Salvando também na estrutura atual para comparação...');
    
    const docRefAtual = db.collection('congressoNacional/senadoFederal/perfis').doc(codigoSenador);
    await docRefAtual.set({
      codigo: senadorData.identificacao.codigo,
      nome: senadorData.identificacao.nome,
      nomeCompleto: senadorData.identificacao.nomeCompleto,
      genero: senadorData.identificacao.genero,
      foto: senadorData.identificacao.foto,
      paginaOficial: senadorData.identificacao.paginaOficial,
      paginaParticular: senadorData.identificacao.paginaParticular,
      email: senadorData.identificacao.email,
      partido: senadorData.identificacao.partido,
      uf: senadorData.identificacao.uf,
      telefones: senadorData.identificacao.telefones,
      situacaoAtual: senadorData.situacaoAtual,
      dadosPessoais: senadorData.dadosPessoais,
      mandatos: senadorData.mandatos,
      cargos: senadorData.cargos,
      comissoes: senadorData.comissoes,
      filiacoes: senadorData.filiacoes,
      formacao: senadorData.formacao,
      licencas: senadorData.licencas,
      liderancas: senadorData.liderancas,
      atualizadoEm: senadorData.metadados.atualizadoEm
    });
    
    console.log(`Dados também salvos na estrutura atual em 'congressoNacional/senadoFederal/perfis/${codigoSenador}'`);
    
    // Também salvar na estrutura atual/senadores/itens para completar a comparação
    console.log('Salvando também na estrutura atual/senadores/itens para completar a comparação...');
    
    const docRefAtualItem = db.collection('congressoNacional/senadoFederal/atual/senadores/itens').doc(codigoSenador);
    await docRefAtualItem.set({
      codigo: senadorData.identificacao.codigo,
      nome: senadorData.identificacao.nome,
      partido: senadorData.identificacao.partido,
      uf: senadorData.identificacao.uf,
      foto: senadorData.identificacao.foto,
      emExercicio: senadorData.situacaoAtual.emExercicio,
      atualizadoEm: senadorData.metadados.atualizadoEm
    });
    
    console.log(`Dados também salvos na estrutura atual/senadores/itens em 'congressoNacional/senadoFederal/atual/senadores/itens/${codigoSenador}'`);
    
    console.log('\nAgora você pode comparar as estruturas no console do Firebase:');
    console.log('1. Estrutura organizada: estrutura_organizada/' + codigoSenador);
    console.log('2. Estrutura atual: congressoNacional/senadoFederal/perfis/' + codigoSenador);
    console.log('3. Estrutura atual/senadores/itens: congressoNacional/senadoFederal/atual/senadores/itens/' + codigoSenador);
    
  } catch (error) {
    console.error('Erro ao fazer upload da estrutura organizada:', error);
    throw error;
  }
}

// Executar a função principal
uploadEstruturaOrganizada()
  .then(() => {
    console.log('Processo concluído com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Falha no processo:', error);
    process.exit(1);
  });
