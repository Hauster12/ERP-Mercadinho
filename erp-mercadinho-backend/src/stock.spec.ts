import { StockService } from "./stock";
import { D } from "./rules";
describe("Inventário", () => {
  const setup = (saldo: number) => {
    const tx: any = {
      produto: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: "p",
          ativo: true,
          unidade: "UN",
          estoqueAtual: D(saldo),
          precoCusto: D(2),
        }),
        update: jest.fn(),
      },
      movimentacaoEstoque: {
        create: jest.fn().mockImplementation(({ data }) => data),
      },
    };
    return {
      tx,
      service: new StockService({ serial: (fn: any) => fn(tx) } as any),
    };
  };
  test("contagem menor registra diferença negativa", async () => {
    const { tx, service } = setup(10);
    const m = await service.manual(
      {
        produtoId: "p",
        tipo: "AJUSTE",
        quantidade: 8,
        observacao: "Contagem física",
      },
      "u",
    );
    expect(m.quantidade.toString()).toBe("-2");
    expect(
      tx.produto.update.mock.calls[0][0].data.estoqueAtual.increment.toString(),
    ).toBe("-2");
  });
  test("saída sem saldo não escreve", async () => {
    const { tx, service } = setup(2);
    await expect(
      service.manual(
        { produtoId: "p", tipo: "SAIDA", quantidade: 3, observacao: "Perda" },
        "u",
      ),
    ).rejects.toThrow();
    expect(tx.produto.update).not.toHaveBeenCalled();
    expect(tx.movimentacaoEstoque.create).not.toHaveBeenCalled();
  });
  test("inventário pode zerar saldo", async () => {
    const { service } = setup(3);
    expect(
      (
        await service.manual(
          {
            produtoId: "p",
            tipo: "AJUSTE",
            quantidade: 0,
            observacao: "Contagem",
          },
          "u",
        )
      ).quantidade.toString(),
    ).toBe("-3");
  });
});
