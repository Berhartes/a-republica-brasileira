/**
 * @file data-comissoes.ts
 * @description Este arquivo exporta os dados detalhados para o card "Comissões" da Assembleia Legislativa.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} comissoesData
 * @description Contém todas as informações necessárias para renderizar o card "Comissões".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de comissões).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const comissoesData: CardData = {
  id: 'comissoes-estaduais',
  title: 'Comissões',
  value: '24',
  label: 'Comissões permanentes',
  period: 'Ativas',
  icon: 'fas fa-briefcase',
  link: 'https://www.alerj.rj.gov.br/comissoes',
  details: {
    title: 'Visão Detalhada sobre as Comissões',
    description: `
      As comissões parlamentares são grupos de trabalho formados por deputados para analisar
      e debater projetos de lei, fiscalizar atos do Executivo e realizar audiências públicas
      sobre temas específicos. Elas são essenciais para o funcionamento do processo legislativo.
      <br/><br/>
      Na Assembleia Legislativa, existem comissões permanentes, que tratam de assuntos contínuos,
      e comissões temporárias, criadas para finalidades específicas e por tempo determinado.
    `,
  },
};
