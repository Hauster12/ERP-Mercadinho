import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Req,
  Query,
} from "@nestjs/common";
import { Prisma, Caixa } from "@prisma/client";
import { PrismaService } from "./prisma.service";
import { Actor, AuthRequest } from "./auth";
import { AbrirCaixaDto, FecharCaixaDto, OperacaoDto, PageDto } from "./dtos";
import { D } from "./rules";
export function ownCash(caixa: Caixa, actor: Actor) {
  if (actor.perfil !== "ADMIN" && caixa.usuarioId !== actor.id)
    throw new ForbiddenException("Caixa de outro usuário");
}
export async function openCash(
  transacao: Prisma.TransactionClient,
  id: string,
  actor: Actor,
) {
  const caixa = await transacao.caixa.findUniqueOrThrow({ where: { id } });
  ownCash(caixa, actor);
  if (caixa.status !== "ABERTO") throw new BadRequestException("Caixa fechado");
  return caixa;
}
@Injectable()
export class CashService {
  constructor(private db: PrismaService) {}
  async balance(transacao: Prisma.TransactionClient, id: string) {
    const caixa = await transacao.caixa.findUniqueOrThrow({ where: { id } });
    const [payments, ops] = await Promise.all([
      transacao.pagamento.findMany({
        where: {
          forma: "DINHEIRO",
          confirmado: true,
          venda: { caixaId: id, status: "CONCLUIDA" },
        },
      }),
      transacao.operacaoCaixa.findMany({
        where: { caixaId: id, tipo: { in: ["SANGRIA", "REFORCO"] } },
      }),
    ]);
    return payments
      .reduce(
        (acumulado, pagamento) => acumulado.plus(pagamento.valor),
        D(caixa.valorInicial),
      )
      .plus(
        ops.reduce(
          (acumulado, operacao) =>
            operacao.tipo === "SANGRIA"
              ? acumulado.minus(operacao.valor)
              : acumulado.plus(operacao.valor),
          D(0),
        ),
      );
  }
  abrir(dados: AbrirCaixaDto, usuarioAutenticado: Actor) {
    return this.db.serial(async (transacao) => {
      if (
        await transacao.caixa.findFirst({
          where: { usuarioId: usuarioAutenticado.id, status: "ABERTO" },
        })
      )
        throw new BadRequestException("Usuário já tem caixa aberto");
      return transacao.caixa.create({
        data: {
          usuarioId: usuarioAutenticado.id,
          valorInicial: dados.valorInicial,
          operacoes: {
            create: {
              usuarioId: usuarioAutenticado.id,
              tipo: "ABERTURA",
              valor: dados.valorInicial,
            },
          },
        },
        include: { operacoes: true },
      });
    });
  }
  operacao(id: string, dados: OperacaoDto, usuarioAutenticado: Actor) {
    return this.db.serial(async (transacao) => {
      await openCash(transacao, id, usuarioAutenticado);
      if (
        dados.tipo === "SANGRIA" &&
        (await this.balance(transacao, id)).lt(dados.valor)
      )
        throw new BadRequestException("Dinheiro insuficiente para sangria");
      return transacao.operacaoCaixa.create({
        data: { caixaId: id, usuarioId: usuarioAutenticado.id, ...dados },
      });
    });
  }
  fechar(id: string, dados: FecharCaixaDto, usuarioAutenticado: Actor) {
    return this.db.serial(async (transacao) => {
      const caixa = await openCash(transacao, id, usuarioAutenticado);
      const saldoEsperado = await this.balance(transacao, id);
      const diferenca = D(dados.valorFinal).minus(saldoEsperado);
      const dataFechamento = new Date();
      await transacao.caixa.update({
        where: { id },
        data: {
          status: "FECHADO",
          valorFinal: dados.valorFinal,
          fechadoEm: dataFechamento,
        },
      });
      await transacao.operacaoCaixa.create({
        data: {
          caixaId: id,
          usuarioId: usuarioAutenticado.id,
          tipo: "FECHAMENTO",
          valor: dados.valorFinal,
          observacao: dados.observacao,
        },
      });
      return transacao.conciliacaoFinanceira.create({
        data: {
          caixaId: id,
          usuarioId: usuarioAutenticado.id,
          periodoInicio: caixa.abertoEm,
          periodoFim: dataFechamento,
          valorSistema: saldoEsperado,
          valorInformado: dados.valorFinal,
          diferenca: diferenca,
          status: diferenca.isZero() ? "CONCILIADO" : "DIVERGENTE",
          observacao: dados.observacao,
        },
      });
    });
  }
}
@Controller("caixas")
export class CashController {
  constructor(
    private db: PrismaService,
    private cash: CashService,
  ) {}
  @Get() listar(@Query() paginacao: PageDto, @Req() requisicao: AuthRequest) {
    return this.db.caixa.findMany({
      where:
        requisicao.user.perfil === "ADMIN"
          ? {}
          : { usuarioId: requisicao.user.id },
      skip: (paginacao.pagina - 1) * paginacao.limite,
      take: paginacao.limite,
      orderBy: { abertoEm: "desc" },
      include: {
        usuario: { select: { nome: true } },
        operacoes: { include: { usuario: { select: { nome: true } } } },
      },
    });
  }
  @Get("atual") atual(@Req() requisicao: AuthRequest) {
    return this.db.caixa.findFirst({
      where: { usuarioId: requisicao.user.id, status: "ABERTO" },
      include: {
        operacoes: { include: { usuario: { select: { nome: true } } } },
        usuario: { select: { nome: true } },
      },
    });
  }
  @Get(":id") async detalhe(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() requisicao: AuthRequest,
  ) {
    const caixa = await this.db.caixa.findUniqueOrThrow({
      where: { id },
      include: {
        operacoes: { include: { usuario: { select: { nome: true } } } },
        conciliacoes: true,
      },
    });
    ownCash(caixa, requisicao.user);
    return {
      ...caixa,
      saldoDinheiro: await this.db.serial((transacao) =>
        this.cash.balance(transacao, id),
      ),
    };
  }
  @Post("abrir") abrir(
    @Body() dados: AbrirCaixaDto,
    @Req() requisicao: AuthRequest,
  ) {
    return this.cash.abrir(dados, requisicao.user);
  }
  @Post(":id/operacoes") operacao(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: OperacaoDto,
    @Req() requisicao: AuthRequest,
  ) {
    return this.cash.operacao(id, dados, requisicao.user);
  }
  @Post(":id/fechar") fechar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dados: FecharCaixaDto,
    @Req() requisicao: AuthRequest,
  ) {
    return this.cash.fechar(id, dados, requisicao.user);
  }
}
