import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3001; // 3001 para local, Cloud Run usará PORT=8080
  await app.listen(port as number, '0.0.0.0');
}

bootstrap();