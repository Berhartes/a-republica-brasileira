// src/domains/congresso/pages/ProfilePage.tsx
import React, { useState } from "react";

interface UserNotifications {
  email: boolean;
  browser: boolean;
  petitionUpdates: boolean;
  weeklyNewsletter: boolean;
}

interface UserData {
  name: string;
  email: string;
  avatar: string;
  location: string;
  bio: string;
  interests: string[];
  notifications: UserNotifications;
}

const ProfilePage: React.FC = () => {
  // Mock user data
  const [userData, setUserData] = useState<UserData>({
    name: "Ana Silva",
    email: "ana.silva@example.com",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200&q=80",
    location: "Rio de Janeiro, RJ",
    bio: "Ativista política e defensora do meio ambiente. Interessada em políticas públicas e participação cidadã.",
    interests: ["Meio Ambiente", "Mobilidade Urbana", "Educação"],
    notifications: {
      email: true,
      browser: false,
      petitionUpdates: true,
      weeklyNewsletter: true
    }
  });

  // Form state
  const [formData, setFormData] = useState<UserData>({...userData});
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [name]: target.checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle interest tags
  const handleInterestToggle = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter(i => i !== interest)
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest]
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUserData(formData);
    setIsEditing(false);
    setSuccessMessage("Perfil atualizado com sucesso!");
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  // Available interest tags
  const availableInterests = [
    "Meio Ambiente", "Mobilidade Urbana", "Educação", "Saúde", 
    "Segurança Pública", "Direitos Humanos", "Cultura", "Economia"
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Meu Perfil</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}
      
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          {/* Profile sidebar */}
          <div className="md:w-1/3 bg-gray-50 p-6 border-r">
            <div className="text-center">
              <img 
                src={userData.avatar} 
                alt={userData.name} 
                className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
              />
              <h2 className="text-xl font-bold">{userData.name}</h2>
              <p className="text-gray-600 mb-2">{userData.location}</p>
              
              <div className="flex flex-wrap justify-center gap-1 mt-4">
                {userData.interests.map(interest => (
                  <span 
                    key={interest} 
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-medium mb-2">Estatísticas</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Petições criadas:</span>
                  <span className="font-medium">3</span>
                </li>
                <li className="flex justify-between">
                  <span>Petições assinadas:</span>
                  <span className="font-medium">12</span>
                </li>
                <li className="flex justify-between">
                  <span>Comentários:</span>
                  <span className="font-medium">24</span>
                </li>
                <li className="flex justify-between">
                  <span>Membro desde:</span>
                  <span className="font-medium">Jan 2023</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Profile content */}
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Informações do Perfil</h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Editar Perfil
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Localização
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium mb-1">
                      Biografia
                    </label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded-md h-24"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Interesses
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableInterests.map(interest => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestToggle(interest)}
                          className={`text-xs px-3 py-1 rounded-full ${
                            formData.interests.includes(interest)
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Notificações</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="email-notifications"
                          name="email"
                          checked={formData.notifications.email}
                          onChange={(e) => 
                            setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                email: e.target.checked
                              }
                            })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="email-notifications">Receber notificações por email</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="browser-notifications"
                          name="browser"
                          checked={formData.notifications.browser}
                          onChange={(e) => 
                            setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                browser: e.target.checked
                              }
                            })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="browser-notifications">Receber notificações no navegador</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="petition-updates"
                          name="petitionUpdates"
                          checked={formData.notifications.petitionUpdates}
                          onChange={(e) => 
                            setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                petitionUpdates: e.target.checked
                              }
                            })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="petition-updates">Atualizações sobre petições</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="weekly-newsletter"
                          name="weeklyNewsletter"
                          checked={formData.notifications.weeklyNewsletter}
                          onChange={(e) => 
                            setFormData({
                              ...formData,
                              notifications: {
                                ...formData.notifications,
                                weeklyNewsletter: e.target.checked
                              }
                            })
                          }
                          className="mr-2"
                        />
                        <label htmlFor="weekly-newsletter">Newsletter semanal</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({...userData});
                        setIsEditing(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                  <p>{userData.email}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Localização</h4>
                  <p>{userData.location}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Biografia</h4>
                  <p>{userData.bio}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Notificações</h4>
                  <ul className="text-sm space-y-1">
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-2 ${userData.notifications.email ? "bg-green-500" : "bg-red-500"}`}></span>
                      Notificações por email: {userData.notifications.email ? "Ativadas" : "Desativadas"}
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-2 ${userData.notifications.browser ? "bg-green-500" : "bg-red-500"}`}></span>
                      Notificações no navegador: {userData.notifications.browser ? "Ativadas" : "Desativadas"}
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-2 ${userData.notifications.petitionUpdates ? "bg-green-500" : "bg-red-500"}`}></span>
                      Atualizações sobre petições: {userData.notifications.petitionUpdates ? "Ativadas" : "Desativadas"}
                    </li>
                    <li className="flex items-center">
                      <span className={`w-4 h-4 rounded-full mr-2 ${userData.notifications.weeklyNewsletter ? "bg-green-500" : "bg-red-500"}`}></span>
                      Newsletter semanal: {userData.notifications.weeklyNewsletter ? "Ativada" : "Desativada"}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;