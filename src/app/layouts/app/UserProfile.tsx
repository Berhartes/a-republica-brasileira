import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle 
} from "@/shared/components/ui/sheet/index";
import { User } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface UserProfileProps {
  email?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  email = "usuario@email.com" 
}) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-white hover:bg-[#234780] rounded-md">
          <User className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 text-white">
        <SheetTitle className="text-white">Perfil do Usuário</SheetTitle>
        <div className="flex flex-col gap-4 mt-8">
          <div className="space-y-2">
            <div className="font-semibold text-gray-300">Usuário</div>
            <p className="text-gray-400">{email}</p>
          </div>
          <nav className="flex flex-col gap-2">
            <Link to="/perfil" className="text-white hover:text-blue-400 transition-colors">
              Editar Perfil
            </Link>
            {/* <Link to="/configuracoes" className="text-white hover:text-blue-400 transition-colors">
              Configurações
            </Link>
            <Link to="/logout" className="text-white hover:text-blue-400 transition-colors">
              Sair
            </Link> */}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserProfile;
