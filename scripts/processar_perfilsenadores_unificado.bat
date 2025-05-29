@echo off
REM Script batch unificado para processar perfis de senadores
REM Este script usa o wrapper unificado em JavaScript

echo Executando script unificado de processamento de perfis de senadores...

REM Passar todos os argumentos para o script
cd %~dp0..
node scripts/processar_perfilsenadores_unificado.js %*

REM Retornar o código de saída do script
exit /b %errorlevel%
