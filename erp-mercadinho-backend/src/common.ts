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
    return out;
  }
  return value;
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
      message: any = "Erro interno";
    if (erro instanceof HttpException) {
      status = erro.getStatus();
      message = (erro.getResponse() as any).message || erro.message;
    } else if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      const codes: Record<string, [number, string]> = {
        P2002: [409, "Registro duplicado"],
        P2025: [404, "Registro não encontrado"],
        P2003: [400, "Relacionamento inválido ou registro em uso"],
        P2004: [400, "Operação viola uma regra do banco"],
      };
      [status, message] = codes[erro.code] || [500, "Falha ao acessar o banco"];
    }
    if (status === 500)
      console.error(
        "Falha interna",
        erro instanceof Error ? erro.name : "Unknown",
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
