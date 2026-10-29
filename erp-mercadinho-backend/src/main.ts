import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { LoggerPortugues } from "./logger";
import { ApiExceptionFilter, SerializeInterceptor } from "./common";
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
}
export async function createApp() {
  validateEnvironment();
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
    origin: true,
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
