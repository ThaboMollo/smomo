import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

// Import the compiled output. `nest build` runs (via vercel.json buildCommand)
// before Vercel bundles this function, so `dist/` exists and already carries the
// decorator metadata that Nest's DI needs (emitted by tsc, not esbuild).
import { AppModule } from '../dist/app.module';
import { AllExceptionsFilter } from '../dist/common/all-exceptions.filter';

let cached: ((req: unknown, res: unknown) => void) | null = null;

async function getServer() {
  if (cached) return cached;
  const app = await NestFactory.create(AppModule, { bufferLogs: false });
  app.setGlobalPrefix('v1');
  app.enableCors({ origin: true, credentials: true });
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
  cached = app.getHttpAdapter().getInstance();
  return cached;
}

export default async function handler(req: unknown, res: unknown) {
  const server = await getServer();
  server(req, res);
}
