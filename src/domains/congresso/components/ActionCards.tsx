import React from 'react';
import { Link } from '@tanstack/react-router';

export const ActionCards: React.FC = () => {
  return (
    <section className="mt-8 mb-20">
      <div className="container">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Ações Prioritárias
          </h2>
          {/* <Link to="/acoes" className="text-sm text-blue-400 flex items-center">
            Ver todas
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </Link> */}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 - Criar Petição */}
          <Link to="/criar-peticao" className="bg-green-600 border border-green-700 rounded-lg p-4 hover:bg-green-700 transition text-white">
            <div className="flex flex-col h-full">
              <div className="mb-2 p-2 bg-green-700 rounded-full w-10 h-10 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <line x1="19" y1="8" x2="19" y2="14"></line>
                  <line x1="22" y1="11" x2="16" y2="11"></line>
                </svg>
              </div>
              <h3 className="font-bold mb-1">Criar Petição</h3>
              <p className="text-xs text-white/80">Mobilize a sociedade e promova mudanças</p>
            </div>
          </Link>
          
          {/* Card 2 - Buscar Políticos */}
          <Link to="/buscar-politicos" className="bg-blue-600 border border-blue-700 rounded-lg p-4 hover:bg-blue-700 transition text-white">
            <div className="flex flex-col h-full">
              <div className="mb-2 p-2 bg-blue-700 rounded-full w-10 h-10 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3 className="font-bold mb-1">Buscar Políticos</h3>
              <p className="text-xs text-white/80">Conheça os representantes do Rio de Janeiro</p>
            </div>
          </Link>
          
          {/* Card 3 - Projetos de Lei */}
          <Link to="/projetos-de-lei" className="bg-amber-100 border border-amber-200 rounded-lg p-4 hover:bg-amber-200 transition">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mr-2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h3 className="font-bold text-amber-800">Projetos de Lei</h3>
              </div>
              <p className="text-xs text-amber-700">Acompanhe as propostas em tramitação</p>
            </div>
          </Link>
          
          {/* Card 4 - Mapa Político */}
          <Link to="/mapa-politico" className="bg-purple-100 border border-purple-200 rounded-lg p-4 hover:bg-purple-200 transition">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600 mr-2">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
                  <line x1="8" y1="2" x2="8" y2="18"></line>
                  <line x1="16" y1="6" x2="16" y2="22"></line>
                </svg>
                <h3 className="font-bold text-purple-800">Mapa Político</h3>
              </div>
              <p className="text-xs text-purple-700">Visualize as regiões e suas representações</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ActionCards;
