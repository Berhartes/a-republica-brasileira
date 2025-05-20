# Script PowerShell para importar dados para o emulador do Firestore

# Importar dados da estrutura organizada
$jsonContent = Get-Content -Path "dados_extraidos\senadores\perfis\exemplo_estrutura_organizada_completa.json" -Raw
$senadorData = $jsonContent | ConvertFrom-Json

# Criar documento na coleção estrutura_organizada
$url = "http://localhost:8080/v1/projects/a-republica-brasileira/databases/(default)/documents/estrutura_organizada/6358"
$headers = @{
    "Content-Type" = "application/json"
}

# Converter o objeto para JSON
$jsonData = $jsonContent

# Enviar requisição POST para o emulador do Firestore
Write-Host "Importando dados para estrutura_organizada/6358..."
try {
    Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $jsonData
    Write-Host "Dados importados com sucesso para estrutura_organizada/6358"
} catch {
    Write-Host "Erro ao importar dados: $_"
}

# Criar documento na coleção congressoNacional/senadoFederal/perfis
$url = "http://localhost:8080/v1/projects/a-republica-brasileira/databases/(default)/documents/congressoNacional/senadoFederal/perfis/6358"

# Criar objeto simplificado para a estrutura atual
$dadosSimplificados = @{
    codigo = $senadorData.identificacao.codigo
    nome = $senadorData.identificacao.nome
    nomeCompleto = $senadorData.identificacao.nomeCompleto
    genero = $senadorData.identificacao.genero
    foto = $senadorData.identificacao.foto
    partido = $senadorData.identificacao.partido
    uf = $senadorData.identificacao.uf
    atualizadoEm = $senadorData.metadados.atualizadoEm
}

# Converter o objeto para JSON
$jsonData = $dadosSimplificados | ConvertTo-Json -Depth 10

# Enviar requisição POST para o emulador do Firestore
Write-Host "Importando dados para congressoNacional/senadoFederal/perfis/6358..."
try {
    Invoke-RestMethod -Uri $url -Method Put -Headers $headers -Body $jsonData
    Write-Host "Dados importados com sucesso para congressoNacional/senadoFederal/perfis/6358"
} catch {
    Write-Host "Erro ao importar dados: $_"
}

Write-Host "Processo concluído. Verifique os dados no console do emulador: http://localhost:4000/firestore"
