import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type Redis from 'ioredis';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { type User, Users } from '@/infra/database/pg/schemas/drizzle.schema';
import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { KeycloakAdminService } from '@/infra/keycloak/keycloak-admin.service';

interface UpsertUserOptions {
    keycloakId: string;
    firstName?: string | undefined;
    lastName?: string | undefined;
    email?: string | undefined;
}

@Injectable()
export class UsersService {
    constructor(
        private readonly drizzle: DrizzleService,
        @Inject(REDIS_KEY) private readonly redis: Redis,
        private readonly keycloak: KeycloakAdminService,
    ) {}

    /**
     * The only 2 ways users are created/updated in our system are:
     * 1. When the use create an account via Keycloak.
     * In this case, we are not able to trigger any
     */
    async syncFromToken({ keycloakId, firstName, lastName, email }: UpsertUserOptions): Promise<User> {
        const cacheKey = `user:${keycloakId}`;

        // fast lookup
        const userAlreadyExists = await this.redis.get(cacheKey);
        if (userAlreadyExists) {
            return JSON.parse(userAlreadyExists) as User;
        }

        // soft upsert:
        // - if the user already exists, the insert will trigger "ON CONFLICT DO UPDATE" statement,
        //   but the UPDATE sets keycloakId to its own value just to force RETURNING
        //   to return the existing record.
        // - if the user didn't exist, it simply gets inserted and returned.
        const [user] = await this.drizzle.db
            .insert(Users)
            .values({ keycloakId, firstName: firstName ?? null, lastName: lastName ?? null, email: email ?? null })
            .onConflictDoUpdate({
                target: Users.keycloakId,
                set: { keycloakId: sql`excluded."keycloak_id"` },
            })
            .returning();

        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 3_600);

        return user!;
    }

    async updateProfile(keycloakId: string, data: { firstName: string; lastName: string }): Promise<User> {
        const [user] = await this.drizzle.db
            .update(Users)
            .set({ firstName: data.firstName, lastName: data.lastName, updatedAt: new Date() })
            .where(eq(Users.keycloakId, keycloakId))
            .returning();

        await Promise.all([
            this.keycloak.updateUserProfile(keycloakId, { firstName: data.firstName, lastName: data.lastName }),
            this.redis.del(`user:${keycloakId}`),
        ]);

        return user!;
    }
}
