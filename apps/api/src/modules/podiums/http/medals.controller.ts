import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { type MedalTable, medalTableSchema } from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { GetMedalTable } from '../application/use-cases/get-medal-table';

class MedalTableDto extends createZodDto(medalTableSchema) {}

/** Couche fine : appeler le cas d'usage, sérialiser. Le calcul est dans le domaine. */
@ApiTags('medals')
@Controller('medals')
export class MedalsController {
  constructor(private readonly getMedalTable: GetMedalTable) {}

  @Get()
  @ZodSerializerDto(MedalTableDto)
  async table(): Promise<MedalTable> {
    return { items: await this.getMedalTable.execute() };
  }
}
