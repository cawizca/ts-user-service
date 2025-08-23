import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
}
bootstrap();
