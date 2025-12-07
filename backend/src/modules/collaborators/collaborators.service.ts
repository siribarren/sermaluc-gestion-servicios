import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CollaboratorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: { search?: string; estado?: string; serviceId?: string }) {
    const where: any = {};

    if (filters.estado) {
      where.estado = filters.estado;
    }

    if (filters.serviceId) {
      where.serviceId = filters.serviceId;
    }

    if (filters.search) {
      where.OR = [
        { nombre: { contains: filters.search, mode: 'insensitive' } },
        { rutDni: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.collaborator.findMany({
      where,
      include: {
        service: true,
        costCenter: true,
        client: true,
        serviceAssignments: {
          include: { service: true },
          orderBy: { fechaCambio: 'desc' },
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.collaborator.findUnique({
      where: { id },
      include: {
        service: true,
        costCenter: true,
        client: true,
        serviceAssignments: {
          include: { service: true, costCenter: true, client: true },
          orderBy: { fechaCambio: 'desc' },
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByRut(rutDni: string) {
    return this.prisma.collaborator.findUnique({
      where: { rutDni },
      include: {
        service: true,
        costCenter: true,
        client: true,
        serviceAssignments: {
          include: { service: true, costCenter: true, client: true },
          orderBy: { fechaCambio: 'desc' },
        },
        changeLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}

