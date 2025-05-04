import { Controller, Get } from '@nestjs/common';
import { VideoResultsService } from './video-results.service';
// import { CreateVideoResultDto } from './dto/create-video-result.dto';
// import { UpdateVideoResultDto } from './dto/update-video-result.dto';

@Controller('video-results')
export class VideoResultsController {
  constructor(private readonly videoResultsService: VideoResultsService) {}

  @Get('features')
  getFeatures() {
    return this.videoResultsService.getFeatures();
  }

  @Get('objects')
  getObjects() {
    return this.videoResultsService.getObjects();
  }

  @Get('scenaries')
  getScenarios() {
    return this.videoResultsService.getScenarios();
  }
}
