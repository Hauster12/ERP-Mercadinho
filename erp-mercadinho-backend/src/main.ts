import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { LoggerPortugues } from "./logger";
import { ApiExceptionFilter, SerializeInterceptor } from "./common";
const LOCAL_CORS_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export function getCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const configured = (env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (env.NODE_ENV === "production" && configured.length === 0)
    throw Error("Configure CORS_ORIGINS com o domínio HTTPS do frontend");

  const origins = configured.length > 0 ? configured : LOCAL_CORS_ORIGINS;
  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw Error("CORS_ORIGINS deve conter somente origens HTTP/HTTPS válidas");
    }
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.origin !== origin ||
      (env.NODE_ENV === "production" && parsed.protocol !== "https:")
    )
      throw Error(
        "CORS_ORIGINS deve conter origens sem caminhos; em produção use HTTPS",
      );
  }
  return [...new Set(origins)];
}

export function validateEnvironment() {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET.includes("SUBSTITUA")
  )
    throw Error("Configure JWT_SECRET aleatório com pelo menos 32 caracteres");
  for (const campo of ["DATABASE_URL", "DIRECT_URL"])
    if (
      !process.env[campo]?.startsWith("postgresql://") &&
      !process.env[campo]?.startsWith("postgres://")
    )
      throw Error("Configure " + campo);
  getCorsOrigins();
}
export async function createApp() {
  validateEnvironment();
  const corsOrigins = getCorsOrigins();
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerPortugues(),
  });
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
    }),
  );
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) =>
      callback(null, !origin || corsOrigins.includes(origin)),
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Origin",
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalInterceptors(new SerializeInterceptor());
  app.enableShutdownHooks();
  return app;
}
if (require.main === module)
  createApp()
    .then((app) => app.listen(Number(process.env.PORT || 3000), "0.0.0.0"))
    .catch(() => {
      console.error("Falha ao iniciar. Verifique ambiente e banco de dados.");
      process.exit(1);
    });
