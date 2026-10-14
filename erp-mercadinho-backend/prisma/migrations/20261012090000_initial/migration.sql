-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('UN', 'KG', 'L', 'CX', 'PCT');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "MovementOrigin" AS ENUM ('VENDA', 'COMPRA', 'INVENTARIO_MANUAL', 'DEVOLUCAO', 'PERDA');

-- CreateEnum
CREATE TYPE "CashStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "CashOperationType" AS ENUM ('SANGRIA', 'REFORCO', 'ABERTURA', 'FECHAMENTO');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('CONCLUIDA', 'CANCELADA', 'EM_ANDAMENTO');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'PIX');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDENTE', 'RECEBIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FinancialType" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PAGO', 'PENDENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "FiscalType" AS ENUM ('COMPROVANTE', 'NFCe', 'NFe');

-- CreateEnum
CREATE TYPE "FiscalStatus" AS ENUM ('SIMULADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('CONCILIADO', 'DIVERGENTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" "UserRole" NOT NULL DEFAULT 'FUNCIONARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "categoriaId" UUID NOT NULL,
    "fornecedorId" UUID,
    "nome" VARCHAR(150) NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "codigoBarras" VARCHAR(40),
    "unidade" "Unit" NOT NULL DEFAULT 'UN',
    "precoCusto" DECIMAL(14,2) NOT NULL,
    "precoVenda" DECIMAL(14,2) NOT NULL,
    "estoqueMinimo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "estoqueAtual" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "imagemUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" UUID NOT NULL,
    "razaoSocial" VARCHAR(150) NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" VARCHAR(14),
    "telefone" TEXT,
    "email" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produto_fornecedor" (
    "id" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "fornecedorId" UUID NOT NULL,
    "codigoFornecedor" TEXT,
    "ultimoCusto" DECIMAL(14,2),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produto_fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "cpfCnpj" VARCHAR(14),
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "limiteCredito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixas" (
    "id" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "valorInicial" DECIMAL(14,2) NOT NULL,
    "valorFinal" DECIMAL(14,2),
    "abertoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechadoEm" TIMESTAMP(3),
    "status" "CashStatus" NOT NULL DEFAULT 'ABERTO',

    CONSTRAINT "caixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operacoes_caixa" (
    "id" UUID NOT NULL,
    "caixaId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tipo" "CashOperationType" NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operacoes_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" UUID NOT NULL,
    "caixaId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "clienteId" UUID,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'CONCLUIDA',
    "chaveIdempotencia" VARCHAR(100) NOT NULL,
    "motivoCancelamento" TEXT,
    "canceladoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" UUID NOT NULL,
    "vendaId" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "produtoNome" TEXT NOT NULL,
    "produtoSku" TEXT NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "precoUnitario" DECIMAL(14,2) NOT NULL,
    "custoUnitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "itens_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" UUID NOT NULL,
    "vendaId" UUID NOT NULL,
    "forma" "PaymentMethod" NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT true,
    "referenciaExterna" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_compra" (
    "id" UUID NOT NULL,
    "fornecedorId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "numero" TEXT NOT NULL,
    "numeroNota" TEXT,
    "valorTotal" DECIMAL(14,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recebidoEm" TIMESTAMP(3),
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_pedido_compra" (
    "id" UUID NOT NULL,
    "pedidoCompraId" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "produtoNome" TEXT NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "custoUnitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "itens_pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentacoes_estoque" (
    "id" UUID NOT NULL,
    "produtoId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "itemVendaId" UUID,
    "itemPedidoCompraId" UUID,
    "tipo" "MovementType" NOT NULL,
    "origem" "MovementOrigin" NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "custoUnitario" DECIMAL(14,2),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lancamentos_financeiros" (
    "id" UUID NOT NULL,
    "vendaId" UUID,
    "pedidoCompraId" UUID,
    "caixaId" UUID,
    "tipo" "FinancialType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagamentoEm" TIMESTAMP(3),
    "status" "FinancialStatus" NOT NULL DEFAULT 'PENDENTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lancamentos_financeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_fiscais" (
    "id" UUID NOT NULL,
    "vendaId" UUID NOT NULL,
    "tipo" "FiscalType" NOT NULL DEFAULT 'COMPROVANTE',
    "status" "FiscalStatus" NOT NULL DEFAULT 'SIMULADO',
    "numero" TEXT NOT NULL,
    "chaveAcesso" TEXT,
    "mensagem" TEXT NOT NULL DEFAULT 'Comprovante interno sem valor fiscal',
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliacoes_financeiras" (
    "id" UUID NOT NULL,
    "caixaId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "periodoInicio" TIMESTAMP(3) NOT NULL,
    "periodoFim" TIMESTAMP(3) NOT NULL,
    "valorSistema" DECIMAL(14,2) NOT NULL,
    "valorInformado" DECIMAL(14,2) NOT NULL,
    "diferenca" DECIMAL(14,2) NOT NULL,
    "status" "ReconciliationStatus" NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliacoes_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracao_empresa" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "razaoSocial" TEXT NOT NULL DEFAULT '',
    "nomeFantasia" TEXT NOT NULL DEFAULT '',
    "cnpj" TEXT NOT NULL DEFAULT '',
    "inscricaoEstadual" TEXT NOT NULL DEFAULT '',
    "telefone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "endereco" TEXT NOT NULL DEFAULT '',
    "cidade" TEXT NOT NULL DEFAULT '',
    "ambienteNFCe" TEXT NOT NULL DEFAULT 'HOMOLOGACAO',
    "impressoraPadrao" TEXT NOT NULL DEFAULT '',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracao_empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigoBarras_key" ON "produtos"("codigoBarras");

-- CreateIndex
CREATE INDEX "produtos_categoriaId_idx" ON "produtos"("categoriaId");

-- CreateIndex
CREATE INDEX "produtos_fornecedorId_idx" ON "produtos"("fornecedorId");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "fornecedores"("cnpj");

-- CreateIndex
CREATE INDEX "produto_fornecedor_fornecedorId_idx" ON "produto_fornecedor"("fornecedorId");

-- CreateIndex
CREATE UNIQUE INDEX "produto_fornecedor_produtoId_fornecedorId_key" ON "produto_fornecedor"("produtoId", "fornecedorId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpfCnpj_key" ON "clientes"("cpfCnpj");

-- CreateIndex
CREATE INDEX "caixas_usuarioId_status_idx" ON "caixas"("usuarioId", "status");

-- CreateIndex
CREATE INDEX "operacoes_caixa_caixaId_criadoEm_idx" ON "operacoes_caixa"("caixaId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "vendas_chaveIdempotencia_key" ON "vendas"("chaveIdempotencia");

-- CreateIndex
CREATE INDEX "vendas_caixaId_status_idx" ON "vendas"("caixaId", "status");

-- CreateIndex
CREATE INDEX "vendas_clienteId_idx" ON "vendas"("clienteId");

-- CreateIndex
CREATE INDEX "vendas_criadoEm_idx" ON "vendas"("criadoEm");

-- CreateIndex
CREATE INDEX "itens_venda_produtoId_idx" ON "itens_venda"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_venda_vendaId_produtoId_key" ON "itens_venda"("vendaId", "produtoId");

-- CreateIndex
CREATE INDEX "pagamentos_vendaId_idx" ON "pagamentos"("vendaId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_compra_numero_key" ON "pedidos_compra"("numero");

-- CreateIndex
CREATE INDEX "pedidos_compra_fornecedorId_idx" ON "pedidos_compra"("fornecedorId");

-- CreateIndex
CREATE INDEX "itens_pedido_compra_produtoId_idx" ON "itens_pedido_compra"("produtoId");

-- CreateIndex
CREATE UNIQUE INDEX "itens_pedido_compra_pedidoCompraId_produtoId_key" ON "itens_pedido_compra"("pedidoCompraId", "produtoId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_produtoId_criadoEm_idx" ON "movimentacoes_estoque"("produtoId", "criadoEm");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_usuarioId_idx" ON "movimentacoes_estoque"("usuarioId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_itemVendaId_idx" ON "movimentacoes_estoque"("itemVendaId");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_itemPedidoCompraId_idx" ON "movimentacoes_estoque"("itemPedidoCompraId");

-- CreateIndex
CREATE INDEX "lancamentos_financeiros_vendaId_idx" ON "lancamentos_financeiros"("vendaId");

-- CreateIndex
CREATE INDEX "lancamentos_financeiros_pedidoCompraId_idx" ON "lancamentos_financeiros"("pedidoCompraId");

-- CreateIndex
CREATE INDEX "lancamentos_financeiros_caixaId_idx" ON "lancamentos_financeiros"("caixaId");

-- CreateIndex
CREATE INDEX "lancamentos_financeiros_status_vencimento_idx" ON "lancamentos_financeiros"("status", "vencimento");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_fiscais_vendaId_key" ON "documentos_fiscais"("vendaId");

-- CreateIndex
CREATE UNIQUE INDEX "documentos_fiscais_numero_key" ON "documentos_fiscais"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "conciliacoes_financeiras_caixaId_key" ON "conciliacoes_financeiras"("caixaId");

-- CreateIndex
CREATE INDEX "conciliacoes_financeiras_usuarioId_idx" ON "conciliacoes_financeiras"("usuarioId");

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_fornecedor" ADD CONSTRAINT "produto_fornecedor_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_fornecedor" ADD CONSTRAINT "produto_fornecedor_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixas" ADD CONSTRAINT "caixas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operacoes_caixa" ADD CONSTRAINT "operacoes_caixa_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operacoes_caixa" ADD CONSTRAINT "operacoes_caixa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_venda" ADD CONSTRAINT "itens_venda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_compra" ADD CONSTRAINT "pedidos_compra_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "pedidos_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_itemVendaId_fkey" FOREIGN KEY ("itemVendaId") REFERENCES "itens_venda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_itemPedidoCompraId_fkey" FOREIGN KEY ("itemPedidoCompraId") REFERENCES "itens_pedido_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_pedidoCompraId_fkey" FOREIGN KEY ("pedidoCompraId") REFERENCES "pedidos_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "lancamentos_financeiros_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_fiscais" ADD CONSTRAINT "documentos_fiscais_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes_financeiras" ADD CONSTRAINT "conciliacoes_financeiras_caixaId_fkey" FOREIGN KEY ("caixaId") REFERENCES "caixas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conciliacoes_financeiras" ADD CONSTRAINT "conciliacoes_financeiras_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Regras adicionais ao schema Prisma.
CREATE UNIQUE INDEX "um_caixa_aberto_por_usuario" ON "caixas" ("usuarioId") WHERE "status" = 'ABERTO';
ALTER TABLE "produtos" ADD CONSTRAINT "produto_valores_validos" CHECK ("precoCusto" >= 0 AND "precoVenda" > 0 AND "estoqueAtual" >= 0 AND "estoqueMinimo" >= 0);
ALTER TABLE "itens_venda" ADD CONSTRAINT "item_venda_valido" CHECK ("quantidade" > 0 AND "precoUnitario" > 0 AND "custoUnitario" >= 0 AND "subtotal" >= 0);
ALTER TABLE "itens_pedido_compra" ADD CONSTRAINT "item_compra_valido" CHECK ("quantidade" > 0 AND "custoUnitario" >= 0 AND "subtotal" >= 0);
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamento_positivo" CHECK ("valor" > 0);
ALTER TABLE "vendas" ADD CONSTRAINT "venda_total_valido" CHECK ("subtotal" >= 0 AND "desconto" >= 0 AND "valorTotal" > 0 AND "valorTotal" = "subtotal" - "desconto");
ALTER TABLE "caixas" ADD CONSTRAINT "caixa_valores_validos" CHECK ("valorInicial" >= 0 AND ("valorFinal" IS NULL OR "valorFinal" >= 0));
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimento_quantidade_valida" CHECK (("tipo" = 'AJUSTE' AND "quantidade" <> 0) OR ("tipo" IN ('ENTRADA','SAIDA') AND "quantidade" > 0));
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimento_origem_exclusiva" CHECK (NOT ("itemVendaId" IS NOT NULL AND "itemPedidoCompraId" IS NOT NULL));
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "financeiro_origem_exclusiva" CHECK (NOT ("vendaId" IS NOT NULL AND "pedidoCompraId" IS NOT NULL));
ALTER TABLE "lancamentos_financeiros" ADD CONSTRAINT "financeiro_valor_positivo" CHECK ("valor" > 0);
ALTER TABLE "configuracao_empresa" ADD CONSTRAINT "config_unica" CHECK ("id" = 1 AND "ambienteNFCe" = 'HOMOLOGACAO');
