import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  ConflictException,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
  async serial<T>(
    executarOperacao: (transacao: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (let tentativa = 0; tentativa < 4; tentativa++) {
      try {
        return await this.$transaction(executarOperacao, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 15000,
        });
      } catch (erro) {
        if (
          erro instanceof Prisma.PrismaClientKnownRequestError &&
          erro.code === "P2034"
        ) {
          if (tentativa === 3)
            throw new ConflictException(
              "Conflito simultâneo. Tente novamente.",
            );
          continue;
        }
        throw erro;
      }
    }
    throw new ConflictException();
  }
}
