import { Injectable } from '@nestjs/common';
// import { CreateVideoResultDto } from './dto/create-video-result.dto';
// import { UpdateVideoResultDto } from './dto/update-video-result.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class VideoResultsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getFeatures() {
    console.log('-----------------------------------');
    console.log('Getting features BD...');

    const rows = await this.databaseService.query('SELECT * FROM features');

    return rows;
  }

  async getObjects() {
    console.log('-----------------------------------');
    console.log('Getting objects BD...');

    const rows = await this.databaseService.query('SELECT * FROM objects');

    return rows;
  }

  async getScenarios() {
    console.log('-----------------------------------');
    console.log('Getting scenarios BD...');

    const rows = await this.databaseService.query('SELECT * FROM scenarios');

    return rows;
  }
}
