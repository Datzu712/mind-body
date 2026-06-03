import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { TypedConfigService } from '@/config/typed-config.service';

export type APPLICATION_ROLE = 'MEMBER' | 'TRAINER' | 'ADMIN';

@Injectable()
export class KeycloakAdminService implements OnModuleInit, OnModuleDestroy {
    #isAuthenticated = false;

    private refreshIntervalId: NodeJS.Timeout | null = null;

    private logger = new Logger('KeycloakAdminService');
    private kcClient!: KcAdminClient;
    private readonly refreshInterval = 58 * 1000; // Refresh token every 58 seconds

    constructor(private readonly configService: TypedConfigService) {}

    async onModuleInit() {
        this.kcClient = new KcAdminClient({
            baseUrl: this.configService.getOrThrow('KC_BASE_URL'),
            realmName: this.configService.getOrThrow('KC_REALM'),
        });

        await this.auth();
        await this.seedRoles();

        this.refreshIntervalId = setInterval(() => void this.auth(), this.refreshInterval);
    }

    onModuleDestroy() {
        if (this.refreshIntervalId) {
            clearInterval(this.refreshIntervalId);
            this.refreshIntervalId = null;
        }
    }

    async auth() {
        try {
            await this.kcClient.auth({
                clientId: this.configService.getOrThrow('KC_ADMIN_CLIENT_ID'),
                clientSecret: this.configService.getOrThrow('KC_ADMIN_CLIENT_SECRET'),
                grantType: 'client_credentials',
            });

            this.#isAuthenticated = true;
        } catch (error) {
            this.#isAuthenticated = false;

            this.logger.error(error);
        }
    }

    get realm(): string {
        return this.configService.getOrThrow('KC_REALM');
    }

    get isAuthenticated() {
        return this.#isAuthenticated;
    }

    private assertAuthenticated() {
        if (!this.#isAuthenticated) {
            throw new InternalServerErrorException(`KC admin service is not authenticated with keycloak!`);
        }
    }

    async getUsers() {
        this.assertAuthenticated();

        return this.kcClient.users.find();
    }

    async getUserById(id: string) {
        this.assertAuthenticated();

        const user = await this.kcClient.users.findOne({ id });

        if (!user) {
            throw new NotFoundException({
                message: `User ${id} not found`,
            });
        }

        return user;
    }

    async getUserRoles(id: string) {
        this.assertAuthenticated();

        const roles = await this.kcClient.users.listRealmRoleMappings({ id });

        return roles.filter((r) => !this.isSystemRole(r.name));
    }
    async updateUserProfile(
        id: string,
        data: { username?: string; firstName?: string; lastName?: string; email?: string; enabled?: boolean },
    ) {
        this.assertAuthenticated();

        await this.kcClient.users.update({ id }, data);
    }

    private isSystemRole(name: string | undefined): boolean {
        if (!name) return true;
        return name.startsWith('default-roles-') || name === 'offline_access' || name === 'uma_authorization';
    }

    private async seedRoles() {
        if (!this.#isAuthenticated) {
            throw new InternalServerErrorException(`Cannot seed roles: not authenticated with Keycloak`);
        }

        const REQUIRED_ROLES: APPLICATION_ROLE[] = ['ADMIN', 'MEMBER', 'TRAINER'];

        const existing = await this.kcClient.roles.find();
        const existingNames = new Set(existing.map((r) => r.name));

        for (const role of REQUIRED_ROLES) {
            if (!existingNames.has(role)) {
                await this.kcClient.roles.create({ name: role });
                this.logger.log(`Created realm role: ${role}`);
            }
        }
    }

    async checkUserExists(email: string): Promise<boolean> {
        this.assertAuthenticated();

        const users = await this.kcClient.users.find({ email, exact: true });
        return users.length > 0;
    }
}
