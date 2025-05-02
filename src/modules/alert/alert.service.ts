import { Injectable } from '@nestjs/common';
import { AlertGateway } from './alert.gateway';

@Injectable()
export class AlertService {
  constructor(private readonly alertGateway: AlertGateway) {}
  private alerts: { alert: string; sql: string }[] = [];

  addAlert(alert: { alert: string }) {
    const sql = this.generateSql(alert.alert); // Generar SQL a partir del texto
    const fullAlert = { alert: alert.alert, sql };
    this.alerts.push(fullAlert);
    console.log('✅ Alerta añadida:', fullAlert);
  }

  generateSql(alertText: string): string {
    // 👀 Aqui utilizaras el API de gpt.
    // Por ejemplo, si alertText = "usuarios bloqueados", genera algo como:
    return `SELECT * FROM logs WHERE message LIKE '%${alertText}%'`;
  }

  async executeAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      console.log('ℹ️ No hay alertas para ejecutar.');
      return;
    }

    console.log('🚨 Ejecutando alertas...');

    for (const alert of this.alerts) {
      try {
        console.log(`⚠️ ALERTA: ${alert.alert}`);
        console.log(`SQL: ${alert.sql}`);
        // 👀 Aquí podrías usar un servicio para ejecutar consultas o notificar

        await this.alertGateway.sendAlert(alert);
      } catch (error) {
        console.error('❌ Error ejecutando alerta:', error);
      }
    }

    this.alerts = [];
  }
}
