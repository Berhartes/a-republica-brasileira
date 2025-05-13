// src/domains/congresso/pages/BuscarPoliticos.tsx
import React, { useState } from 'react';

interface Estado {
  sigla: string;
  nome: string;
}

const BuscarPoliticos: React.FC = () => {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filtroUF, setFiltroUF] = useState<string>('');
  const [filtroPartido, setFiltroPartido] = useState<string>('');

  // Lista de UFs brasileiras
  const estadosBrasileiros: Estado[] = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' },
  ];

  // Lista de partidos
  const partidos = [
    'MDB', 'PT', 'PSDB', 'PL', 'UNIÃO', 'PP', 'PSD', 'PSB', 'REPUBLICANOS', 'PDT'
  ];

  // Limpar todos os filtros
  const limparFiltros = () => {
    setSearchTerm('');
    setFiltroUF('');
    setFiltroPartido('');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Buscar Políticos</h1>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Filtros</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Busca por nome */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium mb-1">
              Nome do Político
            </label>
            <input
              type="text"
              id="search"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Filtro por UF */}
          <div>
            <label htmlFor="uf" className="block text-sm font-medium mb-1">
              Estado (UF)
            </label>
            <select
              id="uf"
              value={filtroUF}
              onChange={(e) => setFiltroUF(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos os estados</option>
              {estadosBrasileiros.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.nome} ({estado.sigla})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por partido */}
          <div>
            <label htmlFor="partido" className="block text-sm font-medium mb-1">
              Partido
            </label>
            <select
              id="partido"
              value={filtroPartido}
              onChange={(e) => setFiltroPartido(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Todos os partidos</option>
              {partidos.map((partido) => (
                <option key={partido} value={partido}>
                  {partido}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={limparFiltros}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Mensagem de funcionalidade em desenvolvimento */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">Funcionalidade em Desenvolvimento</h3>
        <p className="text-yellow-700">
          A busca de políticos está em fase de implementação. Em breve você poderá pesquisar e visualizar informações detalhadas sobre deputados e senadores.
        </p>
      </div>
    </div>
  );
};

export default BuscarPoliticos;