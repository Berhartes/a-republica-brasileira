import React from 'react';
import { Link } from '@tanstack/react-router';

export const PriorityActions: React.FC = () => {
  return (
    <>
      {/* ALERJ - Assembleia Legislativa */}
      <section className="mt-6 pb-6">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-2/3 mb-6 lg:mb-0">
                <h2 className="text-3xl text-white font-bold mb-4">ALERJ - Assembleia Legislativa</h2>
                <p className="text-green-100 mb-4">
                  Representantes do estado do Rio de Janeiro em exercício
                </p>
                <div className="flex flex-wrap gap-3">
                  {/* <Link 
                    to="/alerj" 
                    className="bg-white text-green-700 font-medium py-2 px-6 rounded-md hover:bg-green-50 transition"
                  >
                    Ver Deputados Estaduais
                  </Link> */}
                </div>
              </div>
              <div className="lg:w-1/3 flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                  <h3 className="text-lg font-semibold mb-2">Estatísticas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>70 deputados estaduais</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>Projetos de lei: 342</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>Sessões realizadas: 156</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governo do Estado do Rio */}
      <section className="mt-6 pb-12">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-xl p-6 shadow-lg">
            <div className="flex flex-col lg:flex-row items-center">
              <div className="lg:w-2/3 mb-6 lg:mb-0">
                <h2 className="text-3xl text-white font-bold mb-4">Governo do Estado do Rio</h2>
                <p className="text-red-100 mb-4">
                  Gestão e administração pública
                </p>
                <div className="flex flex-wrap gap-3">
                  {/* <Link 
                    to="/governo-rj" 
                    className="bg-white text-red-700 font-medium py-2 px-6 rounded-md hover:bg-red-50 transition"
                  >
                    Ver Secretarias
                  </Link> */}
                </div>
              </div>
              <div className="lg:w-1/3 flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-white">
                  <h3 className="text-lg font-semibold mb-2">Estatísticas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>Orçamento: R$ 87,5 bilhões</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>Secretarias: 27</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-white/20 p-1 rounded-full mr-2">✓</span>
                      <span>Programas sociais: 18</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PriorityActions;
