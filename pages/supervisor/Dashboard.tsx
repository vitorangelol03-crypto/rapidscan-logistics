import React from 'react';
import { useApp } from '../../store/AppContext';
import { ScanStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PackageCheck, AlertOctagon, RefreshCw, Box } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { scans, packages, users, routes } = useApp();

  const totalScans = scans.length;
  const successScans = scans.filter(s => s.status === ScanStatus.SUCCESS || s.status === ScanStatus.MANUAL).length;
  const errorScans = scans.filter(s => s.status !== ScanStatus.SUCCESS && s.status !== ScanStatus.MANUAL).length;
  const manualScans = scans.filter(s => s.status === ScanStatus.MANUAL).length;

  const operatorsOnline = new Set(scans.filter(s => Date.now() - s.timestamp < 300000).map(s => s.operatorId)).size;

  // Prepare chart data (Scans per hour)
  const scansByHour = new Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, count: 0 }));
  scans.forEach(s => {
    const date = new Date(s.timestamp);
    scansByHour[date.getHours()].count++;
  });

  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
            <Box size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Bipado</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalScans}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg mr-4">
            <PackageCheck size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Sucesso / Manual</p>
            <h3 className="text-2xl font-bold text-gray-800">{successScans} <span className="text-sm text-gray-400 font-normal">({manualScans} man.)</span></h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-4">
            <AlertOctagon size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Erros / Duplicados</p>
            <h3 className="text-2xl font-bold text-gray-800">{errorScans}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg mr-4">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Operadores Ativos</p>
            <h3 className="text-2xl font-bold text-gray-800">{operatorsOnline}</h3>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 h-96">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Volume de Bipagem por Hora</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scansByHour}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {scansByHour.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#3b82f6' : '#e2e8f0'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Simple Stats List */}
         <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Status da Importação</h3>
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Pacotes Importados</span>
                <span className="font-bold">{packages.size}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Rotas Definidas</span>
                <span className="font-bold">{routes.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Progresso Geral</span>
                <span className="font-bold text-blue-600">
                  {packages.size > 0 ? ((successScans / packages.size) * 100).toFixed(1) : 0}%
                </span>
            </div>
         </div>
      </div>
    </div>
  );
};