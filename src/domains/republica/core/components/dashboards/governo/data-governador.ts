/**
 * @file data-governador.ts
 * @description Este arquivo exporta os dados detalhados para o card "Governador" do Governo Estadual.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} governadorData
 * @description Contém todas as informações necessárias para renderizar o card "Governador".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: nome do governador).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const governadorData: CardData = {
  id: 'governador',
  title: 'Governador',
  value: 'Cláudio Castro',
  label: 'Mandato atual',
  period: '2023-2026',
  icon: 'fas fa-user-tie',
  link: 'https://www.rj.gov.br/governador',
  details: {
    title: 'Visão Detalhada sobre o Governador',
    description: `
      O Governador do Estado do Rio de Janeiro é a autoridade máxima do Poder Executivo estadual,
      responsável por liderar a administração pública, implementar políticas e programas,
      e representar o estado em nível nacional e internacional.
      <br/><br/>
      Cláudio Castro é o atual governador, eleito para um mandato que se estende de 2023 a 2026.
      Sua gestão abrange diversas áreas, como saúde, educação, segurança e desenvolvimento econômico.
    `,
  },
};
