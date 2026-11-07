import { ValidationPipe } from "@nestjs/common";
import { VendaDto, ProdutoDto } from "./dtos";
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});
test("não aceita estoque atual enviado no cadastro", async () => {
  await expect(
    pipe.transform(
      {
        categoriaId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
        nome: "Arroz",
        sku: "A",
        unidade: "UN",
        precoCusto: 2,
        precoVenda: 3,
        estoqueMinimo: 1,
        estoqueAtual: 100,
      },
      { type: "body", metatype: ProdutoDto },
    ),
  ).rejects.toThrow();
});
test("valida pagamento e item aninhados", async () => {
  await expect(
    pipe.transform(
      {
        caixaId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
        chaveIdempotencia: "sale-123456",
        itens: [{ produtoId: "INVALID", quantidade: -1 }],
        pagamentos: [{ forma: "PIX", valor: 0 }],
      },
      { type: "body", metatype: VendaDto },
    ),
  ).rejects.toThrow();
});

test("aceita preço de referência opcional para sincronização do PDV", async () => {
  const venda = await pipe.transform(
    {
      caixaId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
      chaveIdempotencia: "offline-sale-123",
      itens: [{
        produtoId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
        quantidade: 1,
        precoUnitarioEsperado: 10,
      }],
      pagamentos: [{ forma: "PIX", valor: 10 }],
    },
    { type: "body", metatype: VendaDto },
  );
  expect(venda.itens[0].precoUnitarioEsperado).toBe(10);

  await expect(
    pipe.transform(
      {
        caixaId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
        chaveIdempotencia: "offline-sale-124",
        itens: [{
          produtoId: "56a1beaa-61d8-4ebf-8286-5db7159fcb1d",
          quantidade: 1,
          precoUnitarioEsperado: -1,
        }],
        pagamentos: [{ forma: "PIX", valor: 10 }],
      },
      { type: "body", metatype: VendaDto },
    ),
  ).rejects.toThrow();
});
