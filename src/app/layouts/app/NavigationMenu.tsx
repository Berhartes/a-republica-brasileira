import React from "react";
import { Menu } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle, 
  SheetDescription 
} from "@/shared/components/ui/sheet/index";

interface NavigationItem {
  label: string;
  href: string;
  className?: string;
}

interface NavigationMenuProps {
  items?: NavigationItem[];
}

const defaultItems: NavigationItem[] = [
  { label: "Início", href: "/" },
  { label: "Buscar Políticos", href: "/buscar-politicos" },
  { label: "Mapa Político", href: "/mapa-politico" },
  { label: "Projetos de Lei", href: "/projetos-de-lei" },
  { label: "Petições", href: "/peticoes" },
  
  // Separador do Senado
  { label: "---", href: "#separator" },
  { label: "SENADO FEDERAL", href: "#senado-header", className: "text-sm font-bold text-gray-500 dark:text-gray-400" },
  
  // Seção do Senado
  { label: "Dashboard do Senado", href: "/senado" },
  { label: "Votações do Senado", href: "/senado/mapa-votacoes" },
  { label: "Proposições do Senado", href: "/senado/proposicoes" },
  { label: "Ranking Senado", href: "/senado/ranking" }
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ 
  items = defaultItems 
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="mr-2 p-2 text-white hover:bg-[#234780] rounded-md">
          <Menu className="h-6 w-6" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] bg-gray-900 text-white">
        <SheetTitle className="text-white">Menu de Navegação</SheetTitle>
        <SheetDescription className="text-gray-400">
          Navegue pelas diferentes seções do aplicativo
        </SheetDescription>
        <nav className="flex flex-col gap-4 mt-8">
          {items.map((item) => {
            if (item.label === "---") {
              return <div key={item.href} className="border-t border-gray-700 my-4" />;
            }
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`text-lg hover:text-blue-400 transition-colors ${
                  item.className || ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default NavigationMenu;
