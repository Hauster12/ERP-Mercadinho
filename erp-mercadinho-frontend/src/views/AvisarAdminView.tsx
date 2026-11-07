import React, { useState } from 'react';
import { Send, Bell, CheckCircle2, AlertCircle, Clock, User } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const AvisarAdminView: React.FC = () => {
  const { user, caixaAtual } = useAuth();
  const { success, error } = useToast();

  const [numeroCaixa, setNumeroCaixa] = useState<number>(caixaAtual?.numeroCaixa || 1);
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagensEnviadas, setMensagensEnviadas] = useState<
    Array<{ id: string; texto: string; caixa: number; hora: string }>
  >([]);

  const atalhos = [
    { label: 'Troco', texto: 'Preciso de troco (moedas e cédulas de baixo valor)' },
    { label: 'Sem Preço', texto: 'Produto sem preço ou código não cadastrado' },
    { label: 'Problema com Aparelhos', texto: 'Problema com aparelhos do caixa (computador, impressora ou leitor)' },
  ];

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagem.trim()) {
      error('Mensagem vazia', 'Por favor, digite o recado que deseja enviar ao administrador.');
      return;
    }

    try {
      setEnviando(true);
      await api.enviarAvisoAdmin({
        mensagem: mensagem.trim(),
        numeroCaixa,
      });

      success('Aviso enviado ao Administrador!', 'Um pop-up foi disparado na tela do admin.');
      setMensagensEnviadas((prev) => [
        {
          id: String(Date.now()),
          texto: mensagem.trim(),
          caixa: numeroCaixa,
          hora: new Date().toLocaleTimeString('pt-BR'),
        },
        ...prev,
      ]);
      setMensagem('');
    } catch (err: any) {
      error('Erro ao enviar aviso', err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
            <Bell className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 font-['Syne'] tracking-tight">
              Chamado / Mensagem ao Administrador
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Envie alertas em tempo real que surgem instantaneamente em pop-up na tela do admin
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <form onSubmit={handleEnviar} className="space-y-5">
          {/* Caixa selector */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-2">
              Qual caixa você está operando? *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { num: 1, label: 'Caixa 01' },
                { num: 2, label: 'Caixa 02' },
              ].map((c) => {
                const ativo = numeroCaixa === c.num;
                return (
                  <button
                    key={c.num}
                    type="button"
                    onClick={() => setNumeroCaixa(c.num)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      ativo
                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{c.label}</span>
                    {ativo && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-2">
              Atalhos Rápidos (clique para preencher)
            </label>
            <div className="flex flex-wrap gap-2">
              {atalhos.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMensagem(item.texto)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-800 hover:border-cyan-300 border border-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mensagem Textarea */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1.5">
              Mensagem do Chamado *
            </label>
            <textarea
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Ex: Preciso de troco de 100 reais no Caixa 2 urgente..."
              required
              className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 p-3.5 rounded-xl text-sm outline-none resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Assim que enviado, uma notificação com pop-up e alerta sonoro/visual aparecerá na tela do admin.
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{enviando ? 'Enviando Aviso...' : 'Enviar Aviso ao Administrador'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Histórico recente da sessão */}
      {mensagensEnviadas.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 font-['Syne']">
            Avisos Enviados nesta Sessão
          </h3>
          <div className="space-y-2.5">
            {mensagensEnviadas.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-100 text-cyan-900 text-[10px]">
                      Caixa 0{m.caixa}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{m.hora}</span>
                  </div>
                  <p className="font-medium text-slate-800">{m.texto}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                  Enviado
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
