import { access, constants as fsConstants } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { TypedConfigService } from '@/config/typed-config.service';
import type { TsePersonData } from '../tse/tse.service';

const execFileAsync = promisify(execFile);
const CACHE_TTL = 60 * 60 * 24; // 24h — matches the TSE cache

/**
 * Fallback resolver backed by the TSE "Padrón Nacional" flat file (PADRON_COMPLETO.txt).
 *
 * The live TSE site is the primary source; this service is only consulted when that scrape
 * is unavailable (see TseController). The padrón has no date of birth and lists only Costa
 * Rican citizens, so resolved people carry `dateOfBirth: ''` and `nationality: 'COSTARRICENSE'`.
 *
 * File format (comma-separated, space-padded, ISO-8859-1):
 *   cedula, codelec, relleno, fecha_caducacion, junta, nombre, primer_apellido, segundo_apellido
 */
@Injectable()
export class PadronService implements OnModuleInit {
    private readonly logger = new Logger(PadronService.name);
    private readonly padronPath: string;

    constructor(
        @Inject(REDIS_KEY) private readonly redis: Redis,
        config: TypedConfigService,
    ) {
        this.padronPath = config.getOrThrow('PADRON_PATH');
    }

    /** Required-at-startup: refuse to boot if the padrón file is missing or unreadable. */
    async onModuleInit() {
        try {
            await access(this.padronPath, fsConstants.R_OK);
        } catch {
            throw new Error(
                `PADRON_PATH "${this.padronPath}" is missing or unreadable. Download ` +
                    `padron_completo.zip from https://www.tse.go.cr/descarga_padron.html, unzip it, ` +
                    `and point PADRON_PATH at PADRON_COMPLETO.txt.`,
            );
        }
        this.logger.log(`Padrón file ready at ${this.padronPath}`);
    }

    async lookup(cedula: string): Promise<TsePersonData | null> {
        const dni = cedula.replace(/\D/g, '');
        // National cédulas are exactly 9 digits. DIMEX/passport are never in the padrón, so
        // anything else short-circuits to a miss without scanning the ~250MB file.
        if (!/^\d{9}$/.test(dni)) {
            return null;
        }

        const cacheKey = `padron:${dni}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            this.logger.debug(`Cache hit for cédula ${dni}`);
            return JSON.parse(cached) as TsePersonData;
        }

        const row = await this.grepRow(dni);
        if (!row) {
            return null;
        }

        const person = PadronService.mapRow(row);
        await this.redis.set(cacheKey, JSON.stringify(person), 'EX', CACHE_TTL);
        return person;
    }

    /**
     * Returns the first padrón line whose first column equals `dni`, or null when there is none.
     *
     * Uses `execFile` (no shell — the cédula is never interpolated into a command string) with an
     * anchored pattern `^<dni>,` so it matches the first column only, never a substring of a later
     * field. grep's stdout is decoded as latin1 to preserve accents and `ñ`.
     */
    private async grepRow(dni: string): Promise<string | null> {
        try {
            const { stdout } = await execFileAsync('grep', ['-a', '-m', '1', `^${dni},`, this.padronPath], {
                encoding: 'buffer',
                maxBuffer: 1024 * 1024,
            });
            const line = stdout.toString('latin1').trim();
            return line || null;
        } catch (error) {
            // grep exits 1 when nothing matches — a normal "not found", not a failure.
            if ((error as { code?: number }).code === 1) {
                return null;
            }
            this.logger.error(`grep failed for cédula ${dni}`, error as Error);
            throw error;
        }
    }

    /** Maps a padrón CSV row to the shared person shape. */
    private static mapRow(row: string): TsePersonData {
        const fields = row.split(',');
        const fullName = [fields[5], fields[6], fields[7]]
            .map((part) => (part ?? '').trim())
            .filter(Boolean)
            .join(' ')
            .replace(/\s+/g, ' ');

        return {
            fullName,
            dni: (fields[0] ?? '').trim(),
            dateOfBirth: '',
            nationality: 'COSTARRICENSE',
            source: 'PADRON',
        };
    }
}
