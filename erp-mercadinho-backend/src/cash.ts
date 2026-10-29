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
import { Actor, AuthRequest, Admin } from "./auth";
import { AbrirCaixaDto, FecharCaixaDto, OperacaoDto, PageDto, AvisarAdminDto } from "./dtos";
import { D } from "./rules";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
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
      const numeroCaixa = dados.numeroCaixa || 1;
      return transacao.caixa.create({
        data: {
          usuarioId: usuarioAutenticado.id,
          valorInicial: dados.valorInicial,
          operacoes: {
            create: {
              usuarioId: usuarioAutenticado.id,
              tipo: "ABERTURA",
              valor: dados.valorInicial,
              observacao: JSON.stringify({ numeroCaixa }),
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

      // Recuperar numeroCaixa da operação de abertura caso não tenha vindo direto
      let numeroCaixa = dados.numeroCaixa;
      if (!numeroCaixa) {
        const opAbertura = await transacao.operacaoCaixa.findFirst({
          where: { caixaId: id, tipo: "ABERTURA" },
        });
        if (opAbertura?.observacao) {
          try {
            const parsed = JSON.parse(opAbertura.observacao);
            if (parsed.numeroCaixa) numeroCaixa = parsed.numeroCaixa;
          } catch {}
        }
      }
      numeroCaixa = numeroCaixa || 1;

      let obsFinal = dados.observacao || "";
      if (dados.recadoProximoOperador || dados.recadoAdmin || numeroCaixa) {
        obsFinal = JSON.stringify({
          conferencia: dados.observacao || "",
          numeroCaixa,
          recadoProximoOperador: (dados.recadoProximoOperador || "").trim(),
          recadoAdmin: (dados.recadoAdmin || "").trim(),
          lidoAdmin: false,
        });
      }
      await transacao.operacaoCaixa.create({
        data: {
          caixaId: id,
          usuarioId: usuarioAutenticado.id,
          tipo: "FECHAMENTO",
          valor: dados.valorFinal,
          observacao: obsFinal,
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
          observacao: obsFinal,
        },
      });
    });
  }
}
@Controller("caixas")
export class CashController {
  private avisosArquivo = path.join(process.cwd(), "avisos-admin.json");

  constructor(
    private db: PrismaService,
    private cash: CashService,
  ) {}

  private lerChamadosAdmin(): any[] {
    try {
      if (fs.existsSync(this.avisosArquivo)) {
        return JSON.parse(fs.readFileSync(this.avisosArquivo, "utf-8"));
      }
    } catch {}
    return [];
  }

  private salvarChamadoAdmin(novo: any) {
    try {
      const lista = this.lerChamadosAdmin();
      lista.unshift(novo);
      fs.writeFileSync(this.avisosArquivo, JSON.stringify(lista.slice(0, 100), null, 2));
    } catch {}
  }

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

  @Get("atual") async atual(@Req() requisicao: AuthRequest) {
    const caixa = await this.db.caixa.findFirst({
      where: { usuarioId: requisicao.user.id, status: "ABERTO" },
      include: {
        operacoes: { include: { usuario: { select: { nome: true } } } },
        usuario: { select: { nome: true } },
      },
    });
    if (!caixa) return null;
    let numeroCaixa = 1;
    const opAbertura = caixa.operacoes.find((o) => o.tipo === "ABERTURA");
    if (opAbertura?.observacao) {
      try {
        const parsed = JSON.parse(opAbertura.observacao);
        if (parsed.numeroCaixa) numeroCaixa = parsed.numeroCaixa;
      } catch {}
    }
    return {
      ...caixa,
      numeroCaixa,
    };
  }

  @Get("ultimo-recado") async ultimoRecado(@Query("numeroCaixa") numeroCaixaStr?: string) {
    const targetNumero = numeroCaixaStr ? parseInt(numeroCaixaStr, 10) : undefined;
    const ops = await this.db.operacaoCaixa.findMany({
      where: { tipo: "FECHAMENTO" },
      orderBy: { criadoEm: "desc" },
      take: 50,
      include: { usuario: { select: { nome: true } }, caixa: true },
    });
    for (const op of ops) {
      if (!op.observacao) continue;
      try {
        const parsed = JSON.parse(op.observacao);
        if (parsed.recadoProximoOperador) {
          const recadoNumeroCaixa = parsed.numeroCaixa || 1;
          if (targetNumero === undefined || recadoNumeroCaixa === targetNumero) {
            return {
              id: op.id,
              caixaId: op.caixaId,
              numeroCaixa: recadoNumeroCaixa,
              usuarioNome: op.usuario?.nome || "Operador Anterior",
              mensagem: parsed.recadoProximoOperador,
              criadoEm: op.criadoEm,
            };
          }
        }
      } catch {}
    }
    return null;
  }

  @Post("avisar-admin") async avisarAdmin(
    @Body() dados: AvisarAdminDto,
    @Req() requisicao: AuthRequest,
  ) {
    const id = randomUUID();
    const usuario = await this.db.usuario.findUnique({
      where: { id: requisicao.user.id },
    });
    const aviso = {
      id,
      usuarioId: requisicao.user.id,
      usuarioNome: usuario?.nome || "Operador",
      numeroCaixa: dados.numeroCaixa || 1,
      mensagem: dados.mensagem.trim(),
      criadoEm: new Date().toISOString(),
      lidoAdmin: false,
    };
    this.salvarChamadoAdmin(aviso);
    return { ok: true, aviso };
  }

  @Admin() @Get("avisos-admin") async avisosAdmin() {
    const chamados = this.lerChamadosAdmin().filter((c: any) => !c.lidoAdmin);
    const avisos: Array<{
      id: string;
      caixaId?: string;
      numeroCaixa: number;
      usuarioNome: string;
      recadoAdmin: string;
      conferencia?: string;
      criadoEm: Date | string;
    }> = chamados.map((c: any) => ({
      id: c.id,
      numeroCaixa: c.numeroCaixa || 1,
      usuarioNome: c.usuarioNome,
      recadoAdmin: c.mensagem,
      criadoEm: c.criadoEm,
    }));

    // Verifica também no banco se há fechamentos anteriores com recadoAdmin
    const ops = await this.db.operacaoCaixa.findMany({
      where: { tipo: "FECHAMENTO" },
      orderBy: { criadoEm: "desc" },
      take: 20,
      include: { usuario: { select: { nome: true } }, caixa: true },
    });
    for (const op of ops) {
      if (!op.observacao) continue;
      try {
        const parsed = JSON.parse(op.observacao);
        if (parsed.recadoAdmin && !parsed.lidoAdmin) {
          avisos.push({
            id: op.id,
            caixaId: op.caixaId,
            numeroCaixa: parsed.numeroCaixa || 1,
            usuarioNome: op.usuario?.nome || "Operador",
            recadoAdmin: parsed.recadoAdmin,
            conferencia: parsed.conferencia,
            criadoEm: op.criadoEm,
          });
        }
      } catch {}
    }
    return avisos;
  }

  @Admin() @Post("avisos-admin/:id/dispensar") async dispensarAvisoAdmin(
    @Param("id") id: string,
  ) {
    const chamados = this.lerChamadosAdmin();
    let alterado = false;
    for (const c of chamados) {
      if (c.id === id) {
        c.lidoAdmin = true;
        alterado = true;
      }
    }
    if (alterado) {
      try {
        fs.writeFileSync(this.avisosArquivo, JSON.stringify(chamados, null, 2));
      } catch {}
    }
    try {
      const op = await this.db.operacaoCaixa.findUnique({ where: { id } });
      if (op?.observacao) {
        const parsed = JSON.parse(op.observacao);
        parsed.lidoAdmin = true;
        await this.db.operacaoCaixa.update({
          where: { id },
          data: { observacao: JSON.stringify(parsed) },
        });
      }
    } catch {}
    return { ok: true };
  }

  @Admin() @Post("avisos-admin/dispensar-todos") async dispensarTodosAvisosAdmin() {
    const chamados = this.lerChamadosAdmin();
    for (const c of chamados) {
      c.lidoAdmin = true;
    }
    try {
      fs.writeFileSync(this.avisosArquivo, JSON.stringify(chamados, null, 2));
    } catch {}

    const ops = await this.db.operacaoCaixa.findMany({
      where: { tipo: "FECHAMENTO" },
      orderBy: { criadoEm: "desc" },
      take: 50,
    });
    for (const op of ops) {
      if (!op.observacao) continue;
      try {
        const parsed = JSON.parse(op.observacao);
        if (parsed.recadoAdmin && !parsed.lidoAdmin) {
          parsed.lidoAdmin = true;
          await this.db.operacaoCaixa.update({
            where: { id: op.id },
            data: { observacao: JSON.stringify(parsed) },
          });
        }
      } catch {}
    }
    return { ok: true };
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
