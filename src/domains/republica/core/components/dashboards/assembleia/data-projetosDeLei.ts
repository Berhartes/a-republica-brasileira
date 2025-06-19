/**
 * @file data-projetosDeLei.ts
 * @description Este arquivo exporta os dados detalhados para o card "Projetos de Lei" da Assembleia Legislativa.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} projetosDeLeiData
 * @description Contém todas as informações necessárias para renderizar o card "Projetos de Lei".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de projetos).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const projetosDeLeiData: CardData = {
  id: 'projetos-de-lei-estaduais',
  title: 'Projetos de Lei',
  value: '350+',
  label: 'Em tramitação',
  period: '2023-2024',
  icon: 'fas fa-file-alt',
  link: 'https://www.alerj.rj.gov.br/projetos',
  details: {
    title: 'Visão Detalhada sobre Projetos de Lei',
    description: `
      Os projetos de lei são propostas legislativas que, após tramitação e aprovação nas
      comissões e no plenário da Assembleia Legislativa, podem se tornar leis estaduais.
      Eles abrangem diversas áreas, como saúde, educação, segurança e infraestrutura.
      <br/><br/>
      Acompanhar os projetos de lei é fundamental para entender as prioridades do legislativo
      e o impacto potencial na vida dos cidadãos.
    `,
  },
};
