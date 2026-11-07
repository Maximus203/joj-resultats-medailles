import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import type { DatabaseConnection } from '../database/database';
import { DATABASE_CONNECTION } from '../database/database.module';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly connection: DatabaseConnection) {}

  /** L'API répond et la base aussi. */
  @Get()
  async check(): Promise<{ status: 'ok'; database: DatabaseConnection['mode'] }> {
    await this.connection.db.execute(sql`select 1`);
    return { status: 'ok', database: this.connection.mode };
  }
}
