# Rotas da API

Base local: `http://localhost:3000/api`. Todas as rotas, exceto health e login, exigem `Authorization: Bearer TOKEN`. POST retorna 201; GET/PUT/PATCH retorna 200. IDs são UUIDs.

| Método | Rota | Função | Permissão |
| --- | --- | --- | --- |
| GET | `/health` | Verificar API | Público |
| POST | `/auth/login` | Login | Público |
| GET | `/auth/me` | Usuário atual | Autenticado |
| GET | `/categorias` | Listar Categorias | Autenticado |
| POST | `/categorias` | Criar Categorias | ADMIN |
| PUT | `/categorias/:categoriaId` | Atualizar Categorias | ADMIN |
| GET | `/produtos` | Listar Produtos | Autenticado |
| POST | `/produtos` | Criar Produtos | ADMIN |
| PUT | `/produtos/:produtoId` | Atualizar Produtos | ADMIN |
| GET | `/fornecedores` | Listar Fornecedores | Autenticado |
| POST | `/fornecedores` | Criar Fornecedores | ADMIN |
| PUT | `/fornecedores/:fornecedorId` | Atualizar Fornecedores | ADMIN |
| GET | `/clientes` | Listar Clientes | Autenticado |
| POST | `/clientes` | Criar Clientes | Autenticado |
| PUT | `/clientes/:clienteId` | Atualizar Clientes | Autenticado |
| GET | `/produtos/:produtoId` | Detalhar produto | Autenticado |
| PATCH | `/produtos/:produtoId/inativar` | Inativar produto | ADMIN |
| POST | `/produtos/:produtoId/fornecedores` | Vincular fornecedor adicional | ADMIN |
| GET | `/usuarios` | Listar usuários | ADMIN |
| POST | `/usuarios` | Criar usuário | ADMIN |
| PATCH | `/usuarios/:usuarioId` | Editar usuário | ADMIN |
| GET | `/configuracoes` | Configuração da empresa | Autenticado |
| PUT | `/configuracoes` | Atualizar empresa | ADMIN |
| GET | `/estoque/movimentacoes` | Histórico de estoque | Autenticado |
| POST | `/estoque/movimentacoes` | Entrada inicial | ADMIN |
| GET | `/caixas` | Listar caixas | ADMIN ou próprio |
| GET | `/caixas/atual` | Caixa atual | Autenticado |
| GET | `/caixas/:caixaId` | Detalhar caixa e saldo | ADMIN ou próprio |
| POST | `/caixas/abrir` | Abrir caixa | Autenticado |
| POST | `/caixas/:caixaId/operacoes` | Sangria/reforço | ADMIN ou próprio |
| POST | `/caixas/:caixaId/fechar` | Fechar caixa | ADMIN ou próprio |
| GET | `/vendas` | Listar vendas | ADMIN ou próprias |
| GET | `/vendas/:vendaId` | Detalhar venda | ADMIN ou própria |
| POST | `/vendas` | Finalizar venda | Autenticado |
| POST | `/vendas/:vendaId/cancelar` | Cancelar venda | ADMIN |
| GET | `/compras` | Listar compras | ADMIN |
| GET | `/compras/:compraId` | Detalhar compra | ADMIN |
| POST | `/compras` | Criar pedido de compra | ADMIN |
| POST | `/compras/:compraId/receber` | Receber compra | ADMIN |
| POST | `/compras/:compraId/cancelar` | Cancelar compra pendente | ADMIN |
| GET | `/financeiro` | Listar lançamentos | ADMIN |
| POST | `/financeiro` | Criar lançamento manual | ADMIN |
| POST | `/financeiro/:lancamentoId/pagar` | Marcar lançamento como pago | ADMIN |
| POST | `/financeiro/:lancamentoId/cancelar` | Cancelar lançamento manual pendente | ADMIN |
| GET | `/conciliacoes` | Listar conferências do caixa | ADMIN |
| GET | `/dashboard` | Indicadores | ADMIN |

## Corpos das requisições

Os exemplos abaixo usam variáveis da coleção. No JSON enviado à API, substitua os placeholders pelos IDs reais. PUT espera o cadastro completo; apenas PATCH de usuários aceita campos parciais.

### POST /auth/login

```json
{
  "email": "{{email}}",
  "senha": "{{senha}}"
}
```

### POST /categorias

```json
{
  "nome": "Mercearia",
  "descricao": "Produtos de mercearia",
  "ativo": true
}
```

### PUT /categorias/{{categoriaId}}

```json
{
  "nome": "Mercearia",
  "descricao": "Produtos de mercearia",
  "ativo": true
}
```

### POST /produtos

```json
{
  "categoriaId": "{{categoriaId}}",
  "nome": "Arroz 1kg",
  "sku": "ARROZ-001",
  "codigoBarras": "7891234567890",
  "unidade": "UN",
  "precoCusto": 3,
  "precoVenda": 5,
  "estoqueMinimo": 3,
  "ativo": true
}
```

### PUT /produtos/{{produtoId}}

```json
{
  "categoriaId": "{{categoriaId}}",
  "nome": "Arroz 1kg",
  "sku": "ARROZ-001",
  "codigoBarras": "7891234567890",
  "unidade": "UN",
  "precoCusto": 3,
  "precoVenda": 5,
  "estoqueMinimo": 3,
  "ativo": true
}
```

### POST /fornecedores

```json
{
  "razaoSocial": "Fornecedor exemplo LTDA",
  "nomeFantasia": "Fornecedor exemplo",
  "cnpj": "12345678000199",
  "telefone": "(53) 99999-9999",
  "email": "fornecedor@example.com",
  "ativo": true
}
```

### PUT /fornecedores/{{fornecedorId}}

```json
{
  "razaoSocial": "Fornecedor exemplo LTDA",
  "nomeFantasia": "Fornecedor exemplo",
  "cnpj": "12345678000199",
  "telefone": "(53) 99999-9999",
  "email": "fornecedor@example.com",
  "ativo": true
}
```

### POST /clientes

```json
{
  "nome": "Cliente exemplo",
  "cpfCnpj": "12345678901",
  "telefone": "(53) 99999-9999",
  "email": "cliente@example.com",
  "endereco": "Pelotas",
  "limiteCredito": 0,
  "ativo": true
}
```

### PUT /clientes/{{clienteId}}

```json
{
  "nome": "Cliente exemplo",
  "cpfCnpj": "12345678901",
  "telefone": "(53) 99999-9999",
  "email": "cliente@example.com",
  "endereco": "Pelotas",
  "limiteCredito": 0,
  "ativo": true
}
```

### POST /produtos/{{produtoId}}/fornecedores

```json
{
  "fornecedorId": "{{fornecedorId}}",
  "codigoFornecedor": "AR-01",
  "ultimoCusto": 3
}
```

### POST /usuarios

```json
{
  "nome": "Operador",
  "email": "operador@example.com",
  "senha": "Troque-esta-senha-123",
  "perfil": "FUNCIONARIO",
  "ativo": true
}
```

### PATCH /usuarios/{{usuarioId}}

```json
{
  "nome": "Operador atualizado",
  "ativo": true
}
```

### PUT /configuracoes

```json
{
  "razaoSocial": "Mercadinho LTDA",
  "nomeFantasia": "Mercadinho",
  "cnpj": "12345678000199",
  "inscricaoEstadual": "",
  "telefone": "",
  "email": "",
  "endereco": "",
  "cidade": "Pelotas",
  "ambienteNFCe": "HOMOLOGACAO",
  "impressoraPadrao": ""
}
```

### POST /estoque/movimentacoes

```json
{
  "produtoId": "{{produtoId}}",
  "tipo": "ENTRADA",
  "quantidade": 10,
  "observacao": "Saldo inicial"
}
```

### POST /caixas/abrir

```json
{
  "valorInicial": 100
}
```

### POST /caixas/{{caixaId}}/operacoes

```json
{
  "tipo": "SANGRIA",
  "valor": 10,
  "observacao": "Retirada para cofre"
}
```

### POST /caixas/{{caixaId}}/fechar

```json
{
  "valorFinal": 100,
  "observacao": "Conferência de fechamento"
}
```

### POST /vendas

```json
{
  "caixaId": "{{caixaId}}",
  "chaveIdempotencia": "{{chaveVenda}}",
  "itens": [
    {
      "produtoId": "{{produtoId}}",
      "quantidade": 1
    }
  ],
  "pagamentos": [
    {
      "forma": "DINHEIRO",
      "valor": 5
    }
  ],
  "desconto": 0
}
```

### POST /vendas/{{vendaId}}/cancelar

```json
{
  "motivo": "Venda registrada por engano"
}
```

### POST /compras

```json
{
  "fornecedorId": "{{fornecedorId}}",
  "numeroNota": "123",
  "itens": [
    {
      "produtoId": "{{produtoId}}",
      "quantidade": 5,
      "custoUnitario": 3
    }
  ]
}
```

### POST /financeiro

```json
{
  "tipo": "DESPESA",
  "descricao": "Conta de energia",
  "valor": 150,
  "vencimento": "2026-12-01T03:00:00.000Z"
}
```

## Respostas e erros

Listagens retornam arrays. GET /caixas/atual pode retornar null. O detalhe da venda inclui itens, pagamentos, usuário, cliente e documentoFiscal. Fechamento retorna a conciliação. Dashboard retorna vendasHoje, receitaHoje, lucroBrutoHoje, produtosAtivos, estoqueBaixo, receitas e despesas.

`400`: validação/regra de negócio; `401`: token ausente/inválido ou credenciais inválidas; `403`: permissão; `404`: ID inexistente; `409`: duplicidade/conflito; `429`: limite de requisições; `500`: falha interna sem detalhes sensíveis.

```json
{"statusCode": 400, "message": "Estoque insuficiente: Arroz 1kg"}
```

Listagens aceitam pagina e limite. Busca funciona em /produtos, /categorias, /clientes e /fornecedores. /estoque/movimentacoes aceita produtoId. Campos de busca sem efeito em outras rotas não filtram a listagem.
