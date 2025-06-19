// src/domains/congresso/pages/MapaPolitico.tsx
import React, { useState } from "react";

interface Representative {
  name: string;
  party: string;
  position: string;
  image: string;
}

interface Region {
  id: string;
  name: string;
  population: string;
  neighborhoods: string[];
  representatives: Representative[];
  projects: number;
  mainIssues: string[];
  description: string;
}

// Mock data for regions
const regionsData: Region[] = [
  {
    id: "zona-sul",
    name: "Zona Sul",
    population: "1.2 milhões",
    neighborhoods: ["Copacabana", "Ipanema", "Leblon", "Botafogo", "Flamengo", "Laranjeiras", "Gávea"],
    representatives: [
      { name: "Ana Silva", party: "PSB", position: "Deputada Estadual", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" },
      { name: "Pedro Santos", party: "PV", position: "Vereador", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" }
    ],
    projects: 23,
    mainIssues: ["Segurança", "Mobilidade Urbana", "Preservação Ambiental"],
    description: "A Zona Sul do Rio de Janeiro é conhecida por suas praias e alta qualidade de vida. É a região com maior IDH da cidade, mas enfrenta desafios como mobilidade urbana e segurança pública."
  },
  {
    id: "zona-norte",
    name: "Zona Norte",
    population: "2.8 milhões",
    neighborhoods: ["Tijuca", "Méier", "Maracanã", "Grajaú", "Vila Isabel", "Andaraí", "Lins de Vasconcelos"],
    representatives: [
      { name: "Carlos Mendes", party: "PSB", position: "Deputado Estadual", image: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" },
      { name: "Mariana Costa", party: "MDB", position: "Vereadora", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" }
    ],
    projects: 35,
    mainIssues: ["Saneamento Básico", "Educação", "Saúde"],
    description: "A Zona Norte do Rio de Janeiro é a região mais populosa da cidade. Possui importantes pontos culturais como o Maracanã e o bairro da Tijuca, que abriga a maior floresta urbana do mundo."
  },
  {
    id: "zona-oeste",
    name: "Zona Oeste",
    population: "2.3 milhões",
    neighborhoods: ["Barra da Tijuca", "Recreio dos Bandeirantes", "Jacarepaguá", "Santa Cruz", "Campo Grande", "Bangu"],
    representatives: [
      { name: "Roberto Lima", party: "PT", position: "Deputado Estadual", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" },
      { name: "Júlia Almeida", party: "PL", position: "Vereadora", image: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" }
    ],
    projects: 42,
    mainIssues: ["Infraestrutura", "Transporte Público", "Expansão Urbana"],
    description: "A Zona Oeste é a região de maior expansão do Rio de Janeiro. Inclui áreas de alto padrão como a Barra da Tijuca e também regiões em desenvolvimento, com grande potencial de crescimento econômico."
  },
  {
    id: "baixada",
    name: "Baixada Fluminense",
    population: "3.7 milhões",
    neighborhoods: ["Nova Iguaçu", "Duque de Caxias", "Belford Roxo", "São João de Meriti", "Nilópolis", "Mesquita"],
    representatives: [
      { name: "José Santos", party: "PSOL", position: "Deputado Federal", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" },
      { name: "Fernanda Oliveira", party: "PP", position: "Deputada Estadual", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" }
    ],
    projects: 48,
    mainIssues: ["Segurança Pública", "Saneamento", "Transporte"],
    description: "A Baixada Fluminense é uma região metropolitana com alta densidade populacional. Enfrenta desafios de infraestrutura, mas tem grande importância econômica e cultural para o estado do Rio de Janeiro."
  },
  {
    id: "regiao-serrana",
    name: "Região Serrana",
    population: "700 mil",
    neighborhoods: ["Petrópolis", "Teresópolis", "Nova Friburgo", "Itaipava", "Areal", "São José do Vale do Rio Preto"],
    representatives: [
      { name: "Roberta Lima", party: "PT", position: "Deputada Estadual", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" },
      { name: "Paulo Carvalho", party: "PSDB", position: "Deputado Federal", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80" }
    ],
    projects: 27,
    mainIssues: ["Turismo", "Preservação Ambiental", "Prevenção de Desastres Naturais"],
    description: "A Região Serrana é conhecida pelo clima ameno, belezas naturais e importante papel na história do Brasil. É um polo turístico que enfrenta desafios relacionados a desastres naturais e preservação ambiental."
  }
];

const MapaPolitico: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Region>(regionsData[0]);
  const [displayMode, setDisplayMode] = useState<"map" | "list">("map"); 

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Banner */}
          <div className="relative rounded-xl mb-8 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-blue-900/70 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1554672449-a76256a8ffa8"
              alt="Mapa do Rio de Janeiro" 
              className="w-full h-48 md:h-64 object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-6">
              <h1 className="text-3xl font-bold mb-2 text-center">Mapa Político do Rio de Janeiro</h1>
              <p className="text-lg opacity-90 text-center max-w-2xl">
                Explore as regiões do estado e conheça seus representantes, projetos e características
              </p>
            </div>
          </div>

          {/* Toggle view mode */}
          <div className="mb-6 flex justify-center">
            <div className="bg-white shadow rounded-lg p-1 inline-flex">
              <button 
                className={`px-4 py-2 rounded-md ${displayMode === "map" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                onClick={() => setDisplayMode("map")}
              >
                Visualizar Mapa
              </button>
              <button 
                className={`px-4 py-2 rounded-md ${displayMode === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-700"}`}
                onClick={() => setDisplayMode("list")}
              >
                Listar Regiões
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left panel - Region list */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Regiões do Rio de Janeiro</h2>
                <ul className="space-y-1">
                  {regionsData.map((region) => (
                    <li key={region.id}>
                      <button
                        className={`w-full text-left px-3 py-2 rounded-md ${
                          selectedRegion.id === region.id 
                            ? "bg-blue-50 text-blue-800" 
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedRegion(region)}
                      >
                        {region.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Region statistics */}
              <div className="bg-white rounded-lg shadow p-4 mt-4">
                <h2 className="text-lg font-semibold mb-3">Estatísticas</h2>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Maior População</span>
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      Baixada Fluminense
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Mais Projetos</span>
                    <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                      Baixada Fluminense
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Maior IDH</span>
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Zona Sul
                    </span>
                  </li>
                  <li className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Maior Crescimento</span>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                      Zona Oeste
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right panel - Region details */}
            <div className="md:col-span-2">
              {displayMode === "map" ? (
                <div className="bg-white rounded-lg shadow p-4 h-full">
                  <h2 className="text-xl font-semibold">{selectedRegion.name}</h2>
                  <p className="text-gray-500 mb-4">População estimada: {selectedRegion.population}</p>
                  
                  {/* Map placeholder */}
                  <div className="bg-gray-100 rounded-lg h-64 mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-gray-600">Mapa interativo da região {selectedRegion.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        (Este seria um mapa interativo em uma aplicação real)
                      </p>
                    </div>
                  </div>

                  {/* Region description */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Sobre a região:</h3>
                    <p className="text-sm text-gray-700">{selectedRegion.description}</p>
                  </div>

                  {/* Main issues */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Principais temas:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegion.mainIssues.map((issue, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {issue}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Neighborhoods */}
                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Bairros/Municípios:</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRegion.neighborhoods.map((neighborhood, index) => (
                        <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                          {neighborhood}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Representatives */}
                  <div>
                    <h3 className="font-medium mb-2">Principais representantes:</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedRegion.representatives.map((rep, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                            <img 
                              src={rep.image} 
                              alt={rep.name} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{rep.name}</p>
                            <p className="text-xs text-gray-600">{rep.position} - {rep.party}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* List view of all regions */
                <div className="space-y-4">
                  {regionsData.map((region) => (
                    <div key={region.id} className="bg-white rounded-lg shadow p-4">
                      <h2 className="text-xl font-semibold">{region.name}</h2>
                      <p className="text-gray-500 mb-3">População estimada: {region.population}</p>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Representantes</h4>
                          <ul className="text-sm space-y-1">
                            {region.representatives.map((rep, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden">
                                  <img 
                                    src={rep.image} 
                                    alt={rep.name} 
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <span>{rep.name} ({rep.party})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-sm mb-2">Principais temas</h4>
                          <div className="flex flex-wrap gap-1">
                            {region.mainIssues.map((issue, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                                {issue}
                              </span>
                            ))}
                          </div>

                          <h4 className="font-medium text-sm mt-3 mb-2">Projetos Ativos</h4>
                          <p className="text-sm">
                            <span className="font-bold text-blue-700">{region.projects}</span> projetos em andamento
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3 mt-3 flex justify-end">
                        <button 
                          className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm"
                          onClick={() => {
                            setSelectedRegion(region);
                            setDisplayMode("map");
                          }}
                        >
                          Ver detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Info section */}
          <div className="mt-10 bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-4">Divisão Político-Administrativa do Rio de Janeiro</h3>
            
            <p className="text-gray-700 mb-4">
              O estado do Rio de Janeiro é dividido em diferentes regiões administrativas, cada uma com suas próprias características socioeconômicas, culturais e políticas. A divisão apresentada neste mapa é uma simplificação para fins de visualização das principais áreas.
            </p>
            
            <p className="text-gray-700">
              As informações de representantes são baseadas nos políticos eleitos que declararam determinada região como sua base eleitoral ou que tradicionalmente defendem pautas relacionadas a estas áreas. Projetos e temas prioritários refletem as principais demandas e iniciativas legislativas para cada região.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MapaPolitico;