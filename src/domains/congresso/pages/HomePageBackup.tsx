// Este arquivo contém o conteúdo original da HomePage que foi removido
// Ele está sendo guardado aqui para referência futura ou caso precise ser restaurado

// src/domains/congresso/pages/HomePageBackup.tsx
import React from "react";
import { Link } from "@tanstack/react-router";
// Importação corrigida para componente que foi movido
import { DashboardSimples } from "@/domains/congresso/components/Dashboards/DashboardsBackup";
import { PriorityActions } from "@/domains/congresso/components/PriorityActions";
import { ActionCards } from "@/domains/congresso/components/ActionCards";

interface HomePageProps {}

const HomePageOriginal: React.FC<HomePageProps> = () => {
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Bem-vindo à República Brasileira</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Explore informações sobre o Senado Federal e acompanhe o trabalho dos senadores.
      </p>
      
      {/* Nova seção do Senado */}
      <section className="mt-10 pb-12">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-800 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-1/2 mb-6 lg:mb-0">
                <h2 className="text-3xl text-white font-bold mb-4">Senado Federal</h2>
                <p className="text-blue-100 mb-4">
                  Acompanhe os dados de todos os 81 senadores brasileiros!
                  Analise gastos, votações, proposições e presença em sessões.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link 
                    to="/senado" 
                    className="bg-white text-blue-700 font-medium py-2 px-6 rounded-md hover:bg-blue-50 transition"
                  >
                    Ver Dashboard do Senado
                  </Link>
                  <Link 
                    to="/senado/mapa-votacoes" 
                    className="bg-blue-700 text-white font-medium py-2 px-6 rounded-md border border-blue-300 hover:bg-blue-800 transition"
                  >
                    Mapa de Votações
                  </Link>
                </div>
              </div>
              <div className="lg:w-1/2 flex justify-center">
                <div className="bg-white rounded-lg p-4 max-w-md">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Destaques do Senado</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">✓</span>
                      <span>Análise de despesas CEAPS por senador e partido</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">✓</span>
                      <span>Detecção automática de gastos incomuns</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">✓</span>
                      <span>Monitoramento de presenças e votações nominais</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-800 p-1 rounded-full mr-2">✓</span>
                      <span>Análise completa de proposições apresentadas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ações Prioritárias */}
      <ActionCards />

      {/* Dashboards */}
      <DashboardSimples isDarkMode={false} />

      {/* Priority Actions */}
      <PriorityActions />
    </>
  );
};

export default HomePageOriginal;

/*
Instruções para restaurar elementos na HomePage:

1. Para restaurar a seção do Senado:
   - Copie a seção comentada "Nova seção do Senado" e cole-a na HomePage atual

2. Para restaurar os componentes ActionCards e PriorityActions:
   - Importe os componentes:
     import { PriorityActions } from "@/domains/congresso/components/PriorityActions";
     import { ActionCards } from "@/domains/congresso/components/ActionCards";
   - Adicione-os na HomePage:
     <ActionCards />
     <PriorityActions />

3. Para restaurar os dashboards:
   - Siga as instruções no arquivo src/domains/congresso/components/Dashboards/DashboardsBackup.tsx
*/
