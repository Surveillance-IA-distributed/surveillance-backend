import { Module } from '@nestjs/common';
import { VideoResultsService } from './video-results.service';
import { VideoResultsController } from './video-results.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [VideoResultsController],
  providers: [VideoResultsService],
  imports: [DatabaseModule],
})
export class VideoResultsModule {}
