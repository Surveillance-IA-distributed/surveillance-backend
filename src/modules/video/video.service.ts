import { ConfigService } from '@nestjs/config';
import { DatabaseService } from 'src/database/database.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import { QueryData } from './dto/queryData.interface';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class VideoService {
  private readonly apiUrl: string;

  constructor(
    private readonly alertService: AlertService,
    private readonly databaseService: DatabaseService,
    private readonly ConfigService: ConfigService,
  ) {
    this.apiUrl = this.ConfigService.get<string>('URL_BACKEND')!;
  }

  private uploadedVideos: string[] = [];

  // ################ AUX ###################
  addUploadedVideo(filename: string) {
    const name = path.parse(filename).name;
    this.uploadedVideos.push(name);
  }

  getLastUploadedVideo(): string | null {
    if (this.uploadedVideos.length === 0) return null;
    return this.uploadedVideos[this.uploadedVideos.length - 1];
  }

  // ################### SUBIR VIDEO ###################
  handleFileUpload(file: Express.Multer.File) {
    if (!file || !file.path) {
      console.error('File upload failed:', file);
      throw new HttpException('Error uploading file', HttpStatus.BAD_REQUEST);
    }

    console.log('-----------------------------------');
    console.log('File uploaded successfully:', file);

    this.addUploadedVideo(file.filename);
    console.log('Uploaded videos:', this.uploadedVideos);

    return {
      message: 'File uploaded successfully',
      filePath: file.path,
    };
  }

  // ################### LISTAR VIDEOS ESCANEADOS ###################
  async getScannedVideosList(): Promise<{ videos: string[] }> {
    console.log('-----------------------------------');
    console.log('Getting video list...');
    const detectionFolder = path.join(process.cwd(), 'detections');

    try {
      // Crear crapeta si no existe
      await fs.promises.mkdir(detectionFolder, { recursive: true });

      const files = await fs.promises.readdir(detectionFolder);
      const videoNames: string[] = [];

      for (const file of files) {
        const fullPath = path.join(detectionFolder, file);
        const stats = await fs.promises.stat(fullPath);
        if (stats.isDirectory()) {
          videoNames.push(file);
        }
      }

      if (videoNames.length === 0) {
        console.log('No videos found in the detections folder.');
        return {
          videos: [],
        };
      }

      console.log('Videos found:', videoNames);
      return {
        videos: videoNames,
      };
    } catch (error) {
      console.error('Error reading videos:', error);

      if (error instanceof HttpException) {
        throw error; // Propaga el error original (como el 404)
      }

      throw new HttpException(
        'Error reading videos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ################### LISTAR VIDEOS SUBIDOS ###################
  async getUploadedVideosList(): Promise<{ videos: string[] }> {
    console.log('-----------------------------------');
    console.log('Getting uploaded video list...');

    const uploadsFolder = path.join(process.cwd(), 'uploads');

    console.log('Buscando videos subidos en:', uploadsFolder);

    try {
      const files = await fs.promises.readdir(uploadsFolder);

      // Filtrar solo archivos de video .mp4
      const videoFiles = files.filter((file) => file.endsWith('.mp4'));

      if (videoFiles.length === 0) {
        console.log('No hay videos en uploads');
        return {
          videos: [],
        };
      }

      console.log('Videos encontrados en uploads:', videoFiles);
      return {
        videos: videoFiles,
      };
    } catch (error) {
      console.error('Error leyendo carpeta uploads:', error);

      if (error instanceof HttpException) {
        throw error; // Propaga el error original (como el 404)
      }

      throw new HttpException(
        'Error reading uploaded videos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ################### ESCANEAR VIDEO ###################
  addAlert(alert: { alert: string }) {
    this.alertService.addAlert(alert);
  }

  async executeAlerts(): Promise<void> {
    await this.alertService.executeAlerts();
  }

  async runScanScript(): Promise<{ message: string; results: string[] }> {
    console.log('-----------------------------------');
    console.log('Scanning video...');

    const scriptPath = path.join(process.cwd(), 'python', 'scanner.py');
    const uploadFolder = path.join(process.cwd(), 'uploads');
    const detectionsFolder = path.join(process.cwd(), 'detections');

    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(
        'python3',
        [scriptPath, uploadFolder, detectionsFolder],
        {
          env: {
            ...process.env,
          },
        },
      );

      let outputData = '';
      let errorData = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        outputData += data.toString();
        console.log(`stdout: ${data.toString()}`);
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        errorData += data.toString();
        console.error(`stderr: ${data.toString()}`);
      });

      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      pythonProcess.on('close', async (code) => {
        console.log(`Python script exited with code ${code}`);
        if (code !== 0) {
          return reject(
            new HttpException(
              `Python script execution failed: ${errorData}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }

        console.log('Python script executed successfully:', outputData);
        try {
          // 1. Obtenemos el video que se proceso
          const videoName = this.getLastUploadedVideo();
          if (!videoName) {
            throw new HttpException(
              'No video found in queue.',
              HttpStatus.BAD_REQUEST,
            );
          }
          const videoFolder = path.join(detectionsFolder, videoName);
          const files = await fs.promises.readdir(videoFolder);

          // 2. Procesar archivos collage_*.json (features)
          const collageFiles = files.filter((file) =>
            /^collage_(\d+)_analysis\.json$/.test(file),
          );
          for (const file of collageFiles) {
            const sec = parseInt(
              file.match(/^collage_(\d+)_analysis\.json$/)?.[1] || '0',
            );
            const fullPath = path.join(videoFolder, file);
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            const parsed = JSON.parse(content);
            const detections = parsed.detections ?? [];

            for (const feature of detections) {
              const f = feature.features || {};

              await this.databaseService.query(
                ` 
                INSERT INTO features_new (
                  video_name, sec, object_name, description,
                  color1, color2, size, orientation, type
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                `,
                [
                  videoName,
                  sec,
                  feature.object_name ?? '',
                  feature.description ?? '',
                  f.color1 ?? f.upper_clothing_color ?? '',
                  f.color2 ?? f.lower_clothing_color ?? '',
                  f.size ?? '',
                  f.orientation ?? f.posture ?? '',
                  f.type ?? f.age_group ?? '',
                ],
              );
            }
          }

          // 3. Procesar archivos de detections_*.txt
          const detectionFiles = files.filter((f) =>
            /^detections_(\d+)\.txt$/.test(f),
          );

          for (const file of detectionFiles) {
            const sec = parseInt(
              file.match(/^detections_(\d+)\.txt$/)?.[1] || '0',
            );
            const fullPath = path.join(videoFolder, file);
            const content = await fs.promises.readFile(fullPath, 'utf-8');
            const lines = content.trim().split('\n');

            for (const line of lines) {
              const parts = line.split(',');

              if (parts.length !== 8) {
                console.warn(`Línea inválida en ${file}: ${line}`);
                continue;
              }
              const [
                object_name,
                x1,
                y1,
                x2,
                y2,
                color,
                proximity,
                secondFromFile,
              ] = parts;

              await this.databaseService.query(
                `
                INSERT INTO objects_new (
                  object_name, video_name, x1, y1, x2, y2,
                  color, proximity, sec
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
                `,
                [
                  object_name ?? '',
                  videoName,
                  parseInt(x1),
                  parseInt(y1),
                  parseInt(x2),
                  parseInt(y2),
                  color ?? '',
                  proximity ?? '',
                  parseInt(secondFromFile), // puedes usar `sec` también, deberían coincidir
                ],
              );
            }
          }

          // 4. Procesar escenario_analysis.json
          const escenarioPath = path.join(
            videoFolder,
            'escenario_analysis.json',
          );
          const rawContent = await fs.promises.readFile(escenarioPath, 'utf-8');

          // Primera capa de JSON: string dentro de string
          const innerJson = JSON.parse(rawContent);

          // Segunda capa: el verdadero objeto JSON
          const parsed =
            typeof innerJson === 'string' ? JSON.parse(innerJson) : innerJson;

          const scene = parsed.scene || {};
          const features = scene.features || {};

          await this.databaseService.query(
            `
            INSERT INTO scenarios_new (
              video_name, environment_type, description,
              weather, time_of_day, terrain, crowd_level, lighting
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            `,
            [
              videoName,
              scene.environment_type ?? '',
              scene.description ?? '',
              features.weather ?? '',
              features.time_of_day ?? '',
              features.terrain ?? '',
              features.crowd_level ?? '',
              features.lighting ?? '',
            ],
          );

          // 5. Ejecutar las alertas
          await this.executeAlerts(); // <-- LLAMADA CLAVE

          resolve({
            message: 'Video scan completed successfully',
            results: outputData.trim().split('\n'),
          });
        } catch (error) {
          console.error('Error processing video:', error);
          return reject(
            new HttpException(
              'Error processing video',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }
      });
    });
  }

  // ################### OBTENER RESULTADOS ESCANEO ###################
  getScanResults(videoName: string): { results: any[] } {
    console.log('-----------------------------------');
    console.log('Getting scan results for video:', videoName);
    const detectionsFolder = path.join(process.cwd(), 'detections', videoName);

    try {
      const resultFiles = fs.readdirSync(detectionsFolder);
      const jsonFiles = resultFiles.filter((file) =>
        file.endsWith('escenario_analysis.json'),
      );
      const txtFiles = resultFiles.filter((file) => file.endsWith('.txt'));

      if (jsonFiles.length === 0 && txtFiles.length === 0) {
        console.log('No results found for the specified video.');
        throw new HttpException(
          'No results found for the specified video',
          HttpStatus.NOT_FOUND,
        );
      }

      const jsonResults = jsonFiles.map((file) => {
        const filePath = path.join(detectionsFolder, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          let jsonContent = JSON.parse(content);
          if (typeof jsonContent === 'string') {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            jsonContent = JSON.parse(jsonContent); // Segundo parse
          }
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            type: 'json',
            fileName: file,
            ...jsonContent,
          };
        } catch (err) {
          if (err instanceof Error) {
            console.error(`Error parsing JSON in file ${file}:`, err.message);
          } else {
            console.error(`Error parsing JSON in file ${file}:`, err);
          }
          return {
            type: 'json',
            fileName: file,
            error: 'Invalid or empty JSON file',
          };
        }
      });

      const txtResults = txtFiles.map((file) => {
        const filePath = path.join(detectionsFolder, file);
        const txtContent = fs.readFileSync(filePath, 'utf-8');

        // Procesamos linea por linea
        const lines = txtContent.split('\n');
        const parsedObjects = lines.map((line) => {
          const [object_name, x1, y1, x2, y2, color, proximity, second] =
            line.split(',');

          return {
            object_name,
            bounding_box: [Number(x1), Number(y1), Number(x2), Number(y2)],
            color,
            proximity,
            second: Number(second),
          };
        });

        return {
          type: 'txt',
          fileName: file,
          content: parsedObjects,
        };
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const allResults = [...jsonResults, ...txtResults];
      console.log('Results returned');
      return {
        results: allResults,
      };
    } catch (error) {
      console.error('Error reading results:', error);
      throw new HttpException(
        'Error reading results',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ################### HACER CONSULTA ###################
  async sendQueryToApiCluster(body: any): Promise<any> {
    console.log('-----------------------------------');
    console.log('Sending query to API cluster...');

    const {
      type,
      video_name,
      environment_type,
      object_name,
      color,
      proximity,
    } = body as QueryData;

    console.log('Received query:', body);

    // 🔍 Resolver environment_type
    let resolve_enviroment_type: string | null = null;
    if (Array.isArray(environment_type) && environment_type.length > 0) {
      resolve_enviroment_type = environment_type[0].trim();
    } else if (
      typeof environment_type === 'string' &&
      environment_type.trim() !== ''
    ) {
      resolve_enviroment_type = environment_type.trim();
    }

    // 🔍 Resolver object_name
    let resolve_object_name: string | null = null;
    if (Array.isArray(object_name) && object_name.length > 0) {
      resolve_object_name = object_name[0].trim();
    } else if (typeof object_name === 'string' && object_name.trim() !== '') {
      resolve_object_name = object_name.trim();
    }

    // 🔍 Resolver proximity
    let resolve_proximity: string | null = null;
    if (Array.isArray(proximity) && proximity.length > 0) {
      resolve_proximity = proximity[0].trim();
    } else if (typeof proximity === 'string' && proximity.trim() !== '') {
      resolve_proximity = proximity.trim();
    }

    // 🔍 Resolver color
    let resolve_color: string | null = null;
    if (Array.isArray(color) && color.length > 0) {
      resolve_color = color[0].trim();
    } else if (typeof color === 'string' && color.trim() !== '') {
      resolve_color = color.trim();
    }

    const queryData = {
      type,
      video_name: video_name,
      environment_type: resolve_enviroment_type,
      object_name: resolve_object_name,
      color: color,
      proximity: resolve_proximity,
    };
    console.log(' Sending Query data:', queryData);

    // Todo... Completar con la logica de la api
    const apiUrl = `${this.apiUrl}/receive_characteristics`;

    try {
      const response = await axios.post(apiUrl, queryData);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error sending query to external API:', error.message);
      } else {
        console.error('Error sending query to external API:', error);
      }
      throw new HttpException(
        'Error processing query',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
