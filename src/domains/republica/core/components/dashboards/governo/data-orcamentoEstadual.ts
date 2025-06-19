/**
 * @file data-orcamentoEstadual.ts
 * @description Este arquivo exporta os dados detalhados para o card "Orçamento Estadual" do Governo.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} orcamentoEstadualData
 * @description Contém todas as informações necessárias para renderizar o card "Orçamento Estadual".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: valor do orçamento).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const orcamentoEstadualData: CardData = {
  id: 'orcamento-estadual-governo',
  title: 'Orçamento Estadual',
  value: 'R$ 87,8B',
  label: 'Previsão para 2023',
  period: 'Finanças',
  icon: 'fas fa-chart-pie',
  link: 'https://www.rj.gov.br/orcamento',
  details: {
    title: 'Visão Detalhada sobre o Orçamento Estadual',
    description: `
      O orçamento do estado do Rio de Janeiro é o planejamento financeiro que define como
      os recursos públicos serão arrecadados e aplicados em diversas áreas, como saúde,
      educação, segurança e infraestrutura.
      <br/><br/>
      A previsão orçamentária para 2023 é de R$ 87,8 bilhões, refletindo as prioridades
      e os desafios da gestão estadual para o período.
    `,
  },
};
