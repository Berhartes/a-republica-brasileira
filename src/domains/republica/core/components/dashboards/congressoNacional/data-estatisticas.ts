/**
 * @file data-estatisticas.ts
 * @description Este arquivo exporta os dados detalhados para o card "Estatísticas" do Congresso Nacional.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} estatisticasData
 * @description Contém todas as informações necessárias para renderizar o card "Estatísticas".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: taxa de atividade).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const estatisticasData: CardData = {
  id: 'estatisticas-parlamentares',
  title: 'Estatísticas',
  value: '86%',
  label: 'Taxa de atividade parlamentar',
  period: 'Dados em tempo real',
  icon: 'fas fa-chart-bar',
  link: 'https://dadosabertos.camara.leg.br/swagger/api.html',
  details: {
    title: 'Visão Detalhada sobre Estatísticas Parlamentares',
    description: `
      As estatísticas parlamentares oferecem uma análise aprofundada sobre a atuação dos
      deputados e senadores, incluindo dados sobre presença, votações, proposições apresentadas
      e participação em debates.
      <br/><br/>
      Esses dados são cruciais para avaliar a produtividade e o desempenho dos representantes
      eleitos, promovendo a transparência e o controle social.
    `,
  },
};
