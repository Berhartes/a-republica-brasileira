/**
 * @file data-deputadosFederais.ts
 * @description Este arquivo exporta os dados detalhados para o card "Deputados Federais" do Congresso Nacional.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} deputadosFederaisData
 * @description Contém todas as informações necessárias para renderizar o card "Deputados Federais".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de deputados).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const deputadosFederaisData: CardData = {
  id: 'deputados-federais',
  title: 'Deputados Federais',
  value: '46',
  label: 'Cadeiras ocupadas pelo RJ',
  period: 'Eleitos 2022',
  icon: 'fas fa-users',
  link: 'https://www.camara.leg.br/deputados/quem-sao/resultado?partido=&uf=RJ&legislatura=56',
  details: {
    title: 'Visão Detalhada sobre os Deputados Federais',
    description: `
      Os deputados federais representam os estados e o Distrito Federal na Câmara dos Deputados,
      em Brasília. Eles são responsáveis por elaborar e votar leis de âmbito nacional,
      fiscalizar o Poder Executivo Federal e aprovar o orçamento da União.
      <br/><br/>
      A bancada do Rio de Janeiro na Câmara dos Deputados é composta por 46 parlamentares,
      eleitos para um mandato de quatro anos.
    `,
  },
};
