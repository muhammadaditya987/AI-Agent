import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { environment } from '../config/env';

@Injectable()
export class InternalAutomationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expectedToken = environment.AUTOMATION_SHARED_TOKEN;
    if (!expectedToken) {
      throw new ServiceUnavailableException({
        code: 'AUTOMATION_AUTH_NOT_CONFIGURED',
        message: 'Internal automation authentication is not configured.',
      });
    }

    const request = context.switchToHttp().getRequest<Request>();
    const suppliedToken = request.header('x-automation-token');
    if (!suppliedToken) {
      throw new UnauthorizedException({
        code: 'AUTOMATION_AUTH_REQUIRED',
        message: 'A valid automation credential is required.',
      });
    }

    const supplied = Buffer.from(suppliedToken);
    const expected = Buffer.from(expectedToken);
    if (
      supplied.length !== expected.length ||
      !timingSafeEqual(supplied, expected)
    ) {
      throw new UnauthorizedException({
        code: 'AUTOMATION_AUTH_INVALID',
        message: 'A valid automation credential is required.',
      });
    }

    return true;
  }
}
