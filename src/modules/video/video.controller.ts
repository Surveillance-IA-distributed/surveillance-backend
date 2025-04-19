import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Express } from 'express';
import { MakeQueryDto } from './dto/make-query.fto';

@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // Upload a video file
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.videoService.handleFileUpload(file);
  }

  // Get Scanned videos list
  @Get('list-videos-scanned')
  getScannedVideosList() {
    return this.videoService.getScannedVideosList();
  }

  // Get Uploaded videos list
  @Get('list-videos-uploaded')
  getUploadedVideosList() {
    return this.videoService.getUploadedVideosList();
  }

  // Scan a video file
  @Post('scan')
  scanVideo() {
    return this.videoService.runScanScript();
  }

  @Get('results/:videoName')
  getScanResults(@Param('videoName') videoName: string) {
    return this.videoService.getScanResults(videoName);
  }

  @Post('make-query')
  makeQuery(@Body() body: MakeQueryDto) {
    return this.videoService.sendQueryToApiCluster(body);
  }
}
