import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertGateway } from './alert.gateway';


@Module({
  providers: [AlertService, AlertGateway],
  exports: [AlertService],
})
export class AlertModule {}
