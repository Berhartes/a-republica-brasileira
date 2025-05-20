// Configurações dos dashboards para todos os estados do Brasil

// Mapeamento de siglas para nomes completos dos estados
export const todosEstados: Record<string, string> = {
  'ac': 'Acre',
  'al': 'Alagoas',
  'am': 'Amazonas',
  'ap': 'Amapá',
  'ba': 'Bahia',
  'ce': 'Ceará',
  'df': 'Distrito Federal',
  'es': 'Espírito Santo',
  'go': 'Goiás',
  'ma': 'Maranhão',
  'mg': 'Minas Gerais',
  'ms': 'Mato Grosso do Sul',
  'mt': 'Mato Grosso',
  'pa': 'Pará',
  'pb': 'Paraíba',
  'pe': 'Pernambuco',
  'pi': 'Piauí',
  'pr': 'Paraná',
  'rj': 'Rio de Janeiro',
  'rn': 'Rio Grande do Norte',
  'ro': 'Rondônia',
  'rr': 'Roraima',
  'rs': 'Rio Grande do Sul',
  'sc': 'Santa Catarina',
  'se': 'Sergipe',
  'sp': 'São Paulo',
  'to': 'Tocantins',
  'br': 'Brasil'
};

// Mapeamento de estados por região
export const estadoPorRegiao: Record<string, string> = {
  'ac': 'NORTE',
  'am': 'NORTE',
  'ap': 'NORTE',
  'pa': 'NORTE',
  'ro': 'NORTE',
  'rr': 'NORTE',
  'to': 'NORTE',

  'al': 'NORDESTE',
  'ba': 'NORDESTE',
  'ce': 'NORDESTE',
  'ma': 'NORDESTE',
  'pb': 'NORDESTE',
  'pe': 'NORDESTE',
  'pi': 'NORDESTE',
  'rn': 'NORDESTE',
  'se': 'NORDESTE',

  'df': 'CENTRO_OESTE',
  'go': 'CENTRO_OESTE',
  'ms': 'CENTRO_OESTE',
  'mt': 'CENTRO_OESTE',

  'es': 'SUDESTE',
  'mg': 'SUDESTE',
  'rj': 'SUDESTE',
  'sp': 'SUDESTE',

  'pr': 'SUL',
  'rs': 'SUL',
  'sc': 'SUL',

  'br': 'FEDERAL'
};

// Interface para os dados dos cartões
export interface CardData {
  title: string;
  icon: string;
  value: string;
  description: string;
  link: string;
  badge: string;
  content?: string;
}

// Interface para a configuração de um dashboard
export interface DashboardConfig {
  primaryColor: string;
  secondaryColor: string;
  accent: string;
  selectedTab: string;
  title: string;
  subtitle: string;
  icon: string;
  iconSubtitle: string;
  dadosCartoes: CardData[];
  dashboardKey?: string; // Chave opcional para identificar o tipo de dashboard
}

// Configuração específica para o Rio de Janeiro
export const configDashboardsRJ: Record<string, DashboardConfig> = {
  'cg-rj': {
    primaryColor: '#005c97',
    secondaryColor: '#0096c7',
    accent: '#00bfff',
    selectedTab: '#00aaff',
    title: 'Congresso Nacional: Voz do Rio',
    subtitle: 'Representantes do estado do Rio de Janeiro em exercício',
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-anchor',
    dashboardKey: 'cg-rj',
    dadosCartoes: [
      {
        title: "Deputados Federais",
        icon: "fas fa-users",
        value: "46",
        description: "Cadeiras ocupadas pelo RJ",
        link: "https://www.camara.leg.br/deputados/quem-sao/resultado?partido=&uf=RJ&legislatura=56",
        badge: "⭐ Eleitos 2022",
        content: "<h3 class='text-xl font-bold text-white mb-3'>Deputados Federais</h3><p class='text-white'>Informações detalhadas sobre os deputados federais do RJ.</p>"
      },
      {
        title: "Senadores",
        icon: "fas fa-landmark",
        value: "3",
        description: "Representantes ativos",
        link: "https://www25.senado.leg.br/web/senadores/por-uf/-/uf/RJ",
        badge: "🎉 Mandatos 2027/2031",
        content: "<h3 class='text-xl font-bold text-white mb-3'>Senadores</h3><p class='text-white'>Informações detalhadas sobre os senadores do RJ.</p>"
      },
      {
        title: "Ranking de Atividades",
        icon: "fas fa-trophy",
        value: "Top 10",
        description: "Deputados mais ativos no RJ",
        link: "https://www.camara.leg.br/deputados/ranking",
        badge: "🏆 Destaques 2023",
        content: "<h3 class='text-xl font-bold text-white mb-3'>Ranking de Atividades</h3><p class='text-white'>Detalhes sobre o ranking de atividade dos deputados do RJ.</p>"
      },
      {
        title: "Eleitorado",
        icon: "fas fa-user-check",
        value: "12,8M",
        description: "Eleitores registrados no RJ",
        link: "https://www.tse.jus.br/eleitor/estatisticas-de-eleitorado",
        badge: "🗳️ Dados 2023",
        content: "<h3 class='text-xl font-bold text-white mb-3'>Eleitorado</h3><p class='text-white'>Informações sobre o eleitorado registrado no RJ.</p>"
      },
      {
        title: "Estatísticas",
        icon: "fas fa-chart-bar",
        value: "86%",
        description: "Taxa de atividade parlamentar",
        link: "https://dadosabertos.camara.leg.br/swagger/api.html",
        badge: "📊 Dados em tempo real",
        content: "<h3 class='text-xl font-bold text-white mb-3'>Estatísticas</h3><p class='text-white'>Estatísticas detalhadas sobre a atividade parlamentar.</p>"
      }
    ]
  },
  'ale-rj': {
    primaryColor: '#065f46',
    secondaryColor: '#047857',
    accent: '#10B981',
    selectedTab: '#10B981',
    title: 'ALERJ - Assembleia Legislativa',
    subtitle: 'Representantes do estado do Rio de Janeiro em exercício',
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-anchor',
    dashboardKey: 'ale-rj',
    dadosCartoes: [
      {
        title: "Deputados Estaduais",
        icon: "fas fa-users",
        value: "70",
        description: "Representantes eleitos",
        link: "https://www.alerj.rj.gov.br/deputados",
        badge: "🗳️ 2023-2027",
        content: "<h3>Deputados Estaduais</h3><p>Os deputados estaduais são responsáveis por legislar e fiscalizar o governo estadual. Atualmente, 70 cadeiras são ocupadas, com uma representação de 47% de mulheres e 15 partidos diferentes.</p>"
      },
      {
        title: "Comissões",
        icon: "fas fa-briefcase",
        value: "24",
        description: "Comissões permanentes",
        link: "https://www.alerj.rj.gov.br/comissoes",
        badge: "📋 Ativas",
        content: "<h3>Comissões</h3><p>As comissões são grupos de trabalho que analisam projetos de lei e fiscalizam áreas específicas do governo estadual.</p>"
      },
      {
        title: "Projetos de Lei",
        icon: "fas fa-file-alt",
        value: "350+",
        description: "Em tramitação",
        link: "https://www.alerj.rj.gov.br/projetos",
        badge: "📝 2023-2024",
        content: "<h3>Projetos de Lei</h3><p>Os projetos de lei são propostas legislativas que, se aprovadas, se tornam leis estaduais.</p>"
      },
      {
        title: "Audiências Públicas",
        icon: "fas fa-comments",
        value: "45",
        description: "Realizadas em 2023",
        link: "https://www.alerj.rj.gov.br/audiencias",
        badge: "🎤 Participação",
        content: "<h3>Audiências Públicas</h3><p>As audiências públicas são reuniões abertas à população para discutir temas de interesse público.</p>"
      },
      {
        title: "Orçamento",
        icon: "fas fa-money-bill-wave",
        value: "R$ 2,5B",
        description: "Orçamento anual",
        link: "https://www.alerj.rj.gov.br/orcamento",
        badge: "💰 Fiscal",
        content: "<h3>Orçamento</h3><p>O orçamento da ALERJ é utilizado para manter o funcionamento do poder legislativo estadual.</p>"
      }
    ]
  },
  'gov-rj': {
    primaryColor: '#c72c41',
    secondaryColor: '#a51c30',
    accent: '#E63946',
    selectedTab: '#E63946',
    title: 'Governo do Estado do Rio',
    subtitle: 'Gestão e administração pública',
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-anchor',
    dashboardKey: 'gov-rj',
    dadosCartoes: [
      {
        title: "Governador",
        icon: "fas fa-user-tie",
        value: "Cláudio Castro",
        description: "Mandato atual",
        link: "https://www.rj.gov.br/governador",
        badge: "👔 2023-2026",
        content: "<h3>Governador</h3><p>O Governador é a autoridade máxima do Poder Executivo no estado, responsável por liderar a administração pública.</p>"
      },
      {
        title: "Secretarias",
        icon: "fas fa-building",
        value: "27",
        description: "Órgãos de gestão",
        link: "https://www.rj.gov.br/secretarias",
        badge: "🏛️ Executivo",
        content: "<h3>Secretarias</h3><p>As secretarias estaduais são responsáveis pela implementação das políticas públicas em áreas específicas.</p>"
      },
      {
        title: "Orçamento Estadual",
        icon: "fas fa-chart-pie",
        value: "R$ 87,8B",
        description: "Previsão para 2023",
        link: "https://www.rj.gov.br/orcamento",
        badge: "💲 Finanças",
        content: "<h3>Orçamento Estadual</h3><p>O orçamento estadual define como os recursos públicos serão utilizados durante o ano.</p>"
      },
      {
        title: "Programas Sociais",
        icon: "fas fa-hands-helping",
        value: "15+",
        description: "Iniciativas ativas",
        link: "https://www.rj.gov.br/programas-sociais",
        badge: "🤝 Assistência",
        content: "<h3>Programas Sociais</h3><p>Os programas sociais visam atender às necessidades da população mais vulnerável do estado.</p>"
      },
      {
        title: "Municípios",
        icon: "fas fa-map-marked-alt",
        value: "92",
        description: "Cidades fluminenses",
        link: "https://www.rj.gov.br/municipios",
        badge: "🗺️ Geografia",
        content: "<h3>Municípios</h3><p>O estado do Rio de Janeiro é composto por 92 municípios, cada um com suas características próprias.</p>"
      }
    ]
  }
};

// Função para clarear uma cor hex
export function lightenColor(hex: string, percent: number): string {
  // Remove o # se existir
  hex = hex.replace('#', '');

  // Converte para RGB
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);

  // Clareia
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

  // Converte de volta para hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Interface para as cores de texto do estilo 2 (branco/escuro)
 */
export interface DashboardTextColors {
  // Modo claro
  light: {
    baseColor: string;
    baseColorHover: string;
    badgeBg: string;
    badgeText: string;
    descriptionColor: string;
    subtitleColor: string;
    detailsColor: string;
    lightColor: string;
    bgColor: string;
    borderColor: string;
  };
  // Modo escuro
  dark: {
    baseColor: string;
    baseColorHover: string;
    badgeBg: string;
    badgeText: string;
    descriptionColor: string;
    subtitleColor: string;
    detailsColor: string;
    lightColor: string;
    bgColor: string;
    borderColor: string;
  };
}

/**
 * Função para obter as cores de texto para o estilo 2 (branco/escuro)
 * @returns Objeto com as cores de texto para o modo claro e escuro
 */
export function getDashboardTextColors(): DashboardTextColors {
  // Cores padrão para todos os dashboards
  const defaultColors = {
    light: {
      baseColor: 'text-gray-700',
      baseColorHover: 'text-gray-800',
      badgeBg: 'bg-gray-100',
      badgeText: 'text-gray-800',
      descriptionColor: 'text-gray-700/80',
      subtitleColor: 'text-gray-600/70',
      detailsColor: 'text-gray-600/70',
      lightColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: '#e5e7eb' // Cinza claro
    },
    dark: {
      baseColor: 'text-gray-300',
      baseColorHover: 'text-gray-200',
      badgeBg: 'bg-gray-800',
      badgeText: 'text-gray-300',
      descriptionColor: 'text-gray-300',
      subtitleColor: 'text-gray-400/70',
      detailsColor: 'text-gray-400/70',
      lightColor: 'text-gray-400',
      bgColor: 'bg-gray-800/50',
      borderColor: '#374151' // Cinza escuro
    }
  };

  return defaultColors;
}

// Função para gerar configuração de dashboard para um estado específico
export function getConfigPorUF(uf: string): Record<string, DashboardConfig> {
  // Validar se a UF existe
  if (!todosEstados[uf]) {
    console.error(`UF não encontrada: ${uf}`);
    // Retornar uma configuração padrão em vez de null
    uf = 'rj'; // Usar RJ como fallback
  }

  // Se for RJ, retornar a configuração específica já definida
  if (uf === 'rj') {
    return {
      [`cg-${uf}`]: configDashboardsRJ['cg-rj'],
      [`ale-${uf}`]: configDashboardsRJ['ale-rj'],
      [`gov-${uf}`]: configDashboardsRJ['gov-rj']
    };
  }

  const nomeEstado = todosEstados[uf];
  const isNacional = uf === 'br';

  // Cores para cada tipo de dashboard
  let coresCongresso, coresAssembleia, coresGoverno;

  // Definir cores com base na UF
  switch(uf) {
    // Manter as cores originais do Rio de Janeiro
    case 'rj':
      coresCongresso = ['#005c97', '#0096c7'];
      coresAssembleia = ['#065f46', '#047857'];
      coresGoverno = ['#c72c41', '#a51c30'];
      break;

    // São Paulo - Cores representativas
    case 'sp':
      coresCongresso = ['#D13238', '#E74C3C']; // Vermelho (cores do estado)
      coresAssembleia = ['#2980B9', '#3498DB']; // Azul (céu e rios)
      coresGoverno = ['#F39C12', '#F1C40F']; // Amarelo/laranja (economia e café)
      break;

    // Minas Gerais - Cores da mineração e montanhas
    case 'mg':
      coresCongresso = ['#922B21', '#C0392B']; // Vermelho/bordô (solo e mineração)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (montanhas e matas)
      coresGoverno = ['#D4AC0D', '#F39C12']; // Dourado/ocre (ouro e história)
      break;

    // Bahia - Cores do litoral e cultura
    case 'ba':
      coresCongresso = ['#2980B9', '#3498DB']; // Azul (litoral)
      coresAssembleia = ['#C0392B', '#E74C3C']; // Vermelho (cultura e história)
      coresGoverno = ['#F1C40F', '#F39C12']; // Dourado/amarelo (sol e praias)
      break;

    // Santa Catarina - Cores da bandeira e natureza
    case 'sc':
      coresCongresso = ['#C0392B', '#E74C3C']; // Vermelho (bandeira)
      coresAssembleia = ['#16A085', '#1ABC9C']; // Verde-água (litoral)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja (cultura)
      break;

    // Amazonas - Cores da floresta e rios
    case 'am':
      coresCongresso = ['#196F3D', '#27AE60']; // Verde escuro (floresta)
      coresAssembleia = ['#2980B9', '#3498DB']; // Azul (rios)
      coresGoverno = ['#16A085', '#1ABC9C']; // Verde-água/turquesa (biodiversidade)
      break;

    // Pernambuco - Cores da bandeira e cultura
    case 'pe':
      coresCongresso = ['#2980B9', '#3498DB']; // Azul (mar)
      coresAssembleia = ['#C0392B', '#E74C3C']; // Vermelho (bandeira)
      coresGoverno = ['#F39C12', '#F1C40F']; // Amarelo/laranja (sol e cultura)
      break;

    // Rio Grande do Sul - Cores da bandeira e tradições
    case 'rs':
      coresCongresso = ['#922B21', '#C0392B']; // Vermelho (bandeira)
      coresAssembleia = ['#196F3D', '#27AE60']; // Verde (campos)
      coresGoverno = ['#8E44AD', '#9B59B6']; // Roxo (céu e pôr do sol)
      break;

    // Paraná - Cores da bandeira e natureza
    case 'pr':
      coresCongresso = ['#2980B9', '#3498DB']; // Azul (céu)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (campos)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja (araucárias)
      break;

    // Ceará - Cores do litoral e sertão
    case 'ce':
      coresCongresso = ['#1ABC9C', '#16A085']; // Azul-turquesa (litoral)
      coresAssembleia = ['#D35400', '#E67E22']; // Laranja (sertão)
      coresGoverno = ['#F1C40F', '#F39C12']; // Amarelo (sol)
      break;

    // Goiás - Cores do cerrado
    case 'go':
      coresCongresso = ['#F1C40F', '#F39C12']; // Amarelo/dourado (cerrado)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (vegetação)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      break;

    // Distrito Federal - Cores do cerrado e arquitetura
    case 'df':
      coresCongresso = ['#27AE60', '#2ECC71']; // Verde (cerrado)
      coresAssembleia = ['#3498DB', '#2980B9']; // Azul (céu de Brasília)
      coresGoverno = ['#D35400', '#E67E22']; // Terracota (arquitetura)
      break;

    // Acre - Cores da floresta e rios
    case 'ac':
      coresCongresso = ['#196F3D', '#27AE60']; // Verde escuro (floresta)
      coresAssembleia = ['#1ABC9C', '#16A085']; // Verde-água (rios)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      break;

    // Alagoas - Cores do litoral e cultura
    case 'al':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#16A085', '#1ABC9C']; // Verde-água (lagoas)
      coresGoverno = ['#F39C12', '#F1C40F']; // Amarelo/dourado (sol)
      break;

    // Amapá - Cores da floresta e rios
    case 'ap':
      coresCongresso = ['#27AE60', '#2ECC71']; // Verde (floresta)
      coresAssembleia = ['#3498DB', '#2980B9']; // Azul (rios)
      coresGoverno = ['#16A085', '#1ABC9C']; // Verde-água (biodiversidade)
      break;

    // Espírito Santo - Cores do litoral e montanhas
    case 'es':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (montanhas)
      coresGoverno = ['#D4AC0D', '#F39C12']; // Dourado (sol)
      break;

    // Maranhão - Cores do litoral e cultura
    case 'ma':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#F1C40F', '#F39C12']; // Amarelo/dourado (dunas)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (cultura)
      break;

    // Mato Grosso - Cores do cerrado e pantanal
    case 'mt':
      coresCongresso = ['#F39C12', '#F1C40F']; // Amarelo/dourado (cerrado)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (vegetação)
      coresGoverno = ['#3498DB', '#2980B9']; // Azul (águas do pantanal)
      break;

    // Mato Grosso do Sul - Cores do pantanal
    case 'ms':
      coresCongresso = ['#16A085', '#1ABC9C']; // Verde-água (pantanal)
      coresAssembleia = ['#3498DB', '#2980B9']; // Azul (águas)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      break;

    // Pará - Cores da floresta e rios
    case 'pa':
      coresCongresso = ['#196F3D', '#27AE60']; // Verde escuro (floresta)
      coresAssembleia = ['#2980B9', '#3498DB']; // Azul (rios)
      coresGoverno = ['#8E44AD', '#9B59B6']; // Roxo (açaí)
      break;

    // Paraíba - Cores do litoral e cultura
    case 'pb':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#C0392B', '#E74C3C']; // Vermelho (cultura)
      coresGoverno = ['#F1C40F', '#F39C12']; // Amarelo/dourado (sol)
      break;

    // Piauí - Cores do cerrado e litoral
    case 'pi':
      coresCongresso = ['#F39C12', '#F1C40F']; // Amarelo/dourado (cerrado)
      coresAssembleia = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      coresGoverno = ['#3498DB', '#2980B9']; // Azul (litoral)
      break;

    // Rio Grande do Norte - Cores do litoral e dunas
    case 'rn':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#F1C40F', '#F39C12']; // Amarelo/dourado (dunas)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (sol)
      break;

    // Rondônia - Cores da floresta e rios
    case 'ro':
      coresCongresso = ['#196F3D', '#27AE60']; // Verde escuro (floresta)
      coresAssembleia = ['#2980B9', '#3498DB']; // Azul (rios)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      break;

    // Roraima - Cores da floresta e savana
    case 'rr':
      coresCongresso = ['#196F3D', '#27AE60']; // Verde escuro (floresta)
      coresAssembleia = ['#F1C40F', '#F39C12']; // Amarelo/dourado (savana)
      coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota (terra)
      break;

    // Sergipe - Cores do litoral e cultura
    case 'se':
      coresCongresso = ['#3498DB', '#2980B9']; // Azul (mar)
      coresAssembleia = ['#C0392B', '#E74C3C']; // Vermelho (cultura)
      coresGoverno = ['#F1C40F', '#F39C12']; // Amarelo/dourado (sol)
      break;

    // Tocantins - Cores do cerrado e rios
    case 'to':
      coresCongresso = ['#F39C12', '#F1C40F']; // Amarelo/dourado (cerrado)
      coresAssembleia = ['#27AE60', '#2ECC71']; // Verde (vegetação)
      coresGoverno = ['#3498DB', '#2980B9']; // Azul (rios)
      break;

    // Brasil (nacional)
    case 'br':
      coresCongresso = ['#1B4F72', '#2874A6']; // Azul escuro (bandeira)
      coresAssembleia = ['#196F3D', '#27AE60']; // Verde (bandeira)
      coresGoverno = ['#922B21', '#C0392B']; // Vermelho (símbolo da república)
      break;

    default:
      // Cores padrão para outros estados - variando por região
      const regiao = estadoPorRegiao[uf] || 'SUDESTE';

      switch(regiao) {
        case 'NORTE':
          coresCongresso = ['#196F3D', '#27AE60']; // Verde floresta
          coresAssembleia = ['#2980B9', '#3498DB']; // Azul rios
          coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota
          break;
        case 'NORDESTE':
          coresCongresso = ['#F1C40F', '#F39C12']; // Amarelo/dourado sol
          coresAssembleia = ['#2980B9', '#3498DB']; // Azul mar
          coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota
          break;
        case 'CENTRO_OESTE':
          coresCongresso = ['#D4AC0D', '#F39C12']; // Dourado cerrado
          coresAssembleia = ['#27AE60', '#2ECC71']; // Verde cerrado
          coresGoverno = ['#D35400', '#E67E22']; // Laranja/terracota
          break;
        case 'SUL':
          coresCongresso = ['#2980B9', '#3498DB']; // Azul frio
          coresAssembleia = ['#27AE60', '#2ECC71']; // Verde campos
          coresGoverno = ['#922B21', '#C0392B']; // Vermelho
          break;
        case 'SUDESTE':
        default:
          coresCongresso = ['#2980B9', '#3498DB']; // Azul
          coresAssembleia = ['#16A085', '#1ABC9C']; // Verde
          coresGoverno = ['#922B21', '#C0392B']; // Vermelho
          break;
      }
  }

  // Dados específicos por estado
  const dadosEstado = {
    deputadosFederais: isNacional ? "513" : "8+",
    deputadosEstaduais: isNacional ? "1059" : "24+",
    eleitorado: isNacional ? "155 milhões" : "2+ milhões",
    municipios: isNacional ? "5570" : "100+",
    governador: isNacional ? "Luiz Inácio Lula da Silva" : `Governador de ${nomeEstado}`
  };

  // Configuração para o Congresso/Bancada Federal
  const configCongresso: DashboardConfig = {
    primaryColor: coresCongresso[0],
    secondaryColor: coresCongresso[1],
    accent: lightenColor(coresCongresso[1], 20),
    selectedTab: lightenColor(coresCongresso[1], 30),
    title: isNacional ? 'Congresso Nacional' : `Congresso Nacional: Bancada de ${nomeEstado}`,
    subtitle: isNacional ? 'Representantes do Brasil em exercício' : `Representantes do estado de ${nomeEstado} em exercício`,
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-landmark',
    dashboardKey: `cg-${uf}`,
    dadosCartoes: [
      {
        title: "Deputados Federais",
        icon: "fas fa-users",
        value: dadosEstado.deputadosFederais,
        description: isNacional ? "Total de cadeiras na Câmara" : `Cadeiras ocupadas por ${nomeEstado}`,
        link: isNacional ? "https://www.camara.leg.br/deputados" : `https://www.camara.leg.br/deputados/quem-sao/resultado?partido=&uf=${uf.toUpperCase()}&legislatura=56`,
        badge: "⭐ Eleitos 2022",
        content: `<h3 class='text-xl font-bold text-white mb-3'>Deputados Federais</h3><p class='text-white'>Informações detalhadas sobre os deputados federais ${isNacional ? 'do Brasil' : `de ${nomeEstado}`}.</p>`
      },
      {
        title: "Senadores",
        icon: "fas fa-landmark",
        value: isNacional ? "81" : "3",
        description: isNacional ? "Total de senadores" : "Representantes ativos",
        link: isNacional ? "https://www25.senado.leg.br/web/senadores/" : `https://www25.senado.leg.br/web/senadores/por-uf/-/uf/${uf.toUpperCase()}`,
        badge: "🎉 Mandatos 2027/2031",
        content: `<h3 class='text-xl font-bold text-white mb-3'>Senadores</h3><p class='text-white'>Informações detalhadas sobre os senadores ${isNacional ? 'do Brasil' : `de ${nomeEstado}`}.</p>`
      },
      {
        title: "Ranking de Atividades",
        icon: "fas fa-trophy",
        value: "Top 10",
        description: isNacional ? "Parlamentares mais ativos" : `Deputados mais ativos em ${nomeEstado}`,
        link: "https://www.camara.leg.br/deputados/ranking",
        badge: "🏆 Destaques 2023",
        content: `<h3 class='text-xl font-bold text-white mb-3'>Ranking de Atividades</h3><p class='text-white'>Detalhes sobre o ranking de atividade dos deputados ${isNacional ? 'do Brasil' : `de ${nomeEstado}`}.</p>`
      },
      {
        title: "Eleitorado",
        icon: "fas fa-user-check",
        value: dadosEstado.eleitorado,
        description: isNacional ? "Eleitores registrados no Brasil" : `Eleitores registrados em ${nomeEstado}`,
        link: "https://www.tse.jus.br/eleitor/estatisticas-de-eleitorado",
        badge: "🗳️ Dados 2023",
        content: `<h3 class='text-xl font-bold text-white mb-3'>Eleitorado</h3><p class='text-white'>Informações sobre o eleitorado registrado ${isNacional ? 'no Brasil' : `em ${nomeEstado}`}.</p>`
      },
      {
        title: "Estatísticas",
        icon: "fas fa-chart-bar",
        value: "86%",
        description: "Taxa de atividade parlamentar",
        link: "https://dadosabertos.camara.leg.br/swagger/api.html",
        badge: "📊 Dados em tempo real",
        content: `<h3 class='text-xl font-bold text-white mb-3'>Estatísticas</h3><p class='text-white'>Estatísticas detalhadas sobre a atividade parlamentar ${isNacional ? 'no Brasil' : `em ${nomeEstado}`}.</p>`
      }
    ]
  };

  // Configuração para a Assembleia Legislativa (ou Câmara dos Deputados no caso nacional)
  const configAssembleia: DashboardConfig = {
    primaryColor: coresAssembleia[0],
    secondaryColor: coresAssembleia[1],
    accent: lightenColor(coresAssembleia[1], 20),
    selectedTab: lightenColor(coresAssembleia[1], 30),
    title: isNacional ? 'Câmara dos Deputados' :
           (uf === 'df' ? 'CLDF - Câmara Legislativa' : `AL${uf.toUpperCase()} - Assembleia Legislativa`),
    subtitle: isNacional ? 'Representantes do povo brasileiro' :
              (uf === 'df' ? 'Deputados Distritais em exercício' : `Representantes do estado de ${nomeEstado} em exercício`),
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-users',
    dashboardKey: `ale-${uf}`,
    dadosCartoes: [
      {
        title: isNacional ? "Deputados Federais" : (uf === 'df' ? "Deputados Distritais" : "Deputados Estaduais"),
        icon: "fas fa-users",
        value: isNacional ? dadosEstado.deputadosFederais : dadosEstado.deputadosEstaduais,
        description: isNacional ? "Representantes eleitos" : `Representantes eleitos em ${nomeEstado}`,
        link: isNacional ? "https://www.camara.leg.br/deputados" :
              (uf === 'df' ? "https://www.cl.df.gov.br/deputados" : `https://www.al${uf}.gov.br/deputados`),
        badge: "🗳️ 2023-2027",
        content: `<h3>${isNacional ? "Deputados Federais" : (uf === 'df' ? "Deputados Distritais" : "Deputados Estaduais")}</h3><p>${isNacional ? "Os deputados federais são responsáveis por legislar e fiscalizar o governo federal." : (uf === 'df' ? "Os deputados distritais são responsáveis por legislar e fiscalizar o governo do Distrito Federal." : "Os deputados estaduais são responsáveis por legislar e fiscalizar o governo estadual.")}</p>`
      },
      {
        title: "Comissões",
        icon: "fas fa-briefcase",
        value: isNacional ? "25+" : "20+",
        description: "Comissões permanentes",
        link: isNacional ? "https://www.camara.leg.br/comissoes" :
              (uf === 'df' ? "https://www.cl.df.gov.br/comissoes" : `https://www.al${uf}.gov.br/comissoes`),
        badge: "📋 Ativas",
        content: "<h3>Comissões</h3><p>As comissões são grupos de trabalho que analisam projetos de lei e fiscalizam áreas específicas do governo.</p>"
      },
      {
        title: "Projetos de Lei",
        icon: "fas fa-file-alt",
        value: isNacional ? "1500+" : "350+",
        description: "Em tramitação",
        link: isNacional ? "https://www.camara.leg.br/busca-portal/proposicoes/pesquisa-simplificada" :
              (uf === 'df' ? "https://www.cl.df.gov.br/projetos" : `https://www.al${uf}.gov.br/projetos`),
        badge: "📝 2023-2024",
        content: "<h3>Projetos de Lei</h3><p>Os projetos de lei são propostas legislativas que, se aprovadas, se tornam leis.</p>"
      },
      {
        title: "Audiências Públicas",
        icon: "fas fa-comments",
        value: isNacional ? "120+" : "45+",
        description: "Realizadas em 2023",
        link: isNacional ? "https://www.camara.leg.br/eventos-divulgacao/evento?id=audiencia-publica" :
              (uf === 'df' ? "https://www.cl.df.gov.br/audiencias" : `https://www.al${uf}.gov.br/audiencias`),
        badge: "🎤 Participação",
        content: "<h3>Audiências Públicas</h3><p>As audiências públicas são reuniões abertas à população para discutir temas de interesse público.</p>"
      },
      {
        title: "Orçamento",
        icon: "fas fa-money-bill-wave",
        value: isNacional ? "R$ 7,8B" : "R$ 2,5B",
        description: "Orçamento anual",
        link: isNacional ? "https://www.camara.leg.br/transparencia/orcamento-da-camara" :
              (uf === 'df' ? "https://www.cl.df.gov.br/orcamento" : `https://www.al${uf}.gov.br/orcamento`),
        badge: "💰 Fiscal",
        content: `<h3>Orçamento</h3><p>O orçamento ${isNacional ? "da Câmara dos Deputados" : (uf === 'df' ? "da CLDF" : `da AL${uf.toUpperCase()}`)} é utilizado para manter o funcionamento do poder legislativo.</p>`
      }
    ]
  };

  // Configuração para o Governo (Estadual ou Federal)
  const configGoverno: DashboardConfig = {
    primaryColor: coresGoverno[0],
    secondaryColor: coresGoverno[1],
    accent: lightenColor(coresGoverno[1], 20),
    selectedTab: lightenColor(coresGoverno[1], 30),
    title: isNacional ? 'Governo Federal' : `Governo do Estado de ${nomeEstado}`,
    subtitle: 'Gestão e administração pública',
    icon: 'fas fa-university',
    iconSubtitle: 'fas fa-landmark',
    dashboardKey: `gov-${uf}`,
    dadosCartoes: [
      {
        title: isNacional ? "Presidente" : "Governador",
        icon: "fas fa-user-tie",
        value: dadosEstado.governador,
        description: "Mandato atual",
        link: isNacional ? "https://www.gov.br/planalto/pt-br/presidencia" :
              (uf === 'df' ? "https://www.df.gov.br/governador" : `https://www.${uf}.gov.br/governador`),
        badge: "👔 2023-2026",
        content: `<h3>${isNacional ? "Presidente" : "Governador"}</h3><p>${isNacional ? "O Presidente é a autoridade máxima do Poder Executivo no país" : "O Governador é a autoridade máxima do Poder Executivo no estado"}, responsável por liderar a administração pública.</p>`
      },
      {
        title: "Secretarias",
        icon: "fas fa-building",
        value: isNacional ? "38" : "25+",
        description: "Órgãos de gestão",
        link: isNacional ? "https://www.gov.br/pt-br/orgaos-do-governo" :
              (uf === 'df' ? "https://www.df.gov.br/secretarias" : `https://www.${uf}.gov.br/secretarias`),
        badge: "🏛️ Executivo",
        content: `<h3>Secretarias</h3><p>As secretarias ${isNacional ? "federais" : "estaduais"} são responsáveis pela implementação das políticas públicas em áreas específicas.</p>`
      },
      {
        title: isNacional ? "Orçamento Federal" : "Orçamento Estadual",
        icon: "fas fa-chart-pie",
        value: isNacional ? "R$ 5,4T" : "R$ 80B+",
        description: "Previsão para 2023",
        link: isNacional ? "https://www.gov.br/economia/pt-br/assuntos/planejamento-e-orcamento" :
              (uf === 'df' ? "https://www.df.gov.br/orcamento" : `https://www.${uf}.gov.br/orcamento`),
        badge: "💲 Finanças",
        content: `<h3>Orçamento ${isNacional ? "Federal" : "Estadual"}</h3><p>O orçamento ${isNacional ? "federal" : "estadual"} define como os recursos públicos serão utilizados durante o ano.</p>`
      },
      {
        title: "Programas Sociais",
        icon: "fas fa-hands-helping",
        value: isNacional ? "30+" : "15+",
        description: "Iniciativas ativas",
        link: isNacional ? "https://www.gov.br/cidadania/pt-br/acoes-e-programas" :
              (uf === 'df' ? "https://www.df.gov.br/programas-sociais" : `https://www.${uf}.gov.br/programas-sociais`),
        badge: "🤝 Assistência",
        content: `<h3>Programas Sociais</h3><p>Os programas sociais visam atender às necessidades da população mais vulnerável ${isNacional ? "do país" : "do estado"}.</p>`
      },
      {
        title: "Municípios",
        icon: "fas fa-map-marked-alt",
        value: dadosEstado.municipios,
        description: isNacional ? "Cidades brasileiras" : `Cidades em ${nomeEstado}`,
        link: isNacional ? "https://www.gov.br/pt-br/servicos/consultar-informacoes-sobre-municipios" :
              (uf === 'df' ? "https://www.df.gov.br/regioes-administrativas" : `https://www.${uf}.gov.br/municipios`),
        badge: "🗺️ Geografia",
        content: `<h3>Municípios</h3><p>${isNacional ? "O Brasil é composto por 5.570 municípios" : `O estado de ${nomeEstado} é composto por diversos municípios`}, cada um com suas características próprias.</p>`
      }
    ]
  };

  // Retornar a configuração completa para o estado
  return {
    [`cg-${uf}`]: configCongresso,
    [`ale-${uf}`]: configAssembleia,
    [`gov-${uf}`]: configGoverno
  };
}
