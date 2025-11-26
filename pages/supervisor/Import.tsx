import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { PackageData } from '../../types';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export const Import: React.FC = () => {
  const { importPackages, packages } = useApp();
  const [inputText, setInputText] = useState('');
  const [stats, setStats] = useState<{ total: number } | null>(null);
  const [error, setError] = useState('');

  const handleProcess = () => {
    if (!inputText.trim()) {
      setError("Por favor, cole os dados ou carregue um arquivo.");
      return;
    }

    try {
      const lines = inputText.split('\n');
      const newData: PackageData[] = [];

      lines.forEach(line => {
        // Assume CSV: Code, CEP OR Tab separated
        // Flexible parsing
        const parts = line.split(/[,\t;]+/); 
        if (parts.length >= 2) {
          const code = parts[0].trim();
          const cep = parts[1].trim();
          if (code && cep) {
            newData.push({ trackingCode: code, cep });
          }
        }
      });

      if (newData.length === 0) {
        setError("Nenhum dado válido encontrado. Certifique-se do formato: Código, CEP");
        return;
      }

      importPackages(newData);
      setStats({ total: newData.length });
      setInputText('');
      setError('');
    } catch (e) {
      setError("Erro ao processar dados.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) setInputText(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <Upload className="mr-2 text-blue-600" /> Importar Carga do Dia
        </h2>

        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm">
          <p className="font-semibold mb-1">Instruções:</p>
          <ul className="list-disc list-inside">
            <li>O arquivo deve conter duas colunas: <strong>Código de Rastreio</strong> e <strong>CEP</strong>.</li>
            <li>Você pode colar os dados diretamente no campo abaixo ou selecionar um arquivo CSV/TXT.</li>
            <li>Esta importação substituirá os dados de referência para validação de rotas.</li>
          </ul>
        </div>

        {stats && (
           <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg flex items-center animate-fade-in">
             <CheckCircle className="mr-2" />
             Sucesso! {stats.total} pacotes foram importados para o sistema.
           </div>
        )}

        {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg flex items-center animate-fade-in">
                <AlertCircle className="mr-2" />
                {error}
            </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Colar Dados (Código, CEP)</label>
          <textarea
            className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder={`BR123456789, 36955000\nBR987654321, 29100000\n...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          ></textarea>
        </div>

        <div className="flex items-center justify-between">
           <div className="flex items-center">
             <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center">
                <FileText size={18} className="mr-2" />
                Carregar Arquivo
                <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
             </label>
             <span className="ml-3 text-xs text-gray-500">.csv ou .txt suportados</span>
           </div>

           <button 
             onClick={handleProcess}
             className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition-all active:scale-95"
           >
             Processar Importação
           </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-sm text-gray-500">
            <span>Total no sistema atualmente: <strong>{packages.size}</strong></span>
        </div>
      </div>
    </div>
  );
};