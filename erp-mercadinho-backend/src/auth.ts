import {
  Body,
  Controller,
  Get,
  Injectable,
  Post,
  Req,
  SetMetadata,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { Throttle } from "@nestjs/throttler";
import { UserRole } from "@prisma/client";
import { Request } from "express";
import * as bcrypt from "bcrypt";
import { PrismaService } from "./prisma.service";
import { LoginDto } from "./dtos";
export type Actor = { id: string; perfil: UserRole };
export type AuthRequest = Request & { user: Actor };
export const Public = () => SetMetadata("public", true);
export const Admin = () => SetMetadata("roles", ["ADMIN"]);
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private db: PrismaService,
    private reflector: Reflector,
  ) {}
  async canActivate(contexto: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride("public", [
        contexto.getHandler(),
        contexto.getClass(),
      ])
    )
      return true;
    const requisicao = contexto.switchToHttp().getRequest<AuthRequest>();
    const [type, token] = (requisicao.headers.authorization || "").split(" ");
    if (type !== "Bearer" || !token)
      throw new UnauthorizedException("Token ausente");
    let sub: string;
    try {
      const payload = await this.jwt.verifyAsync(token, {
        algorithms: ["HS256"],
      });
      if (typeof payload.sub !== "string") throw Error();
      sub = payload.sub;
    } catch {
      throw new UnauthorizedException("Token inválido ou expirado");
    }
    const user = await this.db.usuario.findUnique({ where: { id: sub } });
    if (!user?.ativo) throw new UnauthorizedException("Usuário inativo");
    requisicao.user = { id: user.id, perfil: user.perfil };
    const roles = this.reflector.getAllAndOverride<UserRole[]>("roles", [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (roles && !roles.includes(user.perfil))
      throw new ForbiddenException("Acesso restrito ao administrador");
    return true;
  }
}
@Controller("auth")
export class AuthController {
  constructor(
    private db: PrismaService,
    private jwt: JwtService,
  ) {}
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post("login")
  async login(@Body() dados: LoginDto) {
    const user = await this.db.usuario.findUnique({
      where: { email: dados.email.trim().toLowerCase() },
    });
    // Hash fictício 
    const valid = await bcrypt.compare(
      dados.senha,
      user?.senhaHash ||
        "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW",
    );
    if (!user?.ativo || !valid)
      throw new UnauthorizedException("E-mail ou senha inválidos");
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      usuario: user,
    };
  }
  @Get("me") me(@Req() requisicao: AuthRequest) {
    return this.db.usuario.findUniqueOrThrow({
      where: { id: requisicao.user.id },
    });
  }
}
