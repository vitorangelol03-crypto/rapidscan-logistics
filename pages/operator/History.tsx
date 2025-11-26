import React from 'react';
import { useApp } from '../../store/AppContext';
import { ScanStatus } from '../../types';

export const History: React.FC = () => {
  const { scans, currentUser } = useApp();
  
  if (!currentUser) return null;

  const myScans = scans.filter(s => s.operatorId === currentUser.id);

  const getStatusBadge = (status: ScanStatus) => {
    switch (status) {
        case ScanStatus.SUCCESS: return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">SUCESSO</span>;
        case ScanStatus.MANUAL: return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">MANUAL</span>;
        case ScanStatus.ERROR_DUPLICATE: return <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-bold">DUPLICADO</span>;
        default: return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">ERRO</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">Meu Histórico</h2>
        </div>
        <table className="w-full text-left">
            <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Hora</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rota</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mensagem</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {myScans.map(scan => (
                    <tr key={scan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 font-mono font-medium text-gray-800">{scan.trackingCode}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{scan.routeName}</td>
                        <td className="px-6 py-4">
                            {getStatusBadge(scan.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{scan.message}</td>
                    </tr>
                ))}
                {myScans.length === 0 && (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhum registro encontrado hoje.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
  );
};