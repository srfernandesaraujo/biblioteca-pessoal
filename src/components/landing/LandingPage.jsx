import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  BookOpen, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Database, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight, 
  UserCheck,
  Star,
  LogIn,
  Settings,
  X,
  AlertTriangle,
  Key,
  HelpCircle
} from 'lucide-react';
import { processRealGoogleToken, loginWithGoogleMock } from '../../services/authService';

// Official User Google OAuth Client ID
const DEFAULT_GOOGLE_CLIENT_ID = "613660293885-la1bfsrahqdk2dujbkcvlriboi33or9r.apps.googleusercontent.com";

export function LandingPage({ onLoginSuccess }) {
  const [googleClientId, setGoogleClientId] = useState(
    DEFAULT_GOOGLE_CLIENT_ID
  );
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');

  const handleAdminQuickLogin = async () => {
    const user = await loginWithGoogleMock(
      'srfernandesaraujo@gmail.com',
      'Sérgio Fernandes (Admin)',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    );
    onLoginSuccess(user);
  };

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogleGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response) => {
              if (response.credential) {
                try {
                  const user = await processRealGoogleToken(response.credential);
                  onLoginSuccess(user);
                } catch (err) {
                  alert('Erro ao autenticar com o token do Google.');
                }
              }
            }
          });

          const heroBtn = document.getElementById('googleHeroBtn');
          if (heroBtn) {
            heroBtn.innerHTML = '';
            window.google.accounts.id.renderButton(heroBtn, {
              theme: 'filled_blue',
              size: 'large',
              text: 'continue_with',
              shape: 'pill',
              width: 280
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    const timer = setTimeout(initGoogleGsi, 500);
    return () => clearTimeout(timer);
  }, [googleClientId, onLoginSuccess]);

  const handleSaveClientId = (newId) => {
    const trimmed = newId.trim();
    setGoogleClientId(trimmed);
    localStorage.setItem('biblioteca_google_client_id', trimmed);
    setIsConfigOpen(false);
  };

  const handleManualLogin = async (e) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    const user = await loginWithGoogleMock(manualEmail.trim(), manualName.trim());
    setIsManualModalOpen(false);
    onLoginSuccess(user);
  };

  const handleTriggerGooglePopup = () => {
    if (window.google?.accounts?.id && googleClientId) {
      window.google.accounts.id.prompt();
    } else {
      setIsManualModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg text-white tracking-tight leading-none">Biblioteca Pessoal</h1>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Paperless & Calibre Web</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Admin Access */}
            <button
              onClick={handleAdminQuickLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Entrar como Admin</span>
            </button>

            {/* General Google Login Button */}
            <button
              onClick={handleTriggerGooglePopup}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Login com Google</span>
            </button>

            {/* Config Google Client ID Button */}
            <button
              onClick={() => setIsConfigOpen(true)}
              title="Configurações do Google Cloud"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs font-semibold hidden sm:inline">Google Cloud</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Sistema Pessoal com Autenticação Google & Aprovação por Admin</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Sua biblioteca pessoal <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              com Login Google & Aprovação
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            Armazene notas fiscais, recibos e livros em PDF. O administrador master (<code className="text-emerald-400 font-mono">srfernandesaraujo@gmail.com</code>) possui acesso aprovado automático e gerencia novos usuários.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleAdminQuickLogin}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition-all transform hover:-translate-y-1 flex items-center gap-3"
            >
              <UserCheck className="w-5 h-5 text-slate-950" />
              <span>Entrar como Admin (srfernandesaraujo@gmail.com)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsManualModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-800 transition-all flex items-center gap-3"
            >
              <LogIn className="w-5 h-5 text-emerald-400" />
              <span>Entrar com outra conta Google</span>
            </button>
          </div>

          {/* Render Official Google Button if Client ID configured */}
          {googleClientId && (
            <div className="pt-4 flex flex-col items-center gap-2">
              <div id="googleHeroBtn" className="min-h-[45px]" />
              <span className="text-[11px] text-emerald-400 font-mono">✓ Google OAuth Client ID Ativo</span>
            </div>
          )}

          {/* Mockup Preview Cards Showcase */}
          <div className="pt-12 relative max-w-5xl mx-auto">
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center gap-2 mb-4 px-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500 font-mono ml-2">biblioteca-pessoal.app</span>
              </div>

              {/* Grid of Mini Feature Previews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Paperless Card Preview */}
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-md border border-emerald-500/30 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Paperless-ngx OCR
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">Processamento 100% Local</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-200">Nota Fiscal Energia Junho 2026.pdf</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 font-mono bg-slate-900 p-2.5 rounded border border-slate-800">
                    "VALOR TOTAL R$ 248,50 • VENCIMENTO 15/06/2026 • CONSUMO 310 kWh..."
                  </p>
                </div>

                {/* Calibre Book Card Preview */}
                <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-teal-500/20 text-teal-300 text-xs font-bold px-2.5 py-1 rounded-md border border-teal-500/30 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      Calibre-Web PDF
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" /> 5.0
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-200">Refactoring JavaScript</h4>
                  <p className="text-xs text-teal-400 font-medium">Evan Burchard • Tecnologias</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Biblioteca Pessoal. Sistema 100% privado com OCR local e aprovação por administrador.</p>
      </footer>

      {/* Login Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Login com Conta do Google</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail da Conta Google</label>
                <input
                  type="email"
                  required
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="srfernandesaraujo@gmail.com ou seu e-mail"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Nome (Opcional)</label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nome Completo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>💡 <strong>Regra de Acesso:</strong></p>
                <p>• E-mail <code className="text-emerald-400">srfernandesaraujo@gmail.com</code> entra direto como <strong>Super Admin Aprovado</strong>.</p>
                <p>• Qualquer outro e-mail ficará como <strong>Pendente de Aprovação</strong> até o Admin aprovar.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Acessar o Sistema</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Config Google Client ID Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Solução para o erro origin_mismatch</h3>
              </div>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Por que o erro origin_mismatch acontece no Google?
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                O Google exige que a URL exata do seu navegador esteja listada em <strong>Origens JavaScript autorizadas</strong> no Google Cloud.
              </p>
              <div className="bg-slate-900 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-emerald-400 space-y-1">
                <p>1. http://localhost:5174</p>
                <p>2. http://127.0.0.1:5174</p>
                <p>3. https://biblioteca-pessoal.pages.dev</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Google Client ID</label>
              <input
                type="text"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                placeholder="1234567890-abcdef.apps.googleusercontent.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsConfigOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                onClick={() => handleSaveClientId(googleClientId)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md"
              >
                Salvar Client ID
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
