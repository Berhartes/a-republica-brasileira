/**
 * @file data-municipios.ts
 * @description Este arquivo exporta os dados detalhados para o card "Municípios" do Governo Estadual.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} municipiosData
 * @description Contém todas as informações necessárias para renderizar o card "Municípios".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de municípios).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const municipiosData: CardData = {
  id: 'municipios',
  title: 'Municípios',
  value: '92',
  label: 'Cidades fluminenses',
  period: 'Geografia',
  icon: 'fas fa-map-marked-alt',
  link: 'https://www.rj.gov.br/municipios',
  details: {
    title: 'Visão Detalhada sobre os Municípios do RJ',
    description: `
      O estado do Rio de Janeiro é composto por 92 municípios, cada um com suas particularidades
      geográficas, econômicas e culturais. A gestão municipal é responsável por serviços básicos
      como saúde, educação e infraestrutura local.
      <br/><br/>
      A diversidade dos municípios fluminenses contribui para a riqueza do estado, desde as
      grandes metrópoles até as cidades históricas e turísticas.
    `,
  },
};
