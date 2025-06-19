import React, { useState } from "react";
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
  subItems?: NavigationItem[];
}

interface NavigationMenuProps {
  items?: NavigationItem[];
}

const defaultItems: NavigationItem[] = [
  {
    label: "Início",
    href: "/",
    subItems: [
      { label: "Buscar Políticos", href: "/buscar-politicos" },
      { label: "Mapa Político", href: "/mapa-politico" },
      { label: "Projetos de Lei", href: "/projetos-de-lei" },
      { label: "Petições", href: "/peticoes" },
    ],
  },

  // Separador dos Dashboards
  { label: "---", href: "#separator-dashboards" },
  { label: "DASHBOARDS", href: "#dashboards-header", className: "text-sm font-bold text-gray-500 dark:text-gray-400" },
  { label: "Dashboards Backup", href: "/dashbackup" },
  { label: "Deputados", href: "/deputados" },
  { label: "Novo Design", href: "/novo-teste-dashboard" },

  // Separador do Senado
  { label: "---", href: "#separator" },
  { label: "SENADO FEDERAL", href: "#senado-header", className: "text-sm font-bold text-gray-500 dark:text-gray-400" },

  // Seção do Senado
  { label: "Dashboard do Senado", href: "/senado" },
  { label: "Votações do Senado", href: "/senado/mapa-votacoes" },
  { label: "Proposições do Senado", href: "/senado/proposicoes" },
  { label: "Ranking Senado", href: "/senado/ranking" },

  // Separador de Ferramentas
  { label: "---", href: "#separator-tools" },
  { label: "FERRAMENTAS", href: "#tools-header", className: "text-sm font-bold text-gray-500 dark:text-gray-400" },
  { label: "Diagnóstico", href: "/diagnostico" },
  { label: "Diagnóstico de Senador", href: "/diagnostico-senador" },
  { label: "Teste Senador", href: "/teste-senador" },
  { label: "Admin", href: "/admin" }
];

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items = defaultItems
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

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
            if (item.subItems) {
              return (
                <div key={item.href}>
                  <div className="flex items-center justify-between">
                    <Link
                      to={item.href}
                      className={`text-lg hover:text-blue-400 transition-colors ${
                        item.className || ""
                      }`}
                      onClick={(e) => {
                        // Navega apenas se o clique não for na seta
                        if (!(e.target instanceof HTMLElement && e.target.closest('.dropdown-arrow'))) {
                           // A lógica de navegação do Link cuidará disso
                        } else {
                          e.preventDefault(); // Previne a navegação se clicar na seta
                          toggleDropdown(item.label);
                        }
                      }}
                    >
                      {item.label}
                    </Link>
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className="p-2 dropdown-arrow"
                      aria-expanded={openDropdown === item.label}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className={`bi bi-chevron-down transition-transform duration-200 ${
                          openDropdown === item.label ? "rotate-180" : ""
                        }`}
                        viewBox="0 0 16 16"
                      >
                        <path
                          fillRule="evenodd"
                          d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                        />
                      </svg>
                    </button>
                  </div>
                  {openDropdown === item.label && (
                    <div className="ml-4 mt-2 flex flex-col gap-2">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          to={subItem.href}
                          className={`text-md hover:text-blue-400 transition-colors ${
                            subItem.className || ""
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
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
