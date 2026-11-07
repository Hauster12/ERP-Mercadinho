
## Passos

1. No projeto front, configure `.env.local` com `VITE_API_URL=http://localhost:3000/api`.
2. Copie `frontend/api.ts` deste pacote para `src/services/api.ts` no front.
3. No LoginView, chame `api.login(email, senha)`. O usuário deve vir da resposta da API; o seletor de usuário dos mocks não substitui autenticação.
4. Troque funções síncronas do storageService por chamadas `await` e estados React. Carregue dados em useEffect e trate carregamento, erro e sucesso.
5. Passe token em todas as chamadas. O cliente de referência persiste a sessão e usa IndexedDB apenas para os dados necessários ao PDV offline e para sua fila de vendas; o servidor continua sendo a fonte oficial dos demais dados.
6. Ao receber 401, limpe a sessão online. Em 403, mostre falta de permissão. Erros de validação e conflito não devem ser simulados como sucesso: vendas offline com conflito permanecem salvas para revisão.
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
- O PDV pode concluir vendas sem rede somente com um caixa previamente aberto e catálogo carregado neste terminal. A sincronização usa a chave de idempotência e confere o preço vigente no servidor; conflitos de preço, estoque, cliente ou caixa precisam de revisão.

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

Não use localStorage como banco de vendas. A fila offline do PDV fica no IndexedDB e é enviada à API quando a conexão retorna; os demais módulos continuam dependendo da API online.

## Operação offline do PDV

- A aplicação e o catálogo precisam ter sido carregados online neste navegador/dispositivo. O service worker mantém a interface disponível em recargas offline.
- Não é possível fazer login ou abrir um caixa novo sem internet. O operador precisa estar autenticado e o caixa deve estar aberto neste terminal.
- Vendas offline são persistidas localmente e sincronizadas automaticamente quando a conexão volta. Enquanto houver vendas pendentes ou em revisão, o fechamento do caixa é bloqueado.
- Diferenças no preço, estoque insuficiente, caixa fechado ou dados inválidos não são forçados no servidor: ficam em revisão e podem ser tentados novamente depois de corrigir a causa.
- IndexedDB é local ao navegador e ao dispositivo; outros terminais não veem a fila. Use HTTPS em produção (ou localhost durante desenvolvimento) para o service worker.
