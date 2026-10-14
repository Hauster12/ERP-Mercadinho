import { BadRequestException } from "@nestjs/common";
import { Prisma, Unit } from "@prisma/client";
export const D = (valor: Prisma.Decimal.Value) => new Prisma.Decimal(valor);
export function money(valor: Prisma.Decimal.Value) {
  const valorArredondado = D(valor).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
  if (valorArredondado.abs().gt("999999999999.99"))
    throw new BadRequestException("Valor excede o limite monetário do banco");
  return valorArredondado;
}
export function validateQuantity(
  unidade: Unit,
  quantidade: Prisma.Decimal.Value,
) {
  const quantidadeDecimal = D(quantidade);
  if (
    quantidadeDecimal.lte(0) ||
    (["UN", "CX", "PCT"].includes(unidade) && !quantidadeDecimal.isInteger())
  )
    throw new BadRequestException(
      "Quantidade inválida para a unidade do produto",
    );
}
export function validatePayments(
  total: Prisma.Decimal,
  pagamentos: { valor: number }[],
) {
  const totalPagamentos = pagamentos.reduce(
    (acumulado, pagamento) => acumulado.plus(pagamento.valor),
    D(0),
  );
  if (!totalPagamentos.equals(total))
    throw new BadRequestException(
      "Pagamentos devem somar exatamente o total líquido; desconte o troco do pagamento em dinheiro",
    );
}
export function uniqueProducts(itens: { produtoId: string }[]) {
  if (new Set(itens.map((item) => item.produtoId)).size !== itens.length)
    throw new BadRequestException("Agrupe as quantidades do mesmo produto");
}
