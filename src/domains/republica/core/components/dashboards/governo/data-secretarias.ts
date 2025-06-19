/**
 * @file data-secretarias.ts
 * @description Este arquivo exporta os dados detalhados para o card "Secretarias" do Governo Estadual.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} secretariasData
 * @description Contém todas as informações necessárias para renderizar o card "Secretarias".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de secretarias).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const secretariasData: CardData = {
  id: 'secretarias',
  title: 'Secretarias',
  value: '27',
  label: 'Órgãos de gestão',
  period: 'Executivo',
  icon: 'fas fa-building',
  link: 'https://www.rj.gov.br/secretarias',
  details: {
    title: 'Visão Detalhada sobre as Secretarias',
    description: `
      As secretarias de estado são os órgãos responsáveis pela execução das políticas públicas
      em áreas específicas, como saúde, educação, segurança, fazenda, entre outras. Elas são
      subordinadas ao Governador e desempenham um papel fundamental na administração estadual.
      <br/><br/>
      A estrutura das secretarias pode variar ao longo do tempo, refletindo as prioridades
      e necessidades da gestão governamental.
    `,
  },
};
