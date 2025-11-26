import React, { useState } from 'react';
import { useApp } from '../../store/AppContext';
import { User, UserRole } from '../../types';
import { Plus, Trash2, Edit2, Shield, User as UserIcon } from 'lucide-react';

export const Employees: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({ role: UserRole.OPERATOR, active: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.login || !formData.password) return;

    if (formData.id) {
        updateUser(formData as User);
    } else {
        addUser({ ...formData, id: crypto.randomUUID() } as User);
    }
    setIsFormOpen(false);
    setFormData({ role: UserRole.OPERATOR, active: true });
  };

  const handleEdit = (user: User) => {
      setFormData(user);
      setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
      if (confirm('Tem certeza que deseja remover este usuário?')) {
          deleteUser(id);
      }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Gerenciar Equipe</h2>
            <button 
                onClick={() => { setFormData({ role: UserRole.OPERATOR, active: true }); setIsFormOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
            >
                <Plus size={18} className="mr-2" /> Novo Usuário
            </button>
        </div>

        {isFormOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold mb-4">{formData.id ? 'Editar' : 'Criar'} Usuário</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome</label>
                            <input 
                                className="w-full border rounded-lg p-2 mt-1" 
                                value={formData.name || ''} 
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Login</label>
                            <input 
                                className="w-full border rounded-lg p-2 mt-1" 
                                value={formData.login || ''} 
                                onChange={e => setFormData({...formData, login: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Senha</label>
                            <input 
                                className="w-full border rounded-lg p-2 mt-1" 
                                value={formData.password || ''} 
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cargo</label>
                            <select 
                                className="w-full border rounded-lg p-2 mt-1"
                                value={formData.role}
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                            >
                                <option value={UserRole.OPERATOR}>Operador</option>
                                <option value={UserRole.SUPERVISOR}>Supervisor</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Salvar</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Login</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Cargo</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-800">{user.name}</td>
                            <td className="px-6 py-4 text-gray-600">{user.login}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === UserRole.SUPERVISOR ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {user.role === UserRole.SUPERVISOR ? <Shield size={12} className="mr-1"/> : <UserIcon size={12} className="mr-1"/>}
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleEdit(user)} className="text-blue-600 hover:text-blue-800 mx-2"><Edit2 size={16}/></button>
                                {user.id !== currentUser?.id && (
                                    <button onClick={() => handleDelete(user.id)} className="text-red-600 hover:text-red-800 mx-2"><Trash2 size={16}/></button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};