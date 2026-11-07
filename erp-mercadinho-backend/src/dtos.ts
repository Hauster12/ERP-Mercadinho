import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
  Matches,
} from "class-validator";
import { Unit, UserRole, PaymentMethod, FinancialType } from "@prisma/client";

export class LoginDto {
  @IsEmail({}, { message: "Informe um endereço de e-mail válido" })
  @MaxLength(254, { message: "O e-mail deve ter no máximo 254 caracteres" })
  email!: string;

  @IsString({ message: "Informe a senha de acesso" })
  @Length(1, 128, { message: "A senha deve ter entre 1 e 128 caracteres" })
  senha!: string;
}

export class UsuarioDto {
  @IsString({ message: "O nome deve ser um texto válido" })
  @Length(2, 150, { message: "O nome deve ter entre 2 e 150 caracteres" })
  nome!: string;

  @IsEmail({}, { message: "Informe um endereço de e-mail válido" })
  @MaxLength(254, { message: "O e-mail deve ter no máximo 254 caracteres" })
  email!: string;

  @IsString({ message: "A senha deve ser um texto válido" })
  @Length(6, 72, { message: "A senha deve ter entre 6 e 72 caracteres" })
  @Matches(/^[\x20-\x7E]+$/, {
    message: "A senha deve conter de 6 a 72 caracteres válidos (sem caracteres especiais inválidos)",
  })
  senha!: string;

  @IsEnum(UserRole, { message: "Perfil inválido. Escolha ADMIN ou FUNCIONARIO" })
  perfil!: UserRole;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class UsuarioUpdateDto {
  @IsOptional()
  @IsString({ message: "O nome deve ser um texto válido" })
  @Length(2, 150, { message: "O nome deve ter entre 2 e 150 caracteres" })
  nome?: string;

  @IsOptional()
  @IsEmail({}, { message: "Informe um endereço de e-mail válido" })
  email?: string;

  @IsOptional()
  @IsString({ message: "A senha deve ser um texto válido" })
  @Length(6, 72, { message: "A nova senha deve ter entre 6 e 72 caracteres" })
  @Matches(/^[\x20-\x7E]+$/, {
    message: "A nova senha deve conter apenas caracteres válidos",
  })
  senha?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: "Perfil inválido. Escolha ADMIN ou FUNCIONARIO" })
  perfil?: UserRole;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class CategoriaDto {
  @IsString({ message: "O nome da categoria deve ser um texto válido" })
  @Length(2, 100, { message: "O nome da categoria deve ter entre 2 e 100 caracteres" })
  nome!: string;

  @IsOptional()
  @IsString({ message: "A descrição deve ser um texto válido" })
  @MaxLength(500, { message: "A descrição deve ter no máximo 500 caracteres" })
  descricao?: string;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class ProdutoDto {
  @IsUUID("all", { message: "Selecione uma categoria válida" })
  categoriaId!: string;

  @IsOptional()
  @IsUUID("all", { message: "Selecione um fornecedor válido" })
  fornecedorId?: string;

  @IsString({ message: "O nome do produto deve ser um texto válido" })
  @Length(2, 150, { message: "O nome do produto deve ter entre 2 e 150 caracteres" })
  nome!: string;

  @IsString({ message: "O código SKU deve ser um texto válido" })
  @Length(1, 60, { message: "O código SKU deve ter entre 1 e 60 caracteres" })
  sku!: string;

  @IsOptional()
  @IsString({ message: "O código de barras deve ser um texto válido" })
  @Length(1, 40, { message: "O código de barras deve ter entre 1 e 40 caracteres" })
  codigoBarras?: string;

  @IsEnum(Unit, { message: "Unidade de medida inválida (use UN, KG, L, CX ou PCT)" })
  unidade!: Unit;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O preço de custo deve ser um número com até 2 casas decimais" })
  @Min(0, { message: "O preço de custo não pode ser negativo" })
  @Max(999999999, { message: "O preço de custo excede o limite permitido" })
  precoCusto!: number;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O preço de venda deve ser um número com até 2 casas decimais" })
  @Min(0.01, { message: "O preço de venda deve ser maior que zero (mínimo R$ 0,01)" })
  @Max(999999999, { message: "O preço de venda excede o limite permitido" })
  precoVenda!: number;

  @IsNumber({ maxDecimalPlaces: 3 }, { message: "O estoque mínimo deve ser um número válido" })
  @Min(0, { message: "O estoque mínimo não pode ser negativo" })
  @Max(999999999, { message: "O estoque mínimo excede o limite permitido" })
  estoqueMinimo!: number;

  @IsOptional()
  @IsString({ message: "A URL da imagem deve ser um texto válido" })
  @MaxLength(2000, { message: "A URL da imagem deve ter no máximo 2000 caracteres" })
  imagemUrl?: string;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class FornecedorDto {
  @IsString({ message: "A razão social deve ser um texto válido" })
  @Length(2, 150, { message: "A razão social deve ter entre 2 e 150 caracteres" })
  razaoSocial!: string;

  @IsOptional()
  @IsString({ message: "O nome fantasia deve ser um texto válido" })
  @MaxLength(150, { message: "O nome fantasia deve ter no máximo 150 caracteres" })
  nomeFantasia?: string;

  @IsOptional()
  @Matches(/^\d{14}$/, { message: "O CNPJ deve conter exatamente 14 números (apenas dígitos)" })
  cnpj?: string;

  @IsOptional()
  @IsString({ message: "O telefone deve ser um texto válido" })
  @MaxLength(30, { message: "O telefone deve ter no máximo 30 caracteres" })
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: "Informe um e-mail válido para o fornecedor" })
  email?: string;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class VinculoDto {
  @IsUUID("all", { message: "Fornecedor inválido" })
  fornecedorId!: string;

  @IsOptional()
  @IsString({ message: "O código do fornecedor deve ser um texto válido" })
  @MaxLength(100, { message: "O código do fornecedor deve ter no máximo 100 caracteres" })
  codigoFornecedor?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O último custo deve ser um valor numérico válido" })
  @Min(0, { message: "O último custo não pode ser negativo" })
  ultimoCusto?: number;
}

export class ClienteDto {
  @IsString({ message: "O nome do cliente deve ser um texto válido" })
  @Length(2, 150, { message: "O nome do cliente deve ter entre 2 e 150 caracteres" })
  nome!: string;

  @IsOptional()
  @Matches(/^(\d{11}|\d{14})$/, {
    message: "O CPF deve conter 11 números ou o CNPJ 14 números (apenas dígitos)",
  })
  cpfCnpj?: string;

  @IsOptional()
  @IsString({ message: "O telefone deve ser um texto válido" })
  @MaxLength(30, { message: "O telefone deve ter no máximo 30 caracteres" })
  telefone?: string;

  @IsOptional()
  @IsEmail({}, { message: "Informe um e-mail válido para o cliente" })
  email?: string;

  @IsOptional()
  @IsString({ message: "O endereço deve ser um texto válido" })
  @MaxLength(500, { message: "O endereço deve ter no máximo 500 caracteres" })
  endereco?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O limite de crédito deve ser um valor numérico válido" })
  @Min(0, { message: "O limite de crédito não pode ser negativo" })
  limiteCredito?: number;

  @IsOptional()
  @IsBoolean({ message: "O status ativo deve ser verdadeiro ou falso" })
  ativo?: boolean;
}

export class MovimentoDto {
  @IsUUID("all", { message: "Selecione um produto válido" })
  produtoId!: string;

  @IsEnum(["ENTRADA", "SAIDA", "AJUSTE"], {
    message: "Tipo de movimentação inválido (use ENTRADA, SAIDA ou AJUSTE)",
  })
  tipo!: "ENTRADA" | "SAIDA" | "AJUSTE";

  @IsNumber({ maxDecimalPlaces: 3 }, { message: "A quantidade deve ser um número válido" })
  @Min(0, { message: "A quantidade não pode ser negativa" })
  @Max(999999999, { message: "A quantidade excede o limite permitido" })
  quantidade!: number;

  @IsString({ message: "A observação deve ser um texto válido" })
  @Length(3, 500, { message: "A observação/justificativa deve ter entre 3 e 500 caracteres" })
  observacao!: string;
}

export class AbrirCaixaDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O valor inicial deve ser um número válido" })
  @Min(0, { message: "O valor inicial não pode ser negativo" })
  @Max(999999999, { message: "O valor inicial excede o limite permitido" })
  valorInicial!: number;

  @IsOptional()
  @IsInt({ message: "O número do caixa deve ser um número inteiro" })
  @Min(1, { message: "O número do caixa deve ser no mínimo 1" })
  @Max(10, { message: "O número do caixa deve ser no máximo 10" })
  numeroCaixa?: number;
}

export class OperacaoDto {
  @IsEnum(["SANGRIA", "REFORCO"], {
    message: "Tipo de operação inválido (use SANGRIA ou REFORCO)",
  })
  tipo!: "SANGRIA" | "REFORCO";

  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O valor da operação deve ser um número válido" })
  @Min(0.01, { message: "O valor da operação deve ser de pelo menos R$ 0,01" })
  @Max(999999999, { message: "O valor da operação excede o limite permitido" })
  valor!: number;

  @IsOptional()
  @IsString({ message: "A observação deve ser um texto válido" })
  @MaxLength(500, { message: "A observação deve ter no máximo 500 caracteres" })
  observacao?: string;
}

export class FecharCaixaDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O valor final contado deve ser um número válido" })
  @Min(0, { message: "O valor final contado não pode ser negativo" })
  @Max(999999999, { message: "O valor final contado excede o limite permitido" })
  valorFinal!: number;

  @IsOptional()
  @IsString({ message: "A observação deve ser um texto válido" })
  @MaxLength(1000, { message: "A observação deve ter no máximo 1000 caracteres" })
  observacao?: string;

  @IsOptional()
  @IsString({ message: "O recado ao próximo operador deve ser um texto válido" })
  @MaxLength(1000, { message: "O recado deve ter no máximo 1000 caracteres" })
  recadoProximoOperador?: string;

  @IsOptional()
  @IsString({ message: "O recado ao administrador deve ser um texto válido" })
  @MaxLength(1000, { message: "O recado ao administrador deve ter no máximo 1000 caracteres" })
  recadoAdmin?: string;

  @IsOptional()
  @IsInt({ message: "O número do caixa deve ser um número inteiro" })
  @Min(1, { message: "O número do caixa deve ser no mínimo 1" })
  @Max(10, { message: "O número do caixa deve ser no máximo 10" })
  numeroCaixa?: number;
}

export class AvisarAdminDto {
  @IsString({ message: "A mensagem deve ser um texto válido" })
  @Length(2, 500, { message: "A mensagem deve ter entre 2 e 500 caracteres" })
  mensagem!: string;

  @IsOptional()
  @IsInt({ message: "O número do caixa deve ser um número inteiro" })
  @Min(1, { message: "O número do caixa deve ser no mínimo 1" })
  @Max(10, { message: "O número do caixa deve ser no máximo 10" })
  numeroCaixa?: number;
}

export class ItemVendaDto {
  @IsUUID("all", { message: "Produto inválido no carrinho" })
  produtoId!: string;

  @IsNumber({ maxDecimalPlaces: 3 }, { message: "A quantidade do item deve ser um número válido" })
  @Min(0.001, { message: "A quantidade mínima do item é 0,001" })
  @Max(999999999, { message: "A quantidade do item excede o limite permitido" })
  quantidade!: number;

}

export class ItemVendaPdvDto extends ItemVendaDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O preço registrado no PDV deve ter até 2 casas decimais" })
  @Min(0.01, { message: "O preço registrado no PDV deve ser maior que zero" })
  precoUnitarioEsperado?: number;
}

export class PagamentoDto {
  @IsEnum(PaymentMethod, {
    message: "Forma de pagamento inválida (use DINHEIRO, PIX, CARTAO_DEBITO ou CARTAO_CREDITO)",
  })
  forma!: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O valor do pagamento deve ser um número válido" })
  @Min(0.01, { message: "O valor do pagamento deve ser de pelo menos R$ 0,01" })
  @Max(999999999, { message: "O valor do pagamento excede o limite permitido" })
  valor!: number;
}

export class VendaDto {
  @IsUUID("all", { message: "Identificador do caixa inválido" })
  caixaId!: string;

  @IsOptional()
  @IsUUID("all", { message: "Identificador do cliente inválido" })
  clienteId?: string;

  @IsString({ message: "Chave de identificação da venda inválida" })
  @Length(8, 100, { message: "A chave de identificação deve ter entre 8 e 100 caracteres" })
  chaveIdempotencia!: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O desconto deve ser um valor numérico válido" })
  @Min(0, { message: "O desconto não pode ser negativo" })
  desconto?: number;

  @IsArray({ message: "A lista de itens da venda é inválida" })
  @ArrayMinSize(1, { message: "Adicione pelo menos 1 produto para realizar a venda" })
  @ArrayMaxSize(100, { message: "A venda pode ter no máximo 100 itens distintos" })
  @ValidateNested({ each: true })
  @Type(() => ItemVendaPdvDto)
  itens!: ItemVendaPdvDto[];

  @IsArray({ message: "A lista de pagamentos é inválida" })
  @ArrayMinSize(1, { message: "Informe pelo menos 1 forma de pagamento" })
  @ArrayMaxSize(10, { message: "A venda pode ter no máximo 10 pagamentos" })
  @ValidateNested({ each: true })
  @Type(() => PagamentoDto)
  pagamentos!: PagamentoDto[];
}

export class CancelarDto {
  @IsString({ message: "Informe o motivo do cancelamento" })
  @Length(3, 500, { message: "O motivo do cancelamento deve ter entre 3 e 500 caracteres" })
  motivo!: string;
}

export class ItemCompraDto extends ItemVendaDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O custo unitário deve ser um número válido" })
  @Min(0, { message: "O custo unitário não pode ser negativo" })
  @Max(999999999, { message: "O custo unitário excede o limite permitido" })
  custoUnitario!: number;
}

export class CompraDto {
  @IsUUID("all", { message: "Selecione um fornecedor válido" })
  fornecedorId!: string;

  @IsOptional()
  @IsString({ message: "O número da nota fiscal deve ser um texto válido" })
  @MaxLength(100, { message: "O número da nota fiscal deve ter no máximo 100 caracteres" })
  numeroNota?: string;

  @IsArray({ message: "A lista de itens do pedido é inválida" })
  @ArrayMinSize(1, { message: "Adicione pelo menos 1 item ao pedido de compra" })
  @ArrayMaxSize(100, { message: "O pedido de compra pode ter no máximo 100 itens" })
  @ValidateNested({ each: true })
  @Type(() => ItemCompraDto)
  itens!: ItemCompraDto[];
}

export class FinanceiroDto {
  @IsEnum(FinancialType, { message: "Tipo de lançamento inválido (use RECEITA ou DESPESA)" })
  tipo!: FinancialType;

  @IsString({ message: "A descrição deve ser um texto válido" })
  @Length(3, 500, { message: "A descrição deve ter entre 3 e 500 caracteres" })
  descricao!: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: "O valor deve ser um número válido" })
  @Min(0.01, { message: "O valor deve ser de pelo menos R$ 0,01" })
  @Max(999999999, { message: "O valor excede o limite permitido" })
  valor!: number;

  @IsISO8601({}, { message: "Informe uma data de vencimento válida" })
  vencimento!: string;
}

export class ConfiguracaoDto {
  @IsOptional()
  @IsNumber({}, { message: "ID inválido" })
  id?: number;

  @IsString({ message: "A razão social deve ser um texto válido" })
  @MaxLength(150, { message: "A razão social deve ter no máximo 150 caracteres" })
  razaoSocial!: string;

  @IsOptional()
  @IsString({ message: "O nome fantasia deve ser um texto válido" })
  @MaxLength(150, { message: "O nome fantasia deve ter no máximo 150 caracteres" })
  nomeFantasia?: string;

  @IsOptional()
  @Matches(/^(|\d{14})$/, { message: "O CNPJ deve conter exatamente 14 números (apenas dígitos)" })
  cnpj?: string;

  @IsOptional()
  @IsString({ message: "A inscrição estadual deve ser um texto válido" })
  @MaxLength(30, { message: "A inscrição estadual deve ter no máximo 30 caracteres" })
  inscricaoEstadual?: string;

  @IsOptional()
  @IsString({ message: "O telefone deve ser um texto válido" })
  @MaxLength(30, { message: "O telefone deve ter no máximo 30 caracteres" })
  telefone?: string;

  @IsOptional()
  @IsString({ message: "O e-mail deve ser um texto válido" })
  @MaxLength(254, { message: "O e-mail deve ter no máximo 254 caracteres" })
  email?: string;

  @IsOptional()
  @IsString({ message: "O endereço deve ser um texto válido" })
  @MaxLength(500, { message: "O endereço deve ter no máximo 500 caracteres" })
  endereco?: string;

  @IsOptional()
  @IsString({ message: "A cidade deve ser um texto válido" })
  @MaxLength(100, { message: "A cidade deve ter no máximo 100 caracteres" })
  cidade?: string;

  @IsOptional()
  @IsEnum(["HOMOLOGACAO"], { message: "Ambiente NFC-e inválido" })
  ambienteNFCe?: string;

  @IsOptional()
  @IsString({ message: "A impressora padrão deve ser um texto válido" })
  @MaxLength(150, { message: "O nome da impressora deve ter no máximo 150 caracteres" })
  impressoraPadrao?: string;

  @IsOptional()
  atualizadoEm?: any;
}

export class PageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "A página deve ser um número inteiro" })
  @Min(1, { message: "A página mínima é 1" })
  pagina: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "O limite deve ser um número inteiro" })
  @Min(1, { message: "O limite mínimo é 1" })
  @Max(100, { message: "O limite máximo é 100 registros por página" })
  limite: number = 20;

  @IsOptional()
  @IsString({ message: "O termo de busca deve ser um texto válido" })
  @MaxLength(150, { message: "A busca deve ter no máximo 150 caracteres" })
  busca?: string;

  @IsOptional()
  @IsUUID("all", { message: "Identificador de produto inválido" })
  produtoId?: string;

  @IsOptional()
  @IsUUID("all", { message: "Identificador de caixa inválido" })
  caixaId?: string;
}
