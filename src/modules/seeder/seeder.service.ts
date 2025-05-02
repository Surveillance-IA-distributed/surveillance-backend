import { Injectable, Logger } from '@nestjs/common';
import { CreateSeederDto } from './dto/create-seeder.dto';
import { UpdateSeederDto } from './dto/update-seeder.dto';
import { exec } from 'child_process';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);
  private pool: Pool;

  constructor() {
    // Inicializar la conexión a PostgreSQL
    this.pool = new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'videodata',
    });

    this.logger.log('Servicio de Seeder inicializado');
  }

  // Cargar datos a la base de datos utilizando el script Python existente
  async loadData(): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonScript = path.resolve('/usr/src/app/scripts/run_deploy_postgres.py');
      
      // Verificar si el script existe
      if (!fs.existsSync(pythonScript)) {
        this.logger.error(`Script no encontrado en: ${pythonScript}`);
        return reject(`Script no encontrado en: ${pythonScript}`);
      }

      this.logger.log(`Ejecutando script: ${pythonScript}`);
      
      exec(`python3 ${pythonScript}`, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`Error al ejecutar el script Python: ${error.message}`);
          return reject(`Error al ejecutar el script: ${error.message}`);
        }
        
        if (stderr) {
          this.logger.error(`Error en la salida del script: ${stderr}`);
          return reject(`Error en la salida del script: ${stderr}`);
        }
        
        this.logger.log(`Script ejecutado con éxito: ${stdout}`);
        resolve({ success: true, message: 'Datos cargados exitosamente' });
      });
    });
  }

  // Consultar todos los objetos
  async findAllObjects() {
    try {
      const result = await this.pool.query('SELECT * FROM objects');
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al consultar objetos: ${error.message}`);
      throw error;
    }
  }

  // Consultar todos los escenarios
  async findAllScenarios() {
    try {
      const result = await this.pool.query('SELECT * FROM scenarios');
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al consultar escenarios: ${error.message}`);
      throw error;
    }
  }

  // Consultar todas las características
  async findAllFeatures() {
    try {
      const result = await this.pool.query('SELECT * FROM features');
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al consultar características: ${error.message}`);
      throw error;
    }
  }

  // Consultar objeto por nombre
  async findObjectByName(name: string) {
    try {
      const result = await this.pool.query('SELECT * FROM objects WHERE object_name = $1', [name]);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al consultar objeto por nombre: ${error.message}`);
      throw error;
    }
  }

  // Consultar escenario por tipo
  async findScenarioByType(type: string) {
    try {
      const result = await this.pool.query('SELECT * FROM scenarios WHERE environment_type = $1', [type]);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al consultar escenario por tipo: ${error.message}`);
      throw error;
    }
  }

  // Métodos originales (pueden mantenerse para compatibilidad)
  create(createSeederDto: CreateSeederDto) {
    return 'This action adds a new seeder';
  }

  findAll() {
    return `This action returns all seeder`;
  }

  findOne(id: number) {
    return `This action returns a #${id} seeder`;
  }

  update(id: number, updateSeederDto: UpdateSeederDto) {
    return `This action updates a #${id} seeder`;
  }

  remove(id: number) {
    return `This action removes a #${id} seeder`;
  }
}