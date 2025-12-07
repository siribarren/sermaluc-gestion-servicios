import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { SyncModule } from './modules/sync/sync.module';
import { ServicesModule } from './modules/services/services.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PrismaModule } from './common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CollaboratorsModule,
    SyncModule,
    ServicesModule,
    ClientsModule,
  ],
})
export class AppModule {}

