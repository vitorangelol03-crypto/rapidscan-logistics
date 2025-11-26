import React, { useEffect, useState } from 'react';
import { useApp } from '../../store/AppContext';
import { ScanStatus, UserRole } from '../../types';
import { Clock, Zap, MapPin } from 'lucide-react';

export const Control: React.FC = () => {
  const { users, scans, activeOperatorRoutes, routes } = useApp();
  const [now, setNow] = useState(Date.now());

  // Update "now" every minute to refresh "last active"
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const operators = users.filter(u => u.role === UserRole.OPERATOR && u.active);

  const getOperatorStats = (opId: string) => {
    const opScans = scans.filter(s => s.operatorId === opId);
    const success = opScans.filter(s => s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL).length;
    
    // Scans in last 10 minutes for speed calculation
    const recentScans = opScans.filter(s => now - s.timestamp < 10 * 60 * 1000).length;
    const speed = Math.round(recentScans / 10); // Scans per minute (avg over 10 mins)

    const lastScan = opScans.length > 0 ? opScans[0].timestamp : 0; // scans are prepended
    
    const activeRouteId = activeOperatorRoutes.get(opId);
    const activeRouteName = activeRouteId ? routes.find(r => r.id === activeRouteId)?.name : 'Nenhuma';

    return {
      total: opScans.length,
      success,
      speed,
      lastActive: lastScan,
      routeName: activeRouteName
    };
  };

  const sortedOperators = operators.map(op => ({
    ...op,
    stats: getOperatorStats(op.id)
  })).sort((a, b) => b.stats.total - a.stats.total);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedOperators.map(op => (
          <div key={op.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">{op.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span>Rota Atual: <strong className="text-blue-600">{op.stats.routeName || 'Parado'}</strong></span>
                    </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${Date.now() - op.stats.lastActive < 60000 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} title="Status Ao Vivo"></div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-gray-800">{op.stats.success}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Pacotes</div>
                </div>
                 <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600 flex items-center justify-center">
                        {op.stats.speed} <Zap size={16} className="ml-1" />
                    </div>
                    <div className="text-xs text-blue-400 uppercase tracking-wide">Pcts / Min</div>
                </div>
              </div>

              <div className="flex items-center text-xs text-gray-400">
                <Clock size={12} className="mr-1" />
                <span>Último bipe: {op.stats.lastActive > 0 ? new Date(op.stats.lastActive).toLocaleTimeString() : 'Nunca'}</span>
              </div>
            </div>
          </div>
        ))}

        {operators.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
                Nenhum operador cadastrado ou ativo.
            </div>
        )}
      </div>
    </div>
  );
};