import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoController } from './video.controller';
import { AlertModule } from '../alert/alert.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [VideoController],
  providers: [VideoService],
  imports: [AlertModule, DatabaseModule],
})
export class VideoModule {}
