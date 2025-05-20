/**
 * Script para verificar os dados no Firestore
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Caminho para o arquivo de credenciais de serviço
const serviceAccountPath = path.resolve(process.cwd(), 'config', 'serviceAccountKey.json');

// Verificar se o arquivo de credenciais existe
if (!fs.existsSync(serviceAccountPath)) {
  throw new Error(`Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
}

// Inicializar o Firebase Admin SDK
initializeApp({
  credential: cert(serviceAccountPath)
});
console.log('Firebase Admin SDK inicializado com sucesso');

// Obter instância do Firestore
const db = getFirestore();
db.settings({
  ignoreUndefinedProperties: true
});
console.log('Conexão com Firestore estabelecida');

// Função para verificar os dados no Firestore
async function verificarDados() {
  try {
    console.log('=== Verificando dados no Firestore ===');

    // Verificar coleções de primeiro nível
    console.log('\n=== Coleções de primeiro nível ===');

    // Verificar comissões
    const comissoesSnapshot = await db.collection('comissoes').get();
    console.log(`Comissões: ${comissoesSnapshot.size} documentos`);

    // Verificar índices de comissões
    const comissoesIndicesSnapshot = await db.collection('comissoes_indices').get();
    console.log(`Índices de comissões: ${comissoesIndicesSnapshot.size} documentos`);

    // Verificar referências de comissões
    const comissoesReferenciasSnapshot = await db.collection('comissoes_referencias').get();
    console.log(`Referências de comissões: ${comissoesReferenciasSnapshot.size} documentos`);

    // Verificar histórico de comissões
    const comissoesHistoricoSnapshot = await db.collection('comissoes_historico').get();
    console.log(`Histórico de comissões: ${comissoesHistoricoSnapshot.size} documentos`);

    // Verificar mesas
    const mesasSnapshot = await db.collection('mesas').get();
    console.log(`Mesas: ${mesasSnapshot.size} documentos`);

    // Verificar membros de mesas
    const mesasMembrosSnapshot = await db.collection('mesas_membros').get();
    console.log(`Membros de mesas: ${mesasMembrosSnapshot.size} documentos`);

    // Verificar lideranças
    const liderancasSnapshot = await db.collection('liderancas').get();
    console.log(`Lideranças: ${liderancasSnapshot.size} documentos`);

    // Verificar referências de tipos de liderança
    const referenciasTiposLiderancaSnapshot = await db.collection('referencias_tiposLideranca').get();
    console.log(`Referências de tipos de liderança: ${referenciasTiposLiderancaSnapshot.size} documentos`);

    // Verificar referências de tipos de unidade
    const referenciasTiposUnidadeSnapshot = await db.collection('referencias_tiposUnidade').get();
    console.log(`Referências de tipos de unidade: ${referenciasTiposUnidadeSnapshot.size} documentos`);

    // Verificar referências de tipos de cargo
    const referenciasTiposCargoSnapshot = await db.collection('referencias_tiposCargo').get();
    console.log(`Referências de tipos de cargo: ${referenciasTiposCargoSnapshot.size} documentos`);

    // Verificar metadados
    const metadataSnapshot = await db.collection('metadata').get();
    console.log(`Metadados: ${metadataSnapshot.size} documentos`);

    // Verificar estrutura aninhada do Congresso Nacional
    console.log('\n=== Estrutura do Congresso Nacional ===');

    // Verificar se o documento congressoNacional/senadoFederal existe
    const senadoFederalDoc = await db.doc('congressoNacional/senadoFederal').get();
    console.log(`Documento congressoNacional/senadoFederal: ${senadoFederalDoc.exists ? 'existe' : 'não existe'}`);

    // Verificar senadores na estrutura atual
    try {
      const senadoresAtualDoc = await db.doc('congressoNacional/senadoFederal/atual/senadores').get();
      console.log(`Documento atual/senadores: ${senadoresAtualDoc.exists ? 'existe' : 'não existe'}`);

      if (senadoresAtualDoc.exists) {
        const data = senadoresAtualDoc.data();
        console.log(`  Total de senadores: ${data?.total || 0}`);
        console.log(`  Legislatura: ${data?.legislatura || 'N/A'}`);
      }

      // Verificar itens de senadores
      const senadoresItensSnapshot = await db.collection('congressoNacional/senadoFederal/atual/senadores/itens').get();
      console.log(`Senadores (atual/itens): ${senadoresItensSnapshot.size} documentos`);
    } catch (error) {
      console.log(`Erro ao verificar senadores atuais: ${error.message}`);
    }

    // Verificar comissões na estrutura atual
    try {
      // Verificar itens de comissões
      const comissoesItensSnapshot = await db.collection('congressoNacional/senadoFederal/atual/comissoes/itens').get();
      console.log(`Comissões (atual/itens): ${comissoesItensSnapshot.size} documentos`);

      // Verificar metadados de comissões
      const comissoesMetadataDoc = await db.doc('congressoNacional/senadoFederal/metadata/comissoes').get();
      console.log(`Metadados de comissões: ${comissoesMetadataDoc.exists ? 'existe' : 'não existe'}`);

      // Verificar índices de comissões
      const indicesComissoesPorCodigoDoc = await db.doc('congressoNacional/senadoFederal/indices/comissoes_porCodigo').get();
      console.log(`Índices de comissões por código: ${indicesComissoesPorCodigoDoc.exists ? 'existe' : 'não existe'}`);

      // Verificar referências de comissões
      const referenciasComissoesTiposDoc = await db.doc('congressoNacional/senadoFederal/referencias/comissoes_tipos').get();
      console.log(`Referências de tipos de comissões: ${referenciasComissoesTiposDoc.exists ? 'existe' : 'não existe'}`);
    } catch (error) {
      console.log(`Erro ao verificar comissões: ${error.message}`);
    }

    // Verificar lideranças na estrutura atual
    try {
      // Verificar itens de lideranças
      const liderancasItensSnapshot = await db.collection('congressoNacional').doc('senadoFederal').collection('atual').doc('liderancas').collection('itens').get();
      console.log(`Lideranças (atual/itens): ${liderancasItensSnapshot.size} documentos`);

      // Verificar metadados de lideranças
      const liderancasMetadataDoc = await db.collection('congressoNacional').doc('senadoFederal').collection('metadata').doc('liderancas').get();
      console.log(`Metadados de lideranças: ${liderancasMetadataDoc.exists ? 'existe' : 'não existe'}`);

      // Verificar referências de tipos de liderança
      const tiposLiderancaSnapshot = await db.collection('congressoNacional').doc('senadoFederal').collection('referencias').doc('tiposLideranca').collection('itens').get();
      console.log(`Referências de tipos de liderança: ${tiposLiderancaSnapshot.size} documentos`);

      // Verificar referências de tipos de unidade
      const tiposUnidadeSnapshot = await db.collection('congressoNacional').doc('senadoFederal').collection('referencias').doc('tiposUnidade').collection('itens').get();
      console.log(`Referências de tipos de unidade: ${tiposUnidadeSnapshot.size} documentos`);

      // Verificar referências de tipos de cargo
      const tiposCargoSnapshot = await db.collection('congressoNacional').doc('senadoFederal').collection('referencias').doc('tiposCargo').collection('itens').get();
      console.log(`Referências de tipos de cargo: ${tiposCargoSnapshot.size} documentos`);
    } catch (error) {
      console.log(`Erro ao verificar lideranças: ${error.message}`);
    }

    // Verificar legislaturas
    try {
      const legislaturasSnapshot = await db.collection('congressoNacional/senadoFederal/legislaturas').get();
      console.log(`Legislaturas: ${legislaturasSnapshot.size} documentos`);

      // Para cada legislatura, verificar senadores e comissões
      for (const legislaturaDoc of legislaturasSnapshot.docs) {
        const legislaturaId = legislaturaDoc.id;

        try {
          const senadoresLegislaturaSnapshot = await db.collection(`congressoNacional/senadoFederal/legislaturas/${legislaturaId}/senadores`).get();
          console.log(`  Senadores na legislatura ${legislaturaId}: ${senadoresLegislaturaSnapshot.size} documentos`);
        } catch (error) {
          console.log(`  Erro ao verificar senadores na legislatura ${legislaturaId}: ${error.message}`);
        }

        try {
          const comissoesLegislaturaSnapshot = await db.collection(`congressoNacional/senadoFederal/legislaturas/${legislaturaId}/comissoes`).get();
          console.log(`  Comissões na legislatura ${legislaturaId}: ${comissoesLegislaturaSnapshot.size} documentos`);
        } catch (error) {
          console.log(`  Erro ao verificar comissões na legislatura ${legislaturaId}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log(`Erro ao verificar legislaturas: ${error.message}`);
    }

    // Verificar blocos na estrutura atual
    try {
      const blocosItensSnapshot = await db.collection('congressoNacional/senadoFederal/atual/blocos/itens').get();
      console.log(`Blocos (atual/itens): ${blocosItensSnapshot.size} documentos`);

      // Verificar metadados de blocos
      const blocosMetadataDoc = await db.doc('congressoNacional/senadoFederal/metadata/blocos').get();
      console.log(`Metadados de blocos: ${blocosMetadataDoc.exists ? 'existe' : 'não existe'}`);

      if (blocosMetadataDoc.exists) {
        const data = blocosMetadataDoc.data();
        console.log(`  Total de blocos: ${data?.totalRegistros || 0}`);
        console.log(`  Legislatura: ${data?.legislatura || 'N/A'}`);
      }
    } catch (error) {
      console.log(`Erro ao verificar blocos: ${error.message}`);
    }

    console.log('=== Verificação concluída ===');
  } catch (error) {
    console.error('Erro ao verificar dados:', error);
  }
}

// Executar a verificação
verificarDados()
  .then(() => {
    console.log('Verificação concluída com sucesso');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erro na verificação:', error);
    process.exit(1);
  });
