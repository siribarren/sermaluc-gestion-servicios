import { Controller, Post, Get } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('internal/sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('collaborators')
  async syncCollaborators() {
    await this.syncService.syncMasterSheet();
    await this.syncService.syncHRSheets();
    return { message: 'Sync completed successfully' };
  }

  @Get('health')
  async getSyncHealth() {
    const recentSyncs = await this.syncService.getRecentSyncs();
    return recentSyncs;
  }
}

