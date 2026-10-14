import { CashService, ownCash } from "./cash";
import { D } from "./rules";
test("saldo físico inclui somente dinheiro, sangria e reforço", async () => {
  const tx: any = {
    caixa: { findUniqueOrThrow: async () => ({ valorInicial: D(100) }) },
    pagamento: { findMany: jest.fn().mockResolvedValue([{ valor: D(20) }]) },
    operacaoCaixa: {
      findMany: async () => [
        { tipo: "SANGRIA", valor: D(10) },
        { tipo: "REFORCO", valor: D(5) },
      ],
    },
  };
  const result = await new CashService({} as any).balance(tx, "c");
  expect(result.toString()).toBe("115");
  expect(tx.pagamento.findMany.mock.calls[0][0].where.forma).toBe("DINHEIRO");
});
test("funcionário não opera caixa alheio", () =>
  expect(() =>
    ownCash({ usuarioId: "other" } as any, { id: "me", perfil: "FUNCIONARIO" }),
  ).toThrow());
