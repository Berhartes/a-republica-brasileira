import React from 'react';
import FirestoreDebug from '@/components/debug/FirestoreDebug';

/**
 * Página de diagnóstico para testar a conectividade com o Firestore
 */
const DiagnosticoPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Diagnóstico do Sistema</h1>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-bold mb-4">Conectividade com o Firestore</h2>
          <FirestoreDebug />
        </section>
      </div>
    </div>
  );
};

export default DiagnosticoPage;
