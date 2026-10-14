# ERP Mercadinho — escopo

## Objetivo

Centralizar o controle de produtos, estoque, vendas, caixa, compras e financeiro de um único mercadinho por meio de uma API REST.

## Perfis

ADMIN: administra usuários, catálogo, compras, estoque, financeiro, configurações, cancelamento de vendas e descontos. Pode consultar e operar caixas de outros usuários.

FUNCIONARIO: login, consulta de produtos/categorias/clientes/fornecedores/configurações, cadastro e edição de clientes, próprio caixa, venda sem desconto, consulta das próprias vendas e movimentações de estoque. Não vê dashboard financeiro nem lista de usuários. Consulta de estoque inclui custos; ocultação de custos por perfil fica como possível evolução.

## Regras principais

- Um caixa aberto por operador; o caixa representa uma sessão, não um terminal físico.
- Produtos começam com saldo zero. Entrada inicial deve criar uma movimentação.
- Saldo materializado em Produto e histórico de movimentações atualizados na mesma transação.
- AJUSTE recebe a quantidade física contada (inclusive zero). O histórico registra a diferença com sinal; ENTRADA/SAIDA usam quantidade positiva.
- UN/CX/PCT exigem quantidade inteira; KG/L permitem até três casas.
- Dinheiro/custos/preços são Decimal no PostgreSQL e nos cálculos do servidor. A API envia números para compatibilidade com o front, com limites de entrada definidos nos DTOs.
- Venda é criada já concluída. Carrinho em andamento é do front; não há rota para salvar rascunho de venda.
- O preço do cadastro é aplicado ao finalizar a venda; o preço exibido anteriormente no carrinho pode ter mudado. O front deve atualizar a tela com o retorno da API e tratar divergências.
- Itens guardam nome, SKU, preço e custo da época da venda. Subtotal de cada item arredondado para duas casas; total é soma dos subtotais menos desconto.
- Pagamentos divididos somam exatamente o total líquido. A confirmação é interna, não confirmação bancária.
- Cada venda lógica deve possuir uma chave de idempotência única, de 8 a 100 caracteres; recomenda-se UUID. A mesma chave é reutilizada em uma repetição da requisição após falha de rede. Dados diferentes com a mesma chave geram conflito.
- Transações serializáveis com até quatro tentativas em conflitos de escrita. Baixa de estoque exige saldo suficiente e evita estoque negativo.
- Cancelamento exige ADMIN e caixa ainda aberto. Cancela receitas/comprovante/pagamentos e devolve estoque uma única vez. Dinheiro do caixa deve cobrir o estorno.
- Fechamento compara somente dinheiro físico: fundo inicial + vendas em DINHEIRO + reforços − sangrias. Pix e cartões não compõem a gaveta.
- Recebimento da compra é integral, uma única vez; atualiza preço de custo para o último custo recebido e gera despesa pendente. Não implementa custo médio ou recebimento parcial.
- Pedido pendente pode ser cancelado. Devolução de compra já recebida fica fora desta versão.
- Financeiro é um controle interno; pagar uma despesa não retira dinheiro da gaveta automaticamente. Se a despesa for paga com dinheiro da gaveta, registre sangria separadamente para conferência de caixa.
- Produtos com histórico não são excluídos. PUT atualiza cadastro completo; PATCH específico inativa produto ou altera usuário.
- CPF/CNPJ devem ser enviados só com dígitos; validação de tamanho, sem cálculo de dígitos verificadores.
- Cliente pode estar ausente na venda. Limite de crédito é campo cadastral: fiado não foi implementado, saldoDevedor é zero e totalComprado é calculado pelas vendas concluídas.
- Configuração única da empresa. Documento interno e configuração de NFCe ficam somente em simulação/homologação.

## Entidades (18 tabelas)

Usuario, Categoria, Produto, Fornecedor, ProdutoFornecedor, Cliente, Caixa, OperacaoCaixa, Venda, ItemVenda, Pagamento, PedidoCompra, ItemPedidoCompra, MovimentacaoEstoque, LancamentoFinanceiro, DocumentoFiscal, ConciliacaoFinanceira e ConfiguracaoEmpresa.


## Fora do escopo

Emissão fiscal real, pagamento Pix/cartão integrado, conciliação bancária real, multiempresa, filiais, permissões por campo, terminal físico, fiado, contas parceladas, recuperação de senha por e-mail, refresh token, upload de imagens, impressão física automática, devolução de compra recebida, devolução parcial de venda, venda a preço negociado, migração automática dos dados de demonstração do frontend.

## Critérios de aceite

Login bloqueia usuário inativo; funcionário não acessa administração; estoque inicial tem histórico; venda reduz saldo e gera receita/comprovante; falha não deixa venda parcial; duas vendas não consomem o mesmo último item; repetição não duplica venda/recebimento; cancelamento devolve saldo; sangria não supera dinheiro disponível; fechamento registra divergência; front consegue integrar rotas autenticadas.
