import React from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { Button } from '@/shared/components/ui/button'; // Supondo que você tenha um componente de botão
import { useNavigate } from '@tanstack/react-router';

const AuthButton: React.FC = () => {
  const { user, signIn, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async () => {
    try {
      const { isNewUser } = await signIn();
      if (isNewUser) {
        navigate({ to: '/usuario/criar-perfil' });
      } else {
        navigate({ to: '/perfil' });
      }
    } catch (error) {
      console.error("Falha no login a partir do botão:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate({ to: '/' });
    } catch (error) {
      console.error("Falha no logout a partir do botão:", error);
    }
  };

  if (isLoading) {
    return <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Olá, {user.displayName?.split(' ')[0]}</span>
        <Button onClick={handleSignOut} variant="outline">
          Sair
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleSignIn}>
      Login com Google
    </Button>
  );
};

export default AuthButton;
