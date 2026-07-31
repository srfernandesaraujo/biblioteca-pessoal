import React, { useState } from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';
import { logoutUser, refreshCurrentUserStatus } from '../../services/authService';

export function PendingApprovalScreen({ currentUser, onUserUpdated, onLogout }) {
  const [isChecking, setIsChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const handleCheckStatus = async () => {
    setIsChecking(true);
    setStatusMsg('');
    const updated = await refreshCurrentUserStatus(currentUser.id);
    setIsChecking(false);
    if (updated) {
      if (updated.status === 'approved') {
        setStatusMsg('🎉 Seu acesso foi APROVADO pelo Administrador!');
        onUserUpdated(updated);
      } else {
        setStatusMsg('Ainda pendente. O administrador receberá sua solicitação.');
      }
    }
  };

  const isBlocked = currentUser?.status === 'blocked';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 selection:bg-emerald-500 selection:text-white">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          {isBlocked ? <ShieldAlert className="w-8 h-8 text-rose-500" /> : <Clock className="w-8 h-8 animate-pulse" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {isBlocked ? 'Acesso Revogado / Bloqueado' : 'Aguardando Aprovação do Administrador'}
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isBlocked
              ? 'Seu acesso ao sistema foi suspenso pelo administrador. Entre em contato para mais informações.'
              : 'O seu usuário foi registrado com sucesso. Para acessar a biblioteca de documentos e livros, o administrador precisa aprovar o seu cadastro.'}
          </p>
        </div>

        {/* User Card */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-3 truncate">
            <img
              src={currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
              alt=""
              className="w-10 h-10 rounded-full border border-slate-700 object-cover"
            />
            <div className="truncate">
              <span className="font-bold text-sm text-slate-200 block truncate">{currentUser.name}</span>
              <span className="text-xs text-slate-400 font-mono truncate">{currentUser.email}</span>
            </div>
          </div>

          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
            isBlocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }`}>
            {isBlocked ? 'Bloqueado' : 'Pendente'}
          </span>
        </div>

        {statusMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Admin Contact Info */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          Administrador Master: <code className="text-emerald-400 font-mono">srfernandesaraujo@gmail.com</code>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-2">
          {!isBlocked && (
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Verificar Status de Aprovação</span>
            </button>
          )}

          <button
            onClick={() => {
              logoutUser();
              onLogout();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair / Entrar com Outra Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}
