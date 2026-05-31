import { Module } from '@nestjs/common';

import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { KeycloakModule } from '@/infra/keycloak/keycloak.module';

@Module({
    imports: [KeycloakModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
