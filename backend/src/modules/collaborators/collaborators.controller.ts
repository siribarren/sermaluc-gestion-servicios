import { Controller, Get, Param, Query } from '@nestjs/common';
import { CollaboratorsService } from './collaborators.service';

@Controller('collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsService: CollaboratorsService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.collaboratorsService.findAll({ search, estado, serviceId });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.collaboratorsService.findOne(id);
  }

  @Get('rut/:rutDni')
  async findByRut(@Param('rutDni') rutDni: string) {
    return this.collaboratorsService.findByRut(rutDni);
  }
}

