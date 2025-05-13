@echo off
echo === Transferindo Dados da API do Senado para o Firestore Emulator ===
echo.
echo Verificando que os emuladores estão rodando...

set BASE_URL=http://localhost:5001/a-republica-brasileira-atual/us-central1

curl -s "%BASE_URL%/healthCheck" > nul
if %errorlevel% neq 0 (
    echo ERRO: Os emuladores não parecem estar rodando!
    echo Por favor, inicie os emuladores primeiro com 'start-firebase.bat'
    pause
    exit /b 1
)

echo Emuladores estão rodando. Iniciando transferência...
echo.

echo === Senadores ===
echo Transferindo senadores...
curl -s "%BASE_URL%/triggerETL?tipo=senadores&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Comissões ===
echo Transferindo comissões...
curl -s "%BASE_URL%/triggerETL?tipo=comissoes&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Votações ===
echo Transferindo votações...
curl -s "%BASE_URL%/triggerETL?tipo=votacoes&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Blocos Parlamentares ===
echo Transferindo blocos...
curl -s "%BASE_URL%/triggerETL?tipo=blocos&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Lideranças ===
echo Transferindo lideranças...
curl -s "%BASE_URL%/triggerETL?tipo=liderancas&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Mesas Diretoras ===
echo Transferindo mesas...
curl -s "%BASE_URL%/triggerETL?tipo=mesas&saveToFirestore=true&saveToStorage=true"
timeout /t 3 /nobreak > nul

echo.
echo === Transferência de dados concluída! ===
echo.
echo Os dados foram transferidos para o Firestore Emulator.
echo Abra http://localhost:4000 para visualizar os dados.
echo.
pause
