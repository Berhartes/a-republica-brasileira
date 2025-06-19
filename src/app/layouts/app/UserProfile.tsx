import React from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetTitle 
} from "@/shared/components/ui/sheet/index";
import { User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/domains/usuario/hooks/useAuth.tsx";
import AuthButton from "@/domains/usuario/components/AuthButton";

export const UserProfile: React.FC = () => {
  const { user, isLoading } = useAuth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 text-white hover:bg-[#234780] rounded-md">
          <User className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-gray-900 text-white">
        <SheetTitle className="text-white">
          {user ? `Bem-vindo, ${user.displayName?.split(' ')[0]}` : "Perfil do Usuário"}
        </SheetTitle>
        <div className="flex flex-col gap-4 mt-8">
          {isLoading ? (
            <p>Carregando...</p>
          ) : user ? (
            <>
              <div className="space-y-2">
                <div className="font-semibold text-gray-300">Email</div>
                <p className="text-gray-400">{user.email}</p>
              </div>
              <nav className="flex flex-col gap-2">
                <Link to="/perfil" className="text-white hover:text-blue-400 transition-colors">
                  Meu Perfil
                </Link>
                {/* Adicione outros links para usuários logados aqui */}
              </nav>
              <div className="mt-auto pt-4 border-t border-gray-700">
                <AuthButton />
              </div>
            </>
          ) : (
            <div>
              <p className="text-gray-400 mb-4">Faça login para acessar seu perfil e participar.</p>
              <AuthButton />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserProfile;
