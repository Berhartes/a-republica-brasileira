/**
 * @file data-senadores.ts
 * @description Este arquivo exporta os dados detalhados para o card "Senadores" do Congresso Nacional.
 *              A estrutura segue o tipo CardData, permitindo que seja facilmente integrado
 *              ao sistema de dashboards. Manter os dados centralizados aqui facilita a
 *              manutenção e a consistência das informações.
 */

import { CardData } from '../dashboardConfig';

/**
 * @property {CardData} senadoresData
 * @description Contém todas as informações necessárias para renderizar o card "Senadores".
 *
 * @property {string} id - Identificador único para o card.
 * @property {string} title - O título principal do card.
 * @property {string} value - O valor principal exibido no card (ex: número de senadores).
 * @property {string} label - Um rótulo ou descrição curta para o valor principal.
 * @property {string} period - O período de tempo ao qual os dados se referem.
 * @property {string} icon - A classe do ícone a ser exibido no card.
 * @property {string} link - URL para a página de "Ver mais".
 * @property {object} details - Um objeto contendo o conteúdo detalhado para o "board" quando o card é aberto.
 * @property {string} details.title - Título para a seção de detalhes.
 * @property {string} details.description - Texto descritivo para a seção de detalhes.
 */
export const senadoresData: CardData = {
  id: 'senadores',
  title: 'Senadores',
  value: '3',
  label: 'Representantes ativos',
  period: 'Mandatos 2027/2031',
  icon: 'fas fa-landmark',
  link: 'https://www25.senado.leg.br/web/senadores/por-uf/-/uf/RJ',
  details: {
    title: 'Visão Detalhada sobre os Senadores',
    description: `
      Os senadores representam os estados e o Distrito Federal no Senado Federal, em Brasília.
      Cada estado e o Distrito Federal são representados por três senadores, eleitos para
      um mandato de oito anos. A cada quatro anos, a eleição renova um terço e dois terços
      das cadeiras do Senado.
      <br/><br/>
      Os senadores têm como principais atribuições legislar sobre matérias de interesse nacional,
      fiscalizar o Poder Executivo e aprovar indicações de autoridades.
    `,
    mainValueLabel: 'Total de Senadores',
    periodLabel: 'Mandatos Vigentes',
    boardPeriodValue: '2019-2027 / 2023-2031', // Exemplo, pode ser ajustado conforme a realidade dos dados
    additionalInfoSectionTitle: 'Informações Adicionais',
    additionalInfo: [
      {
        icon: 'fas fa-calendar-check',
        text: 'Mandatos: 8 anos (renovação de 1/3 e 2/3 a cada 4 anos)',
      },
      {
        icon: 'fas fa-map-marker-alt',
        text: 'Representação: Estadual e do Distrito Federal',
      },
      {
        icon: 'fas fa-users',
        text: 'Participação partidária detalhada no portal oficial.',
      },
    ],
    externalLinkText: 'Acesse o portal do Senado',
  },
};
