import { ConsoleLogger } from "@nestjs/common";

export function traduzirLog(message: unknown): unknown {
  if (typeof message !== "string") return message;
  return message
    .replace("Starting Nest application...", "Iniciando aplicação Nest...")
    .replace(
      "Nest application successfully started",
      "Aplicação Nest iniciada com sucesso",
    )
    .replace(
      /^(.+) dependencies initialized$/,
      "Dependências de $1 inicializadas",
    )
    .replace(/^Mapped (\{.+\}) route$/, "Rota registrada $1")
    .replace(/^(\w+Controller) (\{.*\}):$/, "Controlador $1 $2:");
}

export class LoggerPortugues extends ConsoleLogger {
  override log(message: any, ...optionalParams: any[]) {
    super.log(traduzirLog(message), ...optionalParams);
  }
}
