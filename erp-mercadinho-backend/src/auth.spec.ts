import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "./auth";
const jwt = new JwtService({
  secret: "unit-test-secret-with-thirty-two-characters",
});
function setup(roles?: string[], publicRoute = false) {
  const req: any = { headers: {} };
  const db: any = {
    usuario: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: "u", ativo: true, perfil: "FUNCIONARIO" }),
    },
  };
  const reflector: any = {
    getAllAndOverride: jest
      .fn()
      .mockImplementation((key: string) =>
        key === "public" ? publicRoute : roles,
      ),
  };
  const ctx: any = {
    getHandler: () => () => {},
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  };
  return {
    req,
    db,
    ctx,
    guard: new AuthGuard(jwt, db, reflector as Reflector),
  };
}
test("rota pública não exige JWT", async () => {
  const x = setup(undefined, true);
  expect(await x.guard.canActivate(x.ctx)).toBe(true);
  expect(x.db.usuario.findUnique).not.toHaveBeenCalled();
});
test("JWT ausente é bloqueado antes do banco", async () => {
  const x = setup();
  await expect(x.guard.canActivate(x.ctx)).rejects.toThrow("Token ausente");
  expect(x.db.usuario.findUnique).not.toHaveBeenCalled();
});
test("JWT com assinatura falsa é bloqueado", async () => {
  const x = setup();
  x.req.headers.authorization =
    "Bearer " + new JwtService({ secret: "other-secret" }).sign({ sub: "u" });
  await expect(x.guard.canActivate(x.ctx)).rejects.toThrow("Token inválido");
});
test("token válido gera identidade pela conta atual", async () => {
  const x = setup();
  x.req.headers.authorization =
    "Bearer " + jwt.sign({ sub: "u", perfil: "ADMIN" });
  expect(await x.guard.canActivate(x.ctx)).toBe(true);
  expect(x.req.user.perfil).toBe("FUNCIONARIO");
});
test("inativação revoga acesso mesmo com token válido", async () => {
  const x = setup();
  x.db.usuario.findUnique.mockResolvedValue({
    id: "u",
    ativo: false,
    perfil: "ADMIN",
  });
  x.req.headers.authorization = "Bearer " + jwt.sign({ sub: "u" });
  await expect(x.guard.canActivate(x.ctx)).rejects.toThrow("Usuário inativo");
});
test("funcionário não entra em rota de administrador", async () => {
  const x = setup(["ADMIN"]);
  x.req.headers.authorization = "Bearer " + jwt.sign({ sub: "u" });
  await expect(x.guard.canActivate(x.ctx)).rejects.toThrow("Acesso restrito");
});
