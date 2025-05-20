/**
 * Script wrapper para processar perfis de senadores
 * Este script simplesmente chama o script real na pasta src/core/functions/senado_api_wrapper/scripts/initiators/
 */

// Importar o script real
import { processarPerfilSenadores, processarPerfilSenadoresMultiplasLegislaturas } from '../src/core/functions/senado_api_wrapper/scripts/initiators/processar_perfilsenadores.js';

// Função para processar a legislatura específica de linha de comando
function processarLegislaturaEspecifica(): void {
  // Função para exibir ajuda
  function exibirAjuda() {
    console.log(`
Uso: npx ts-node -P tsconfig.scripts.json scripts/processar_perfilsenadores.ts [legislatura] [opções]

Argumentos:
  [legislatura]                Número da legislatura para processamento (opcional)
                              Se não fornecido, usa a legislatura atual

Opções:
  --limite, -l <número>       Limita o processamento a um número específico de senadores
  --exportar, -e              Exporta os dados para arquivos JSON
  --pc                        Salva a estrutura exata do Firestore no PC local
  --estrutura-original        Usa a estrutura original (não organizada) para exportação
  --estrutura-organizada      Usa a estrutura organizada para exportação (padrão)
  --ajuda, -h                 Exibe esta mensagem de ajuda
    `);
    process.exit(0);
  }

  const args = process.argv.slice(2);
  let legislatura: number | undefined;
  let exportarDados = false;
  let limiteSenadores: number | undefined = undefined;
  let salvarNoPC = false;
  let mostrarAjuda = false;
  let usarEstruturaOrganizada = true; // Padrão: usar estrutura organizada

  // Analisar argumentos
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--ajuda' || arg === '-h') {
      mostrarAjuda = true;
    } else if (arg === '--exportar' || arg === '-e') {
      exportarDados = true;
    } else if (arg === '--pc') {
      salvarNoPC = true;
      console.log('Flag --pc ativa: Dados serão salvos no PC local com a estrutura exata do Firestore');
    } else if (arg === '--estrutura-original') {
      usarEstruturaOrganizada = false;
      console.log('Flag --estrutura-original ativa: Usando estrutura original para exportação');
    } else if (arg === '--estrutura-organizada') {
      usarEstruturaOrganizada = true;
      console.log('Flag --estrutura-organizada ativa: Usando estrutura organizada para exportação');
    } else if (arg === '--limite' || arg === '-l') {
      const limite = parseInt(args[++i], 10);
      if (!isNaN(limite) && limite > 0) {
        limiteSenadores = limite;
        console.log(`Configurado limite de ${limiteSenadores} senadores para processamento`);
      } else {
        console.warn(`Limite inválido: ${args[i]}. Deve ser um número positivo.`);
      }
    } else if (i === 0 && !isNaN(parseInt(arg, 10))) {
      // Primeiro argumento numérico é tratado como legislatura
      const legislaturaArg = parseInt(arg, 10);
      if (legislaturaArg > 0 && legislaturaArg <= 58) {
        legislatura = legislaturaArg;
      } else {
        console.error(`Legislatura inválida: ${arg}. Deve ser um número entre 1 e 58.`);
        process.exit(1);
      }
    }
  }

  // Exibir ajuda se solicitado
  if (mostrarAjuda) {
    exibirAjuda();
  }

  // Processar legislatura específica ou atual
  processarPerfilSenadores(legislatura, salvarNoPC, limiteSenadores, usarEstruturaOrganizada)
    .then(() => {
      console.log('Processamento concluído com sucesso.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Falha no processamento de perfis de senadores', error);
      process.exit(1);
    });
}

// Executa o processamento se este arquivo for chamado diretamente
// Em ES modules, não existe require.main, então usamos uma abordagem diferente
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Verificar se este é o módulo principal
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  processarLegislaturaEspecifica();
}

export { processarPerfilSenadores, processarPerfilSenadoresMultiplasLegislaturas };
