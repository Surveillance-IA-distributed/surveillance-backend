import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AlertGateway } from './alert.gateway';

@Injectable()
export class AlertService {
  private readonly openAiApiKey: string;
  private readonly backendUrl: string;

  constructor(
    private readonly alertGateway: AlertGateway,
    private readonly configService: ConfigService,
  ) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY')!;
    this.backendUrl = this.configService.get<string>('URL_BACKEND')!;
  }

  private alerts: { alert: string; sql: string }[] = [];

  addAlert(alert: { alert: string }) {
    this.generateSql(alert.alert).then((sql) => {
      const fullAlert = { alert: alert.alert, sql };
      this.alerts.push(fullAlert);
      console.log('✅ Alerta añadida:', fullAlert);
    });
  }

  async generateSql(alertText: string): Promise<string> {
    const prompt = `
    You are an assistant that converts alerts in natural language into SQL queries only for last row. You have access to the following tables:

---

**Table: objects_new**  
- "object_name" (VARCHAR): Name of the object (e.g., person, vehicle, car, etc.)  
- "video_name" (VARCHAR): Name of the video (e.g., video1.mp4)  
- "x1" (INT): Starting X coordinate of the bounding box  
- "y1" (INT): Starting Y coordinate of the bounding box  
- "x2" (INT): Ending X coordinate of the bounding box  
- "y2" (INT): Ending Y coordinate of the bounding box  
- "color" (VARCHAR): Color of the object (e.g., white, black, red, etc.)  
- "proximity" (VARCHAR): Proximity of the object (e.g., near, middle, far)  
- "sec" (INT): Timestamp (in seconds) when the object appears  

---

**Table: scenarios_new**  
- "video_name" (VARCHAR): Name of the video (e.g., video1.mp4)  
- "environment_type" (VARCHAR): Type of environment (e.g., parking_lot, street, park, etc.)  
- "description" (TEXT): Detailed description of the scenario  
- "weather" (VARCHAR): Weather condition (e.g., sunny, rainy, cloudy)  
- "time_of_day" (VARCHAR): Time of the day (e.g., day)  
- "terrain" (VARCHAR): Terrain type (e.g., paved, grass)  
- "crowd_level" (VARCHAR): Crowd level (e.g., low, medium, high)  
- "lighting" (VARCHAR): Lighting condition (e.g., natural)  

---

**Table: features_new**  
- "video_name" (VARCHAR): Name of the video (e.g., video1.mp4)  
- "sec" (INT): Timestamp (in seconds) when the feature appears  
- "object_name" (VARCHAR): Name of the object (e.g., person, vehicle, etc.)  
- "description" (TEXT): Detailed description of the feature  
- "color1" (VARCHAR): Primary color of the object (e.g., white, black, etc.)  
- "color2" (VARCHAR): Secondary color of the object (e.g., green, blue, etc.)  
- "size" (VARCHAR): Size of the object (e.g., small, medium, large)  
- "orientation" (VARCHAR): Orientation of the object (e.g., frontal, rear, side)  
- "type" (VARCHAR): Type of the object (e.g., Sedan, SUV, Motorcycle, etc.)  

---

**Relevant Data:**

---

**features_new:**  
**object_name:**  
- person, vehicle, car, sedan, hatchback, SUV, unknown, pickup, minivan, convertible, coupe, motorcycle, van  

**description:**  
Vehicles(cars, truck, vehicle):  
- Parked blue sedan, Black sedan with sun reflection, Dark SUV, front view, Silver sedan, rear view, Black sedan, side view, Red convertible, rear view, Silver hatchback with black details, Red sedan, possible hybrid, White sedan, side view, Light brown sedan, rear view, Beige sedan, side view, Beige sedan with rear spoiler, Blurred silver sedan, Blurred front view gray sedan, Silver sedan, rear view, White SUV with black patches, Silver or gray car, blurred, Black SUV with roof rack, Dark SUV, rear view with lights, Blurred gray sedan, Blurred white object, likely a car, Dark vehicle, possibly SUV or van, Red sedan with visible license plate, Silver hatchback with roof rails, White sedan with standard design, Parked silver sedan, Yellow car with rear spoiler, Black and white SUV with roof rack, Moving brown car, Black pickup truck with extended cab, White SUV with unique pattern, Black SUV with shiny finish, Modern design gray sedan, Parked silver minivan, Red sedan with compact design, Clean white sedan, Silver hatchback with sporty design, Beige compact sedan, White sedan with spoiler, Custom SUV with distinctive pattern, Black SUV with tinted windows, White SUV with mounted spare tire, Black pickup with green logo, Red pickup, Parked silver minivan rear view, Platform trailer with construction vehicle, Pickup with open cab, Motorcycle with visible wheels and seats  

Persons:
- Young person with an orange t-shirt and backpack, Person with a dark jacket and light shorts, Person walking, Person with a red jacket and black pants, Person sitting on a bench, Person standing near a tree, Person with a hat, Person with sunglasses, Person with a white t-shirt and jeans, Person running, Person with a blue hoodie, Person holding a phone, Person carrying groceries, Person riding a bicycle, Person in a green jacket and gray pants, Person with a black backpack, Person in a yellow dress, Person with a red scarf, Person talking to another person, Person with a briefcase, Person in a wheelchair, Person with a dog, Person with headphones, Person holding an umbrella, Person crossing the street, Person entering a building

**color1:**  
- white, black, blue, red, silver, grey, beige, light brown, yellow, maroon, dark green, light gray, gold  

**color2:**  
- black, green, unknown  

**size:**  
- small, medium, large, unknown  

**orientation:**  
- frontal, rear, lateral, rear view, unknown  

**type:**  
- unknown, Sedan, SUV, Hatchback, Convertible, Coupe, Pickup, Minivan, Motorcycle, Van  

---

**objects_new:**  
**object_name:**  
- tree, car, truck, bus, umbrella, chair, person, potted plant, bicycle, motorcycle, traffic light, stop sign, dining table  

**rgb_color:**  
- gray, silver, black, navy, brown, teal, olive, purple  

**proximity:**  
- near, middle, far  

---

**scenarios_new:**  
**environment_type:**  
- parking_lot, plaza, campus, park, street  

**weather:**  
- sunny, rainy, cloudy  

**time_of_day:**  
- day  

**terrain:**  
- paved, grass  

**crowd_level:**  
- low, medium  

**lighting:**  
- natural  


---

**Few shot Examples**

**alert example:**
- "A red sedan is parked in a parking lot under sunny weather during the day."
**result:** 
- SELECT * FROM objects_new WHERE object_name = 'car' AND color = 'red' AND proximity = 'middle' AND sec IN (SELECT sec FROM scenarios_new WHERE environment_type = 'parking_lot' AND weather = 'sunny' AND time_of_day = 'day')

**alert example:**
- "A person wearing a red jacket is walking near a tree in a park."
**result:** 
- SELECT * FROM objects_new WHERE object_name = 'person' AND color = 'red' AND proximity = 'near' AND sec IN (SELECT sec FROM objects_new WHERE object_name = 'tree' AND sec IN (SELECT sec FROM scenarios WHERE environment_type = 'park'))

**alert example:**
-"A person is detected near the camera."
**result:**
- SELECT * FROM objects_new WHERE object_name = 'person' AND proximity = 'near'

**alert example:**
- "It is a sunny day in a parking lot."
**result:**
- SELECT * FROM scenarios_new WHERE weather = 'sunny' AND environment_type = 'parking_lot'
    
    Alerta: "${alertText}"
    SQL:
    `;

    try {
      const response: any = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'Eres un asistente que convierte descripciones en lenguaje natural en consultas SQL. Usa los ejemplos proporcionados como guía.',
            },
            { role: 'user', content: prompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.openAiApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const sql = response.data.choices[0].message.content.trim();
      return sql;
    } catch (error) {
      console.error('❌ Error al generar SQL con OpenAI:', error.message);
      return `-- Error generando SQL para: ${alertText}`;
    }
  }

  async executeAlerts(): Promise<void> {
    if (this.alerts.length === 0) {
      console.log('ℹ️ No hay alertas para ejecutar.');
      return;
    }

    console.log('🚨 Ejecutando alertas...');

    try {
      const response = await axios.post(`${this.backendUrl}/execute_alerts`, {
        alerts: this.alerts,
      });

      console.log('✅ Respuesta del backend:', response.data);
    } catch (error) {
      console.error('❌ Error al enviar alertas al backend:', error.message);
    }

    this.alerts = [];
  }
}
