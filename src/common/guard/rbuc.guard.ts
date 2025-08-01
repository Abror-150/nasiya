// src/common/guards/rbuc.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/rbuc.decorator';

@Injectable()
export class RbucGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const req = context.switchToHttp().getRequest();

    if (!roles || roles.length === 0) return true;

    const userRole = req.user?.role;
    if (!userRole) throw new UnauthorizedException('Role topilmadi');

    if (roles.includes(userRole)) return true;

    throw new UnauthorizedException("Sizga ruxsat yo'q");
  }
}
