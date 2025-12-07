import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { collaborators: true },
        },
      },
    });
  }
}

