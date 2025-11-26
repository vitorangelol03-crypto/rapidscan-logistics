import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  Activity, 
  Map as MapIcon, 
  Layers, 
  Upload, 
  Users, 
  FileText, 
  Trash2, 
  LogOut,
  ScanBarcode,
  History,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const { currentUser, logout } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

  const supervisorMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'control', label: 'Controle', icon: Activity },
    { id: 'routes', label: 'Rotas', icon: MapIcon },
    { id: 'groups', label: 'Grupos', icon: Layers },
    { id: 'import', label: 'Importar', icon: Upload },
    { id: 'employees', label: 'Funcionários', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'clean', label: 'Limpar Dados', icon: Trash2 },
  ];

  const operatorMenu = [
    { id: 'scanner', label: 'Bipagem', icon: ScanBarcode },
    { id: 'history', label: 'Histórico', icon: History },
  ];

  const menu = currentUser.role === UserRole.SUPERVISOR ? supervisorMenu : operatorMenu;

  const handleNavigate = (id: string) => {
    onNavigate(id);
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:relative z-30 w-64 bg-slate-900 text-white flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wider">RAPID<span className="text-blue-500">SCAN</span></h1>
            <p className="text-xs text-slate-400 mt-1">v1.0.0 • {currentUser.name}</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul>
            {menu.map((item) => (
              <li key={item.id} className="px-3 mb-1">
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`flex items-center w-full px-3 py-3 rounded-lg transition-colors ${
                    currentPage === item.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className="mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full flex flex-col">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-4 md:px-8 py-4 flex justify-between items-center shrink-0 h-16 md:h-20">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="mr-4 md:hidden text-slate-700 hover:bg-slate-100 p-2 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize truncate">
              {menu.find(m => m.id === currentPage)?.label || 'Bem-vindo'}
            </h2>
          </div>
          <div className="text-xs md:text-sm text-slate-500 hidden sm:block">
           {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </header>
        <div className="flex-1 p-2 md:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};