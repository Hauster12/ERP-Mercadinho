import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Admin } from "./auth";
import { FinanceiroDto, PageDto } from "./dtos";
import { D } from "./rules";
@Admin()
@Controller()
export class FinanceController {
  constructor(private db: PrismaService) {}
  @Get("financeiro") listar(@Query() paginacao: PageDto) {
    return this.db.lancamentoFinanceiro.findMany({
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { criadoEm: "desc" },
    });
  }
  @Post("financeiro") criar(@Body() dados: FinanceiroDto) {
    return this.db.lancamentoFinanceiro.create({
      data: { ...dados, vencimento: new Date(dados.vencimento) },
    });
  }
  @Post("financeiro/:id/pagar") pagar(@Param("id", ParseUUIDPipe) id: string) {
    return this.db.serial(async (transacao) => {
      const lancamento = await transacao.lancamentoFinanceiro.findUniqueOrThrow(
        { where: { id } },
      );
      if (lancamento.status === "CANCELADO")
        throw new BadRequestException("Lançamento cancelado");
      if (lancamento.status === "PAGO") return lancamento;
      return transacao.lancamentoFinanceiro.update({
        where: { id },
        data: { status: "PAGO", pagamentoEm: new Date() },
      });
    });
  }
  @Post("financeiro/:id/cancelar") cancelar(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.db.serial(async (transacao) => {
      const lancamento = await transacao.lancamentoFinanceiro.findUniqueOrThrow(
        { where: { id } },
      );
      if (
        lancamento.vendaId ||
        lancamento.pedidoCompraId ||
        lancamento.status === "PAGO"
      )
        throw new BadRequestException(
          "Cancele na origem; somente lançamento manual pendente pode ser cancelado",
        );
      return transacao.lancamentoFinanceiro.update({
        where: { id },
        data: { status: "CANCELADO" },
      });
    });
  }
  @Get("conciliacoes") conciliacoes(@Query() paginacao: PageDto) {
    return this.db.conciliacaoFinanceira.findMany({
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { criadoEm: "desc" },
    });
  }
  @Get("dashboard") dashboard() {
    return this.db.serial(async (transacao) => {
      const start = new Date();
      start.setUTCHours(3, 0, 0, 0);
      if (new Date() < start) start.setUTCDate(start.getUTCDate() - 1);
      const [sales, products, finance] = await Promise.all([
        transacao.venda.findMany({
          where: { status: "CONCLUIDA", criadoEm: { gte: start } },
          include: { itens: true },
        }),
        transacao.produto.findMany({ where: { ativo: true } }),
        transacao.lancamentoFinanceiro.findMany({ where: { status: "PAGO" } }),
      ]);
      return {
        vendasHoje: sales.length,
        receitaHoje: sales.reduce(
          (totalReceitas, venda) => totalReceitas.plus(venda.valorTotal),
          D(0),
        ),
        lucroBrutoHoje: sales.reduce(
          (totalLucro, venda) =>
            totalLucro
              .plus(venda.valorTotal)
              .minus(
                venda.itens.reduce(
                  (acumulado, itemVenda) =>
                    acumulado.plus(
                      itemVenda.custoUnitario.mul(itemVenda.quantidade),
                    ),
                  D(0),
                ),
              ),
          D(0),
        ),
        produtosAtivos: products.length,
        estoqueBaixo: products.filter((produto) =>
          produto.estoqueAtual.lte(produto.estoqueMinimo),
        ),
        receitas: finance
          .filter((lancamento) => lancamento.tipo === "RECEITA")
          .reduce(
            (acumulado, lancamento) => acumulado.plus(lancamento.valor),
            D(0),
          ),
        despesas: finance
          .filter((lancamento) => lancamento.tipo === "DESPESA")
          .reduce(
            (acumulado, lancamento) => acumulado.plus(lancamento.valor),
            D(0),
          ),
      };
    });
  }
}
