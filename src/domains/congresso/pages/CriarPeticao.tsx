// src/domains/congresso/pages/CriarPeticao.tsx
import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";

interface CriarPeticaoProps {}

const CriarPeticao: React.FC<CriarPeticaoProps> = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("");
  const [meta, setMeta] = useState<number>(1000);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Lista de categorias
  const categorias = [
    "Meio Ambiente",
    "Educação",
    "Saúde",
    "Segurança Pública",
    "Mobilidade Urbana",
    "Direitos Humanos",
    "Cultura",
    "Economia",
    "Outros"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulação de envio
    setTimeout(() => {
      setSubmitted(true);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">Petição Criada com Sucesso!</h2>
            <p className="text-gray-600 mb-6">
              Sua petição "{titulo}" foi criada e está aguardando aprovação. Você receberá uma notificação quando ela for publicada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Criar Nova Petição
              </button>
              <button 
                onClick={() => navigate({ to: "/peticoes" })}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Ver Minhas Petições
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Criar Nova Petição</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="titulo" className="block text-sm font-medium mb-1">
                Título da Petição *
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Ex: Mais ciclovias na Zona Sul"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="descricao" className="block text-sm font-medium mb-1">
                Descrição *
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md h-32"
                placeholder="Descreva o objetivo da sua petição e por que as pessoas deveriam apoiá-la..."
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium mb-1">
                  Categoria *
                </label>
                <select
                  id="categoria"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="meta" className="block text-sm font-medium mb-1">
                  Meta de Assinaturas
                </label>
                <input
                  type="number"
                  id="meta"
                  value={meta}
                  onChange={(e) => setMeta(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  min="100"
                  step="100"
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mb-6">
              <h3 className="text-blue-800 font-medium mb-2">Dicas para uma petição eficaz:</h3>
              <ul className="text-sm text-blue-700 space-y-1 list-disc pl-5">
                <li>Seja claro e específico sobre o que você está pedindo</li>
                <li>Explique por que a mudança é importante</li>
                <li>Inclua dados ou exemplos que apoiem sua causa</li>
                <li>Mantenha um tom respeitoso e construtivo</li>
                <li>Compartilhe sua petição nas redes sociais para alcançar mais pessoas</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate({ to: "/peticoes" })}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={!titulo || !descricao || !categoria}
              >
                Criar Petição
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarPeticao;