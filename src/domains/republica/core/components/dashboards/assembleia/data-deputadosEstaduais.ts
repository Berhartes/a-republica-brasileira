/**
 * @file data-deputadosEstaduais.ts
 * @description Este arquivo exporta os dados detalhados para o card "Deputados Estaduais".
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} deputadosEstaduaisData
 * @description Contém todas as informações necessárias para renderizar o card "Deputados Estaduais".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de deputados).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} [backgroundColor] - Cor de fundo opcional para o card.
 * @property {string} [textColor] - Cor do texto opcional para o card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const deputadosEstaduaisData: CardData = {
  id: 'deputados-estaduais',
  title: 'Deputados Estaduais',
  value: '70',
  label: 'Representantes eleitos',
  period: '2023-2027',
  icon: 'fas fa-users',
  link: '/deputados-estaduais', // Exemplo de link interno
  details: {
    title: 'Visão Detalhada sobre os Deputados Estaduais',
    description: `
      Os deputados estaduais são os representantes do povo no âmbito estadual, responsáveis por
      criar, alterar e revogar leis estaduais, além de fiscalizar as ações do Poder Executivo,
      como o governador e seus secretários. Eles atuam na Assembleia Legislativa.
      <br/><br/>
      Atualmente, a Assembleia Legislativa do Rio de Janeiro (ALERJ) é composta por 70 deputados.
      A representação inclui parlamentares de diversos partidos, refletindo a pluralidade
      política do estado.
    `,
  },
};
