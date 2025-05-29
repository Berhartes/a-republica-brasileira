@echo off
echo Processando perfis de deputados...
npx ts-node -P tsconfig.scripts.json src\core\functions\camara_api_wrapper\scripts\initiators\processar_perfildeputados.ts --limite 10 --pc
pause
