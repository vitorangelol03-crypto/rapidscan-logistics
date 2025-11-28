import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { ScanStatus } from '../../types';
import { ScanBarcode, ToggleRight, ToggleLeft, CheckCircle, XCircle, AlertTriangle, List, LogOut, Check, Filter } from 'lucide-react';

export const Scanner: React.FC = () => {
  const { routes, currentUser, processScan, assignOperatorRoute, activeOperatorRoutes, toggleRouteStatus } = useApp();
  
  // Local State
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<{ status: ScanStatus; message: string; code: string } | null>(null);
  
  // Category Filtering
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  // Available Categories (A, B, C...) sorted
  const categories = useMemo(() => {
    const cats = new Set(routes.map(r => r.category || 'A'));
    return Array.from(cats).sort();
  }, [routes]);

  // Set default category to the first one available if none selected
  useEffect(() => {
    if (!selectedCategory && categories.length > 0) {
        setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Focus keeper - slightly less aggressive on mobile to allow button clicks
  useEffect(() => {
    const keepFocus = (e: MouseEvent) => {
        // Only refocus if the click was not on a button or link
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('input')) {
            return;
        }
        inputRef.current?.focus();
    };
    
    // Initial focus
    inputRef.current?.focus();

    document.addEventListener('click', keepFocus);
    return () => document.removeEventListener('click', keepFocus);
  }, []);

  // Update global active route when local selection changes
  useEffect(() => {
    if (currentUser) {
        assignOperatorRoute(currentUser.id, selectedRouteId || null);
    }
  }, [selectedRouteId, currentUser, assignOperatorRoute]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedRouteId) return;

    const result = processScan(inputValue.trim(), selectedRouteId, manualMode);
    
    setLastScanResult({
        status: result.status,
        message: result.message,
        code: inputValue.trim()
    });

    setInputValue('');
  };

  const handleFinishRoute = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent focus logic interference
      if (confirm("Deseja realmente marcar esta rota como CONCLUÍDA? Isso sinalizará ao supervisor que o trabalho terminou.")) {
        toggleRouteStatus(selectedRouteId, true);
        setSelectedRouteId('');
        setLastScanResult(null);
      }
  };

  const handleRemoveRoute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent focus logic interference
    if (confirm("Tem certeza que deseja REMOVER esta rota da sua tela? Ela NÃO será marcada como concluída e poderá ser continuada depois.")) {
      setSelectedRouteId('');
      setLastScanResult(null);
    }
  };

  const toggleManualMode = (e: React.MouseEvent) => {
      e.stopPropagation();
      setManualMode(!manualMode);
      inputRef.current?.focus(); // Return focus to input immediately
  };

  // Determine feedback color
  let bgColor = "bg-slate-900";
  let textColor = "text-white";
  let statusIcon = <ScanBarcode size={48} className="text-white/20" />;

  if (lastScanResult) {
      switch (lastScanResult.status) {
          case ScanStatus.SUCCESS:
          case ScanStatus.MANUAL:
              bgColor = "bg-green-500";
              textColor = "text-white";
              statusIcon = <CheckCircle size={80} className="text-white drop-shadow-lg" />;
              break;
          case ScanStatus.ERROR_ROUTE:
          case ScanStatus.ERROR_INVALID:
          case ScanStatus.ERROR_NOT_FOUND:
              bgColor = "bg-red-600";
              textColor = "text-white";
              statusIcon = <XCircle size={80} className="text-white drop-shadow-lg" />;
              break;
          case ScanStatus.ERROR_DUPLICATE:
              bgColor = "bg-yellow-500";
              textColor = "text-white";
              statusIcon = <AlertTriangle size={80} className="text-white drop-shadow-lg" />;
              break;
      }
  }

  if (!selectedRouteId) {
      const filteredRoutes = routes.filter(r => !r.completed && (r.category || 'A') === selectedCategory);

      return (
          <div className="max-w-md mx-auto mt-4 md:mt-6 p-4 md:p-6 bg-white rounded-xl shadow-lg flex flex-col h-[calc(100vh-140px)]">
              <div className="text-center mb-4">
                <List size={32} className="mx-auto text-blue-500 mb-2" />
                <h2 className="text-xl font-bold text-gray-800">Selecione uma Rota</h2>
              </div>
              
              {/* Category Tabs */}
              <div className="flex overflow-x-auto pb-2 mb-4 gap-2 no-scrollbar">
                  {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 w-12 h-12 rounded-lg font-bold text-lg flex items-center justify-center transition-all ${
                            selectedCategory === cat 
                            ? 'bg-slate-800 text-white shadow-md transform scale-105' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {filteredRoutes.map(r => (
                      <button 
                        key={r.id}
                        onClick={() => setSelectedRouteId(r.id)}
                        className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 transition-all text-left font-medium flex justify-between items-center active:bg-blue-100 group"
                      >
                          <div className="flex items-center overflow-hidden">
                              <span className="w-8 h-8 rounded bg-gray-100 group-hover:bg-white text-gray-600 font-bold flex items-center justify-center mr-3 text-sm flex-shrink-0">
                                  {r.category || 'A'}
                              </span>
                              <span className="truncate mr-2 text-lg">{r.name}</span>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full whitespace-nowrap">{r.ceps.length} CEPs</span>
                      </button>
                  ))}
                  {filteredRoutes.length === 0 && (
                      <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed">
                          Nenhuma rota disponível no setor {selectedCategory}.
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className={`flex flex-col rounded-xl transition-colors duration-200 ${bgColor} relative overflow-hidden h-full md:h-[calc(100vh-140px)] shadow-xl`}>
      
      {/* Header Info - Optimized for mobile width */}
      <div className="bg-black/20 p-3 flex flex-col gap-3 backdrop-blur-sm text-white border-b border-white/10">
          <div className="flex justify-between items-center">
              <div className="font-semibold text-sm md:text-lg flex items-center truncate max-w-[50%]">
                  <span className="opacity-70 mr-2 hidden md:inline">Rota:</span> 
                  <span className="font-bold truncate">{routes.find(r => r.id === selectedRouteId)?.name}</span>
              </div>
              <button 
                  onClick={toggleManualMode}
                  className={`flex items-center px-3 py-1.5 rounded-full font-bold text-xs md:text-sm transition-all whitespace-nowrap ${manualMode ? 'bg-yellow-400 text-yellow-900 shadow-lg' : 'bg-white/10 hover:bg-white/20 border border-white/20'}`}
              >
                  {manualMode ? <ToggleRight className="mr-1 md:mr-2" size={16} /> : <ToggleLeft className="mr-1 md:mr-2" size={16} />}
                  {manualMode ? 'Manual ON' : 'Manual OFF'}
              </button>
          </div>
          
          <div className="flex gap-2 w-full">
               <button 
                onClick={handleRemoveRoute}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-500/30 px-2 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center transition-colors active:scale-95"
               >
                   <LogOut className="mr-2" size={16} />
                   Sair
               </button>

               <button 
                onClick={handleFinishRoute}
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-500/30 px-2 py-2 rounded-lg text-xs md:text-sm font-bold flex items-center justify-center transition-colors active:scale-95"
               >
                   <Check className="mr-2" size={16} />
                   Concluir
               </button>
          </div>
      </div>

      {/* Main Feedback Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-fade-in select-none">
          <div className="mb-4 md:mb-6 transform transition-all duration-300 scale-100">
              {statusIcon}
          </div>
          
          {lastScanResult ? (
              <div className="flex flex-col items-center max-w-full">
                <h1 className={`text-3xl md:text-5xl font-black mb-1 md:mb-2 tracking-tight leading-tight ${textColor} break-words w-full`}>{lastScanResult.message}</h1>
                <p className={`text-lg md:text-2xl font-mono opacity-80 ${textColor} break-all`}>{lastScanResult.code}</p>
              </div>
          ) : (
              <h1 className={`text-2xl md:text-4xl font-bold opacity-50 ${textColor}`}>Aguardando...</h1>
          )}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-10">
          <form onSubmit={handleScan}>
              <div className="relative">
                  <ScanBarcode className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 text-lg md:text-2xl font-mono bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all uppercase placeholder-gray-300 text-slate-900"
                    placeholder="BIPAR CÓDIGO..."
                    autoFocus
                    autoComplete="off"
                    // On mobile, preventing auto-capitalization/correct helps scanning accuracy
                    autoCapitalize="characters"
                    spellCheck={false}
                  />
              </div>
          </form>
          <div className="mt-2 text-center text-[10px] md:text-xs text-gray-400 hidden sm:block">
              O cursor será mantido automaticamente no campo de entrada.
          </div>
      </div>
    </div>
  );
};