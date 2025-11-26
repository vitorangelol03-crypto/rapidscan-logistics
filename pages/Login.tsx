import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Package, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        setError('');
      } else {
        setError('Credenciais inválidas ou erro de conexão.');
      }
    } catch (e) {
      setError('Erro ao tentar conectar ao sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 text-white">
            <Package size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">RapidScan</h1>
          <p className="text-blue-100 mt-2">Sistema de Gestão Logística</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 pt-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Digite seu usuário"
              required
              disabled={loading}
            />
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Entrar no Sistema'}
          </button>
        </form>
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-500">
          © 2024 RapidScan Logistics Inc.
        </div>
      </div>
    </div>
  );
};