import { CardData } from '../dashboardConfig';

/**
 * data-rankingAtividades.ts
 *
 * Este arquivo define os dados para o card "Ranking de Atividades"
 * exibido na visão geral do dashboard do Congresso Nacional.
 * A lógica detalhada e a busca de dados para o board específico
 * são tratadas pelo componente BoardRankingCongresso.tsx.
 */
export const rankingAtividadesData: CardData = {
  id: 'ranking-atividades', // Ou o ID que era usado, ex: `ranking-${uf}` se dinâmico
  title: "Ranking de Atividades",
  icon: "fas fa-trophy", // Ícone original
  value: "Top 10", // Valor genérico para a visão geral
  label: "Parlamentares mais ativos", // Label para a visão geral
  period: "2023", // Período original
  link: "https://www.camara.leg.br/deputados/ranking", // Link original
  details: {
    title: "Ranking de Atividade Parlamentar",
    description: "Detalhes sobre o ranking de atividade dos deputados." // Descrição genérica
  }
};
