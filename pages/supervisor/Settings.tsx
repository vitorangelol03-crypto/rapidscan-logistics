import React from 'react';
import { useApp } from '../../store/AppContext';
import { Trash2, AlertTriangle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { clearDailyData } = useApp();

  const handleClear = () => {
    if (confirm("ATENÇÃO: Isso irá apagar todos os registros de bipes, rotas ativas e dados importados do dia. Usuários e definições de grupos serão mantidos. Deseja continuar?")) {
        clearDailyData();
        alert("Sistema limpo com sucesso.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-red-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center text-red-600">
                <AlertTriangle className="mr-2" /> Zona de Perigo
            </h2>
            <p className="text-gray-600 mb-6">
                Utilize esta função ao final do dia ou início de um novo turno. Ela remove todos os dados transacionais (bipes, logs) para preparar o sistema para uma nova carga.
            </p>
            
            <button 
                onClick={handleClear}
                className="w-full py-4 border-2 border-red-500 text-red-600 font-bold rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
            >
                <Trash2 className="mr-2" /> LIMPAR DADOS DO SISTEMA
            </button>
        </div>
    </div>
  );
};