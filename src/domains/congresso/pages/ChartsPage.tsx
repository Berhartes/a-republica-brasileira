// src/domains/congresso/pages/ChartsPage.tsx
import React from "react";

interface ChartsPageProps {}

const ChartsPage: React.FC<ChartsPageProps> = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gráficos</h1>
      <p>Visualize os gráficos e métricas.</p>
    </div>
  );
};

export default ChartsPage;