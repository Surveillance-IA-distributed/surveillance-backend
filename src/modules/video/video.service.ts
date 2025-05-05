import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import { QueryData } from './dto/queryData.interface';
import { AlertService } from '../alert/alert.service';

@Injectable()
export class VideoService {
  constructor(private readonly alertService: AlertService) {}

  handleFileUpload(file: Express.Multer.File) {
    if (!file || !file.path) {
      console.error('File upload failed:', file);
      throw new HttpException('Error uploading file', HttpStatus.BAD_REQUEST);
    }

    console.log('-----------------------------------');
    console.log('File uploaded successfully:', file);
    return {
      message: 'File uploaded successfully',
      filePath: file.path,
    };
  }

  async getScannedVideosList(): Promise<{ videos: string[] }> {
    console.log('-----------------------------------');
    console.log('Getting video list...');
    const detectionFolder = path.join(process.cwd(), 'detections');

    try {
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
      const pythonProcess = spawn('python3', [
        scriptPath,
        uploadFolder,
        detectionsFolder,
      ]);

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
        if (code === 0) {
          console.log('Python script executed successfully:', outputData);

          // ✅ Aquí ejecutamos las alertas guardadas
          // await this.executeAlerts(); // <-- LLAMADA CLAVE

          resolve({
            message: 'Video scan completed successfully',
            results: outputData.trim().split('\n'),
          });
        } else {
          console.error('Python script execution failed:', errorData);
          reject(
            new HttpException(
              `Python script execution failed: ${errorData}`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        }
      });
    });
  }

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
          const jsonContent = JSON.parse(content);
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

    // Tomar solo el primer valor si es un array
    let resolve_enviroment_type: string | null = null;
    if (Array.isArray(environment_type) && environment_type.length > 0) {
      resolve_enviroment_type = environment_type[0] as string;
    } else {
      resolve_enviroment_type = null;
    }

    let resolve_object_name: string | null = null;
    if (Array.isArray(object_name) && object_name.length > 0) {
      resolve_object_name = object_name[0] as string;
    } else {
      resolve_object_name = null;
    }

    let resolve_proximity: string | null = null;
    if (Array.isArray(proximity) && proximity.length > 0) {
      resolve_proximity = proximity[0] as string;
    } else {
      resolve_proximity = null;
    }

    const queryData = {
      type,
      video_name: video_name || null,
      environment_type: resolve_enviroment_type,
      object_name: resolve_object_name || null,
      color: color || null,
      proximity: resolve_proximity || null,
    };
    console.log(' Sending Query data:', queryData);

    // Todo... Completar con la logica de la api
    const apiUrl =
      'http://ec2-18-208-129-187.compute-1.amazonaws.com:1234/receive_characteristics';

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
