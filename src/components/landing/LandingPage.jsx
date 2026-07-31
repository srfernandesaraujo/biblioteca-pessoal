import React, { useState } from 'react';
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
  ChevronDown,
  UserCheck,
  Star,
  LogIn
} from 'lucide-react';
import { loginWithGoogle } from '../../services/authService';

export function LandingPage({ onLoginSuccess }) {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  const handleAdminQuickLogin = async () => {
    const user = await loginWithGoogle(
      'srfernandesaraujo@gmail.com',
      'Sérgio Fernandes (Admin)',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    );
    onLoginSuccess(user);
  };

  const handleCustomGoogleLogin = async (e) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const user = await loginWithGoogle(customEmail.trim(), customName.trim() || customEmail.split('@')[0]);
    setIsLoginModalOpen(false);
    onLoginSuccess(user);
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
            {/* Super Admin Direct Button */}
            <button
              onClick={handleAdminQuickLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              <span>Entrar como Admin</span>
            </button>

            {/* General Google Login Button */}
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              <span>Login com Google</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Glow Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Sistema Pessoal de Documentos OCR & Estante Digital</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Sua biblioteca física e digital <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              organizada em um só lugar
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-base sm:text-lg leading-relaxed">
            Armazene notas fiscais, contratos, recibos e livros em PDF. Com leitura de OCR local automática, progresso de leitura estilo Kindle e aprovação segura por administrador.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={handleAdminQuickLogin}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition-all transform hover:-translate-y-1 flex items-center gap-3"
            >
              <UserCheck className="w-5 h-5 text-slate-950" />
              <span>Acessar Painel do Admin</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-8 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-800 transition-all flex items-center gap-3"
            >
              <LogIn className="w-5 h-5 text-emerald-400" />
              <span>Login com Google (Novo Usuário)</span>
            </button>
          </div>

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
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold">Notas Fiscais</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-semibold">Pago</span>
                  </div>
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
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full w-[65%]" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block">Continuar da Pág. 142 de 218 (65%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section with Scroll Animations */}
      <section className="py-24 px-6 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white tracking-tight">Recursos Projetados para Máxima Eficiência</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">Tudo o que você precisa para gerenciar seus documentos e livros com segurança e valor.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">OCR Local em Português</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Digitalize documentos escaneados e imagens com Tesseract.js localmente. O sistema reconhece texto, valores e datas automaticamente sem enviar nada à nuvem.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-teal-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Estante & Leitor Integrado</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Monte sua biblioteca em PDF com capa automática, marque status de leitura, classifique com estrelas e abra o leitor de PDF que salva a última página onde você parou.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-purple-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                <UserCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-white">Aprovação por Administrador</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Controle total de acessos. O administrador master (<code className="text-emerald-400 font-mono">srfernandesaraujo@gmail.com</code>) deve aprovar manualmente cada novo usuário cadastrado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Biblioteca Pessoal. Sistema 100% privado com OCR local e aprovação de usuários.</p>
      </footer>

      {/* Google Login Simulation Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center font-bold text-slate-900 text-xs">G</div>
                <h3 className="font-bold text-sm text-white">Login com Google</h3>
              </div>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomGoogleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">E-mail da Conta Google</label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="exemplo@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Seu Nome (Opcional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Seu Nome Completo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>💡 <strong>Nota de Aprovação:</strong></p>
                <p>Se usar o e-mail <code className="text-emerald-400">srfernandesaraujo@gmail.com</code> você entrará como <strong>Admin Aprovado</strong>.</p>
                <p>Outros e-mails serão registrados como <strong>Pendente de Aprovação</strong> até o Admin aprovar.</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Continuar com Google</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function X({ className }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
}
