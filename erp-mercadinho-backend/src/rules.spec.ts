import {
  D,
  money,
  validateQuantity,
  validatePayments,
  uniqueProducts,
} from "./rules";
import { serialize } from "./common";
describe("Regras monetárias e quantidades", () => {
  test("arredonda subtotal por item com meio para cima", () =>
    expect(money(D("3.99").mul("0.5")).toString()).toBe("2"));
  test("rejeita subtotal além da precisão do banco", () =>
    expect(() => money("1000000000000")).toThrow());
  test("soma decimal não sofre erro de ponto flutuante", () =>
    expect(D("0.1").plus("0.2").equals("0.3")).toBe(true));
  test("aceita peso fracionado", () =>
    expect(() => validateQuantity("KG", 0.125)).not.toThrow());
  test("rejeita fração por unidade e quantidade zero", () => {
    expect(() => validateQuantity("UN", 0.5)).toThrow();
    expect(() => validateQuantity("KG", 0)).toThrow();
  });
  test("pagamentos divididos somam total", () =>
    expect(() =>
      validatePayments(D("10.30"), [{ valor: 5 }, { valor: 5.3 }]),
    ).not.toThrow());
  test("rejeita pagamento maior ou menor", () => {
    expect(() => validatePayments(D(10), [{ valor: 11 }])).toThrow();
    expect(() => validatePayments(D(10), [{ valor: 9 }])).toThrow();
  });
  test("rejeita linhas duplicadas", () =>
    expect(() =>
      uniqueProducts([{ produtoId: "a" }, { produtoId: "a" }]),
    ).toThrow());
  test("resposta remove hash recursivamente e converte decimal", () =>
    expect(
      serialize({
        usuario: { nome: "Juan", senhaHash: "secret" },
        valor: D("2.30"),
      }),
    ).toEqual({ usuario: { nome: "Juan" }, usuarioNome: "Juan", valor: 2.3 }));
});
