# Tutorial: Usando o Wrapper SenadoApiWrapper pelo Shell

Este tutorial ensina como rodar scripts que utilizam o wrapper `SenadoApiWrapper` para acessar a API de Dados Abertos do Senado Federal, usando comandos no shell.

---

## 1. Pré-requisitos

- Ter o Node.js e o pnpm instalados.
- Ter as dependências do projeto instaladas:
  ```sh
  pnpm install
  ```
- Ter o TypeScript e o ts-node instalados (já incluídos nas dependências de desenvolvimento):
  ```sh
  pnpm add -D typescript ts-node @types/node
  ```
- Ter o `axios` instalado:
  ```sh
  pnpm add axios
  ```

---

## 2. Rodando um script de exemplo

Já existe um exemplo pronto em:
```
src/core/functions/senado_api_wrapper/examples/basic_usage.ts
```

Para rodar este exemplo, use o comando:
```sh
pnpm exec ts-node src/core/functions/senado_api_wrapper/examples/basic_usage.ts
```

O script irá:
- Listar senadores em exercício
- Listar comissões ativas
- Listar partidos políticos
- Tentar obter detalhes de senador, comissão, mesa diretora e sessões plenárias

Os resultados aparecerão no terminal.

---

## 3. Criando e rodando seu próprio script

1. **Crie um novo arquivo TypeScript**
   
   Exemplo: `meu_teste_senado.ts` (pode ser na raiz do projeto ou em qualquer pasta)

2. **Implemente o código usando o wrapper**
   
   Exemplo de conteúdo:
   ```typescript
   import { SenadoApiWrapper } from '../src/core/functions/senado_api_wrapper/src';

   const senadoApi = new SenadoApiWrapper();

   async function main() {
     const senadores = await senadoApi.parlamentar.listarParlamentares({ emExercicio: true });
     console.log(senadores);
   }

   main();
   ```
   > Ajuste o caminho do import conforme a localização do seu arquivo.

3. **Rode o script pelo shell:**
   ```sh
   pnpm exec ts-node caminho/para/meu_teste_senado.ts
   ```

---

## 4. Dicas úteis

- Use sempre `pnpm exec ts-node` para rodar arquivos `.ts` sem precisar compilar antes.
- Para rodar arquivos já compilados (`.js`), use `node caminho/para/arquivo.js`.
- Para ver logs ou erros, basta olhar o terminal após rodar o comando.
- Consulte o arquivo `USAGE_EXAMPLES.md` para mais exemplos de uso do wrapper.

---

## 5. Explorando outros endpoints

Veja o arquivo `USAGE_EXAMPLES.md` para exemplos de como acessar:
- Detalhes de senador
- Mandatos
- Comissões
- Partidos
- Sessões plenárias
- Votações

Você pode adaptar qualquer exemplo para criar seu próprio script!

---

**Dúvidas?**
Se precisar de um exemplo customizado, peça para o assistente criar um script para você! 