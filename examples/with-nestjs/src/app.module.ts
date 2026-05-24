import { Controller, Get, Module } from "@nestjs/common";

@Controller()
export class AppController {
  @Get()
  index(): string {
    return "Try /jobs for the Workbench dashboard.";
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}
