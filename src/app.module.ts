import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ importar el módulo
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VideoModule } from './modules/video/video.module';
import { SeederModule } from './modules/seeder/seeder.module';
import { VideoResultsModule } from './modules/video-results/video-results.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    VideoModule,
    SeederModule,
    VideoResultsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}