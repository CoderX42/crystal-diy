import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  uploadLocalDir: process.env.UPLOAD_LOCAL_DIR ?? 'uploads',
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
}));
