/**
 * @file data-eleitorado.ts
 * @description Este arquivo exporta os dados detalhados para o card "Eleitorado" do Congresso Nacional.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} eleitoradoData
 * @description Contém todas as informações necessárias para renderizar o card "Eleitorado".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de eleitores).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const eleitoradoData: CardData = {
  id: 'eleitorado',
  title: 'Eleitorado',
  value: '12,8M',
  label: 'Eleitores registrados no RJ',
  period: 'Dados 2023',
  icon: 'fas fa-user-check',
  link: 'https://www.tse.jus.br/eleitor/estatisticas-de-eleitorado',
  details: {
    title: 'Visão Detalhada sobre o Eleitorado',
    description: `
      O eleitorado do Rio de Janeiro é composto por milhões de cidadãos aptos a votar,
      desempenhando um papel crucial nas eleições e na definição dos rumos políticos do estado.
      <br/><br/>
      As estatísticas do eleitorado são atualizadas periodicamente pelo Tribunal Superior Eleitoral (TSE),
      fornecendo dados importantes sobre a distribuição demográfica e o perfil dos votantes.
    `,
  },
};
