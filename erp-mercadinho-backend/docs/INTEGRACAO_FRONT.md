
## Passos

1. No projeto front, configure `.env.local` com `VITE_API_URL=http://localhost:3000/api`.
2. Copie `frontend/api.ts` deste pacote para `src/services/api.ts` no front.
3. No LoginView, chame `api.login(email, senha)`. O usuário deve vir da resposta da API; o seletor de usuário dos mocks não substitui autenticação.
4. Troque funções síncronas do storageService por chamadas `await` e estados React. Carregue dados em useEffect e trate carregamento, erro e sucesso.
5. Passe token em todas as chamadas. O cliente de referência faz isso automaticamente. O exemplo mantém token em memória: ao atualizar a página, faça login novamente. Para persistir sessão de modo mais seguro em uma evolução, use cookies HttpOnly com proteção CSRF e ajuste de CORS.
6. Ao receber 401, limpe a sessao e volte ao login. Em 403, mostre falta de permissão. Em 400/409 mostre a mensagem da API sem simular sucesso local.
7. Não remova registros históricos no front. Para produto, chame a rota de inativação.
8. Não envie campos calculados, nomes de relacionamentos, saldo ou IDs dos mocks nas requisições. IDs de mock como `prod-001` não são UUIDs e não servem para a API. Cadastre novos dados para obter IDs reais.

## Mapeamento

| Storage atual | API |
| --- | --- |
| getCurrentUser | GET /auth/me após login |
| getUsuarios/saveUsuario | GET/POST /usuarios, PATCH /usuarios/:id |
| getCategorias | GET /categorias |
| getProdutos/saveProduto | GET/POST /produtos, PUT /produtos/:id |
| deleteProduto | PATCH /produtos/:id/inativar |
| getClientes/saveCliente | GET/POST /clientes, PUT /clientes/:id |
| getFornecedores/saveFornecedor | GET/POST /fornecedores, PUT /fornecedores/:id |
| getCaixa | GET /caixas/atual; pode retornar null |
| abrirCaixa | POST /caixas/abrir |
| registrarOperacaoCaixa | POST /caixas/:id/operacoes |
| fecharCaixa | POST /caixas/:id/fechar |
| getVendas/finalizarVenda | GET/POST /vendas |
| movimentações/inventário | GET/POST /estoque/movimentacoes |
| pedidos | GET/POST /compras e POST /compras/:id/receber |
| financeiro | GET/POST /financeiro e POST /financeiro/:id/pagar |
| configurações | GET/PUT /configuracoes |

## Diferenças a tratar

- Listagens retornam arrays paginados. Não assuma que a primeira página contém todos os produtos.
- Campos opcionais podem vir como null. Ajuste interfaces com `campo?: string | null`, ou normalize no cliente.
- Datas são ISO 8601; dinheiro/quantidade são números na resposta e Decimal no servidor.
- API devolve `categoriaNome`, `fornecedorNome`, `usuarioNome` e `clienteNome` quando os relacionamentos foram incluídos, além dos objetos relacionados.
- Cliente possui ativo; saldoDevedor é zero nesta versão, pois não há fiado. totalComprado é calculado na listagem.
- Usuário não recebe senha nem hash. Avatares são opcionais.
- Código de barras pode não existir. Não use fallback inventado na busca do PDV.
- AJUSTE envia contagem física, não diferença; documento fiscal SEM VALOR FISCAL retorna chaveAcesso null.
- O frontend permite produção de NFCe nos tipos, mas a API só permite HOMOLOGACAO. Remova a opção de produção da tela desta versão.
- Operação de fechamento retorna conciliação; recarregue o caixa depois.
- Permissões precisam refletir ADMIN/FUNCIONARIO. O servidor continua verificando mesmo se um botão for exibido indevidamente.

## Exemplo React

```tsx
const [produtos, setProdutos] = useState<Produto[]>([]);
const [erro, setErro] = useState('');
useEffect(() => {
  let active = true;
  api.request<Produto[]>('/produtos?limite=100')
    .then(rows => { if (active) setProdutos(rows); })
    .catch(e => { if (active) setErro(e.message); });
  return () => { active = false; };
}, []);
```

Não mantenha escrita em localStorage e escrita na API ao mesmo tempo para vendas/estoque: isso cria duas fontes de saldo. Atualize estado com a resposta do servidor.
