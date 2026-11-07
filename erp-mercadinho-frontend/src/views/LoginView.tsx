import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ArrowRight, Lock, Mail, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { error, success } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin(null);
    if (!email.trim() || !senha) {
      const msg = 'Por favor, preencha o e-mail e a senha para entrar.';
      setErroLogin(msg);
      error('Campos obrigatórios', msg);
      return;
    }

    try {
      setSubmitting(true);
      await login(email, senha);
      success('Sessão iniciada', 'Bem-vindo ao NexusERP!');
    } catch (err: any) {
      const msg = err?.message || 'E-mail ou senha incorretos. Verifique suas credenciais.';
      setErroLogin(msg);
      error('Falha na autenticação', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillAdmin = () => {
    setErroLogin(null);
    setEmail('admin@mercadinho.local');
    setSenha('senhaforte123');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background accents */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 bg-white border border-slate-200 rounded-2xl shadow-xl p-6 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/logo-full.png"
              alt="NexusERP"
              className="h-auto w-full max-w-80 max-h-16 object-contain"
            />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-['Syne'] tracking-tight">
            Autenticação Operacional
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Acesso integrado ao PDV, Gestão de Estoque e Caixa
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {erroLogin && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800">
                <p className="font-bold">Erro ao entrar no sistema</p>
                <p className="mt-0.5">{erroLogin}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 font-mono">
              E-mail do Operador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@mercadinho.local"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 pl-10 pr-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                Senha de Acesso
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 pl-10 pr-3.5 py-2.5 rounded-lg text-sm outline-none transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-sm tracking-wide transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? 'Autenticando...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>

        {/* Quick Demo Credentials Button */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={handleFillAdmin}
            className="w-full py-2.5 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors font-mono cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Preencher como Administrador Padrão</span>
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setErroLogin(null);
                setEmail('joao@mercadinho.local');
                setSenha('123456');
              }}
              className="py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors font-mono cursor-pointer"
            >
              <span>Operador 01 (João)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setErroLogin(null);
                setEmail('maria@mercadinho.local');
                setSenha('123456');
              }}
              className="py-2 px-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600 flex items-center justify-center gap-1.5 transition-colors font-mono cursor-pointer"
            >
              <span>Operadora 02 (Maria)</span>
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-700" />
            <span>Autenticação JWT protegida com bcrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
};
