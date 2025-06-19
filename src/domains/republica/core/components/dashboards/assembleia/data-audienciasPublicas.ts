/**
 * @file data-audienciasPublicas.ts
 * @description Este arquivo exporta os dados detalhados para o card "Audiências Públicas" da Assembleia Legislativa.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} audienciasPublicasData
 * @description Contém todas as informações necessárias para renderizar o card "Audiências Públicas".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de audiências).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const audienciasPublicasData: CardData = {
  id: 'audiencias-publicas-estaduais',
  title: 'Audiências Públicas',
  value: '45',
  label: 'Realizadas em 2023',
  period: '2023',
  icon: 'fas fa-comments',
  link: 'https://www.alerj.rj.gov.br/audiencias',
  details: {
    title: 'Visão Detalhada sobre Audiências Públicas',
    description: `
      As audiências públicas são eventos abertos à participação da sociedade, promovidos
      pelas comissões ou pelo plenário da Assembleia Legislativa, para debater temas de
      grande relevância e coletar opiniões de especialistas e cidadãos.
      <br/><br/>
      Elas são um importante instrumento de transparência e participação popular no processo
      legislativo, permitindo que a população influencie as decisões dos parlamentares.
    `,
  },
};
