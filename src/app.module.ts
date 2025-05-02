import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './modules/video/video.module';
import { SeederModule } from './modules/seeder/seeder.module';

@Module({
  imports: [VideoModule, SeederModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}