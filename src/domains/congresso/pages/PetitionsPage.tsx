// src/domains/congresso/pages/PetitionsPage.tsx
import React, { useState } from "react";
import { Link } from "@tanstack/react-router";

interface Petition {
  id: number;
  title: string;
  description: string;
  category: string;
  signatures: number;
  goal: number;
  status: string;
  created: string;
  author: string;
  tags: string[];
}

// Mock data for petitions
const mockPetitions: Petition[] = [
  {
    id: 1,
    title: "Ampliação das Ciclovias na Zona Sul",
    description: "Projeto de lei que determina a ampliação da malha cicloviária na Zona Sul do Rio de Janeiro em 50km, conectando os principais bairros e facilitando a mobilidade sustentável.",
    category: "Mobilidade Urbana",
    signatures: 3245,
    goal: 5000,
    status: "active",
    created: "2023-06-15",
    author: "Ana Silva",
    tags: ["Mobilidade", "Sustentabilidade", "Zona Sul"]
  },
  {
    id: 2,
    title: "Programa de Incentivo à Energia Solar em Prédios Públicos",
    description: "Institui programa para instalação de painéis solares em todos os prédios públicos estaduais, visando economia e sustentabilidade energética.",
    category: "Meio Ambiente",
    signatures: 4872,
    goal: 5000,
    status: "active",
    created: "2023-04-02",
    author: "Roberto Lima",
    tags: ["Energia Renovável", "Economia", "Sustentabilidade"]
  },
  {
    id: 3,
    title: "Reforço da Segurança nas Escolas Estaduais",
    description: "Propõe medidas de reforço à segurança nas escolas estaduais, incluindo câmeras de vigilância, detectores de metal e presença policial.",
    category: "Segurança",
    signatures: 2189,
    goal: 5000,
    status: "active",
    created: "2023-05-18",
    author: "Carlos Mendes",
    tags: ["Educação", "Segurança", "Escolas"]
  },
  {
    id: 4,
    title: "Revitalização do Parque Municipal",
    description: "Petição para revitalizar o Parque Municipal com novas áreas de lazer, manutenção das áreas verdes e melhoria da iluminação.",
    category: "Meio Ambiente",
    signatures: 5243,
    goal: 5000,
    status: "completed",
    created: "2023-02-10",
    author: "Mariana Costa",
    tags: ["Lazer", "Meio Ambiente", "Urbanismo"]
  }
];

const PetitionsPage: React.FC = () => {
  const [filter, setFilter] = useState<string>("all"); // all, active, completed, mine
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Filter petitions based on filter and search term
  const filteredPetitions = mockPetitions.filter(petition => {
    const matchesFilter = 
      filter === "all" || 
      (filter === "active" && petition.status === "active") ||
      (filter === "completed" && petition.status === "completed") ||
      (filter === "mine" && petition.author === "Ana Silva"); // Assuming current user is Ana Silva
    
    const matchesSearch = 
      petition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      petition.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      petition.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calculate progress percentage
  const getProgressPercentage = (signatures: number, goal: number): number => {
    return Math.min(Math.round((signatures / goal) * 100), 100);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Petições</h1>
        <Link 
          to="/criar-peticao" 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Criar Nova Petição
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md ${filter === "all" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
            >
              Todas
            </button>
            <button 
              onClick={() => setFilter("active")}
              className={`px-3 py-1 rounded-md ${filter === "active" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
            >
              Ativas
            </button>
            <button 
              onClick={() => setFilter("completed")}
              className={`px-3 py-1 rounded-md ${filter === "completed" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
            >
              Concluídas
            </button>
            <button 
              onClick={() => setFilter("mine")}
              className={`px-3 py-1 rounded-md ${filter === "mine" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
            >
              Minhas
            </button>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <input
              type="search"
              placeholder="Buscar petições..."
              className="w-full p-2 pl-8 border border-gray-300 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-2 top-2.5 text-gray-400">
              🔍
            </span>
          </div>
        </div>
      </div>

      {/* Petitions List */}
      {filteredPetitions.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">Nenhuma petição encontrada com os filtros selecionados.</p>
          <button 
            onClick={() => {setFilter("all"); setSearchTerm("");}}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPetitions.map(petition => {
            const progressPercentage = getProgressPercentage(petition.signatures, petition.goal);
            
            return (
              <div key={petition.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{petition.title}</h2>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      petition.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                    }`}>
                      {petition.status === "completed" ? "Concluída" : "Ativa"}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{petition.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {petition.category}
                    </span>
                    {petition.tags.map(tag => (
                      <span key={tag} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{petition.signatures} assinaturas</span>
                      <span>{petition.goal} meta</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          progressPercentage >= 100 ? "bg-green-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      Criada em {petition.created} por {petition.author}
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                      {petition.status === "completed" ? "Ver Resultados" : "Assinar Petição"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PetitionsPage;