import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, ShieldCheck, UserCheck, UserX, Crown, Clock, CheckCircle2, Search, Filter } from 'lucide-react';
import { db } from '../../db/database';

export function AdminDashboardModal({
  isOpen,
  onClose,
  currentUser
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'approved' | 'blocked'
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users from Dexie DB
  const users = useLiveQuery(() => db.users.toArray(), []) || [];

  if (!isOpen || currentUser?.email !== 'srfernandesaraujo@gmail.com') return null;

  const filteredUsers = users.filter(user => {
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = user.email?.toLowerCase().includes(q);
      const matchName = user.name?.toLowerCase().includes(q);
      if (!matchEmail && !matchName) return false;
    }
    return true;
  });

  const handleApproveUser = async (id) => {
    await db.users.update(id, { status: 'approved' });
  };

  const handleBlockUser = async (id) => {
    await db.users.update(id, { status: 'blocked' });
  };

  const handlePromoteAdmin = async (id) => {
    await db.users.update(id, { role: 'admin', status: 'approved' });
  };

  const pendingCount = users.filter(u => u.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Painel do Administrador Master
                <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Crown className="w-3 h-3" /> Admin
                </span>
              </h3>
              <p className="text-xs text-slate-300">Gerenciamento e Aprovação de Usuários (srfernandesaraujo@gmail.com)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Top Status Filter & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-lg text-xs font-semibold w-full sm:w-auto overflow-x-auto">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  filterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({users.length})
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  filterStatus === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendentes ({pendingCount})</span>
              </button>
              <button
                onClick={() => setFilterStatus('approved')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                  filterStatus === 'approved' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprovados ({users.filter(u => u.status === 'approved').length})</span>
              </button>
              <button
                onClick={() => setFilterStatus('blocked')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  filterStatus === 'blocked' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bloqueados ({users.filter(u => u.status === 'blocked').length})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar usuário por e-mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Usuário</th>
                    <th className="p-3.5">Função</th>
                    <th className="p-3.5">Status de Acesso</th>
                    <th className="p-3.5">Data Registro</th>
                    <th className="p-3.5 text-right">Ações de Aprovação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isSelfAdmin = user.email === 'srfernandesaraujo@gmail.com';
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                              alt=""
                              className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">{user.name}</span>
                              <span className="text-[11px] text-slate-500 font-mono">{user.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5">
                          {user.role === 'admin' ? (
                            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1 w-fit">
                              <Crown className="w-3 h-3 text-amber-600" /> Admin
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">Usuário</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {user.status === 'approved' ? (
                            <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-fit">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aprovado
                            </span>
                          ) : user.status === 'pending' ? (
                            <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-fit">
                              <Clock className="w-3 h-3 text-amber-600" /> Pendente de Aprovação
                            </span>
                          ) : (
                            <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1 w-fit">
                              Bloqueado
                            </span>
                          )}
                        </td>

                        <td className="p-3.5 text-slate-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}
                        </td>

                        <td className="p-3.5 text-right space-x-1.5">
                          {isSelfAdmin ? (
                            <span className="text-[10px] text-slate-400 font-semibold italic">Admin Master</span>
                          ) : (
                            <>
                              {user.status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveUser(user.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-all shadow-xs inline-flex items-center gap-1"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Aprovar</span>
                                </button>
                              )}

                              {user.status !== 'blocked' && (
                                <button
                                  onClick={() => handleBlockUser(user.id)}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded text-[11px] font-semibold transition-all inline-flex items-center gap-1"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Bloquear</span>
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
