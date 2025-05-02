// src/gateways/alert.gateway.ts

import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AlertGateway {
  @WebSocketServer()
  server: Server;

  sendAlert(alert: { alert: string; sql: string }) {
    this.server.emit('alert-detected', alert); // Emitir a todos los clientes
  }
}
