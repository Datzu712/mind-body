import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, ne, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type Redis from 'ioredis';

import { DrizzleService } from '@/infra/database/pg/drizzle.service';
import {
    usersInApp as Users,
    membersInApp as Members,
    trainersInApp as Trainers,
    staffInApp as Staff,
} from '@/infra/database/pg/schemas/schema';
import type { User } from '@/infra/database/pg/schemas/schema';
import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { KeycloakAdminService, type APPLICATION_ROLE } from '@/infra/keycloak/keycloak-admin.service';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { CreateUserDto } from './dto/create-user.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import type { CreateProfileDto } from './dto/create-profile.dto';
import type { UpdateMemberProfileDto } from './dto/update-member-profile.dto';
import type { UpdateTrainerProfileDto } from './dto/update-trainer-profile.dto';
import type { UpdateStaffProfileDto } from './dto/update-staff-profile.dto';

type ProfileType = 'MEMBER' | 'TRAINER' | 'STAFF';

interface UpsertUserOptions {
    keycloakId: string;
    fullName: string;
    email?: string | undefined;
}

const PROFILE_TO_KC_ROLE: Record<ProfileType, APPLICATION_ROLE> = {
    MEMBER: 'MEMBER',
    TRAINER: 'TRAINER',
    STAFF: 'STAFF',
};

const SORT_COLUMNS = {
    fullName: Users.fullName,
    phone: Users.phone,
    dni: Users.dni,
    status: Users.status,
    createdAt: Users.createdAt,
} as const;

const DNI_CONFLICT_MESSAGE = 'Ya existe un usuario con este documento de identidad.';

/** True for a Postgres unique-constraint violation (SQLSTATE 23505). */
function isUniqueViolation(err: unknown): boolean {
    return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
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

        const cached = await this.redis.get(cacheKey);
        if (cached) return JSON.parse(cached) as User;

        const [user] = await this.drizzle.db
            .insert(Users)
            .values({ keycloakSubject: keycloakId, fullName, email })
            .onConflictDoUpdate({
                target: Users.keycloakSubject,
                // Only the email is token-sourced. `fullName` is admin-managed in the
                // dashboard, so an existing user's name must NOT be reverted to the
                // (possibly stale) token claim on every request.
                set: { email, updatedAt: sql`now()` },
            })
            .returning();

        await this.redis.set(cacheKey, JSON.stringify(user), 'EX', 3_600);

        return user!;
    }

    async findAll(query: ListUsersQueryDto) {
        const { page, limit, name, email, phone, dni, profile, status, sortBy, sortDir } = query;
        const offset = (page - 1) * limit;

        const sortColumn = SORT_COLUMNS[sortBy ?? 'createdAt'];
        const orderBy = sortDir === 'desc' ? desc(sortColumn) : asc(sortColumn);

        const conditions: SQL[] = [];
        if (name) conditions.push(ilike(Users.fullName, `%${name}%`));
        if (email) conditions.push(ilike(Users.email, `%${email}%`));
        if (phone) conditions.push(ilike(Users.phone, `%${phone}%`));
        if (dni) conditions.push(ilike(Users.dni, `%${dni}%`));
        if (status) conditions.push(eq(Users.status, status));

        // Filter by profile: only return users that have a row in the matching table
        if (profile === 'MEMBER') {
            conditions.push(sql`EXISTS (SELECT 1 FROM app.members m WHERE m.user_id = ${Users.id})`);
        } else if (profile === 'TRAINER') {
            conditions.push(sql`EXISTS (SELECT 1 FROM app.trainers t WHERE t.user_id = ${Users.id})`);
        } else if (profile === 'STAFF') {
            conditions.push(sql`EXISTS (SELECT 1 FROM app.staff s WHERE s.user_id = ${Users.id})`);
        }

        const where = conditions.length > 0 ? and(...conditions) : undefined;

        const [users, [countResult]] = await Promise.all([
            this.drizzle.db.select().from(Users).where(where).limit(limit).offset(offset).orderBy(orderBy),
            this.drizzle.db.select({ total: count() }).from(Users).where(where),
        ]);

        // Enrich with profiles array and KC roles
        const enriched = await Promise.all(users.map(async (u) => this.enrichUser(u)));

        return {
            data: enriched,
            total: countResult?.total ?? 0,
            page,
            limit,
        };
    }

    async findById(id: string) {
        const [user] = await this.drizzle.db.select().from(Users).where(eq(Users.id, id));
        if (!user) throw new NotFoundException(`User ${id} not found`);

        const [memberProfile, trainerProfile, staffProfile] = await Promise.all([
            this.drizzle.db
                .select()
                .from(Members)
                .where(eq(Members.userId, id))
                .then((r) => r[0]),
            this.drizzle.db
                .select()
                .from(Trainers)
                .where(eq(Trainers.userId, id))
                .then((r) => r[0]),
            this.drizzle.db
                .select()
                .from(Staff)
                .where(eq(Staff.userId, id))
                .then((r) => r[0]),
        ]);

        const roles = await this.getKcRoles(user.keycloakSubject);
        const profiles = this.detectProfiles(memberProfile, trainerProfile, staffProfile);

        return {
            ...user,
            roles,
            profiles,
            memberProfile: memberProfile ?? undefined,
            trainerProfile: trainerProfile ?? undefined,
            staffProfile: staffProfile ?? undefined,
        };
    }

    async create(dto: CreateUserDto) {
        const exists = await this.keycloak.checkUserExists(dto.email);
        if (exists) throw new ConflictException('A user with this email already exists.');

        const [firstName = '', ...restName] = dto.fullName.split(' ');
        const lastName = restName.join(' ');

        const kcUserId = await this.keycloak.createUser({
            email: dto.email,
            firstName,
            lastName,
        });

        await this.keycloak.assignRole(kcUserId, PROFILE_TO_KC_ROLE[dto.profileType]);

        const [user] = await this.drizzle.db
            .insert(Users)
            .values({
                keycloakSubject: kcUserId,
                fullName: dto.fullName,
                email: dto.email,
                phone: dto.phone,
                dni: this.normalizeDni(dto.dni, dto.dniType) ?? undefined,
                dniType: dto.dniType,
                birthDate: dto.birthDate,
            })
            .returning();

        await this.insertProfile(user!.id, dto.profileType, {
            joinedAt: dto.memberFields?.joinedAt,
            emergencyContactName: dto.memberFields?.emergencyContactName,
            emergencyContactPhone: dto.memberFields?.emergencyContactPhone,
            specialty: dto.trainerFields?.specialty,
            biography: dto.trainerFields?.biography,
            hiredAt: dto.staffFields?.hiredAt,
        });

        this.keycloak.sendPasswordSetupEmail(kcUserId).catch(() => {
            // Non-critical — log but don't fail
        });

        return this.findById(user!.id);
    }

    async update(id: string, dto: UpdateUserDto) {
        const [existing] = await this.drizzle.db.select().from(Users).where(eq(Users.id, id));
        if (!existing) throw new NotFoundException(`User ${id} not found`);

        // Normalize the DNI (trim, '' -> null, validate cédula format) against the
        // effective document type — the one being set, or the existing one.
        const nextDni = this.normalizeDni(dto.dni, dto.dniType ?? existing.dniType);

        // The DNI is UNIQUE — reject a value already taken by another user before
        // hitting the DB constraint, so the client gets a clean 409 instead of a 500.
        // A null DNI means "no document" and never collides (multiple NULLs allowed).
        if (nextDni != null && nextDni !== existing.dni) {
            const [dupe] = await this.drizzle.db
                .select({ id: Users.id })
                .from(Users)
                .where(and(eq(Users.dni, nextDni), ne(Users.id, id)));
            if (dupe) throw new ConflictException(DNI_CONFLICT_MESSAGE);
        }

        const set: Record<string, unknown> = { updatedAt: sql`now()` };
        if (dto.fullName !== undefined) set.fullName = dto.fullName;
        if (dto.phone !== undefined) set.phone = dto.phone;
        if (dto.status !== undefined) set.status = dto.status;
        if (nextDni !== undefined) set.dni = nextDni;
        if (dto.dniType !== undefined) set.dniType = dto.dniType;
        if (dto.birthDate !== undefined) set.birthDate = dto.birthDate === '' ? null : dto.birthDate;

        try {
            await this.drizzle.db.update(Users).set(set).where(eq(Users.id, id));
        } catch (err) {
            // Backstop the pre-check's TOCTOU race: a concurrent update can still
            // trip the unique index — surface it as the same clean 409.
            if (isUniqueViolation(err)) throw new ConflictException(DNI_CONFLICT_MESSAGE);
            throw err;
        }

        // Sync name to KC if changed
        if (dto.fullName) {
            const [first = '', ...rest] = dto.fullName.split(' ');
            await this.keycloak.updateUserProfile(existing.keycloakSubject, {
                firstName: first,
                lastName: rest.join(' '),
            });
        }

        await this.redis.del(`user:${existing.keycloakSubject}`);

        return this.findById(id);
    }

    async createProfile(userId: string, dto: CreateProfileDto) {
        const [user] = await this.drizzle.db.select().from(Users).where(eq(Users.id, userId));
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        await this.insertProfile(userId, dto.profileType, {
            joinedAt: dto.joinedAt,
            emergencyContactName: dto.emergencyContactName,
            emergencyContactPhone: dto.emergencyContactPhone,
            specialty: dto.specialty,
            biography: dto.biography,
            hiredAt: dto.hiredAt,
        });

        // Assign KC role
        await this.keycloak.assignRole(user.keycloakSubject, PROFILE_TO_KC_ROLE[dto.profileType]);

        return this.findById(userId);
    }

    async updateMemberProfile(userId: string, dto: UpdateMemberProfileDto) {
        const [profile] = await this.drizzle.db.select().from(Members).where(eq(Members.userId, userId));
        if (!profile) throw new NotFoundException(`Member profile not found for user ${userId}`);

        const set: Record<string, unknown> = { updatedAt: sql`now()` };
        if (dto.emergencyContactName !== undefined) set.emergencyContactName = dto.emergencyContactName;
        if (dto.emergencyContactPhone !== undefined) set.emergencyContactPhone = dto.emergencyContactPhone;
        if (dto.notes !== undefined) set.notes = dto.notes;

        await this.drizzle.db.update(Members).set(set).where(eq(Members.userId, userId));

        return this.findById(userId);
    }

    async updateTrainerProfile(userId: string, dto: UpdateTrainerProfileDto) {
        const [profile] = await this.drizzle.db.select().from(Trainers).where(eq(Trainers.userId, userId));
        if (!profile) throw new NotFoundException(`Trainer profile not found for user ${userId}`);

        const set: Record<string, unknown> = { updatedAt: sql`now()` };
        if (dto.specialty !== undefined) set.specialty = dto.specialty;
        if (dto.biography !== undefined) set.biography = dto.biography;

        await this.drizzle.db.update(Trainers).set(set).where(eq(Trainers.userId, userId));

        return this.findById(userId);
    }

    async updateStaffProfile(userId: string, dto: UpdateStaffProfileDto) {
        const [profile] = await this.drizzle.db.select().from(Staff).where(eq(Staff.userId, userId));
        if (!profile) throw new NotFoundException(`Staff profile not found for user ${userId}`);

        const set: Record<string, unknown> = { updatedAt: sql`now()` };
        if (dto.hiredAt !== undefined) set.hiredAt = dto.hiredAt;

        await this.drizzle.db.update(Staff).set(set).where(eq(Staff.userId, userId));

        return this.findById(userId);
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

    /**
     * Trim a DNI, map an empty value to null ("no document" — keeps the UNIQUE
     * column clean), and enforce the national-ID format so the API does not rely
     * on the client. Returns `undefined` when no DNI was provided (field left
     * untouched on update).
     */
    private normalizeDni(
        dni: string | undefined,
        dniType: 'CEDULA_NACIONAL' | 'DIMEX' | 'PASAPORTE' | null | undefined,
    ): string | null | undefined {
        if (dni === undefined) return undefined;
        const trimmed = dni.trim();
        if (trimmed === '') return null;
        if (dniType === 'CEDULA_NACIONAL' && !/^\d{9}$/.test(trimmed)) {
            throw new BadRequestException('La cédula nacional debe tener 9 dígitos.');
        }
        return trimmed;
    }

    private async enrichUser(user: User) {
        const [memberExists, trainerExists, staffExists] = await Promise.all([
            this.drizzle.db
                .select({ id: Members.id })
                .from(Members)
                .where(eq(Members.userId, user.id))
                .then((r) => r.length > 0),
            this.drizzle.db
                .select({ id: Trainers.id })
                .from(Trainers)
                .where(eq(Trainers.userId, user.id))
                .then((r) => r.length > 0),
            this.drizzle.db
                .select({ id: Staff.id })
                .from(Staff)
                .where(eq(Staff.userId, user.id))
                .then((r) => r.length > 0),
        ]);

        const profiles: ProfileType[] = [];
        if (memberExists) profiles.push('MEMBER');
        if (trainerExists) profiles.push('TRAINER');
        if (staffExists) profiles.push('STAFF');

        const roles = await this.getKcRoles(user.keycloakSubject);

        return { ...user, roles, profiles };
    }

    private async getKcRoles(keycloakSubject: string): Promise<string[]> {
        try {
            const kcRoles = await this.keycloak.getUserRoles(keycloakSubject);
            return kcRoles.map((r) => r.name).filter((n): n is string => !!n);
        } catch {
            return [];
        }
    }

    private detectProfiles(member: unknown, trainer: unknown, staff: unknown): ProfileType[] {
        const profiles: ProfileType[] = [];
        if (member) profiles.push('MEMBER');
        if (trainer) profiles.push('TRAINER');
        if (staff) profiles.push('STAFF');
        return profiles;
    }

    private async insertProfile(
        userId: string,
        profileType: ProfileType,
        fields: {
            joinedAt?: string | undefined;
            emergencyContactName?: string | undefined;
            emergencyContactPhone?: string | undefined;
            specialty?: string | undefined;
            biography?: string | undefined;
            hiredAt?: string | undefined;
        },
    ) {
        switch (profileType) {
            case 'MEMBER':
                await this.drizzle.db.insert(Members).values({
                    userId,
                    emergencyContactName: fields.emergencyContactName,
                    emergencyContactPhone: fields.emergencyContactPhone,
                    joinedAt: fields.joinedAt,
                });
                break;
            case 'TRAINER':
                await this.drizzle.db.insert(Trainers).values({
                    userId,
                    specialty: fields.specialty,
                    biography: fields.biography,
                });
                break;
            case 'STAFF':
                await this.drizzle.db.insert(Staff).values({
                    userId,
                    hiredAt: fields.hiredAt,
                });
                break;
        }
    }
}
