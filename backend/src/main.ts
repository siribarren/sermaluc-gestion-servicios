import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔴 IMPORTANTE: usar el PORT de la env
  const port = process.env.PORT ? Number(process.env.PORT) : 8080;

  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Backend escuchando en puerto ${port}`);
}
bootstrap();
