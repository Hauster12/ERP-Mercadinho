import "dotenv/config";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { createApp } from "./main";
import { PrismaService } from "./prisma.service";
import { CashService } from "./cash";
import { SalesService } from "./sales";
import { PurchasesService } from "./purchases";
import { StockService } from "./stock";
import { Actor } from "./auth";
import { D } from "./rules";
let app: INestApplication,
  db: PrismaService,
  cash: CashService,
  sales: SalesService,
  purchases: PurchasesService,
  stock: StockService;
let actor: Actor, categoryId: string, providerId: string;
const email = `${randomUUID()}@test.local`;
beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url || !new URL(url).pathname.endsWith("_test"))
    throw Error(
      "Configure banco TEST_DATABASE_URL com nome terminado em _test, exclusivo para testes",
    );
  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = process.env.TEST_DIRECT_URL || url;
  process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
  process.env.CORS_ORIGINS = "http://localhost:5173";
  app = await createApp();
  await app.init();
  db = app.get(PrismaService);
  cash = app.get(CashService);
  sales = app.get(SalesService);
  purchases = app.get(PurchasesService);
  stock = app.get(StockService);
  const u = await db.usuario.create({
    data: {
      nome: "Teste",
      email,
      senhaHash: await bcrypt.hash("test-password-123", 12),
      perfil: "ADMIN",
    },
  });
  actor = { id: u.id, perfil: u.perfil };
  categoryId = (await db.categoria.create({ data: { nome: randomUUID() } })).id;
  providerId = (
    await db.fornecedor.create({ data: { razaoSocial: "Fornecedor teste" } })
  ).id;
});
afterEach(async () => {
  if (db && actor) {
    for (const c of await db.caixa.findMany({
      where: { usuarioId: actor.id, status: "ABERTO" },
    }))
      await close(c.id);
  }
});
afterAll(async () => {
  if (app) await app.close();
});
async function fixture(q = 10) {
  const product = await db.produto.create({
    data: {
      categoriaId: categoryId,
      nome: "Produto teste",
      sku: randomUUID(),
      unidade: "UN",
      precoCusto: 2,
      precoVenda: 5,
    },
  });
  await stock.manual(
    {
      produtoId: product.id,
      tipo: "ENTRADA",
      quantidade: q,
      observacao: "Saldo inicial teste",
    },
    actor.id,
  );
  const c = await cash.abrir({ valorInicial: 20 }, actor);
  return { product, c };
}
async function close(id: string) {
  await cash.fechar(
    id,
    { valorFinal: (await db.serial((tx) => cash.balance(tx, id))).toNumber() },
    actor,
  );
}
function sale(c: string, p: string, q = 1) {
  return {
    caixaId: c,
    chaveIdempotencia: randomUUID(),
    itens: [{ produtoId: p, quantidade: q }],
    pagamentos: [{ forma: "DINHEIRO" as const, valor: 5 * q }],
  };
}
test("HTTP: JWT, bloqueio sem token e senha não exposta", async () => {
  await request(app.getHttpServer()).get("/api/produtos").expect(401);
  const r = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, senha: "test-password-123" })
    .expect(201);
  expect(r.body.usuario.senhaHash).toBeUndefined();
  await request(app.getHttpServer())
    .get("/api/auth/me")
    .set("Authorization", "Bearer " + r.body.accessToken)
    .expect(200);
  await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, senha: "errada" })
    .expect(401);
  const employee = await db.usuario.create({
    data: {
      nome: "Operador",
      email: randomUUID() + "@test.local",
      senhaHash: await bcrypt.hash("test-password-123", 12),
    },
  });
  const e = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email: employee.email, senha: "test-password-123" })
    .expect(201);
  await request(app.getHttpServer())
    .get("/api/usuarios")
    .set("Authorization", "Bearer " + e.body.accessToken)
    .expect(403);
});
test("venda baixa estoque, gera financeiro e comprovante; repetição não duplica", async () => {
  const { product, c } = await fixture();
  const d = sale(c.id, product.id, 2);
  const s = await sales.criar(d, actor);
  expect((await sales.criar(d, actor)).id).toBe(s.id);
  expect(
    (
      await db.produto.findUniqueOrThrow({ where: { id: product.id } })
    ).estoqueAtual.toString(),
  ).toBe("8");
  expect(
    await db.lancamentoFinanceiro.count({ where: { vendaId: s.id } }),
  ).toBe(1);
  expect(s.documentoFiscal?.status).toBe("SIMULADO");
  await expect(
    sales.criar(
      {
        ...d,
        itens: [{ produtoId: product.id, quantidade: 3 }],
        pagamentos: [{ forma: "DINHEIRO", valor: 15 }],
      },
      actor,
    ),
  ).rejects.toThrow();
  await close(c.id);
});
test("pagamento inválido não deixa venda ou movimentação parcial", async () => {
  const { product, c } = await fixture();
  const before = await db.movimentacaoEstoque.count({
    where: { produtoId: product.id },
  });
  const d = sale(c.id, product.id);
  d.pagamentos[0].valor = 4;
  await expect(sales.criar(d, actor)).rejects.toThrow();
  expect(
    await db.venda.count({ where: { chaveIdempotencia: d.chaveIdempotencia } }),
  ).toBe(0);
  expect(
    await db.movimentacaoEstoque.count({ where: { produtoId: product.id } }),
  ).toBe(before);
  expect(
    (
      await db.produto.findUniqueOrThrow({ where: { id: product.id } })
    ).estoqueAtual.toString(),
  ).toBe("10");
  await close(c.id);
});
test("duas vendas simultâneas disputam último item: uma conclui", async () => {
  const { product, c } = await fixture(1);
  const result = await Promise.allSettled([
    sales.criar(sale(c.id, product.id), actor),
    sales.criar(sale(c.id, product.id), actor),
  ]);
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(
    (
      await db.produto.findUniqueOrThrow({ where: { id: product.id } })
    ).estoqueAtual.toString(),
  ).toBe("0");
  await close(c.id);
});
test("cancelamento devolve saldo uma única vez e cancela financeiro", async () => {
  const { product, c } = await fixture();
  const s = await sales.criar(sale(c.id, product.id), actor);
  await sales.cancelar(s.id, "Cancelamento de teste", actor);
  await sales.cancelar(s.id, "Repetição", actor);
  expect(
    (
      await db.produto.findUniqueOrThrow({ where: { id: product.id } })
    ).estoqueAtual.toString(),
  ).toBe("10");
  expect(
    (
      await db.lancamentoFinanceiro.findFirstOrThrow({
        where: { vendaId: s.id },
      })
    ).status,
  ).toBe("CANCELADO");
  await close(c.id);
});
test("caixa fechado bloqueia nova venda", async () => {
  const { product, c } = await fixture();
  await close(c.id);
  await expect(sales.criar(sale(c.id, product.id), actor)).rejects.toThrow();
});
test("recebimento de compra repetido não duplica entrada ou despesa", async () => {
  const { product, c } = await fixture();
  await close(c.id);
  const p = await purchases.criar(
    {
      fornecedorId: providerId,
      itens: [{ produtoId: product.id, quantidade: 3, custoUnitario: 2 }],
    },
    actor.id,
  );
  await purchases.receber(p.id, actor.id);
  await purchases.receber(p.id, actor.id);
  expect(
    (
      await db.produto.findUniqueOrThrow({ where: { id: product.id } })
    ).estoqueAtual.toString(),
  ).toBe("13");
  expect(
    await db.lancamentoFinanceiro.count({ where: { pedidoCompraId: p.id } }),
  ).toBe(1);
});
test("sangria sem dinheiro falha, fechamento registra diferença", async () => {
  const c = await cash.abrir({ valorInicial: 20 }, actor);
  await expect(
    cash.operacao(c.id, { tipo: "SANGRIA", valor: 21 }, actor),
  ).rejects.toThrow();
  await cash.operacao(c.id, { tipo: "REFORCO", valor: 5 }, actor);
  const rec = await cash.fechar(c.id, { valorFinal: 24 }, actor);
  expect(rec.diferenca.toString()).toBe("-1");
  expect(rec.status).toBe("DIVERGENTE");
});
