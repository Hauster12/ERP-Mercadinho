import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  Query,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { Admin, AuthRequest } from "./auth";
import { MovimentoDto, PageDto } from "./dtos";
import { D, validateQuantity } from "./rules";
@Injectable()
export class StockService {
  constructor(private db: PrismaService) {}
  async manual(dados: MovimentoDto, usuarioId: string) {
    return this.db.serial(async (transacao) => {
      const produto = await transacao.produto.findUniqueOrThrow({
        where: { id: dados.produtoId },
      });
      if (!produto.ativo) throw new BadRequestException("Produto inativo");
      const quantidadeInformada = D(dados.quantidade);
      if (dados.tipo !== "AJUSTE")
        validateQuantity(produto.unidade, quantidadeInformada);
      else if (
        ["UN", "CX", "PCT"].includes(produto.unidade) &&
        !quantidadeInformada.isInteger()
      )
        throw new BadRequestException("Contagem deve ser inteira");
      const variacaoEstoque =
        dados.tipo === "AJUSTE"
          ? quantidadeInformada.minus(produto.estoqueAtual)
          : dados.tipo === "SAIDA"
            ? quantidadeInformada.negated()
            : quantidadeInformada;
      if (variacaoEstoque.isZero())
        throw new BadRequestException(
          "A contagem já corresponde ao saldo atual",
        );
      if (produto.estoqueAtual.plus(variacaoEstoque).lt(0))
        throw new BadRequestException("Estoque insuficiente");
      await transacao.produto.update({
        where: { id: produto.id },
        data: { estoqueAtual: { increment: variacaoEstoque } },
      });
      return transacao.movimentacaoEstoque.create({
        data: {
          produtoId: produto.id,
          usuarioId,
          tipo: dados.tipo,
          origem: dados.tipo === "SAIDA" ? "PERDA" : "INVENTARIO_MANUAL",
          quantidade:
            dados.tipo === "AJUSTE" ? variacaoEstoque : quantidadeInformada,
          custoUnitario: produto.precoCusto,
          observacao: dados.observacao,
        },
      });
    });
  }
}
@Controller("estoque")
export class StockController {
  constructor(
    private db: PrismaService,
    private stock: StockService,
  ) {}
  @Get("movimentacoes") listar(@Query() paginacao: PageDto) {
    return this.db.movimentacaoEstoque.findMany({
      where: paginacao.produtoId
        ? { produtoId: paginacao.produtoId }
        : undefined,
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { criadoEm: "desc" },
      include: { produto: true, usuario: { select: { nome: true } } },
    });
  }
  @Admin() @Post("movimentacoes") manual(
    @Body() dados: MovimentoDto,
    @Req() requisicao: AuthRequest,
  ) {
    return this.stock.manual(dados, requisicao.user.id);
  }
}
