/**
 * Script para importar dados para o emulador do Firestore usando a API REST
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function importarDados() {
  try {
    console.log('Iniciando importação de dados para o emulador do Firestore...');
    
    // Ler o arquivo JSON
    const filePath = resolve(__dirname, '../dados_extraidos/senadores/perfis/exemplo_estrutura_organizada_completa.json');
    console.log('Lendo arquivo:', filePath);
    
    const fileContent = readFileSync(filePath, 'utf8');
    const senadorData = JSON.parse(fileContent);
    
    // URL base do emulador do Firestore
    const baseUrl = 'http://localhost:8080/v1/projects/a-republica-brasileira/databases/(default)/documents';
    
    // Importar dados para estrutura_organizada
    console.log('Importando dados para estrutura_organizada/6358...');
    
    const estruturaOrganizadaUrl = `${baseUrl}/estrutura_organizada/6358`;
    const estruturaOrganizadaResponse = await fetch(estruturaOrganizadaUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          dados: {
            stringValue: JSON.stringify(senadorData)
          }
        }
      })
    });
    
    if (estruturaOrganizadaResponse.ok) {
      console.log('Dados importados com sucesso para estrutura_organizada/6358');
    } else {
      console.error('Erro ao importar dados para estrutura_organizada/6358:', await estruturaOrganizadaResponse.text());
    }
    
    // Importar dados para estrutura_atual
    console.log('Importando dados para estrutura_atual/6358...');
    
    const estruturaAtualUrl = `${baseUrl}/estrutura_atual/6358`;
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
    
    const estruturaAtualResponse = await fetch(estruturaAtualUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          dados: {
            stringValue: JSON.stringify(dadosSimplificados)
          }
        }
      })
    });
    
    if (estruturaAtualResponse.ok) {
      console.log('Dados importados com sucesso para estrutura_atual/6358');
    } else {
      console.error('Erro ao importar dados para estrutura_atual/6358:', await estruturaAtualResponse.text());
    }
    
    console.log('\nImportação concluída com sucesso!');
    console.log('Você pode visualizar os dados no console do emulador: http://localhost:4000/firestore');
  } catch (error) {
    console.error('Erro ao importar dados:', error);
  }
}

importarDados();
