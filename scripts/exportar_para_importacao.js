/**
 * Script para exportar os dados em formato compatível com importação manual no Firestore
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Iniciando exportação para formato de importação do Firestore...');

// Ler o arquivo JSON
try {
  console.log('Lendo arquivo JSON...');
  
  const filePath = resolve(__dirname, '../dados_extraidos/senadores/perfis/exemplo_estrutura_organizada_completa.json');
  console.log('Caminho do arquivo:', filePath);
  
  const fileContent = readFileSync(filePath, 'utf8');
  console.log('Arquivo lido com sucesso, tamanho:', fileContent.length, 'bytes');
  
  const senadorData = JSON.parse(fileContent);
  console.log('Arquivo JSON parseado com sucesso.');
  
  const codigoSenador = senadorData.identificacao.codigo;
  
  // Criar estrutura para importação no Firestore
  const estruturaOrganizada = {
    __collections__: {
      estrutura_organizada: {
        [codigoSenador]: {
          ...senadorData,
          __collections__: {}
        }
      },
      congressoNacional: {
        senadoFederal: {
          __collections__: {
            perfis: {
              [codigoSenador]: {
                codigo: senadorData.identificacao.codigo,
                nome: senadorData.identificacao.nome,
                nomeCompleto: senadorData.identificacao.nomeCompleto,
                genero: senadorData.identificacao.genero,
                foto: senadorData.identificacao.foto,
                partido: senadorData.identificacao.partido,
                uf: senadorData.identificacao.uf,
                mandatos: senadorData.mandatos,
                comissoes: senadorData.comissoes,
                atualizadoEm: senadorData.metadados.atualizadoEm,
                __collections__: {}
              }
            },
            atual: {
              __collections__: {
                senadores: {
                  __collections__: {
                    itens: {
                      [codigoSenador]: {
                        codigo: senadorData.identificacao.codigo,
                        nome: senadorData.identificacao.nome,
                        partido: senadorData.identificacao.partido,
                        uf: senadorData.identificacao.uf,
                        foto: senadorData.identificacao.foto,
                        emExercicio: senadorData.situacaoAtual.emExercicio,
                        atualizadoEm: senadorData.metadados.atualizadoEm,
                        __collections__: {}
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  
  // Salvar arquivo para importação
  const outputPath = resolve(__dirname, '../dados_extraidos/senadores/perfis/firestore_import.json');
  writeFileSync(outputPath, JSON.stringify(estruturaOrganizada, null, 2));
  
  console.log(`\nArquivo de importação salvo em: ${outputPath}`);
  console.log('\nComo importar manualmente:');
  console.log('1. Acesse o console do emulador do Firestore: http://localhost:4000/firestore');
  console.log('2. Clique no botão "Import/Export"');
  console.log('3. Selecione o arquivo firestore_import.json');
  console.log('4. Clique em "Import"');
  
  console.log('\nProcesso concluído com sucesso!');
} catch (error) {
  console.error('Erro:', error);
  process.exit(1);
}
