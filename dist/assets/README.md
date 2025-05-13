# Public Directory Structure

Este diretório contém todos os assets estáticos do projeto A República Brasileira.

## Estrutura

```
public/
├── assets/          # Assets processados pelo build
│   ├── js/         # JavaScript compilado
│   ├── css/        # CSS compilado
│   └── maps/       # Source maps
├── flags/          # Bandeiras e símbolos
│   ├── brazil/     # Bandeira nacional
│   └── estados/    # Bandeiras estaduais
│       ├── espirito-santo/
│       ├── minas-gerais/
│       ├── rio-de-janeiro/
│       └── sao-paulo/
├── images/         # Imagens estáticas
│   └── placeholder-avatar.png
└── styles/         # Estilos globais
    └── main.css
```

## Organização de Assets

### Assets Compilados
- `assets/js/`: Arquivos JavaScript otimizados
- `assets/css/`: Estilos CSS processados
- `assets/maps/`: Source maps para debugging

### Bandeiras
- Organizadas hierarquicamente (nacional/estadual)
- Formato padronizado (PNG)
- Otimizadas para web

### Imagens
- Imagens estáticas do projeto
- Placeholders e recursos default
- Otimizadas para performance

### Estilos
- Estilos CSS globais
- Temas e variáveis base
- Utilitários compartilhados

## Padrões de Arquivo

### Imagens
- Formato: PNG/WebP para melhor compressão
- Resolução: Otimizada para web
- Nomenclatura: kebab-case

### Estilos
- Formato: CSS minificado
- Organização: Por funcionalidade
- Nomenclatura: camelCase

### JavaScript
- Formato: Minificado e otimizado
- Source maps incluídos
- Versionamento por hash

## Boas Práticas

1. **Otimização de Assets**
   - Comprimir imagens
   - Minificar CSS/JS
   - Usar formatos modernos

2. **Organização**
   - Manter estrutura consistente
   - Documentar alterações
   - Remover assets não utilizados

3. **Performance**
   - Otimizar tamanho de arquivos
   - Usar lazy loading quando possível
   - Implementar cache adequado

4. **Manutenção**
   - Revisar assets periodicamente
   - Atualizar documentação
   - Manter versionamento

## Uso em Desenvolvimento

```html
<!-- Exemplo de uso de assets -->
<img src="/flags/brazil/flag_circle_brazil.png" alt="Bandeira do Brasil">
<link rel="stylesheet" href="/styles/main.css">
<script src="/assets/js/main.js"></script>
```

## Build e Deploy

- Assets são processados via Vite
- Otimização automática no build
- Deploy com cache-busting
