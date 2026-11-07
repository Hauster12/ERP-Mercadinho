import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { map } from "rxjs/operators";

export function extrairNumeroCaixaOperacoes(operacoes?: any[]): number | undefined {
  if (!Array.isArray(operacoes)) return undefined;
  const op =
    operacoes.find((o) => o?.tipo === "ABERTURA") ||
    operacoes.find((o) => o?.tipo === "FECHAMENTO");
  if (op?.observacao && typeof op.observacao === "string") {
    try {
      const parsed = JSON.parse(op.observacao);
      if (parsed?.numeroCaixa) return Number(parsed.numeroCaixa) || 1;
    } catch {}
  }
  return undefined;
}

export function serialize(value: any): any {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const { senhaHash, ...safe } = value;
    const out: any = Object.fromEntries(
      Object.entries(safe).map(([campo, valor]) => [campo, serialize(valor)]),
    );
    if (safe.categoria) out.categoriaNome = safe.categoria.nome;
    if (safe.fornecedor)
      out.fornecedorNome =
        safe.fornecedor.nomeFantasia || safe.fornecedor.razaoSocial;
    if (safe.usuario) out.usuarioNome = safe.usuario.nome;
    if (safe.produto) out.produtoNome = safe.produto.nome;
    if (safe.cliente) out.clienteNome = safe.cliente.nome;
    if (safe.caixa) {
      const numFromCaixa =
        safe.caixa.numeroCaixa ||
        extrairNumeroCaixaOperacoes(safe.caixa.operacoes) ||
        1;
      if (out.numeroCaixa === undefined) out.numeroCaixa = numFromCaixa;
    } else if (Array.isArray(safe.operacoes) && out.numeroCaixa === undefined) {
      out.numeroCaixa = extrairNumeroCaixaOperacoes(safe.operacoes) || 1;
    }
    return out;
  }
  return value;
}

export function traduzirMensagemErro(msg: unknown): string {
  if (typeof msg !== "string") return "Erro inesperado na requisição";
  const texto = msg.trim();
  if (!texto) return "Erro inesperado na requisição";

  if (
    texto.includes("ThrottlerException") ||
    texto.toLowerCase().includes("too many requests")
  ) {
    return "Muitas tentativas seguidas. Aguarde um instante e tente novamente.";
  }
  if (texto.includes("Validation failed (uuid is expected)")) {
    return "Identificador inválido (formato UUID esperado).";
  }
  if (texto.includes("Validation failed (numeric string is expected)")) {
    return "Valor numérico inválido.";
  }
  if (texto === "Forbidden resource" || texto === "Forbidden") {
    return "Acesso negado: você não tem permissão para realizar esta operação.";
  }
  if (texto === "Unauthorized") {
    return "Sessão inválida ou expirada. Faça login novamente.";
  }
  if (texto === "Bad Request") {
    return "Dados inválidos na requisição. Verifique os campos preenchidos.";
  }
  if (texto === "Not Found" || /^Cannot (GET|POST|PUT|PATCH|DELETE) /i.test(texto)) {
    return "Rota ou recurso não encontrado no servidor.";
  }
  if (texto === "Internal server error") {
    return "Erro interno do servidor.";
  }
  if (texto.includes("Unexpected token") && texto.includes("JSON")) {
    return "Formato de dados JSON inválido enviado na requisição.";
  }

  // Traduções de mensagens residuais do class-validator
  let traduzido = texto
    .replace(/^property (.+) should not exist$/i, "O campo '$1' não é permitido")
    .replace(/^each value in /i, "Cada item em ")
    .replace(/^(.+) must be an email$/i, "O campo '$1' deve ser um e-mail válido")
    .replace(/^(.+) must be a UUID$/i, "O campo '$1' deve ter um identificador válido")
    .replace(/^(.+) must be a string$/i, "O campo '$1' deve ser um texto válido")
    .replace(/^(.+) must be a boolean value$/i, "O campo '$1' deve ser verdadeiro ou falso")
    .replace(/^(.+) must be an integer number$/i, "O campo '$1' deve ser um número inteiro")
    .replace(/^(.+) must be a number.*$/i, "O campo '$1' deve ser um número válido")
    .replace(/^(.+) must be longer than or equal to (\d+) characters$/i, "O campo '$1' deve ter no mínimo $2 caracteres")
    .replace(/^(.+) must be shorter than or equal to (\d+) characters$/i, "O campo '$1' deve ter no máximo $2 caracteres")
    .replace(/^(.+) must not be less than (.+)$/i, "O campo '$1' não pode ser menor que $2")
    .replace(/^(.+) must not be greater than (.+)$/i, "O campo '$1' não pode ser maior que $2")
    .replace(/^(.+) must be one of the following values: (.+)$/i, "O campo '$1' deve ser um dos seguintes valores: $2")
    .replace(/^(.+) must match (.*) regular expression$/i, "O campo '$1' está em formato inválido")
    .replace(/^(.+) must contain at least (\d+) elements$/i, "O campo '$1' deve conter pelo menos $2 item(ns)")
    .replace(/^(.+) must contain not more than (\d+) elements$/i, "O campo '$1' deve conter no máximo $2 itens")
    .replace(/^(.+) must be an array$/i, "O campo '$1' deve ser uma lista")
    .replace(/^(.+) must be a valid ISO 8601 date string$/i, "O campo '$1' deve ser uma data válida");

  return traduzido;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map(serialize));
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(erro: any, host: ArgumentsHost) {
    let status = 500,
      message: any = "Erro interno no servidor";
    if (erro instanceof HttpException) {
      status = erro.getStatus();
      const rawMessage = (erro.getResponse() as any)?.message || erro.message;
      message = Array.isArray(rawMessage)
        ? rawMessage.map(traduzirMensagemErro)
        : traduzirMensagemErro(rawMessage);
    } else if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      const codes: Record<string, [number, string]> = {
        P2002: [409, "Registro duplicado: já existe um cadastro com estes dados (e-mail, SKU, CPF/CNPJ ou código de barras)"],
        P2025: [404, "Registro não encontrado"],
        P2003: [400, "Relacionamento inválido ou registro em uso por outras operações"],
        P2004: [400, "Operação viola uma regra do banco de dados"],
      };
      [status, message] = codes[erro.code] || [500, "Falha ao acessar o banco de dados"];
    }
    if (status === 500)
      console.error(
        "Falha interna",
        erro instanceof Error ? erro.name : "Desconhecido",
      );
    const res = host.switchToHttp().getResponse();
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept, X-Requested-With, Origin",
    );
    res.status(status).json({ statusCode: status, message });
  }
}
