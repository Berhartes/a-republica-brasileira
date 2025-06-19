import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle 
} from "@/shared/components/ui/sheet/index";
import { Search } from "lucide-react";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'deputado' | 'senador' | 'projeto' | 'partido';
  url: string;
}

interface SearchPanelProps {
  suggestions?: SearchSuggestion[];
}

const defaultSuggestions = [
  { id: "1", text: "Projetos de Lei", type: "projeto" as const, url: "/projetos-de-lei" },
  { id: "2", text: "Deputados", type: "deputado" as const, url: "/buscar-politicos" },
  { id: "3", text: "Votações", type: "projeto" as const, url: "/senado/mapa-votacoes" }
];

export const SearchPanel: React.FC<SearchPanelProps> = ({ 
  suggestions = defaultSuggestions 
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-white hover:bg-[#234780] rounded-md">
          <Search className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 text-white">
        <SheetTitle className="text-white">Busca</SheetTitle>
        <div className="flex flex-col gap-4 mt-8">
          <div className="relative">
            <input 
              type="search" 
              placeholder="Digite sua busca..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-2 text-gray-300">Sugestões</h3>
            <ul className="space-y-2">
              {suggestions.map(suggestion => (
                <li 
                  key={suggestion.id} 
                  className="cursor-pointer hover:text-blue-400 transition-colors"
                >
                  {suggestion.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SearchPanel;
