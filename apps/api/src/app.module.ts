import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { PodiumsModule } from './modules/podiums/podiums.module';

@Module({
  imports: [CoreModule, PodiumsModule],
})
export class AppModule {}
