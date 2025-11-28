import React, { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { RouteGroup, ScanStatus } from '../../types';
import { Plus, Download, CheckCircle, XCircle, Map, Layers, Settings, Edit2, Trash2, X, Save, Upload, FileSpreadsheet, FileText } from 'lucide-react';

interface GroupsAndRoutesProps {
  view: 'monitoring' | 'management';
}

export const GroupsAndRoutes: React.FC<GroupsAndRoutesProps> = ({ view }) => {
  const { routes, addRoute, updateRoute, deleteRoute, importRoutes, toggleRouteStatus, scans, packages } = useApp();
  
  // Group Form State
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupCeps, setGroupCeps] = useState('');

  // Bulk Import State
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [parsedBulkRoutes, setParsedBulkRoutes] = useState<RouteGroup[]>([]);
  const [fileName, setFileName] = useState('');

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    const cepsList = groupCeps
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    if (editingRouteId) {
        // Edit Mode
        const existingRoute = routes.find(r => r.id === editingRouteId);
        if (existingRoute) {
            const updatedRoute: RouteGroup = {
                ...existingRoute,
                name: groupName,
                ceps: cepsList,
            };
            updateRoute(updatedRoute);
            alert('Grupo atualizado com sucesso!');
        }
    } else {
        // Create Mode
        const newRoute: RouteGroup = {
            id: crypto.randomUUID(),
            name: groupName,
            ceps: cepsList,
            completed: false
        };
        addRoute(newRoute);
        alert('Grupo criado com sucesso! Ele já está disponível na aba Rotas.');
    }

    // Reset Form
    setEditingRouteId(null);
    setGroupName('');
    setGroupCeps('');
  };

  const handleDownloadTemplate = () => {
      // CSV Content: Header + Examples (Line by Line format)
      const csvContent = "NOME_DA_ROTA;CEP\nRota Mutum;36955000\nRota Mutum;36956000\nRota Mutum;36957000\nRota Centro;36900000\nRota Centro;36900001";
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template_rotas_rapidscan.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      const reader = new FileReader();

      reader.onload = (evt) => {
          const text = evt.target?.result as string;
          if (!text) return;

          const lines = text.split('\n');
          // Map to aggregate CEPs by Route Name
          const routeMap = new Map<string, Set<string>>();

          // Skip header (index 0)
          for (let i = 1; i < lines.length; i++) {
              const line = lines[i];
              if (!line.trim()) continue;

              const parts = line.split(';');
              if (parts.length >= 1) {
                  const name = parts[0].trim();
                  if (!name) continue;

                  // Get existing set or create new
                  if (!routeMap.has(name)) {
                      routeMap.set(name, new Set());
                  }

                  // Process CEP if present
                  if (parts[1]) {
                      const cleanCep = parts[1].replace(/\D/g, ''); // Remove non-digits
                      if (cleanCep.length > 0) {
                          routeMap.get(name)?.add(cleanCep);
                      }
                  }
              }
          }

          // Convert Map to RouteGroup[]
          const newRoutes: RouteGroup[] = Array.from(routeMap.entries()).map(([name, cepsSet]) => ({
              id: crypto.randomUUID(),
              name: name,
              ceps: Array.from(cepsSet),
              completed: false
          }));

          setParsedBulkRoutes(newRoutes);
      };
      reader.readAsText(file);
  };

  const handleProcessBulkImport = () => {
      if (parsedBulkRoutes.length > 0) {
          importRoutes(parsedBulkRoutes);
          alert(`${parsedBulkRoutes.length} grupos importados com sucesso!`);
          
          // Reset
          setParsedBulkRoutes([]);
          setFileName('');
          setIsBulkImportOpen(false);
      } else {
          alert('Nenhum grupo válido encontrado no arquivo.');
      }
  };

  const handleEdit = (route: RouteGroup) => {
      setEditingRouteId(route.id);
      setGroupName(route.name);
      setGroupCeps(route.ceps.join(', '));
      // Scroll to top to see form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingRouteId(null);
      setGroupName('');
      setGroupCeps('');
  };

  const handleDelete = (id: string) => {
      if (confirm('Tem certeza que deseja excluir este grupo? Todas as associações com bipes antigos podem ser afetadas visualmente.')) {
          deleteRoute(id);
      }
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

  // Helper to calculate stats per route
  const getRouteStats = (route: RouteGroup) => {
      // 1. Scanned Count
      const scannedCount = scans.filter(s => s.routeId === route.id && (s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL)).length;

      // 2. Total Expected (Based on imported Packages + Route Rules)
      let totalExpected = 0;
      const routeCepsClean = route.ceps.map(c => c.replace(/\D/g, ''));

      // If route has no CEPs, it's a wildcard (matches everything theoretically, 
      // or we assume it matches the whole load if it's the only route. 
      // Following processScan logic: matches everything).
      if (routeCepsClean.length === 0) {
          totalExpected = packages.size;
      } else {
          // Iterate all packages to count matches
          // Note: This iterates 10k items per route render. For < 50 routes it's fine (JS is fast).
          // For huge datasets, we would optimize this with a reverse index.
          for (const pkgCep of packages.values()) {
             const cleanPkgCep = pkgCep.replace(/\D/g, '');
             if (routeCepsClean.some(rc => cleanPkgCep.startsWith(rc))) {
                 totalExpected++;
             }
          }
      }

      // Cap scanned count visually at totalExpected to avoid > 100% confusion if user scans extras manually
      // but keep real percentage if needed. For UI bar we cap at 100%.
      const percentage = totalExpected > 0 ? (scannedCount / totalExpected) * 100 : 0;
      
      return { scannedCount, totalExpected, percentage };
  };

  // --- VISÃO DE MONITORAMENTO (ABA ROTAS) ---
  if (view === 'monitoring') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Map className="mr-2 text-blue-600" /> Monitoramento em Tempo Real
            </h2>
            <div className="text-sm text-gray-500 hidden md:block">
                Acompanhe o progresso e baixe relatórios das rotas ativas.
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rota</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Configuração</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-64">Progresso</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {routes.map(route => {
                                const stats = getRouteStats(route);
                                return (
                                <tr key={route.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{route.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {route.ceps.length > 0 ? `${route.ceps.length} CEPs vinculados` : 'Sem restrição de CEP'}
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="w-full">
                                            <div className="flex justify-between items-end mb-1">
                                                <span className="text-sm font-bold text-blue-600">{stats.scannedCount}</span>
                                                <span className="text-xs text-gray-400 font-medium">de {stats.totalExpected}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                <div 
                                                    className={`h-2.5 rounded-full transition-all duration-500 ${route.completed ? 'bg-green-500' : 'bg-blue-600'}`} 
                                                    style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-right mt-1">
                                                <span className="text-xs font-bold text-gray-600">{stats.percentage.toFixed(1)}%</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${route.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {route.completed ? 'Concluída' : 'Em Andamento'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end items-center space-x-2">
                                        <button 
                                            onClick={() => downloadRouteReport(route.id)}
                                            className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Baixar Planilha de Bipes"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                                        <button 
                                            onClick={() => toggleRouteStatus(route.id, !route.completed)}
                                            className={`flex items-center px-3 py-1 rounded-md text-xs font-bold transition-colors ${route.completed ? 'bg-gray-100 text-gray-500 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                            title={route.completed ? "Reabrir Rota" : "Concluir Rota"}
                                        >
                                            {route.completed ? (
                                                <>
                                                    <XCircle size={14} className="mr-1" /> Reabrir
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle size={14} className="mr-1" /> Concluir
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                                );
                        })}
                        {routes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    Nenhuma rota ativa no momento. Vá em <strong>Grupos</strong> para criar uma nova.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    );
  }

  // --- VISÃO DE GERENCIAMENTO (ABA GRUPOS) ---
  return (
    <div className="space-y-6">
         {/* Modal de Importação em Massa */}
         {isBulkImportOpen && (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                         <h3 className="font-bold text-lg text-gray-800 flex items-center">
                             <FileSpreadsheet className="mr-2 text-blue-600" /> Importar Grupos via Planilha
                         </h3>
                         <button onClick={() => setIsBulkImportOpen(false)} className="text-gray-400 hover:text-gray-600">
                             <X size={24} />
                         </button>
                     </div>
                     <div className="p-6">
                         <div className="flex flex-col md:flex-row gap-6">
                            {/* Passo 1 */}
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-700 mb-2">1. Baixe o Modelo</h4>
                                <p className="text-sm text-gray-500 mb-3">
                                    Baixe nossa planilha modelo (.csv). O formato é simples: <strong>NOME_DA_ROTA;CEP</strong>.
                                    <br/><br/>
                                    Para adicionar múltiplos CEPs à mesma rota, basta repetir o nome da rota em várias linhas.
                                </p>
                                <button 
                                    onClick={handleDownloadTemplate}
                                    className="w-full flex items-center justify-center py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors border border-gray-200"
                                >
                                    <Download size={16} className="mr-2" /> Baixar Template.csv
                                </button>
                            </div>
                            
                            {/* Divisor */}
                            <div className="hidden md:block w-px bg-gray-200"></div>

                            {/* Passo 2 */}
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-700 mb-2">2. Envie o Arquivo</h4>
                                <p className="text-sm text-gray-500 mb-3">
                                    Carregue o arquivo preenchido aqui.
                                </p>
                                <label className="w-full flex flex-col items-center justify-center py-4 px-4 border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                                    <Upload size={24} className="text-blue-500 mb-1" />
                                    <span className="text-xs text-blue-600 font-semibold">{fileName || 'Clique para selecionar'}</span>
                                    <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
                                </label>
                            </div>
                         </div>

                         {/* Preview */}
                         {parsedBulkRoutes.length > 0 && (
                             <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg">
                                 <h5 className="font-bold text-green-800 text-sm mb-2 flex items-center">
                                     <CheckCircle size={16} className="mr-2" />
                                     {parsedBulkRoutes.length} rotas identificadas com sucesso:
                                 </h5>
                                 <div className="max-h-32 overflow-y-auto text-xs text-green-700 font-mono space-y-1">
                                     {parsedBulkRoutes.slice(0, 5).map((r, i) => (
                                         <div key={i}>{r.name} ({r.ceps.length} CEPs)</div>
                                     ))}
                                     {parsedBulkRoutes.length > 5 && <div>...e mais {parsedBulkRoutes.length - 5}.</div>}
                                 </div>
                             </div>
                         )}
                     </div>
                     <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                         <button 
                             onClick={() => setIsBulkImportOpen(false)}
                             className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                         >
                             Cancelar
                         </button>
                         <button 
                             onClick={handleProcessBulkImport}
                             disabled={parsedBulkRoutes.length === 0}
                             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             Confirmar Importação
                         </button>
                     </div>
                 </div>
             </div>
         )}

         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Layers className="mr-2 text-blue-600" /> Gerenciar Grupos e Definições
            </h2>
            <div className="text-sm text-gray-500 hidden md:block">
                Crie grupos de CEPs para distribuir as rotas aos operadores.
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulário de Criação/Edição */}
            <div className="lg:col-span-1">
                <div className={`rounded-xl shadow-sm border p-6 sticky top-24 transition-colors ${editingRouteId ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center mb-4 text-gray-800 justify-between">
                        <div className="flex items-center">
                            {editingRouteId ? <Edit2 className="mr-2 text-yellow-600" size={20} /> : <Settings className="mr-2" size={20} />}
                            <h3 className="font-bold">{editingRouteId ? 'Editar Grupo' : 'Cadastrar Novo Grupo'}</h3>
                        </div>
                        {editingRouteId ? (
                            <button onClick={handleCancelEdit} className="text-gray-400 hover:text-gray-600" title="Cancelar Edição">
                                <X size={20} />
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setIsBulkImportOpen(true); setParsedBulkRoutes([]); setFileName(''); }} 
                                className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors text-xs font-bold flex items-center border border-blue-200"
                                title="Importar em Massa"
                            >
                                <Upload size={14} className="mr-1" /> Massa
                            </button>
                        )}
                    </div>
                    
                    <form onSubmit={handleSaveGroup}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Identificador</label>
                            <input 
                                type="text" 
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                placeholder="Ex: Rota Mutum, Centro..."
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEPs Vinculados</label>
                            <textarea 
                                className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border h-32 font-mono text-sm"
                                placeholder="36955000, 36956000..."
                                value={groupCeps}
                                onChange={e => setGroupCeps(e.target.value)}
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Separe os CEPs por vírgula. <br/>
                                <span className="text-orange-500">Atenção:</span> Deixe em branco para criar uma rota "Coringa" (aceita qualquer pacote).
                            </p>
                        </div>
                        <div className="flex gap-2">
                             {editingRouteId && (
                                <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-300 transition-colors">
                                    Cancelar
                                </button>
                             )}
                             <button type="submit" className={`flex-1 ${editingRouteId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-2 rounded-lg transition-colors flex justify-center items-center`}>
                                {editingRouteId ? (
                                    <> <Save size={18} className="mr-2" /> Atualizar </>
                                ) : (
                                    <> <Plus size={18} className="mr-2" /> Salvar Grupo </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Lista de Grupos Existentes */}
            <div className="lg:col-span-2 space-y-4">
                <h3 className="font-bold text-gray-700 mb-2">Grupos Cadastrados</h3>
                {routes.map(route => (
                    <div key={route.id} className={`bg-white rounded-lg border p-4 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between ${editingRouteId === route.id ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'}`}>
                        <div className="mb-4 md:mb-0 flex-1">
                            <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3 text-xs">
                                    ID
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{route.name}</h4>
                                    <p className="text-xs text-gray-400">Criado em: {new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="mt-3 ml-11">
                                {route.ceps.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {route.ceps.slice(0, 8).map((cep, idx) => (
                                            <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono border border-gray-200">
                                                {cep}
                                            </span>
                                        ))}
                                        {route.ceps.length > 8 && (
                                            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-medium cursor-help" title={route.ceps.join(', ')}>
                                                +{route.ceps.length - 8} CEPs
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-orange-500 text-xs font-medium bg-orange-50 px-2 py-1 rounded border border-orange-100">
                                        Rota sem restrição de CEP (Aberta)
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-end md:border-l md:border-gray-100 md:pl-6 md:ml-4 gap-4">
                             <div className="text-center">
                                 <div className="text-xs text-gray-400 uppercase font-bold mb-1">Status</div>
                                 <span className={`text-xs font-bold ${route.completed ? 'text-red-500' : 'text-green-500'}`}>
                                     {route.completed ? 'FECHADO' : 'ATIVO'}
                                 </span>
                             </div>

                             <div className="flex flex-col gap-2">
                                <button 
                                    onClick={() => handleEdit(route)} 
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar Grupo"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(route.id)} 
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir Grupo"
                                >
                                    <Trash2 size={18} />
                                </button>
                             </div>
                        </div>
                    </div>
                ))}

                {routes.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-400">
                        Nenhum grupo cadastrado. Utilize o formulário ao lado para começar.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};