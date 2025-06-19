/**
 * @file data-programasSociais.ts
 * @description Este arquivo exporta os dados detalhados para o card "Programas Sociais" do Governo Estadual.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} programasSociaisData
 * @description Contém todas as informações necessárias para renderizar o card "Programas Sociais".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de programas).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const programasSociaisData: CardData = {
  id: 'programas-sociais',
  title: 'Programas Sociais',
  value: '15+',
  label: 'Iniciativas ativas',
  period: 'Assistência',
  icon: 'fas fa-hands-helping',
  link: 'https://www.rj.gov.br/programas-sociais',
  details: {
    title: 'Visão Detalhada sobre Programas Sociais',
    description: `
      Os programas sociais do governo do estado do Rio de Janeiro visam promover a inclusão
      social, combater a pobreza e garantir direitos básicos à população mais vulnerável.
      Eles abrangem áreas como moradia, alimentação, educação e qualificação profissional.
      <br/><br/>
      A implementação desses programas é fundamental para reduzir as desigualdades sociais
      e melhorar a qualidade de vida dos cidadãos fluminenses.
    `,
  },
};
