import React from 'react';

interface ErrorMessageProps {
  message: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  // Estilo inline para a animação
  const errorMessageStyle = {
    animation: 'fadeIn 0.3s ease-out forwards'
  };

  return (
    <div 
      className="fixed top-20 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg" 
      style={errorMessageStyle}
    >
      <div className="flex items-center">
        <i className="fas fa-exclamation-circle mr-2"></i>
        <p>{message}</p>
      </div>
      
      {/* Adicionar a keyframe animation ao DOM */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default ErrorMessage;
