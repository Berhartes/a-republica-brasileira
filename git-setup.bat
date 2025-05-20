@echo off
echo Configurando Git e enviando para o GitHub...

echo 1. Adicionando alterações ao stage...
git add .

echo 2. Fazendo commit das alterações...
git commit -m "Commit inicial do projeto A República Brasileira"

echo 3. Verificando se o repositório remoto já está configurado...
git remote -v

echo 4. Se não houver um repositório remoto configurado, você precisará criar um no GitHub e executar:
echo git remote add origin URL_DO_SEU_REPOSITORIO
echo git push -u origin main

echo 5. Se o repositório remoto já estiver configurado, envie as alterações:
git push

echo Processo concluído!
