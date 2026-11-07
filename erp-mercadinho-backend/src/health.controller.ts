import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { Public } from "./auth";
@Controller("health")
export class HealthController {
  @Public() @SkipThrottle() @Get() health() {
    return { status: "ok" };
  }
}
