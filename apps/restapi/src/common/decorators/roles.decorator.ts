import { SetMetadata } from '@nestjs/common';
import type { AppRole } from '@/common/constant/roles.constant';

export const ROLES_KEY = 'mab:roles';

export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
