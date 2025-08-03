import { Injectable, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config } from 'src/config';
import * as basicAuth from 'express-basic-auth';
import * as express from 'express';
import * as path from 'path';

@Injectable()
export class Application {
  public static async main(): Promise<void> {
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe());
    app.use(
      ['/api', '/api-json'],
      basicAuth({
        challenge: true,
        users: {
          [process.env.SWAGGER_USER || 'admin']:
            process.env.SWAGGER_PASS || 'admin123',
        },
      }),
    );

    const configSwagger = new DocumentBuilder()
      .setTitle('Nasiya savdo')
      .setVersion('1.0')
      .addSecurityRequirements('bearer', ['bearer'])
      .addBearerAuth()
      .build();
    const documentFactory = () =>
      SwaggerModule.createDocument(app, configSwagger);
    app.use('/images', express.static(path.join(process.cwd(), 'images')));
    SwaggerModule.setup('api', app, documentFactory);
    await app.listen(config.API_PORT, () => {
      console.log(Date.now());
    });
  }
}
