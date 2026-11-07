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
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Admin, AuthRequest } from "./auth";
import { CompraDto, PageDto } from "./dtos";
import { D, money, uniqueProducts, validateQuantity } from "./rules";
const include = {
  itens: true,
  fornecedor: true,
  usuario: { select: { nome: true } },
} as const;
@Injectable()
export class PurchasesService {
  constructor(private db: PrismaService) {}
  criar(dados: CompraDto, usuarioId: string) {
    uniqueProducts(dados.itens);
    return this.db.serial(async (transacao) => {
      if (
        !(
          await transacao.fornecedor.findUnique({
            where: { id: dados.fornecedorId },
          })
        )?.ativo
      )
        throw new BadRequestException("Fornecedor inativo ou inexistente");
      const itens = [];
      for (const itemProduto of dados.itens) {
        const produto = await transacao.produto.findUniqueOrThrow({
          where: { id: itemProduto.produtoId },
        });
        if (!produto.ativo) throw new BadRequestException("Produto inativo");
        validateQuantity(produto.unidade, itemProduto.quantidade);
        itens.push({
          ...itemProduto,
          produtoNome: produto.nome,
          subtotal: money(
            D(itemProduto.custoUnitario).mul(itemProduto.quantidade),
          ),
        });
      }
      return transacao.pedidoCompra.create({
        data: {
          fornecedorId: dados.fornecedorId,
          usuarioId,
          numeroNota: dados.numeroNota,
          valorTotal: money(
            itens.reduce(
              (acumulado, itemProduto) => acumulado.plus(itemProduto.subtotal),
              D(0),
            ),
          ),
          itens: { create: itens },
        },
        include,
      });
    });
  }
  receber(id: string, usuarioId: string) {
    return this.db.serial(async (transacao) => {
      const pedidoCompra = await transacao.pedidoCompra.findUniqueOrThrow({
        where: { id },
        include,
      });
      if (pedidoCompra.status === "RECEBIDO") return pedidoCompra;
      if (pedidoCompra.status !== "PENDENTE")
        throw new BadRequestException("Pedido cancelado");
      for (const itemProduto of pedidoCompra.itens) {
        await transacao.produto.update({
          where: { id: itemProduto.produtoId },
          data: {
            estoqueAtual: { increment: itemProduto.quantidade },
            precoCusto: itemProduto.custoUnitario,
          },
        });
        await transacao.produtoFornecedor.upsert({
          where: {
            produtoId_fornecedorId: {
              produtoId: itemProduto.produtoId,
              fornecedorId: pedidoCompra.fornecedorId,
            },
          },
          create: {
            produtoId: itemProduto.produtoId,
            fornecedorId: pedidoCompra.fornecedorId,
            ultimoCusto: itemProduto.custoUnitario,
          },
          update: { ultimoCusto: itemProduto.custoUnitario },
        });
        await transacao.movimentacaoEstoque.create({
          data: {
            produtoId: itemProduto.produtoId,
            usuarioId,
            itemPedidoCompraId: itemProduto.id,
            tipo: "ENTRADA",
            origem: "COMPRA",
            quantidade: itemProduto.quantidade,
            custoUnitario: itemProduto.custoUnitario,
          },
        });
      }
      if (pedidoCompra.valorTotal.gt(0))
        await transacao.lancamentoFinanceiro.create({
          data: {
            pedidoCompraId: id,
            tipo: "DESPESA",
            descricao: "Compra " + pedidoCompra.numero,
            valor: pedidoCompra.valorTotal,
            vencimento: new Date(),
            status: "PENDENTE",
          },
        });
      return transacao.pedidoCompra.update({
        where: { id },
        data: { status: "RECEBIDO", recebidoEm: new Date() },
        include,
      });
    });
  }
  cancelar(id: string) {
    return this.db.serial(async (transacao) => {
      const pedidoCompra = await transacao.pedidoCompra.findUniqueOrThrow({
        where: { id },
      });
      if (pedidoCompra.status === "RECEBIDO")
        throw new BadRequestException(
          "Compra recebida exige processo de devolução, fora deste MVP",
        );
      return transacao.pedidoCompra.update({
        where: { id },
        data: { status: "CANCELADO" },
        include,
      });
    });
  }
}
@Admin()
@Controller("compras")
export class PurchasesController {
  constructor(
    private db: PrismaService,
    private purchases: PurchasesService,
  ) {}
  @Get() listar(@Query() paginacao: PageDto) {
    return this.db.pedidoCompra.findMany({
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { criadoEm: "desc" },
      include,
    });
  }
  @Get(":id") detalhe(@Param("id", ParseUUIDPipe) id: string) {
    return this.db.pedidoCompra.findUniqueOrThrow({ where: { id }, include });
  }
  @Post() criar(@Body() dados: CompraDto, @Req() requisicao: AuthRequest) {
    return this.purchases.criar(dados, requisicao.user.id);
  }
  @Post(":id/receber") receber(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() requisicao: AuthRequest,
  ) {
    return this.purchases.receber(id, requisicao.user.id);
  }
  @Post(":id/cancelar") cancelar(@Param("id", ParseUUIDPipe) id: string) {
    return this.purchases.cancelar(id);
  }
}
