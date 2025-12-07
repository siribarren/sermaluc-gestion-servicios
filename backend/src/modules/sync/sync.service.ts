import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CollaboratorStatus, ChangeType, SyncType, SyncStatus } from '@prisma/client';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private sheets: any;

  // IDs de las hojas de Google Sheets
  private readonly MASTER_SHEET_ID = '1TA-fkVC7T7dlBa9VWIPOIeSEOosDk_Cd1-VFKERByng';
  private readonly MASTER_SHEET_GID = '269393876'; // GID de la hoja específica
  private readonly HR_SHEET_ID = '1UhHy65woxg5h9TLOvKY3qWqU77npKuQQKP8in5PaPb8';
  private readonly HR_SHEET_CHILE_GID = '0';
  private readonly HR_SHEET_PERU_GID = '306343796';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.initializeSheets();
  }

  private async initializeSheets() {
    try {
      const serviceAccountKey = this.config.get('GOOGLE_SERVICE_ACCOUNT_KEY');
      
      if (!serviceAccountKey) {
        this.logger.warn('GOOGLE_SERVICE_ACCOUNT_KEY not found, sync will not work');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      this.sheets = google.sheets({ version: 'v4', auth });
    } catch (error) {
      this.logger.error('Failed to initialize Google Sheets API', error);
    }
  }

  async syncMasterSheet() {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    this.logger.log('Starting Master Sheet sync...');
    const syncLog = await this.prisma.syncLog.create({
      data: {
        syncType: SyncType.MASTER_SHEET,
        status: SyncStatus.RUNNING,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        startedAt: new Date(),
      },
    });

    try {
      // Usar el GID específico de la hoja
      const range = `Sheet1!A2:O`; // Ajustar según columnas reales
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.MASTER_SHEET_ID,
        range,
      });

      const rows = response.data.values || [];
      let processed = 0;
      let created = 0;
      let updated = 0;

      for (const row of rows) {
        if (!row[0]) continue; // Skip empty RUT
        
        const [
          rutDni,
          nombre,
          estado,
          fechaCambioSS,
          fechaIngresoSermaluc,
          fechaFiniquito,
          fechaFinalizacionSS,
          centroCosto,
          nombreServicio,
          cliente,
          tarifa,
          cargo,
          coordinador,
        ] = row;

        // Normalizar y validar datos
        const collaboratorData = {
          rutDni: rutDni?.trim(),
          nombre: nombre?.trim(),
          estado: this.normalizeEstado(estado?.trim()),
          fechaIngresoSermaluc: this.parseDate(fechaIngresoSermaluc),
          fechaFiniquito: this.parseDate(fechaFiniquito),
          fechaFinalizacion: this.parseDate(fechaFinalizacionSS),
          tarifa: tarifa ? parseFloat(tarifa) : null,
          cargo: cargo?.trim(),
          coordinator: coordinador?.trim(),
        };

        if (!collaboratorData.rutDni || !collaboratorData.nombre) {
          continue; // Skip invalid rows
        }

        // Buscar o crear Cost Center, Service, Client
        const costCenter = centroCosto 
          ? await this.upsertCostCenter(centroCosto)
          : null;
        const service = nombreServicio
          ? await this.upsertService(nombreServicio)
          : null;
        const client = cliente
          ? await this.upsertClient(cliente)
          : null;

        // Buscar colaborador existente
        const existing = await this.prisma.collaborator.findUnique({
          where: { rutDni: collaboratorData.rutDni },
          include: { service: true, costCenter: true, client: true },
        });

        if (existing) {
          // Detectar cambios
          await this.detectAndLogChanges(existing, collaboratorData, costCenter, service, client);
          
          // Actualizar
          await this.prisma.collaborator.update({
            where: { rutDni: collaboratorData.rutDni },
            data: {
              ...collaboratorData,
              costCenterId: costCenter?.id,
              serviceId: service?.id,
              clientId: client?.id,
            },
          });
          updated++;
        } else {
          // Crear nuevo
          await this.prisma.collaborator.create({
            data: {
              ...collaboratorData,
              costCenterId: costCenter?.id,
              serviceId: service?.id,
              clientId: client?.id,
            },
          });
          created++;
        }

        // Crear ServiceAssignment si hay cambio de servicio
        if (fechaCambioSS && service) {
          await this.createServiceAssignment(
            collaboratorData.rutDni,
            service.id,
            costCenter?.id,
            client?.id,
            tarifa,
            cargo,
            coordinador,
            fechaCambioSS,
          );
        }

        processed++;
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.SUCCESS,
          recordsProcessed: processed,
          recordsCreated: created,
          recordsUpdated: updated,
          completedAt: new Date(),
        },
      });

      this.logger.log(`Master Sheet sync completed: ${processed} processed, ${created} created, ${updated} updated`);
    } catch (error) {
      this.logger.error('Master Sheet sync failed', error);
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.ERROR,
          errors: { message: error.message, stack: error.stack },
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  async syncHRSheets() {
    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized');
    }

    this.logger.log('Starting HR Sheets sync...');
    
    // Sync Chile HR Sheet
    await this.syncHRSheet(this.HR_SHEET_CHILE_GID, SyncType.HR_SHEET_CHILE);
    
    // Sync Peru HR Sheet
    await this.syncHRSheet(this.HR_SHEET_PERU_GID, SyncType.HR_SHEET_PERU);
  }

  private async syncHRSheet(gid: string, syncType: SyncType) {
    const syncLog = await this.prisma.syncLog.create({
      data: {
        syncType,
        status: SyncStatus.RUNNING,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        startedAt: new Date(),
      },
    });

    try {
      // Usar el GID para especificar la hoja correcta
      const range = 'Sheet1!A2:C'; // Ajustar según columnas HR (RUT, Fecha Ingreso, etc.)
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.HR_SHEET_ID,
        range,
        majorDimension: 'ROWS',
      });

      const rows = response.data.values || [];
      let processed = 0;
      let updated = 0;

      for (const row of rows) {
        if (!row[0]) continue;
        
        const [rutDni, fechaIngresoOficial] = row;

        const collaborator = await this.prisma.collaborator.findUnique({
          where: { rutDni: rutDni?.trim() },
        });

        if (collaborator) {
          const parsedDate = this.parseDate(fechaIngresoOficial);
          if (parsedDate && collaborator.fechaIngresoOficial?.getTime() !== parsedDate.getTime()) {
            await this.prisma.collaborator.update({
              where: { rutDni: rutDni.trim() },
              data: { fechaIngresoOficial: parsedDate },
            });
            
            await this.prisma.changeLog.create({
              data: {
                collaboratorId: collaborator.id,
                field: 'fecha_ingreso_oficial',
                oldValue: collaborator.fechaIngresoOficial?.toISOString(),
                newValue: parsedDate.toISOString(),
                changeType: ChangeType.OTHER,
                source: syncType.toLowerCase(),
              },
            });
            updated++;
          }
        }
        processed++;
      }

      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.SUCCESS,
          recordsProcessed: processed,
          recordsUpdated: updated,
          completedAt: new Date(),
        },
      });

      this.logger.log(`${syncType} sync completed: ${processed} processed, ${updated} updated`);
    } catch (error) {
      this.logger.error(`${syncType} sync failed`, error);
      await this.prisma.syncLog.update({
        where: { id: syncLog.id },
        data: {
          status: SyncStatus.ERROR,
          errors: { message: error.message, stack: error.stack },
          completedAt: new Date(),
        },
      });
    }
  }

  async getRecentSyncs() {
    return this.prisma.syncLog.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
    });
  }

  private normalizeEstado(estado: string): CollaboratorStatus {
    if (!estado) return CollaboratorStatus.OTRO;
    
    const estadoUpper = estado.toUpperCase().trim();
    
    if (estadoUpper.includes('ACTIVO PERU') || estadoUpper === 'ACTIVO PERÚ') {
      return CollaboratorStatus.ACTIVO_PERU;
    }
    if (estadoUpper.includes('ACTIVO')) {
      return CollaboratorStatus.ACTIVO;
    }
    if (estadoUpper.includes('CAMBIO CC') || estadoUpper.includes('CAMBIO CENTRO COSTO')) {
      return CollaboratorStatus.CAMBIO_CC;
    }
    if (estadoUpper.includes('FINIQUITO') || estadoUpper.includes('FINIQUITADO')) {
      return CollaboratorStatus.FINIQUITADO;
    }
    
    return CollaboratorStatus.OTRO;
  }

  private async upsertCostCenter(code: string) {
    return this.prisma.costCenter.upsert({
      where: { code },
      update: {},
      create: { code, name: code },
    });
  }

  private async upsertService(name: string) {
    return this.prisma.service.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  private async upsertClient(name: string) {
    return this.prisma.client.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  private async detectAndLogChanges(
    existing: any,
    newData: any,
    costCenter: any,
    service: any,
    client: any,
  ) {
    const changes: any[] = [];

    if (existing.estado !== newData.estado) {
      changes.push({
        collaboratorId: existing.id,
        field: 'estado',
        oldValue: existing.estado,
        newValue: newData.estado,
        changeType: ChangeType.STATUS_CHANGE,
        source: 'master_sheet',
      });
    }

    if (existing.serviceId !== service?.id) {
      changes.push({
        collaboratorId: existing.id,
        field: 'service',
        oldValue: existing.serviceId,
        newValue: service?.id,
        changeType: ChangeType.SERVICE_CHANGE,
        source: 'master_sheet',
      });
    }

    if (existing.costCenterId !== costCenter?.id) {
      changes.push({
        collaboratorId: existing.id,
        field: 'cost_center',
        oldValue: existing.costCenterId,
        newValue: costCenter?.id,
        changeType: ChangeType.COST_CENTER_CHANGE,
        source: 'master_sheet',
      });
    }

    if (existing.clientId !== client?.id) {
      changes.push({
        collaboratorId: existing.id,
        field: 'client',
        oldValue: existing.clientId,
        newValue: client?.id,
        changeType: ChangeType.CLIENT_CHANGE,
        source: 'master_sheet',
      });
    }

    if (existing.tarifa?.toString() !== newData.tarifa?.toString()) {
      changes.push({
        collaboratorId: existing.id,
        field: 'tarifa',
        oldValue: existing.tarifa?.toString(),
        newValue: newData.tarifa?.toString(),
        changeType: ChangeType.TARIFA_CHANGE,
        source: 'master_sheet',
      });
    }

    if (changes.length > 0) {
      await this.prisma.changeLog.createMany({ data: changes });
    }
  }

  private async createServiceAssignment(
    rutDni: string,
    serviceId: string,
    costCenterId: string | null,
    clientId: string | null,
    tarifa: any,
    cargo: string,
    coordinator: string,
    fechaCambio: string,
  ) {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: { rutDni },
    });

    if (!collaborator) return;

    const parsedDate = this.parseDate(fechaCambio);
    if (!parsedDate) return;

    // Check if assignment already exists for this date
    const existing = await this.prisma.serviceAssignment.findFirst({
      where: {
        collaboratorId: collaborator.id,
        serviceId,
        fechaCambio: parsedDate,
      },
    });

    if (!existing) {
      await this.prisma.serviceAssignment.create({
        data: {
          collaboratorId: collaborator.id,
          serviceId,
          costCenterId,
          clientId,
          tarifa: tarifa ? parseFloat(tarifa) : null,
          cargo,
          coordinator,
          fechaCambio: parsedDate,
        },
      });
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    // Try different date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    // Try Excel date format (serial number)
    const excelDate = parseFloat(dateStr);
    if (!isNaN(excelDate)) {
      // Excel epoch is 1900-01-01, but JavaScript is 1970-01-01
      // Excel incorrectly treats 1900 as a leap year
      const excelEpoch = new Date(1899, 11, 30);
      const jsDate = new Date(excelEpoch.getTime() + excelDate * 86400000);
      return jsDate;
    }
    
    return null;
  }
}
