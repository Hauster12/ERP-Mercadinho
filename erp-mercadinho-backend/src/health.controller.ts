import { Controller, Get } from "@nestjs/common";
import { Public } from "./auth";
@Controller("health")
export class HealthController {
  @Public() @Get() health() {
    return { status: "ok" };
  }
}
