import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { PodiumsModule } from './modules/podiums/podiums.module';
import { ScrapingModule } from './modules/scraping/scraping.module';

@Module({
  imports: [CoreModule, PodiumsModule, ScrapingModule],
})
export class AppModule {}
