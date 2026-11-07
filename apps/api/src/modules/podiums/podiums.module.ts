import { Module } from '@nestjs/common';
import { PodiumRepository } from './application/podium.repository';
import { GetMedalTable } from './application/use-cases/get-medal-table';
import { ListPodiums } from './application/use-cases/list-podiums';
import { RecordPodium } from './application/use-cases/record-podium';
import { MedalsController } from './http/medals.controller';
import { PodiumsController } from './http/podiums.controller';
import { DrizzlePodiumRepository } from './infra/drizzle-podium.repository';

@Module({
  controllers: [PodiumsController, MedalsController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: PodiumRepository, useClass: DrizzlePodiumRepository },
    RecordPodium,
    GetMedalTable,
    ListPodiums,
  ],
})
export class PodiumsModule {}
