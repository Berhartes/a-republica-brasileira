@echo off
echo Importando dados para o emulador do Firestore...

echo Importando estrutura organizada...
curl -X PATCH -H "Content-Type: application/json" -d "{\"fields\":{\"dados\":{\"stringValue\":\"Exemplo de estrutura organizada\"}}}" http://localhost:8080/v1/projects/a-republica-brasileira/databases/(default)/documents/estrutura_organizada/6358

echo Importando estrutura atual...
curl -X PATCH -H "Content-Type: application/json" -d "{\"fields\":{\"dados\":{\"stringValue\":\"Exemplo de estrutura atual\"}}}" http://localhost:8080/v1/projects/a-republica-brasileira/databases/(default)/documents/estrutura_atual/6358

echo Importação concluída!
echo Verifique os dados no console do emulador: http://localhost:4000/firestore
pause
