import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { podiumSchema, type PodiumResponse, recordPodiumSchema } from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { RecordPodium } from '../application/use-cases/record-podium';
import type { Podium } from '../domain/podium';

class RecordPodiumDto extends createZodDto(recordPodiumSchema) {}
class PodiumDto extends createZodDto(podiumSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('podiums')
@Controller('podiums')
export class PodiumsController {
  constructor(private readonly recordPodium: RecordPodium) {}

  @Post()
  @ZodSerializerDto(PodiumDto)
  async record(@Body() body: RecordPodiumDto): Promise<PodiumResponse> {
    return toResponse(await this.recordPodium.execute(body));
  }
}

function toResponse(podium: Podium): PodiumResponse {
  return {
    id: podium.id,
    eventName: podium.eventName,
    discipline: podium.discipline,
    day: podium.day,
    gold: podium.gold,
    silver: podium.silver,
    bronze: podium.bronze,
    createdAt: podium.createdAt.toISOString(),
  };
}
