import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  Param,
  ParseUUIDPipe,
  Req,
  Query,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Actor, Admin, AuthRequest } from "./auth";
import { VendaDto, CancelarDto, PageDto } from "./dtos";
import {
  D,
  money,
  validateQuantity,
  validatePayments,
  uniqueProducts,
} from "./rules";
import { openCash, CashService } from "./cash";
export const saleInclude = {
  itens: true,
  pagamentos: true,
  documentoFiscal: true,
  usuario: { select: { nome: true } },
  cliente: true,
} satisfies Prisma.VendaInclude;
@Injectable()
export class SalesService {
  constructor(
    private db: PrismaService,
    private cash: CashService,
  ) {}
  async criar(dados: VendaDto, usuarioAutenticado: Actor) {
    uniqueProducts(dados.itens);
    const executarVenda = () =>
      this.db.serial(async (transacao) => {
        const vendaExistente = await transacao.venda.findUnique({
          where: { chaveIdempotencia: dados.chaveIdempotencia },
          include: saleInclude,
        });
        if (vendaExistente) {
          if (vendaExistente.usuarioId !== usuarioAutenticado.id)
            throw new ConflictException("Chave de idempotência em uso");
          const mesmosDados =
            vendaExistente.caixaId === dados.caixaId &&
            vendaExistente.clienteId === (dados.clienteId || null) &&
            vendaExistente.desconto.equals(dados.desconto || 0) &&
            vendaExistente.itens.length === dados.itens.length &&
            vendaExistente.itens.every((itemVenda) =>
              dados.itens.some(
                (itemProduto) =>
                  itemProduto.produtoId === itemVenda.produtoId &&
                  itemVenda.quantidade.equals(itemProduto.quantidade),
              ),
            ) &&
            vendaExistente.pagamentos.length === dados.pagamentos.length &&
            Object.values([
              "DINHEIRO",
              "CARTAO_CREDITO",
              "CARTAO_DEBITO",
              "PIX",
            ]).every((formaPagamento) =>
              vendaExistente.pagamentos
                .filter((pagamento) => pagamento.forma === formaPagamento)
                .reduce(
                  (acumulado, pagamento) => acumulado.plus(pagamento.valor),
                  D(0),
                )
                .equals(
                  dados.pagamentos
                    .filter((pagamento) => pagamento.forma === formaPagamento)
                    .reduce(
                      (acumulado, pagamento) => acumulado.plus(pagamento.valor),
                      D(0),
                    ),
                ),
            );
          if (!mesmosDados)
            throw new ConflictException("Chave já usada com outros dados");
          return vendaExistente;
        }
        await openCash(transacao, dados.caixaId, usuarioAutenticado);
        if (
          dados.clienteId &&
          !(
            await transacao.cliente.findUnique({
              where: { id: dados.clienteId },
            })
          )?.ativo
        )
          throw new BadRequestException("Cliente inativo ou inexistente");
        const itens = [];
        for (const itemProduto of dados.itens) {
          const produto = await transacao.produto.findUniqueOrThrow({
            where: { id: itemProduto.produtoId },
          });
          if (!produto.ativo)
            throw new BadRequestException("Produto inativo: " + produto.nome);
          validateQuantity(produto.unidade, itemProduto.quantidade);
          if (produto.estoqueAtual.lt(itemProduto.quantidade))
            throw new BadRequestException(
              "Estoque insuficiente: " + produto.nome,
            );
          itens.push({
            produtoId: produto.id,
            produtoNome: produto.nome,
            produtoSku: produto.sku,
            quantidade: D(itemProduto.quantidade),
            precoUnitario: produto.precoVenda,
            custoUnitario: produto.precoCusto,
            subtotal: money(produto.precoVenda.mul(itemProduto.quantidade)),
          });
        }
        const subtotal = money(
          itens.reduce(
            (acumulado, itemVenda) => acumulado.plus(itemVenda.subtotal),
            D(0),
          ),
        );
        const desconto = D(dados.desconto || 0);
        if (desconto.gte(subtotal))
          throw new BadRequestException(
            "Desconto deve ser menor que o subtotal",
          );
        if (desconto.gt(0) && usuarioAutenticado.perfil !== "ADMIN")
          throw new ForbiddenException("Desconto exige administrador");
        const total = subtotal.minus(desconto);
        validatePayments(total, dados.pagamentos);
        const venda = await transacao.venda.create({
          data: {
            caixaId: dados.caixaId,
            usuarioId: usuarioAutenticado.id,
            clienteId: dados.clienteId,
            chaveIdempotencia: dados.chaveIdempotencia,
            subtotal,
            desconto,
            valorTotal: total,
            itens: { create: itens },
            pagamentos: {
              create: dados.pagamentos.map((pagamento) => ({
                ...pagamento,
                confirmado: true,
              })),
            },
            documentoFiscal: { create: {} },
            lancamentos: {
              create: {
                caixaId: dados.caixaId,
                tipo: "RECEITA",
                descricao: "Venda no PDV",
                valor: total,
                vencimento: new Date(),
                pagamentoEm: new Date(),
                status: "PAGO",
              },
            },
          },
          include: saleInclude,
        });
        for (const itemVenda of venda.itens) {
          const resultadoAtualizacao = await transacao.produto.updateMany({
            where: {
              id: itemVenda.produtoId,
              estoqueAtual: { gte: itemVenda.quantidade },
            },
            data: { estoqueAtual: { decrement: itemVenda.quantidade } },
          });
          if (resultadoAtualizacao.count !== 1)
            throw new BadRequestException("Estoque insuficiente");
          await transacao.movimentacaoEstoque.create({
            data: {
              produtoId: itemVenda.produtoId,
              usuarioId: usuarioAutenticado.id,
              itemVendaId: itemVenda.id,
              tipo: "SAIDA",
              origem: "VENDA",
              quantidade: itemVenda.quantidade,
              custoUnitario: itemVenda.custoUnitario,
            },
          });
        }
        return venda;
      });
    try {
      return await executarVenda();
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002"
      )
        return executarVenda();
      throw erro;
    }
  }
  cancelar(id: string, motivo: string, usuarioAutenticado: Actor) {
    return this.db.serial(async (transacao) => {
      const venda = await transacao.venda.findUniqueOrThrow({
        where: { id },
        include: saleInclude,
      });
      if (venda.status === "CANCELADA") return venda;
      await openCash(transacao, venda.caixaId, usuarioAutenticado);
      const cashRefund = venda.pagamentos
        .filter((pagamento) => pagamento.forma === "DINHEIRO")
        .reduce(
          (acumulado, pagamento) => acumulado.plus(pagamento.valor),
          D(0),
        );
      if ((await this.cash.balance(transacao, venda.caixaId)).lt(cashRefund))
        throw new BadRequestException(
          "Dinheiro insuficiente no caixa para estorno",
        );
      for (const itemVenda of venda.itens) {
        await transacao.produto.update({
          where: { id: itemVenda.produtoId },
          data: { estoqueAtual: { increment: itemVenda.quantidade } },
        });
        await transacao.movimentacaoEstoque.create({
          data: {
            produtoId: itemVenda.produtoId,
            usuarioId: usuarioAutenticado.id,
            itemVendaId: itemVenda.id,
            tipo: "ENTRADA",
            origem: "DEVOLUCAO",
            quantidade: itemVenda.quantidade,
            custoUnitario: itemVenda.custoUnitario,
            observacao: motivo,
          },
        });
      }
      await transacao.pagamento.updateMany({
        where: { vendaId: id },
        data: { confirmado: false },
      });
      await transacao.lancamentoFinanceiro.updateMany({
        where: { vendaId: id },
        data: { status: "CANCELADO" },
      });
      await transacao.documentoFiscal.updateMany({
        where: { vendaId: id },
        data: { status: "CANCELADO" },
      });
      return transacao.venda.update({
        where: { id },
        data: {
          status: "CANCELADA",
          motivoCancelamento: motivo,
          canceladoEm: new Date(),
        },
        include: saleInclude,
      });
    });
  }
}
@Controller("vendas")
export class SalesController {
  constructor(
    private db: PrismaService,
    private sales: SalesService,
  ) {}
  @Post() criar(@Body() dados: VendaDto, @Req() requisicao: AuthRequest) {
    return this.sales.criar(dados, requisicao.user);
  }
  @Get() listar(@Query() paginacao: PageDto, @Req() requisicao: AuthRequest) {
    return this.db.venda.findMany({
      where:
        requisicao.user.perfil === "ADMIN"
          ? {}
          : { usuarioId: requisicao.user.id },
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { criadoEm: "desc" },
      include: saleInclude,
    });
  }
  @Get(":id") async detalhe(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() requisicao: AuthRequest,
  ) {
    const venda = await this.db.venda.findUniqueOrThrow({
      where: { id },
      include: saleInclude,
    });
    if (
      requisicao.user.perfil !== "ADMIN" &&
      venda.usuarioId !== requisicao.user.id
    )
      throw new ForbiddenException();
    return venda;
  }
  @Admin() @Post(":id/cancelar") cancelar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: CancelarDto,
    @Req() requisicao: AuthRequest,
  ) {
    return this.sales.cancelar(id, dados.motivo, requisicao.user);
  }
}
