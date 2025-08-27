import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['kafka:9092'],
      },
      consumer: {
        groupId: 'user-consumer',
      },
    },
  });
  // app.enableCors({
  //   origin: 'https://rooster.jobs/',
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });

  const config = new DocumentBuilder()
    .setTitle('Trav Sim User service')
    .setDescription('The Trav Sim User service API description')
    .setVersion('1.0')
    .addTag('users')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
  await app.startAllMicroservices();
}
bootstrap();
