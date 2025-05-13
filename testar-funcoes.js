import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';

// Inicializar o Firebase Admin SDK com emuladores
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8000';
process.env.FIREBASE_DATABASE_EMULATOR_HOST = '127.0.0.1:9000';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';
process.env.FUNCTIONS_EMULATOR = 'true';

const app = initializeApp({
  projectId: 'a-republica-brasileira'
});

const db = getFirestore();
db.settings({ 
  host: '127.0.0.1:8000',
  ssl: false
});

// Aguardar um momento para garantir que o emulador está pronto
await new Promise(resolve => setTimeout(resolve, 1000));

// Função para testar operações básicas do Firestore
async function testarOperacoesFirestore() {
  try {
    console.log('Iniciando testes do Firestore emulator...');
    
    // Teste 1: Escrever um documento
    console.log('Teste 1: Escrevendo documento...');
    const docRef = db.collection('testes').doc('documento1');
    await docRef.set({
      campo1: 'valor1',
      numero: 42,
      booleano: true,
      timestamp: new Date(),
      objeto: {
        subcampo1: 'subvalor1',
        subcampo2: 'subvalor2'
      }
    });
    console.log('✅ Documento escrito com sucesso!');
    
    // Teste 2: Ler um documento
    console.log('Teste 2: Lendo documento...');
    const docSnap = await docRef.get();
    console.log('Dados do documento:', docSnap.data());
    
    // Teste 3: Atualizar um documento
    console.log('Teste 3: Atualizando documento...');
    await docRef.update({
      campo1: 'valor atualizado',
      'objeto.subcampo1': 'subvalor atualizado'
    });
    const docSnapAtualizado = await docRef.get();
    console.log('Dados atualizados:', docSnapAtualizado.data());
    
    // Teste 4: Consulta com where
    console.log('Teste 4: Executando consulta com where...');
    await db.collection('testes').doc('documento2').set({ tipo: 'teste', valor: 10 });
    await db.collection('testes').doc('documento3').set({ tipo: 'teste', valor: 20 });
    await db.collection('testes').doc('documento4').set({ tipo: 'outro', valor: 30 });
    
    const querySnapshot = await db.collection('testes')
      .where('tipo', '==', 'teste')
      .get();
    
    console.log(`Encontrados ${querySnapshot.size} documentos na consulta:`);
    querySnapshot.forEach(doc => {
      console.log(`- ${doc.id}:`, doc.data());
    });
    
    // Teste 5: Excluir um documento
    console.log('Teste 5: Excluindo documento...');
    await docRef.delete();
    const docSnapExcluido = await docRef.get();
    console.log('Documento existe após exclusão?', docSnapExcluido.exists);
    
    console.log('✅ Todos os testes do Firestore concluídos com sucesso!');
  } catch (error) {
    console.error('❌ Erro nos testes do Firestore:', error);
  }
}

// Função para testar a função de estrutura
async function testarEstrutura() {
  try {
    console.log('\n🔄 Testando função de estrutura...');
    
    // Chamando a função triggerEstrutura
    console.log('Chamando triggerEstrutura...');
    const response = await axios.post(
      'http://127.0.0.1:5001/a-republica-brasileira/southamerica-east1/triggerEstrutura',
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      }
    );
    
    console.log('✅ Resposta da função estrutura:', response.data);
    
    // Verificar se os dados foram salvos no Firestore
    console.log('\nVerificando dados no Firestore...');
    
    // Verificar documento do Senado Federal
    const senadoDoc = await db.collection('congressoNacional').doc('senadoFederal').get();
    if (senadoDoc.exists) {
      console.log('✅ Dados do Senado Federal salvos:', senadoDoc.data());
      
      // Verificar metadata da legislatura
      const metadataDoc = await db.collection('congressoNacional')
        .doc('senadoFederal')
        .collection('metadata')
        .doc('legislatura')
        .get();
      
      if (metadataDoc.exists) {
        console.log('✅ Metadata da legislatura:', metadataDoc.data());
      } else {
        console.log('❌ Metadata da legislatura não encontrada');
      }
    } else {
      console.log('❌ Dados do Senado Federal não encontrados');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar função de estrutura:', error.message);
    if (error.response) {
      console.error('Detalhes do erro:', error.response.data);
    }
  }
}

// Executar o teste de estrutura
async function executarTestes() {
  try {
    await testarEstrutura();
  } catch (error) {
    console.error('Erro ao executar testes:', error);
  }
}

executarTestes();
