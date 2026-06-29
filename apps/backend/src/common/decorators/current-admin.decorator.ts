import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentAdminPayload {
  sub: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export const CurrentAdmin = createParamDecorator((_data: unknown, ctx: ExecutionContext): CurrentAdminPayload => {
  const request = ctx.switchToHttp().getRequest<{ user: CurrentAdminPayload }>();
  return request.user;
});
