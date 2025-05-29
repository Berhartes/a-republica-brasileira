@echo off
echo === Inicializando Firebase Emulators com as Funções ETL do Senado ===

echo.
echo Instalando dependências das funções...
cd src\core\functions\senado_api_wrapper
call npm install
cd ..\..\..\..\

echo.
echo Compilando as funções...
npm --prefix "src\core\functions\senado_api_wrapper" run build

echo.
echo Iniciando os emuladores...
firebase emulators:start

echo.
echo Emuladores finalizados.
pause
