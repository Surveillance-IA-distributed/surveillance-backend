import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { SeederService } from './seeder.service';
import { CreateSeederDto } from './dto/create-seeder.dto';
import { UpdateSeederDto } from './dto/update-seeder.dto';

@Controller('seeder')
export class SeederController {
  constructor(private readonly seederService: SeederService) {}

  @Post('load-data')
  async loadData() {
    try {
      const result = await this.seederService.loadData();
      return result;
    } catch (error) {
      throw new HttpException(
        `Error al cargar datos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('objects')
  async getAllObjects() {
    try {
      return await this.seederService.findAllObjects();
    } catch (error) {
      throw new HttpException(
        `Error al obtener objetos: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios')
  async getAllScenarios() {
    try {
      return await this.seederService.findAllScenarios();
    } catch (error) {
      throw new HttpException(
        `Error al obtener escenarios: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('features')
  async getAllFeatures() {
    try {
      return await this.seederService.findAllFeatures();
    } catch (error) {
      throw new HttpException(
        `Error al obtener características: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('objects/:name')
  async getObjectByName(@Param('name') name: string) {
    try {
      return await this.seederService.findObjectByName(name);
    } catch (error) {
      throw new HttpException(
        `Error al obtener objeto por nombre: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('scenarios/:type')
  async getScenarioByType(@Param('type') type: string) {
    try {
      return await this.seederService.findScenarioByType(type);
    } catch (error) {
      throw new HttpException(
        `Error al obtener escenario por tipo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Métodos originales (para mantener compatibilidad)
  @Post()
  create(@Body() createSeederDto: CreateSeederDto) {
    return this.seederService.create(createSeederDto);
  }

  @Get()
  findAll() {
    return this.seederService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.seederService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSeederDto: UpdateSeederDto) {
    return this.seederService.update(+id, updateSeederDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.seederService.remove(+id);
  }
}