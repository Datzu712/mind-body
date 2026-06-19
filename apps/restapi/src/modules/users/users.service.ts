import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import type Redis from 'ioredis';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import { usersInApp as Users } from '@/infra/database/pg/schemas/schema';
import type { User } from '@/infra/database/pg/schemas/schema';
import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { KeycloakAdminService } from '@/infra/keycloak/keycloak-admin.service';

interface UpsertUserOptions {
    keycloakId: string;
    fullName: string;
    email?: string | undefined;
}

@Injectable()
export class UsersService {
    constructor(
        private readonly drizzle: DrizzleService,
        @Inject(REDIS_KEY) private readonly redis: Redis,
        private readonly keycloak: KeycloakAdminService,
    ) {}

    async syncFromToken({ keycloakId, fullName, email }: UpsertUserOptions): Promise<User> {
        const cacheKey = `user:${keycloakId}`;
        const incomingEmail = email ?? null;

        const cached = await this.redis.get(cacheKey);
        if (cached) {
            const cachedUser = JSON.parse(cached) as User;
            if (cachedUser.email === incomingEmail) return cachedUser;
        }

        const [user] = await this.drizzle.db
            .insert(Users)
            .values({ keycloakSubject: keycloakId, fullName, email: incomingEmail ?? '' })
            .onConflictDoUpdate({
                target: Users.keycloakSubject,
                set: {
                    email: sql`excluded."email"`,
                },
            })
            .returning();

        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 3_600);

        return user!;
    }

    async updateProfile(keycloakId: string, data: { fullName: string }): Promise<User> {
        const [user] = await this.drizzle.db
            .update(Users)
            .set({ fullName: data.fullName, updatedAt: sql`now()` })
            .where(eq(Users.keycloakSubject, keycloakId))
            .returning();

        await Promise.all([
            this.keycloak.updateUserProfile(keycloakId, { firstName: data.fullName, lastName: '' }),
            this.redis.del(`user:${keycloakId}`),
        ]);

        return user!;
    }
}
