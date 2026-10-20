import React, { useState, useEffect } from 'react';
import {
  Users,
  Truck,
  Tags,
  Shield,
  Building,
  Plus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Cliente, Fornecedor, Categoria, Usuario, ConfiguracaoEmpresa } from '../types';

export const CadastrosView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const isAdmin = user?.perfil === 'ADMIN';

  const [abaAtiva, setAbaAtiva] = useState<
    'clientes' | 'fornecedores' | 'categorias' | 'usuarios' | 'empresa'
  >('clientes');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresa, setEmpresa] = useState<ConfiguracaoEmpresa | null>(null);

  // Modal State
  const [modalCliente, setModalCliente] = useState(false);
  const [cliNome, setCliNome] = useState('');
  const [cliCpf, setCliCpf] = useState('');
  const [cliTel, setCliTel] = useState('');

  const [modalFornecedor, setModalFornecedor] = useState(false);
  const [fornRazao, setFornRazao] = useState('');
  const [fornFantasia, setFornFantasia] = useState('');
  const [fornCnpj, setFornCnpj] = useState('');
  const [fornTel, setFornTel] = useState('');

  const [modalCategoria, setModalCategoria] = useState(false);
  const [catNome, setCatNome] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [modalUsuario, setModalUsuario] = useState(false);
  const [usrNome, setUsrNome] = useState('');
  const [usrEmail, setUsrEmail] = useState('');
  const [usrSenha, setUsrSenha] = useState('');
  const [usrPerfil, setUsrPerfil] = useState<'ADMIN' | 'FUNCIONARIO'>('FUNCIONARIO');

  const [salvando, setSalvando] = useState(false);

  const carregarDados = async () => {
    try {
      const [cliRes, fornRes, catRes] = await Promise.all([
        api.getClientes(),
        api.getFornecedores(),
        api.getCategorias(),
      ]);
      setClientes(cliRes);
      setFornecedores(fornRes);
      setCategorias(catRes);

      if (isAdmin) {
        try {
          const usrRes = await api.getUsuarios();
          setUsuarios(usrRes);
        } catch {}
      }

      try {
        const empRes = await api.getConfiguracoes();
        if (empRes) {
          setEmpresa({
            id: empRes.id ?? 1,
            razaoSocial: empRes.razaoSocial ?? '',
            nomeFantasia: empRes.nomeFantasia ?? '',
            cnpj: empRes.cnpj ?? '',
            inscricaoEstadual: empRes.inscricaoEstadual ?? '',
            telefone: empRes.telefone ?? '',
            email: empRes.email ?? '',
            endereco: empRes.endereco ?? '',
            cidade: empRes.cidade ?? '',
            ambienteNFCe: empRes.ambienteNFCe ?? 'HOMOLOGACAO',
            impressoraPadrao: empRes.impressoraPadrao ?? '',
          });
        }
      } catch {}
    } catch (err: any) {
      error('Erro ao listar cadastros', err.message);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Handlers
  const handleToggleUsuarioAtivo = async (u: Usuario, novoStatus: boolean) => {
    try {
      setSalvando(true);
      await api.updateUsuario(u.id, { ativo: novoStatus });
      success(`Usuário ${u.nome} foi ${novoStatus ? 'reativado' : 'desativado'} com sucesso!`);
      await carregarDados();
    } catch (err: any) {
      error('Erro ao atualizar usuário', err.message);
    } finally {
      setSalvando(false);
    }
  };
  const handleCriarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await api.createCliente({
        nome: cliNome,
        cpfCnpj: cliCpf || undefined,
        telefone: cliTel || undefined,
        ativo: true,
      });
      success('Cliente cadastrado!');
      setModalCliente(false);
      setCliNome('');
      setCliCpf('');
      setCliTel('');
      carregarDados();
    } catch (err: any) {
      error('Erro ao cadastrar cliente', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await api.createFornecedor({
        razaoSocial: fornRazao,
        nomeFantasia: fornFantasia || undefined,
        cnpj: fornCnpj || undefined,
        telefone: fornTel || undefined,
        ativo: true,
      });
      success('Fornecedor cadastrado!');
      setModalFornecedor(false);
      setFornRazao('');
      setFornFantasia('');
      setFornCnpj('');
      setFornTel('');
      carregarDados();
    } catch (err: any) {
      error('Erro ao cadastrar fornecedor', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await api.createCategoria({
        nome: catNome,
        descricao: catDesc || undefined,
        ativo: true,
      });
      success('Categoria cadastrada!');
      setModalCategoria(false);
      setCatNome('');
      setCatDesc('');
      carregarDados();
    } catch (err: any) {
      error('Erro ao cadastrar categoria', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      await api.createUsuario({
        nome: usrNome,
        email: usrEmail,
        senha: usrSenha,
        perfil: usrPerfil,
        ativo: true,
      });
      success('Usuário cadastrado com sucesso!');
      setModalUsuario(false);
      setUsrNome('');
      setUsrEmail('');
      setUsrSenha('');
      carregarDados();
    } catch (err: any) {
      error('Erro ao cadastrar usuário', err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresa) return;

    try {
      setSalvando(true);
      await api.updateConfiguracoes(empresa);
      success('Configurações da empresa salvas!');
    } catch (err: any) {
      error('Erro ao salvar empresa', err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Subtabs selector */}
      <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'clientes', label: 'Clientes', icon: Users },
            { id: 'fornecedores', label: 'Fornecedores', icon: Truck },
            { id: 'categorias', label: 'Categorias', icon: Tags },
            ...(isAdmin ? [{ id: 'usuarios', label: 'Usuários', icon: Shield }] : []),
            { id: 'empresa', label: 'Empresa', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = abaAtiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAbaAtiva(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* New item trigger button */}
        {abaAtiva === 'clientes' && (
          <button
            onClick={() => setModalCliente(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cliente</span>
          </button>
        )}
        {abaAtiva === 'fornecedores' && isAdmin && (
          <button
            onClick={() => setModalFornecedor(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Fornecedor</span>
          </button>
        )}
        {abaAtiva === 'categorias' && isAdmin && (
          <button
            onClick={() => setModalCategoria(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Categoria</span>
          </button>
        )}
        {abaAtiva === 'usuarios' && isAdmin && (
          <button
            onClick={() => setModalUsuario(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* ABA CLIENTES */}
      {abaAtiva === 'clientes' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">NOME</th>
                <th className="py-3 px-3">CPF / CNPJ</th>
                <th className="py-3 px-3">TELEFONE</th>
                <th className="py-3 px-3">TOTAL COMPRADO</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{c.nome}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{c.cpfCnpj || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{c.telefone || '-'}</td>
                    <td className="py-3 px-3 font-mono text-amber-700 font-bold">
                      R$ {Number(c.totalComprado || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA FORNECEDORES */}
      {abaAtiva === 'fornecedores' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">RAZÃO SOCIAL</th>
                <th className="py-3 px-3">NOME FANTASIA</th>
                <th className="py-3 px-3">CNPJ</th>
                <th className="py-3 px-3">TELEFONE</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fornecedores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              ) : (
                fornecedores.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{f.razaoSocial}</td>
                    <td className="py-3 px-3 text-slate-600">{f.nomeFantasia || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{f.cnpj || '-'}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{f.telefone || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {f.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA CATEGORIAS */}
      {abaAtiva === 'categorias' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">NOME DA CATEGORIA</th>
                <th className="py-3 px-3">DESCRIÇÃO</th>
                <th className="py-3 px-3 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              ) : (
                categorias.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">{c.nome}</td>
                    <td className="py-3 px-3 text-slate-600">{c.descricao || '-'}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {c.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA USUÁRIOS */}
      {abaAtiva === 'usuarios' && isAdmin && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">NOME</th>
                <th className="py-3 px-3">E-MAIL</th>
                <th className="py-3 px-3">PERFIL</th>
                <th className="py-3 px-3">STATUS</th>
                <th className="py-3 px-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => {
                const isCurrentUser = u.id === user?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900">
                      {u.nome}
                      {isCurrentUser && (
                        <span className="ml-2 text-[10px] text-cyan-700 font-mono font-normal">
                          (Você)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{u.email}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          u.perfil === 'ADMIN'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                        }`}
                      >
                        {u.perfil}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                          u.ativo
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isCurrentUser ? (
                        <span className="text-[11px] font-mono text-slate-400">
                          Conta em uso
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleUsuarioAtivo(u, !u.ativo)}
                          disabled={salvando}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                            u.ativo
                              ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          {u.ativo ? 'Desativar' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ABA EMPRESA */}
      {abaAtiva === 'empresa' && empresa && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs max-w-2xl">
          <h3 className="text-base font-bold text-slate-900 font-['Syne'] mb-4">
            Dados da Empresa & Emissão
          </h3>
          <form onSubmit={handleSalvarEmpresa} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  required
                  value={empresa.razaoSocial}
                  onChange={(e) => setEmpresa({ ...empresa, razaoSocial: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={empresa.nomeFantasia}
                  onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  CNPJ (somente números)
                </label>
                <input
                  type="text"
                  value={empresa.cnpj}
                  maxLength={14}
                  onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value.replace(/\D/g, '') })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono font-medium"
                  placeholder="00000000000000"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={empresa.inscricaoEstadual}
                  maxLength={30}
                  onChange={(e) => setEmpresa({ ...empresa, inscricaoEstadual: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono font-medium"
                  placeholder="Isento ou nº da IE"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  value={empresa.telefone}
                  maxLength={30}
                  onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={empresa.email}
                  maxLength={254}
                  onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                  placeholder="contato@empresa.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={empresa.endereco}
                  maxLength={500}
                  onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={empresa.cidade}
                  maxLength={100}
                  onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-medium"
                  placeholder="Nome da Cidade - UF"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={salvando}
                className="py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer disabled:opacity-50"
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      {modalCliente && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">Novo Cliente</h3>
              <button onClick={() => setModalCliente(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarCliente} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={cliNome}
                  onChange={(e) => setCliNome(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">CPF / CNPJ</label>
                  <input
                    type="text"
                    value={cliCpf}
                    onChange={(e) => setCliCpf(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={cliTel}
                    onChange={(e) => setCliTel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCliente(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE FORNECEDOR MODAL */}
      {modalFornecedor && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">Novo Fornecedor</h3>
              <button onClick={() => setModalFornecedor(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarFornecedor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Razão Social *</label>
                <input
                  type="text"
                  value={fornRazao}
                  onChange={(e) => setFornRazao(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Nome Fantasia</label>
                <input
                  type="text"
                  value={fornFantasia}
                  onChange={(e) => setFornFantasia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={fornCnpj}
                    onChange={(e) => setFornCnpj(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={fornTel}
                    onChange={(e) => setFornTel(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalFornecedor(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CATEGORIA MODAL */}
      {modalCategoria && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">Nova Categoria</h3>
              <button onClick={() => setModalCategoria(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarCategoria} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  value={catNome}
                  onChange={(e) => setCatNome(e.target.value)}
                  placeholder="Ex: Mercearia, Bebidas, Laticínios"
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Ex: Alimentos não perecíveis"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalCategoria(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USUARIO MODAL */}
      {modalUsuario && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base font-bold text-slate-900 font-['Syne']">Novo Usuário do Sistema</h3>
              <button onClick={() => setModalUsuario(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCriarUsuario} className="space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={usrNome}
                  onChange={(e) => setUsrNome(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={usrEmail}
                  onChange={(e) => setUsrEmail(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Senha *</label>
                  <input
                    type="password"
                    value={usrSenha}
                    onChange={(e) => setUsrSenha(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-700 mb-1">Perfil</label>
                  <select
                    value={usrPerfil}
                    onChange={(e) => setUsrPerfil(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-cyan-600 focus:bg-white text-slate-900 px-3 py-2 rounded-lg text-xs outline-none font-bold"
                  >
                    <option value="FUNCIONARIO">FUNCIONÁRIO</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalUsuario(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-300 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs cursor-pointer"
                >
                  {salvando ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
