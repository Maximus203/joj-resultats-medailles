import { Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { AppConfig } from '../config/app-config';
import { type DatabaseConnection, openDatabase } from './database';

/** Jeton d'injection de l'instance Drizzle : `@Inject(DATABASE) db: Database`. */
export const DATABASE = Symbol('DATABASE');
export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      inject: [AppConfig],
      useFactory: async (config: AppConfig): Promise<DatabaseConnection> => {
        const connection = openDatabase({
          databaseUrl: config.get('DATABASE_URL'),
          pgliteDataDir: config.get('PGLITE_DATA_DIR'),
        });
        // En production, les migrations seraient une étape de déploiement à part.
        if (config.get('NODE_ENV') !== 'production') {
          await connection.migrate();
        }
        new Logger('Database').log(`Base de données : ${connection.mode}`);
        return connection;
      },
    },
    {
      provide: DATABASE,
      inject: [DATABASE_CONNECTION],
      useFactory: (connection: DatabaseConnection) => connection.db,
    },
  ],
  exports: [DATABASE, DATABASE_CONNECTION],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_CONNECTION) private readonly connection: DatabaseConnection) {}

  async onApplicationShutdown(): Promise<void> {
    await this.connection.close();
  }
}
