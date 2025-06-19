// src/domains/congresso/pages/ProjetosDeLei.tsx
import React, { useState } from "react";

interface Voto {
  favor: number;
  against: number;
  abstentions: number;
}

interface Suporte {
  positive: number;
  negative: number;
}

interface ProjetoLei {
  id: string;
  title: string;
  author: string;
  date: string;
  category: string;
  status: string;
  description: string;
  votes: Voto;
  comments: number;
  support: Suporte;
  lastUpdate: string;
  tags: string[];
}

// Mock data for law projects
const projectsData: ProjetoLei[] = [
  {
    id: "PL12345/2023",
    title: "Ampliação das Ciclovias na Zona Sul",
    author: "Dep. Ana Silva",
    date: "15/03/2023",
    category: "Mobilidade Urbana",
    status: "Em tramitação",
    description: "Projeto de lei que determina a ampliação da malha cicloviária na Zona Sul do Rio de Janeiro em 50km, conectando os principais bairros e facilitando a mobilidade sustentável.",
    votes: { favor: 12, against: 3, abstentions: 2 },
    comments: 28,
    support: { positive: 87, negative: 13 },
    lastUpdate: "23/06/2023",
    tags: ["Mobilidade", "Sustentabilidade", "Zona Sul"]
  },
  {
    id: "PL23456/2023",
    title: "Programa de Incentivo à Energia Solar em Prédios Públicos",
    author: "Dep. Roberto Lima",
    date: "02/04/2023",
    category: "Meio Ambiente",
    status: "Aprovado",
    description: "Institui programa para instalação de painéis solares em todos os prédios públicos estaduais, visando economia e sustentabilidade energética.",
    votes: { favor: 25, against: 2, abstentions: 0 },
    comments: 42,
    support: { positive: 93, negative: 7 },
    lastUpdate: "10/07/2023",
    tags: ["Energia Renovável", "Economia", "Sustentabilidade"]
  },
  {
    id: "PL34567/2023",
    title: "Reforço da Segurança nas Escolas Estaduais",
    author: "Dep. Carlos Mendes",
    date: "18/05/2023",
    category: "Segurança",
    status: "Rejeitado",
    description: "Propõe medidas de reforço à segurança nas escolas estaduais, incluindo câmeras de vigilância, detectores de metal e presença policial.",
    votes: { favor: 10, against: 18, abstentions: 5 },
    comments: 89,
    support: { positive: 45, negative: 55 },
    lastUpdate: "30/06/2023",
    tags: ["Educação", "Segurança", "Escolas"]
  }
];

// Filter categories
const categories = ["Todos", "Educação", "Saúde", "Segurança", "Mobilidade Urbana", "Meio Ambiente", "Economia", "Cultura", "Direitos Humanos"];
const statuses = ["Todos", "Em tramitação", "Aprovado", "Rejeitado", "Arquivado"];

const ProjetosDeLei: React.FC = () => {
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [selectedStatus, setSelectedStatus] = useState<string>("Todos");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // Filter projects based on search and filters
  const filteredProjects = projectsData.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "Todos" || project.category === selectedCategory;
    const matchesStatus = selectedStatus === "Todos" || project.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Toggle project details expansion
  const toggleProjectDetails = (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
    }
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "Em tramitação":
        return "text-blue-600 bg-blue-50";
      case "Aprovado":
        return "text-green-600 bg-green-50";
      case "Rejeitado":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Banner */}
          <div className="relative rounded-xl mb-8 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-blue-900/70 z-10"></div>
            <img 
              src="https://images.unsplash.com/photo-1589391886645-d51941baf7fb"
              alt="Alerj" 
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-center items-center text-white p-6">
              <h1 className="text-3xl font-bold mb-2 text-center">Projetos de Lei</h1>
              <p className="text-lg opacity-90 text-center max-w-2xl">
                Acompanhe as propostas em tramitação na Assembleia Legislativa do Rio de Janeiro
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">Buscar Projetos</h2>
            <p className="text-gray-500 mb-4">
              Encontre projetos de lei por título, número ou autor
            </p>
            
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="search"
                  placeholder="Pesquisar projetos..."
                  className="w-full p-2 pl-9 border border-gray-300 rounded-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center gap-1"
              >
                Filtros
              </button>
            </div>

            {/* Expandable filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoria</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select 
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Resultados</h2>
              <p className="text-sm text-gray-500">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
              </p>
            </div>

            {/* No results message */}
            {filteredProjects.length === 0 ? (
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <p className="text-gray-500">Nenhum projeto encontrado com os filtros selecionados.</p>
                <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md" onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Todos");
                  setSelectedStatus("Todos");
                }}>
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Project cards */}
                {filteredProjects.map((project) => {
                  const statusColor = getStatusColor(project.status);
                  const isExpanded = expandedProject === project.id;
                  
                  return (
                    <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                      {/* Project header - always visible */}
                      <div className="p-4 cursor-pointer" onClick={() => toggleProjectDetails(project.id)}>
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 rounded">
                                {project.id}
                              </span>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded flex items-center gap-1 ${statusColor}`}>
                                {project.status}
                              </span>
                            </div>
                            <h3 className="font-bold text-lg">{project.title}</h3>
                          </div>
                          <span className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>{project.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>Proposto em {project.date}</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Expandable details section */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t mt-2">
                          <div className="p-3 bg-gray-50 rounded-lg mb-3">
                            <h4 className="font-medium mb-2">Descrição:</h4>
                            <p className="text-sm text-gray-700">{project.description}</p>
                          </div>
                          
                          {/* Voting results */}
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Votação:</h4>
                            <div className="flex flex-wrap gap-4">
                              <div className="flex items-center gap-1">
                                <span className="text-sm">A favor: <strong>{project.votes.favor}</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">Contra: <strong>{project.votes.against}</strong></span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm">Abstenções: <strong>{project.votes.abstentions}</strong></span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Public opinion */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">Apoio popular: {project.support.positive}%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">{project.comments} comentários</span>
                              </div>
                            </div>
                            
                            <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded-md">
                              Ver detalhes
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Legislative process info */}
          <div className="mt-10 bg-white p-6 rounded-xl shadow">
            <h3 className="text-xl font-bold mb-4">Processo Legislativo</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="min-w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">1</div>
                <div>
                  <h4 className="font-medium text-blue-800">Apresentação</h4>
                  <p className="text-sm text-gray-600">
                    O projeto é apresentado por um deputado, comissão ou pelo Poder Executivo e recebe um número de identificação.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">2</div>
                <div>
                  <h4 className="font-medium text-blue-800">Comissões</h4>
                  <p className="text-sm text-gray-600">
                    O projeto passa por comissões temáticas que analisam sua constitucionalidade, impacto orçamentário e mérito.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">3</div>
                <div>
                  <h4 className="font-medium text-blue-800">Plenário</h4>
                  <p className="text-sm text-gray-600">
                    Após aprovação nas comissões, o projeto é votado em plenário pelos deputados. Pode receber emendas nesta fase.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">4</div>
                <div>
                  <h4 className="font-medium text-blue-800">Sanção ou Veto</h4>
                  <p className="text-sm text-gray-600">
                    Se aprovado, segue para o Governador, que pode sancionar (aprovar) ou vetar total ou parcialmente o projeto.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="min-w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">5</div>
                <div>
                  <h4 className="font-medium text-blue-800">Publicação</h4>
                  <p className="text-sm text-gray-600">
                    Após sancionada, a lei é publicada no Diário Oficial e entra em vigor na data estabelecida no texto.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjetosDeLei;