import { Module } from '@nestjs/common';
import { PodiumRepository } from './application/podium.repository';
import { RecordPodium } from './application/use-cases/record-podium';
import { PodiumsController } from './http/podiums.controller';
import { DrizzlePodiumRepository } from './infra/drizzle-podium.repository';

@Module({
  controllers: [PodiumsController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: PodiumRepository, useClass: DrizzlePodiumRepository },
    RecordPodium,
  ],
})
export class PodiumsModule {}
