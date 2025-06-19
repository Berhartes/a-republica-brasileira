/**
 * @file data-orcamentoEstadual.ts
 * @description Este arquivo exporta os dados detalhados para o card "Orçamento" da Assembleia Legislativa.
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
  id: 'orcamento-estadual-alerj',
  title: 'Orçamento',
  value: 'R$ 2,5B',
  label: 'Orçamento anual',
  period: 'Fiscal',
  icon: 'fas fa-money-bill-wave',
  link: 'https://www.alerj.rj.gov.br/orcamento',
  details: {
    title: 'Visão Detalhada sobre o Orçamento Estadual',
    description: `
      O orçamento anual da Assembleia Legislativa do Rio de Janeiro (ALERJ) detalha
      como os recursos públicos são alocados para o funcionamento do poder legislativo,
      incluindo despesas com pessoal, manutenção e investimentos.
      <br/><br/>
      A transparência na gestão orçamentária é fundamental para a fiscalização e o
      controle social, garantindo que os recursos sejam utilizados de forma eficiente
      e em benefício da população.
    `,
  },
};
