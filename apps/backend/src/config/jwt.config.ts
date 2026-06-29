import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'please-change-access-secret',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '2h',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'please-change-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
}));
