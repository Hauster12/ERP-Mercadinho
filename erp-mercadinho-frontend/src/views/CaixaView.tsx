import React, { useState, useEffect } from 'react';
import {
  Vault,
  PlusCircle,
  MinusCircle,
  Lock,
  History,
  RefreshCw,
  X,
  AlertTriangle,
  User,
  Receipt,
  TrendingUp,
  Eye,
  Printer,
  Banknote,
  QrCode,
  CreditCard,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Caixa, Venda } from '../types';

const formatarFormaPagamento = (forma: string) => {
  const mapa: Record<string, string> = {
    DINHEIRO: 'Dinheiro',
    PIX: 'PIX',
    CARTAO_DEBITO: 'Cartão de Débito',
    CARTAO_CREDITO: 'Cartão de Crédito',
  };
  return mapa[forma] || forma;
};

const formatarObservacaoOperacao = (obs?: string | null) => {
  if (!obs) return '-';
  try {
    const parsed = JSON.parse(obs);
    if (typeof parsed === 'object' && parsed !== null) {
      const partes: string[] = [];
      if (parsed.numeroCaixa) partes.push(`Caixa 0${parsed.numeroCaixa}`);
      if (parsed.conferencia) partes.push(parsed.conferencia);
      if (parsed.recadoProximoOperador)
        partes.push(`Recado próx. operador: "${parsed.recadoProximoOperador}"`);
      if (parsed.recadoAdmin) partes.push(`Aviso admin: "${parsed.recadoAdmin}"`);
      return partes.length > 0 ? partes.join(' • ') : obs;
    }
  } catch {
    // Não é JSON, retorna texto normal
  }
  return obs;
};

export const CaixaView: React.FC = () => {
  const { caixaAtual, refreshCaixa, user } = useAuth();
  const { success, error } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [caixasAbertos, setCaixasAbertos] = useState<Caixa[]>([]);
  const [historicoCaixas, setHistoricoCaixas] = useState<Caixa[]>([]);
  const [caixaSelecionado, setCaixaSelecionado] = useState<Caixa | null>(null);
  const [abaFluxo, setAbaFluxo] = useState<'vendas' | 'operacoes'>('vendas');
  const [vendaDetalheModal, setVendaDetalheModal] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick Operation Modal (Sangria / Reforço)
  const [modalOperacaoAberto, setModalOperacaoAberto] = useState(false);
  const [caixaAlvoOperacao, setCaixaAlvoOperacao] = useState<Caixa | null>(null);
  const [tipoOperacao, setTipoOperacao] = useState<'SANGRIA' | 'REFORCO'>('SANGRIA');
  const [valorOperacao, setValorOperacao] = useState('');
  const [obsOperacao, setObsOperacao] = useState('');
  const [salvandoOp, setSalvandoOp] = useState(false);

  // Close Cash Register Modal
  const [modalFechamentoAberto, setModalFechamentoAberto] = useState(false);
  const [caixaAlvoFechamento, setCaixaAlvoFechamento] = useState<Caixa | null>(null);
  const [valorFinalContado, setValorFinalContado] = useState('');
  const [obsFechamento, setObsFechamento] = useState('Conferência de turno');
  const [recadoProximoOperador, setRecadoProximoOperador] = useState('');
  const [fechando, setFechando] = useState(false);

  // Open Cash Register Modal (directly from CaixaView if closed)
  const [modalAberturaAberto, setModalAberturaAberto] = useState(false);
  const [abrirNumeroCaixa, setAbrirNumeroCaixa] = useState<number>(1);
  const [abrirValorInicial, setAbrirValorInicial] = useState('100.00');
  const [recadoAbertura, setRecadoAbertura] = useState<any | null>(null);
  const [carregandoRecadoAbertura, setCarregandoRecadoAbertura] = useState(false);
  const [abrindoTurno, setAbrindoTurno] = useState(false);

  const carregarDadosCaixas = async (idParaSelecionar?: string) => {
    try {
      setLoading(true);
      const [abertosRes, historicoRes] = await Promise.all([
        api.getCaixasAbertos(),
        api.getCaixas(),
      ]);
      setCaixasAbertos(abertosRes);
      setHistoricoCaixas(historicoRes);

      const alvoId =
        idParaSelecionar ||
        caixaSelecionado?.id ||
        caixaAtual?.id ||
        abertosRes[0]?.id ||
        historicoRes[0]?.id;

      if (alvoId) {
        try {
          const det = await api.getCaixa(alvoId);
          setCaixaSelecionado(det);
        } catch {
          const fallback =
            abertosRes.find((c) => c.id === alvoId) ||
            historicoRes.find((c) => c.id === alvoId) ||
            abertosRes[0] ||
            historicoRes[0] ||
            null;
          setCaixaSelecionado(fallback);
        }
      } else {
        setCaixaSelecionado(null);
      }
    } catch (err: any) {
      error('Erro ao carregar controle de caixas', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDadosCaixas(caixaAtual?.id);
  }, [caixaAtual?.id]);

  const selecionarCaixaParaFluxo = async (c: Caixa) => {
    try {
      setLoading(true);
      const det = await api.getCaixa(c.id);
      setCaixaSelecionado(det);
    } catch {
      setCaixaSelecionado(c);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalOperacao = (tipo: 'SANGRIA' | 'REFORCO', alvo?: Caixa) => {
    const target = alvo || caixaAtual;
    if (!target) return;
    setCaixaAlvoOperacao(target);
    setTipoOperacao(tipo);
    setValorOperacao('20.00');
    setObsOperacao(tipo === 'SANGRIA' ? 'Sangria para cofre central' : 'Reforço de moedas/troco');
    setModalOperacaoAberto(true);
  };

  useEffect(() => {
    if (modalAberturaAberto) {
      let cancel = false;
      setCarregandoRecadoAbertura(true);
      api
        .getUltimoRecadoCaixa(abrirNumeroCaixa)
        .then((r) => {
          if (!cancel) setRecadoAbertura(r);
        })
        .catch(() => {
          if (!cancel) setRecadoAbertura(null);
        })
        .finally(() => {
          if (!cancel) setCarregandoRecadoAbertura(false);
        });
      return () => {
        cancel = true;
      };
    }
  }, [modalAberturaAberto, abrirNumeroCaixa]);

  const handleSalvarOperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = caixaAlvoOperacao || caixaAtual;
    if (!target) return;

    try {
      setSalvandoOp(true);
      const val = parseFloat(valorOperacao) || 0;
      await api.registrarOperacaoCaixa(target.id, {
        tipo: tipoOperacao,
        valor: val,
        observacao: obsOperacao,
      });

      success(
        `${tipoOperacao === 'SANGRIA' ? 'Sangria' : 'Reforço'} realizado!`,
        `Caixa 0${target.numeroCaixa || 1} • R$ ${val.toFixed(2)}`
      );
      setModalOperacaoAberto(false);
      await refreshCaixa();
      await carregarDadosCaixas(target.id);
    } catch (err: any) {
      error('Falha na operação de caixa', err.message);
    } finally {
      setSalvandoOp(false);
    }
  };

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAbrindoTurno(true);
      const val = parseFloat(abrirValorInicial) || 0;
      const novo = await api.abrirCaixa(val, abrirNumeroCaixa);
      success(
        'Turno de caixa aberto com sucesso!',
        `Você está logado no Caixa 0${abrirNumeroCaixa} com fundo inicial de R$ ${val.toFixed(2)}`
      );
      setModalAberturaAberto(false);
      await refreshCaixa();
      await carregarDadosCaixas(novo.id);
    } catch (err: any) {
      error('Erro ao abrir caixa', err.message);
    } finally {
      setAbrindoTurno(false);
    }
  };

  const abrirModalFechamento = async (alvo?: Caixa) => {
    const target = alvo || caixaAtual;
    if (!target) return;

    try {
      const detalhes = await api.getCaixa(target.id);
      setCaixaAlvoFechamento(detalhes);
      setCaixaSelecionado(detalhes);
      setValorFinalContado(
        String(Number(detalhes.saldoDinheiro ?? target.valorInicial).toFixed(2))
      );
      setModalFechamentoAberto(true);
    } catch (err: any) {
      error('Erro ao consultar saldo do caixa', err.message);
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = caixaAlvoFechamento || caixaAtual;
    if (!target) return;

    try {
      setFechando(true);
      const valorFinal = parseFloat(valorFinalContado) || 0;
      await api.fecharCaixa(target.id, {
        valorFinal,
        observacao: obsFechamento,
        recadoProximoOperador: recadoProximoOperador.trim() || undefined,
        numeroCaixa: target.numeroCaixa || 1,
      });

      success(`Caixa 0${target.numeroCaixa || 1} fechado com sucesso!`);
      setModalFechamentoAberto(false);
      setRecadoProximoOperador('');
      await refreshCaixa();
      await carregarDadosCaixas(target.id);
    } catch (err: any) {
      error('Erro ao fechar caixa', err.message);
    } finally {
      setFechando(false);
    }
  };

  // Monta lista de terminais (Caixa 01, Caixa 02 e outros caso existam abertos)
  const numerosTerminais = Array.from(
    new Set([1, 2, ...caixasAbertos.map((c) => c.numeroCaixa || 1)])
  ).sort((a, b) => a - b);

  const caixaExibido = caixaSelecionado || caixaAtual;
  const vendasDoCaixa = caixaExibido?.vendas || [];
  const operacoesDoCaixa = caixaExibido?.operacoes || [];
  const saldoEsperadoExibido =
    caixaExibido?.saldoDinheiro ?? caixaExibido?.valorInicial ?? 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* 1. PAINEL DE CONTROLE DOS CAIXAS (QUAL CAIXA ESTÁ ABERTO & FUNCIONÁRIO LOGADO) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Vault className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 font-['Syne']">
                  Controle de Caixas & Terminais PDV
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {caixasAbertos.length} {caixasAbertos.length === 1 ? 'caixa aberto' : 'caixas abertos'} agora
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Veja em tempo real qual caixa está aberto, qual funcionário está logado em cada terminal e o fluxo de vendas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(!caixaAtual || caixaAtual.status !== 'ABERTO') && (
              <button
                onClick={() => {
                  // Sugere o primeiro caixa livre
                  const livre = [1, 2].find(
                    (n) => !caixasAbertos.some((c) => (c.numeroCaixa || 1) === n)
                  );
                  setAbrirNumeroCaixa(livre || 1);
                  setModalAberturaAberto(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs shadow-xs transition-all cursor-pointer"
              >
                <Vault className="w-4 h-4" />
                <span>Abrir Meu Turno de Caixa</span>
              </button>
            )}
            <button
              onClick={() => carregarDadosCaixas(caixaExibido?.id)}
              title="Atualizar status dos caixas"
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Banner de Status do Funcionário Logado */}
        <div
          className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            caixaAtual?.status === 'ABERTO'
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                caixaAtual?.status === 'ABERTO'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse'
                  : 'bg-amber-500'
              }`}
            />
            <div className="text-xs">
              <span className="text-slate-600">Funcionário conectado: </span>
              <strong className="text-slate-900">{user?.nome}</strong>
              <span className="mx-1.5 text-slate-400">•</span>
              {caixaAtual?.status === 'ABERTO' ? (
                <span className="font-mono font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                  LOGADO NO CAIXA 0{caixaAtual.numeroCaixa || 1}
                </span>
              ) : (
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                  SEM CAIXA ABERTO NESTE MOMENTO
                </span>
              )}
            </div>
          </div>

          {caixaAtual?.status === 'ABERTO' && (
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-600">
                Vendas no seu turno:{' '}
                <strong className="text-cyan-800">
                  {caixaAtual.quantidadeVendas || 0} ({' '}
                  R$ {Number(caixaAtual.totalVendas || 0).toFixed(2)})
                </strong>
              </span>
              {caixaExibido?.id !== caixaAtual.id && (
                <button
                  onClick={() => selecionarCaixaParaFluxo(caixaAtual)}
                  className="text-cyan-700 font-bold hover:underline cursor-pointer"
                >
                  Ver meu caixa
                </button>
              )}
            </div>
          )}
        </div>

        {/* Cards de Status por Terminal (Caixa 01, Caixa 02, etc.) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {numerosTerminais.map((num) => {
            const aberto = caixasAbertos.find((c) => (c.numeroCaixa || 1) === num);
            const ultimoFechado = !aberto
              ? historicoCaixas.find(
                  (c) => c.status === 'FECHADO' && (c.numeroCaixa || 1) === num
                )
              : null;
            const ehMeuCaixa = aberto && aberto.usuarioId === user?.id;
            const selecionado =
              (aberto && caixaExibido?.id === aberto.id) ||
              (!aberto && ultimoFechado && caixaExibido?.id === ultimoFechado.id);

            return (
              <div
                key={num}
                className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-4 ${
                  aberto
                    ? selecionado
                      ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                      : 'bg-white border-emerald-200 hover:border-emerald-400 shadow-xs'
                    : selecionado
                    ? 'bg-slate-50 border-cyan-500 ring-2 ring-cyan-500/20'
                    : 'bg-slate-50/60 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-sm border ${
                        aberto
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-200/70 text-slate-600 border-slate-300'
                      }`}
                    >
                      0{num}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 font-['Syne']">
                          Caixa 0{num}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            aberto
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-200 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {aberto ? '● ABERTO' : 'FECHADO / LIVRE'}
                        </span>
                        {ehMeuCaixa && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
                            SEU CAIXA
                          </span>
                        )}
                      </div>

                      {aberto ? (
                        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>
                            Funcionário logado:{' '}
                            <strong className="text-slate-900">
                              {aberto.usuario?.nome || aberto.usuarioNome || 'Operador'}
                            </strong>
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 mt-1">
                          Nenhum funcionário logado neste caixa no momento
                        </p>
                      )}
                    </div>
                  </div>

                  {aberto && (
                    <span className="text-[11px] font-mono text-slate-500">
                      Desde{' '}
                      {new Date(aberto.abertoEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                {/* Resumo do Fluxo de Vendas dentro do Card do Caixa */}
                {aberto ? (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs font-mono">
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Vendas Realizadas
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {aberto.quantidadeVendas || 0}{' '}
                        <span className="text-[10px] font-normal text-slate-500">cupons</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Fluxo de Vendas
                      </span>
                      <span className="text-sm font-black text-cyan-700">
                        R$ {Number(aberto.totalVendas || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        Saldo Gaveta
                      </span>
                      <span className="text-sm font-black text-emerald-700">
                        R$ {Number(aberto.saldoDinheiro ?? aberto.valorInicial ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : ultimoFechado ? (
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200 text-[11px] text-slate-600 font-mono flex items-center justify-between">
                    <span>
                      Último turno: <strong>{ultimoFechado.usuarioNome || ultimoFechado.usuario?.nome}</strong>
                    </span>
                    <span>
                      Vendas: <strong>R$ {Number(ultimoFechado.totalVendas || 0).toFixed(2)}</strong>
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-white/80 border border-slate-200 text-[11px] text-slate-400 font-mono">
                    Sem turnos registrados anteriormente para o Caixa 0{num}.
                  </div>
                )}

                {/* Botões de Ação do Card do Caixa */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  {aberto ? (
                    <>
                      <button
                        type="button"
                        onClick={() => selecionarCaixaParaFluxo(aberto)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                          caixaExibido?.id === aberto.id
                            ? 'bg-cyan-600 text-white'
                            : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200'
                        }`}
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>
                          {caixaExibido?.id === aberto.id
                            ? 'Exibindo Fluxo Abaixo'
                            : 'Ver Fluxo de Vendas'}
                        </span>
                      </button>

                      {(ehMeuCaixa || isAdmin) && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalOperacao('REFORCO', aberto)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-cyan-50 text-cyan-800 border border-slate-200 text-xs font-bold cursor-pointer"
                            title="Registrar reforço neste caixa"
                          >
                            + Reforço
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalOperacao('SANGRIA', aberto)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold cursor-pointer"
                            title="Registrar sangria neste caixa"
                          >
                            - Sangria
                          </button>
                          <button
                            type="button"
                            onClick={() => abrirModalFechamento(aberto)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer flex items-center gap-1"
                            title="Fechar turno deste caixa"
                          >
                            <Lock className="w-3 h-3" />
                            <span>Fechar</span>
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {ultimoFechado && (
                        <button
                          type="button"
                          onClick={() => selecionarCaixaParaFluxo(ultimoFechado)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Último Fluxo</span>
                        </button>
                      )}
                      {(!caixaAtual || caixaAtual.status !== 'ABERTO') && (
                        <button
                          type="button"
                          onClick={() => {
                            setAbrirNumeroCaixa(num);
                            setModalAberturaAberto(true);
                          }}
                          className="ml-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold cursor-pointer shadow-xs"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5" />
                          <span>Abrir Caixa 0{num}</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. FLUXO DE VENDAS & MOVIMENTAÇÕES DO CAIXA EM QUESTÃO */}
      {caixaExibido && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-slate-900 font-['Syne']">
                    Fluxo de Vendas — Caixa 0{caixaExibido.numeroCaixa || 1}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      caixaExibido.status === 'ABERTO'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {caixaExibido.status === 'ABERTO' ? 'TURNO ABERTO' : 'TURNO FECHADO'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Funcionário logado:{' '}
                  <strong className="text-slate-900">
                    {caixaExibido.usuario?.nome || caixaExibido.usuarioNome || 'Operador'}
                  </strong>{' '}
                  • Abertura: {new Date(caixaExibido.abertoEm).toLocaleString('pt-BR')}
                  {caixaExibido.fechadoEm
                    ? ` • Fechamento: ${new Date(caixaExibido.fechadoEm).toLocaleString('pt-BR')}`
                    : ''}
                </p>
              </div>
            </div>

            {/* Seletor rápido de turno para inspecionar fluxo */}
            {historicoCaixas.length > 1 && (
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-mono font-bold text-slate-500 uppercase">
                  Alternar Caixa/Turno:
                </label>
                <select
                  value={caixaExibido.id}
                  onChange={(e) => {
                    const found =
                      caixasAbertos.find((c) => c.id === e.target.value) ||
                      historicoCaixas.find((c) => c.id === e.target.value);
                    if (found) selecionarCaixaParaFluxo(found);
                  }}
                  className="bg-slate-50 border border-slate-300 text-xs text-slate-900 font-mono font-bold rounded-lg px-2.5 py-1.5 outline-none focus:border-cyan-600"
                >
                  {historicoCaixas.map((c) => (
                    <option key={c.id} value={c.id}>
                      Caixa 0{c.numeroCaixa || 1} — {c.usuario?.nome || c.usuarioNome || 'Operador'} (
                      {c.status === 'ABERTO'
                        ? 'ABERTO'
                        : new Date(c.abertoEm).toLocaleDateString('pt-BR')}
                      )
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* KPIs do Fluxo de Vendas e Gaveta deste Caixa */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase block">
                Fundo Inicial
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                R$ {Number(caixaExibido.valorInicial || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-cyan-50/70 border border-cyan-200">
              <span className="text-[10px] font-mono font-bold text-cyan-900 uppercase block">
                Total Vendas ({caixaExibido.quantidadeVendas || 0})
              </span>
              <p className="text-sm font-black font-mono text-cyan-800 mt-1">
                R$ {Number(caixaExibido.totalVendas || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase flex items-center gap-1">
                <Banknote className="w-3 h-3" /> Dinheiro
              </span>
              <p className="text-sm font-bold font-mono text-emerald-900 mt-1">
                R$ {Number(caixaExibido.vendasPorForma?.DINHEIRO || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                <QrCode className="w-3 h-3 text-cyan-600" /> PIX
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                R$ {Number(caixaExibido.vendasPorForma?.PIX || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-indigo-600" /> Débito
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                R$ {Number(caixaExibido.vendasPorForma?.CARTAO_DEBITO || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-amber-600" /> Crédito
              </span>
              <p className="text-sm font-bold font-mono text-slate-900 mt-1">
                R$ {Number(caixaExibido.vendasPorForma?.CARTAO_CREDITO || 0).toFixed(2)}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono font-bold text-amber-800 uppercase block">
                Sangrias / Reforços
              </span>
              <p className="text-xs font-bold font-mono text-slate-800 mt-1">
                <span className="text-emerald-700">
                  +{Number(caixaExibido.totalReforcos || 0).toFixed(2)}
                </span>{' '}
                /{' '}
                <span className="text-rose-700">
                  -{Number(caixaExibido.totalSaidas || 0).toFixed(2)}
                </span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-mono font-bold text-amber-900 uppercase block">
                Saldo em Gaveta
              </span>
              <p className="text-sm font-black font-mono text-amber-800 mt-1">
                R$ {Number(saldoEsperadoExibido).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Abas de Vendas do Caixa vs Operações de Gaveta */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAbaFluxo('vendas')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  abaFluxo === 'vendas'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Vendas Realizadas neste Caixa ({vendasDoCaixa.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setAbaFluxo('operacoes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  abaFluxo === 'operacoes'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Vault className="w-3.5 h-3.5" />
                <span>Movimentações de Gaveta ({operacoesDoCaixa.length})</span>
              </button>
            </div>
          </div>

          {/* TABELA 1: FLUXO DE VENDAS DESTE CAIXA */}
          {abaFluxo === 'vendas' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">HORÁRIO</th>
                    <th className="py-2.5 px-3">CAIXA / OPERADOR</th>
                    <th className="py-2.5 px-3">CLIENTE</th>
                    <th className="py-2.5 px-3">ITENS VENDIDOS</th>
                    <th className="py-2.5 px-3">PAGAMENTO</th>
                    <th className="py-2.5 px-3">VALOR TOTAL</th>
                    <th className="py-2.5 px-3">STATUS</th>
                    <th className="py-2.5 px-3 text-right">CUPOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendasDoCaixa.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Nenhuma venda registrada neste turno do Caixa 0{caixaExibido.numeroCaixa || 1} até o momento.
                      </td>
                    </tr>
                  ) : (
                    vendasDoCaixa.map((v) => {
                      const cancelada = v.status === 'CANCELADA';
                      const resumoItens =
                        v.itens && v.itens.length > 0
                          ? v.itens
                              .map((i) => `${Number(i.quantidade)}x ${i.produtoNome}`)
                              .join(', ')
                          : '-';
                      const formas =
                        v.pagamentos && v.pagamentos.length > 0
                          ? v.pagamentos.map((p) => formatarFormaPagamento(p.forma)).join(', ')
                          : '-';

                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {new Date(v.criadoEm).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono font-bold text-[10px] mr-1.5">
                              Caixa 0{caixaExibido.numeroCaixa || 1}
                            </span>
                            <span className="font-bold text-slate-900">
                              {v.usuarioNome || caixaExibido.usuarioNome || 'Operador'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {v.clienteNome || 'Consumidor Final'}
                          </td>
                          <td
                            className="py-2.5 px-3 text-slate-700 max-w-xs truncate"
                            title={resumoItens}
                          >
                            {resumoItens}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-cyan-800">
                            {formas}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-amber-700">
                            R$ {Number(v.valorTotal).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                cancelada
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => setVendaDetalheModal(v)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-700 hover:bg-cyan-50 transition-colors cursor-pointer"
                              title="Ver detalhes do cupom"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* TABELA 2: OPERAÇÕES DE GAVETA DESTE CAIXA */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">DATA / HORA</th>
                    <th className="py-2.5 px-3">TIPO DE OPERAÇÃO</th>
                    <th className="py-2.5 px-3">FUNCIONÁRIO</th>
                    <th className="py-2.5 px-3">OBSERVAÇÃO / DETALHES</th>
                    <th className="py-2.5 px-3 text-right">VALOR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {operacoesDoCaixa.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Nenhuma operação registrada neste caixa.
                      </td>
                    </tr>
                  ) : (
                    operacoesDoCaixa.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-500">
                          {new Date(op.criadoEm).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              op.tipo === 'ABERTURA'
                                ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                : op.tipo === 'REFORCO'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : op.tipo === 'SANGRIA'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {op.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {op.usuario?.nome || caixaExibido.usuarioNome || 'Operador'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatarObservacaoOperacao(op.observacao)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900">
                          R$ {Number(op.valor).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. HISTÓRICO DE TURNOS DE CAIXA */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-700" />
            <h3 className="text-sm font-bold text-slate-900 font-['Syne'] tracking-wide">
              HISTÓRICO DE TURNOS E FLUXO POR CAIXA
            </h3>
          </div>
          <button
            onClick={() => carregarDadosCaixas(caixaExibido?.id)}
            className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">CAIXA</th>
                <th className="py-2.5 px-3">STATUS</th>
                <th className="py-2.5 px-3">FUNCIONÁRIO LOGADO</th>
                <th className="py-2.5 px-3">ABERTURA</th>
                <th className="py-2.5 px-3">FECHAMENTO</th>
                <th className="py-2.5 px-3">FUNDO INICIAL</th>
                <th className="py-2.5 px-3">FLUXO DE VENDAS</th>
                <th className="py-2.5 px-3 text-right">VALOR FINAL</th>
                <th className="py-2.5 px-3 text-right">FLUXO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historicoCaixas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    Nenhum turno registrado.
                  </td>
                </tr>
              ) : (
                historicoCaixas.map((c) => {
                  const ativo = caixaExibido?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        ativo ? 'bg-cyan-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-cyan-50 text-cyan-900 border border-cyan-200">
                          Caixa 0{c.numeroCaixa || 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            c.status === 'ABERTO'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {c.usuario?.nome || c.usuarioNome || 'Operador'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {new Date(c.abertoEm).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {c.fechadoEm ? new Date(c.fechadoEm).toLocaleString('pt-BR') : 'Em aberto'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        R$ {Number(c.valorInicial).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className="font-bold text-cyan-800">
                          R$ {Number(c.totalVendas || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          ({c.quantidadeVendas || 0} vendas)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right font-extrabold text-amber-700">
                        {c.valorFinal !== null && c.valorFinal !== undefined
                          ? `R$ ${Number(c.valorFinal).toFixed(2)}`
                          : `R$ ${Number(c.saldoDinheiro ?? c.valorInicial ?? 0).toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => selecionarCaixaParaFluxo(c)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                            ativo
                              ? 'bg-cyan-600 text-white'
                              : 'bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-800 border border-slate-200'
                          }`}
                        >
                          {ativo ? 'Visualizando' : 'Ver Fluxo'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALHE DE CUPOM DE VENDA DO CAIXA */}
      {vendaDetalheModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Cupom Detalhado da Venda
                </h3>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Caixa 0{vendaDetalheModal.numeroCaixa || caixaExibido?.numeroCaixa || 1} • ID:{' '}
                  {vendaDetalheModal.id.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={() => setVendaDetalheModal(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs font-mono space-y-3 text-slate-700">
              <div className="text-center border-b border-slate-200 pb-2">
                <p className="font-bold text-slate-900 tracking-widest">NEXUS ERP — COMPROVANTE</p>
                <p className="text-[10px] text-slate-500">
                  CAIXA 0{vendaDetalheModal.numeroCaixa || caixaExibido?.numeroCaixa || 1}
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>DATA / HORA:</span>
                  <span>{new Date(vendaDetalheModal.criadoEm).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>CAIXA:</span>
                  <span className="text-cyan-800 font-bold">
                    Caixa 0{vendaDetalheModal.numeroCaixa || caixaExibido?.numeroCaixa || 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>OPERADOR:</span>
                  <span className="text-slate-900 font-bold">
                    {vendaDetalheModal.usuarioNome || caixaExibido?.usuarioNome || 'Operador'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="text-slate-900 font-bold">
                    {vendaDetalheModal.clienteNome || 'Consumidor Final'}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">ITENS:</p>
                {vendaDetalheModal.itens?.map((it) => (
                  <div key={it.id} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[220px] text-slate-800">
                      {Number(it.quantidade)}x {it.produtoNome}
                    </span>
                    <span className="text-slate-900 font-bold">
                      R$ {Number(it.subtotal).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-2 space-y-1">
                <p className="text-[10px] text-slate-500 font-bold uppercase">PAGAMENTO:</p>
                {vendaDetalheModal.pagamentos?.map((p) => (
                  <div key={p.id} className="flex justify-between text-[11px]">
                    <span className="text-cyan-800 font-bold">
                      {formatarFormaPagamento(p.forma)}
                    </span>
                    <span className="text-slate-900 font-bold">
                      R$ {Number(p.valor).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                <span>TOTAL LIQUIDADO:</span>
                <span className="text-amber-700">
                  R$ {Number(vendaDetalheModal.valorTotal).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="py-2 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={() => setVendaDetalheModal(null)}
                className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SANGRIA / REFORÇO MODAL */}
      {modalOperacaoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Registrar {tipoOperacao === 'SANGRIA' ? 'Sangria (Retirada)' : 'Reforço (Suprimento)'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Caixa 0{(caixaAlvoOperacao || caixaAtual)?.numeroCaixa || 1}
                </p>
              </div>
              <button
                onClick={() => setModalOperacaoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarOperacao} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Valor da Operação (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={valorOperacao}
                  onChange={(e) => setValorOperacao(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={obsOperacao}
                  onChange={(e) => setObsOperacao(e.target.value)}
                  placeholder="Ex: Pagamento fornecedor, troco extra"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOperacaoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoOp}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvandoOp ? 'Gravando...' : 'Confirmar Operação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FECHAMENTO DE CAIXA MODAL */}
      {modalFechamentoAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                  Fechamento & Conciliação — Caixa 0{(caixaAlvoFechamento || caixaAtual)?.numeroCaixa || 1}
                </h3>
                <p className="text-xs text-slate-500">
                  Operador:{' '}
                  {(caixaAlvoFechamento || caixaAtual)?.usuario?.nome ||
                    (caixaAlvoFechamento || caixaAtual)?.usuarioNome ||
                    user?.nome}
                </p>
              </div>
              <button
                onClick={() => setModalFechamentoAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFecharCaixa} className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono text-slate-700">
                <div className="flex justify-between">
                  <span>Vendas Concluídas no Turno:</span>
                  <span className="text-slate-900 font-bold">
                    {(caixaAlvoFechamento || caixaAtual)?.quantidadeVendas || 0} (R${' '}
                    {Number((caixaAlvoFechamento || caixaAtual)?.totalVendas || 0).toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Saldo Teórico em Dinheiro na Gaveta:</span>
                  <span className="text-cyan-800 font-bold">
                    R${' '}
                    {Number(
                      (caixaAlvoFechamento || caixaAtual)?.saldoDinheiro ??
                        (caixaAlvoFechamento || caixaAtual)?.valorInicial ??
                        0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Valor Físico Contado na Gaveta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorFinalContado}
                  onChange={(e) => setValorFinalContado(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Observações de Fechamento
                </label>
                <input
                  type="text"
                  value={obsFechamento}
                  onChange={(e) => setObsFechamento(e.target.value)}
                  placeholder="Conferência de fechamento"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="pt-1 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1 flex items-center gap-1.5">
                    <span className="text-cyan-700 font-bold">💬</span> Recado para o Próximo Atendente do Caixa 0
                    {(caixaAlvoFechamento || caixaAtual)?.numeroCaixa || 1}
                  </label>
                  <textarea
                    rows={3}
                    value={recadoProximoOperador}
                    onChange={(e) => setRecadoProximoOperador(e.target.value)}
                    placeholder="Ex: Caixa com problema para abrir gaveta, notas organizadas..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none resize-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Aparecerá em pop-up para o próximo funcionário que entrar no Caixa 0
                    {(caixaAlvoFechamento || caixaAtual)?.numeroCaixa || 1}.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFechamentoAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={fechando}
                  className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {fechando ? 'Processando...' : 'Confirmar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ABERTURA DE CAIXA MODAL */}
      {modalAberturaAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-cyan-100 text-cyan-800">
                  <Vault className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Syne']">
                    Abertura de Turno de Caixa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecione o caixa em que você vai trabalhar e informe o fundo inicial
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalAberturaAberto(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAbrirCaixa} className="space-y-4">
              {/* Escolha do Caixa com indicação se já está aberto */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-2">
                  Selecione o Caixa *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map((num) => {
                    const ativo = abrirNumeroCaixa === num;
                    const ocupadoPor = caixasAbertos.find((c) => (c.numeroCaixa || 1) === num);
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={Boolean(ocupadoPor)}
                        onClick={() => setAbrirNumeroCaixa(num)}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                          ativo
                            ? 'bg-cyan-600 border-cyan-600 text-white shadow-xs'
                            : ocupadoPor
                            ? 'bg-amber-50 border-amber-300 text-amber-900'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono font-bold text-sm">
                          <span>Caixa 0{num}</span>
                          {ativo && !ocupadoPor && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <p
                          className={`text-[10px] font-mono mt-1 ${
                            ativo
                              ? 'text-cyan-100'
                              : ocupadoPor
                              ? 'text-amber-800 font-bold'
                              : 'text-emerald-700 font-semibold'
                          }`}
                        >
                          {ocupadoPor
                            ? `Aberto por ${ocupadoPor.usuario?.nome || ocupadoPor.usuarioNome}`
                            : '● Livre para abertura'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recado específico do caixa selecionado se houver */}
              {carregandoRecadoAbertura ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center animate-pulse">
                  Verificando avisos do turno anterior para Caixa 0{abrirNumeroCaixa}...
                </div>
              ) : recadoAbertura?.mensagem ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Aviso do Turno Anterior (Caixa 0{abrirNumeroCaixa}):</span>
                  </div>
                  <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
                    {recadoAbertura.mensagem}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Deixado por <strong>{recadoAbertura.usuarioNome}</strong> em{' '}
                    {new Date(recadoAbertura.criadoEm).toLocaleString('pt-BR')}
                  </p>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Fundo de Troco Inicial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={abrirValorInicial}
                  onChange={(e) => setAbrirValorInicial(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2.5 rounded-lg text-lg font-mono outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberturaAberto(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    abrindoTurno ||
                    caixasAbertos.some((c) => (c.numeroCaixa || 1) === abrirNumeroCaixa)
                  }
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
                >
                  {abrindoTurno ? 'Abrindo...' : `Abrir Caixa 0${abrirNumeroCaixa}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
