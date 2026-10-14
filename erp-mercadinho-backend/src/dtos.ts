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
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString()
  @Length(1, 128)
  senha!: string;
}
export class UsuarioDto {
  @IsString()
  @Length(2, 150)
  nome!: string;
  @IsEmail()
  @MaxLength(254)
  email!: string;
  @IsString()
  @Length(10, 72)
  @Matches(/^[\x20-\x7E]+$/, {
    message: "Use senha de 10 a 72 caracteres ASCII para bcrypt",
  })
  senha!: string;
  @IsEnum(UserRole) perfil!: UserRole;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class UsuarioUpdateDto {
  @IsOptional()
  @IsString()
  @Length(2, 150)
  nome?: string;
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsString()
  @Length(10, 72)
  @Matches(/^[\x20-\x7E]+$/)
  senha?: string;
  @IsOptional()
  @IsEnum(UserRole)
  perfil?: UserRole;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class CategoriaDto {
  @IsString()
  @Length(2, 100)
  nome!: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class ProdutoDto {
  @IsUUID() categoriaId!: string;
  @IsOptional()
  @IsUUID()
  fornecedorId?: string;
  @IsString()
  @Length(2, 150)
  nome!: string;
  @IsString()
  @Length(1, 60)
  sku!: string;
  @IsOptional()
  @IsString()
  @Length(1, 40)
  codigoBarras?: string;
  @IsEnum(Unit) unidade!: Unit;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  precoCusto!: number;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  precoVenda!: number;
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999)
  estoqueMinimo!: number;
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  imagemUrl?: string;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class FornecedorDto {
  @IsString()
  @Length(2, 150)
  razaoSocial!: string;
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nomeFantasia?: string;
  @IsOptional()
  @Matches(/^\d{14}$/)
  cnpj?: string;
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string;
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class VinculoDto {
  @IsUUID() fornecedorId!: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  codigoFornecedor?: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  ultimoCusto?: number;
}
export class ClienteDto {
  @IsString()
  @Length(2, 150)
  nome!: string;
  @IsOptional()
  @Matches(/^(\d{11}|\d{14})$/)
  cpfCnpj?: string;
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string;
  @IsOptional()
  @IsEmail()
  email?: string;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  endereco?: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  limiteCredito?: number;
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
export class MovimentoDto {
  @IsUUID() produtoId!: string;
  @IsEnum(["ENTRADA", "SAIDA", "AJUSTE"]) tipo!: "ENTRADA" | "SAIDA" | "AJUSTE";
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999)
  quantidade!: number;
  @IsString()
  @Length(3, 500)
  observacao!: string;
}
export class AbrirCaixaDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  valorInicial!: number;
}
export class OperacaoDto {
  @IsEnum(["SANGRIA", "REFORCO"]) tipo!: "SANGRIA" | "REFORCO";
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  valor!: number;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
export class FecharCaixaDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  valorFinal!: number;
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
export class ItemVendaDto {
  @IsUUID() produtoId!: string;
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(999999999)
  quantidade!: number;
}
export class PagamentoDto {
  @IsEnum(PaymentMethod) forma!: PaymentMethod;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  valor!: number;
}
export class VendaDto {
  @IsUUID() caixaId!: string;
  @IsOptional()
  @IsUUID()
  clienteId?: string;
  @IsString()
  @Length(8, 100)
  chaveIdempotencia!: string;
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  desconto?: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ItemVendaDto)
  itens!: ItemVendaDto[];
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PagamentoDto)
  pagamentos!: PagamentoDto[];
}
export class CancelarDto {
  @IsString()
  @Length(3, 500)
  motivo!: string;
}
export class ItemCompraDto extends ItemVendaDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999)
  custoUnitario!: number;
}
export class CompraDto {
  @IsUUID() fornecedorId!: string;
  @IsOptional()
  @IsString()
  @MaxLength(100)
  numeroNota?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ItemCompraDto)
  itens!: ItemCompraDto[];
}
export class FinanceiroDto {
  @IsEnum(FinancialType) tipo!: FinancialType;
  @IsString()
  @Length(3, 500)
  descricao!: string;
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999999)
  valor!: number;
  @IsISO8601() vencimento!: string;
}
export class ConfiguracaoDto {
  @IsString()
  @MaxLength(150)
  razaoSocial!: string;
  @IsString()
  @MaxLength(150)
  nomeFantasia!: string;
  @Matches(/^(|\d{14})$/) cnpj!: string;
  @IsString()
  @MaxLength(30)
  inscricaoEstadual!: string;
  @IsString()
  @MaxLength(30)
  telefone!: string;
  @IsString()
  @MaxLength(254)
  email!: string;
  @IsString()
  @MaxLength(500)
  endereco!: string;
  @IsString()
  @MaxLength(100)
  cidade!: string;
  @IsEnum(["HOMOLOGACAO"]) ambienteNFCe!: string;
  @IsString()
  @MaxLength(150)
  impressoraPadrao!: string;
}
export class PageDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina: number = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limite: number = 20;
  @IsOptional()
  @IsString()
  @MaxLength(150)
  busca?: string;
  @IsOptional()
  @IsUUID()
  produtoId?: string;
}
