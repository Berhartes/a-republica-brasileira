@echo off
REM Script batch para processar perfis de deputados
REM Este script simplesmente chama o script real na pasta src/core/functions/camara_api_wrapper/scripts/initiators/

echo Executando script de processamento de perfis de deputados...

REM Passar todos os argumentos para o script
cd %~dp0..
npx ts-node -P tsconfig.scripts.json src/core/functions/camara_api_wrapper/scripts/initiators/processar_perfildeputados.ts %*

REM Retornar o código de saída do script
exit /b %errorlevel%
