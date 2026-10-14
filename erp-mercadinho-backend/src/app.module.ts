import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { PrismaService } from "./prisma.service";
import { AuthController, AuthGuard } from "./auth";
import { CatalogController } from "./catalog.controller";
import { StockController, StockService } from "./stock";
import { CashController, CashService } from "./cash";
import { SalesController, SalesService } from "./sales";
import { PurchasesController, PurchasesService } from "./purchases";
import { FinanceController } from "./finance.controller";
import { HealthController } from "./health.controller";
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: "8h", algorithm: "HS256" },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [
    AuthController,
    CatalogController,
    StockController,
    CashController,
    SalesController,
    PurchasesController,
    FinanceController,
    HealthController,
  ],
  providers: [
    PrismaService,
    StockService,
    CashService,
    SalesService,
    PurchasesService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
