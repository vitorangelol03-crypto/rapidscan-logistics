import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { RouteGroup, ScanStatus } from '../../types';
import { Plus, Trash2, Download, CheckCircle, XCircle, Search } from 'lucide-react';

export const GroupsAndRoutes: React.FC = () => {
  const { routes, addRoute, toggleRouteStatus, scans } = useApp();
  const [activeTab, setActiveTab] = useState<'routes' | 'groups'>('routes');
  
  // Group Form State
  const [groupName, setGroupName] = useState('');
  const [groupCeps, setGroupCeps] = useState('');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    const cepsList = groupCeps
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    const newRoute: RouteGroup = {
        id: crypto.randomUUID(),
        name: groupName,
        ceps: cepsList,
        completed: false
    };

    addRoute(newRoute);
    setGroupName('');
    setGroupCeps('');
    alert('Grupo/Rota criada com sucesso!');
  };

  const downloadRouteReport = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;

    const routeScans = scans.filter(s => s.routeId === routeId && (s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL));
    
    // Create CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data Hora,Operador,Codigo Rastreio,Status\n";
    
    routeScans.forEach(s => {
        const date = new Date(s.timestamp).toLocaleString();
        csvContent += `${date},${s.operatorName},${s.trackingCode},${s.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_rota_${route.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
        <div className="flex border-b border-gray-200 mb-6">
            <button 
                onClick={() => setActiveTab('routes')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'routes' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Monitoramento de Rotas
            </button>
            <button 
                onClick={() => setActiveTab('groups')}
                className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Gerenciar Grupos
            </button>
        </div>

        {activeTab === 'routes' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rota</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">CEPs Vinculados</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Progresso (Bipes)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {routes.map(route => {
                             const count = scans.filter(s => s.routeId === route.id && (s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL)).length;
                             return (
                                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={route.ceps.join(', ')}>
                                        {route.ceps.length > 0 ? route.ceps.join(', ') : 'Sem restrição'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{count} pacotes</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${route.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {route.completed ? 'Concluída' : 'Em Andamento'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => downloadRouteReport(route.id)}
                                            className="text-blue-600 hover:text-blue-800 mx-2"
                                            title="Baixar Planilha"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button 
                                            onClick={() => toggleRouteStatus(route.id, !route.completed)}
                                            className={`${route.completed ? 'text-gray-400' : 'text-green-600'} hover:opacity-80 mx-2`}
                                            title={route.completed ? "Reabrir" : "Concluir"}
                                        >
                                            {route.completed ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                        </button>
                                    </td>
                                </tr>
                             );
                        })}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhuma rota criada. Vá para a aba "Gerenciar Grupos".</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {activeTab === 'groups' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4">Criar Novo Grupo/Rota</h3>
                        <form onSubmit={handleCreateGroup}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Rota</label>
                                <input 
                                    type="text" 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                    placeholder="Ex: Mutum, Centro, Zona Norte"
                                    value={groupName}
                                    onChange={e => setGroupName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">CEPs (Separados por vírgula)</label>
                                <textarea 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border h-32"
                                    placeholder="36955000, 36956000, 36959000..."
                                    value={groupCeps}
                                    onChange={e => setGroupCeps(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">Deixe em branco para criar uma rota que aceita qualquer pacote (mas sem validação de CEP).</p>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center">
                                <Plus size={18} className="mr-2" /> Criar Rota
                            </button>
                        </form>
                    </div>
                 </div>

                 <div className="lg:col-span-2 space-y-4">
                    {routes.map(route => (
                        <div key={route.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{route.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">ID: {route.id.split('-')[0]}</p>
                                </div>
                                {/* In a real app we'd have delete/edit here */}
                            </div>
                            <div className="mt-3">
                                <span className="text-xs font-semibold text-gray-500 uppercase">CEPs Vinculados ({route.ceps.length})</span>
                                <div className="mt-1 flex flex-wrap gap-2">
                                    {route.ceps.slice(0, 10).map((cep, idx) => (
                                        <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                                            {cep}
                                        </span>
                                    ))}
                                    {route.ceps.length > 10 && (
                                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                                            +{route.ceps.length - 10}
                                        </span>
                                    )}
                                    {route.ceps.length === 0 && <span className="text-gray-400 text-sm italic">Nenhum CEP vinculado</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
        )}
    </div>
  );
};