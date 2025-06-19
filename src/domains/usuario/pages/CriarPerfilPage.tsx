import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

// Supondo que você tenha um serviço para interagir com o Firestore
// import { updateUserProfile } from '../services/firestoreService'; 

// Supondo que você tenha um hook para obter o usuário atual
// import { useAuth } from '../../auth/hooks/useAuth'; 

const CriarPerfilPage: React.FC = () => {
  // const { user } = useAuth(); // Descomente quando a autenticação estiver integrada
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', // Pré-preencher com o nome do Google se disponível
    location: '',
    bio: '',
    interests: [] as string[],
    politicalSpectrum: '',
    avatar: '', // Pré-preencher com a foto do Google se disponível
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      // Lógica para salvar no Firestore
      // await updateUserProfile(user.uid, formData);
      console.log('Perfil salvo:', formData);
      navigate({ to: '/perfil' }); // Ou para a página principal
    } catch (err) {
      setError('Ocorreu um erro ao salvar o perfil. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const availableInterests = [
    "Meio Ambiente", "Mobilidade Urbana", "Educação", "Saúde", 
    "Segurança Pública", "Direitos Humanos", "Cultura", "Economia"
  ];

  const politicalSpectrums = [
    "Esquerda", "Centro-Esquerda", "Centro", "Centro-Direita", "Direita", "Prefiro não informar"
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4 text-center">Crie seu Perfil</h1>
      <p className="text-gray-600 mb-8 text-center">Complete seu perfil para começar a participar.</p>

      <div className="bg-white p-8 rounded-lg shadow-md">
        {/* Barra de Progresso */}
        <div className="mb-8">
          <div className="flex justify-between mb-1">
            <span className={`text-sm ${step >= 1 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Informações</span>
            <span className={`text-sm ${step >= 2 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Interesses</span>
            <span className={`text-sm ${step >= 3 ? 'font-bold text-blue-600' : 'text-gray-500'}`}>Engajamento</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

          {step === 1 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Informações Básicas</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Nome</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                  <label htmlFor="location" className="block text-sm font-medium mb-1">Localização (Ex: Rio de Janeiro, RJ)</label>
                  <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium mb-1">Mini Biografia</label>
                  <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md h-24" />
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Seus Interesses</h2>
              <p className="text-gray-600 mb-4">Selecione os tópicos que mais lhe interessam.</p>
              <div className="flex flex-wrap gap-3">
                {availableInterests.map(interest => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestToggle(interest)}
                    className={`text-sm px-4 py-2 rounded-full transition-colors ${
                      formData.interests.includes(interest)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 3 && (
            <section>
              <h2 className="text-2xl font-semibold mb-6">Engajamento Político</h2>
               <div>
                  <label htmlFor="politicalSpectrum" className="block text-sm font-medium mb-1">Como você se identifica politicamente?</label>
                  <select id="politicalSpectrum" name="politicalSpectrum" value={formData.politicalSpectrum} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="" disabled>Selecione uma opção</option>
                    {politicalSpectrums.map(spectrum => (
                      <option key={spectrum} value={spectrum}>{spectrum}</option>
                    ))}
                  </select>
                </div>
            </section>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 && (
              <button type="button" onClick={prevStep} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Voltar
              </button>
            )}
            {step < 3 && (
              <button type="button" onClick={nextStep} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 ml-auto">
                Avançar
              </button>
            )}
            {step === 3 && (
              <button type="submit" disabled={isLoading} className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 ml-auto disabled:bg-gray-400">
                {isLoading ? 'Salvando...' : 'Finalizar Perfil'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarPerfilPage;
