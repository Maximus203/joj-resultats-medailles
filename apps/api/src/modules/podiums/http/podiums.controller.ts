import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  listPodiumsQuerySchema,
  type PodiumList,
  podiumListSchema,
  podiumSchema,
  type PodiumResponse,
  type PublishedPodium,
  recordPodiumSchema,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { ListPodiums } from '../application/use-cases/list-podiums';
import { RecordPodium } from '../application/use-cases/record-podium';
import type { Podium } from '../domain/podium';

class RecordPodiumDto extends createZodDto(recordPodiumSchema) {}
class PodiumDto extends createZodDto(podiumSchema) {}
class ListPodiumsQueryDto extends createZodDto(listPodiumsQuerySchema) {}
class PodiumListDto extends createZodDto(podiumListSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('podiums')
@Controller('podiums')
export class PodiumsController {
  constructor(
    private readonly recordPodium: RecordPodium,
    private readonly listPodiums: ListPodiums,
  ) {}

  @Post()
  @ZodSerializerDto(PodiumDto)
  async record(@Body() body: RecordPodiumDto): Promise<PodiumResponse> {
    return toResponse(await this.recordPodium.execute(body));
  }

  @Get()
  @ZodSerializerDto(PodiumListDto)
  async list(@Query() query: ListPodiumsQueryDto): Promise<PodiumList> {
    const podiums = await this.listPodiums.execute(query);
    return { items: podiums.map(toPublishedResponse) };
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

function toPublishedResponse(podium: Podium): PublishedPodium {
  return { ...toResponse(podium), correctedAt: podium.correctedAt?.toISOString() ?? null };
}
