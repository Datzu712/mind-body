import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type Redis from 'ioredis';

import { PadronService } from '../src/modules/padron/padron.service';
import type { TypedConfigService } from '../src/config/typed-config.service';

const FIXTURE_PATH = join(tmpdir(), `padron-fixture-${process.pid}.txt`);

// cedula, codelec, relleno, fecha_caducacion, junta, nombre, primer_apellido, segundo_apellido
// Names are space-padded (like the real fixed-width file) to exercise per-field trimming.
const ROWS = [
    '100000001,11801,1,2030,01001,JUAN          ,PEREZ         ,GOMEZ         ',
    // Accents + ñ — verifies the latin1 decode path.
    '100000002,11802,2,2031,01002,MARÍA         ,PEÑA          ,NÚÑEZ         ',
    // `100000099` appears here only as the 2nd column — must NOT match an anchored cedula search.
    '200000003,100000099,1,2027,01001,CARLOS        ,SOLANO        ,VARGAS        ',
];

function makeRedis(overrides: Partial<Pick<Redis, 'get' | 'set'>> = {}) {
    return {
        get: overrides.get ?? vi.fn(async () => null),
        set: overrides.set ?? vi.fn(async () => 'OK'),
    } as unknown as Redis;
}

function makeService(redis: Redis) {
    const config = { getOrThrow: () => FIXTURE_PATH } as unknown as TypedConfigService;
    return new PadronService(redis, config);
}

describe('PadronService.lookup', () => {
    beforeAll(() => {
        // Write the fixture as latin1 bytes so accented names round-trip through grep + decode.
        writeFileSync(FIXTURE_PATH, Buffer.from(ROWS.join('\n') + '\n', 'latin1'));
    });

    afterAll(() => {
        rmSync(FIXTURE_PATH, { force: true });
    });

    it('resolves a cedula to the shared person shape', async () => {
        const redis = makeRedis();
        const person = await makeService(redis).lookup('100000001');

        expect(person).toEqual({
            fullName: 'JUAN PEREZ GOMEZ',
            dni: '100000001',
            dateOfBirth: '',
            nationality: 'COSTARRICENSE',
            source: 'PADRON',
        });
        // Hit is cached for next time.
        expect(redis.set).toHaveBeenCalledWith('padron:100000001', JSON.stringify(person), 'EX', 60 * 60 * 24);
    });

    it('decodes latin1 accents and ñ correctly', async () => {
        const person = await makeService(makeRedis()).lookup('100000002');
        expect(person?.fullName).toBe('MARÍA PEÑA NÚÑEZ');
    });

    it('normalizes non-digit characters in the input cedula', async () => {
        const person = await makeService(makeRedis()).lookup('1-0000-0001');
        expect(person?.dni).toBe('100000001');
    });

    it('returns null when the cedula is not in the padrón', async () => {
        const person = await makeService(makeRedis()).lookup('999999999');
        expect(person).toBeNull();
    });

    it('anchors the match to the first column (no substring false-positives)', async () => {
        // 100000099 exists only as a codelec in row 3 — an anchored search must not match it.
        const person = await makeService(makeRedis()).lookup('100000099');
        expect(person).toBeNull();
    });

    it('short-circuits invalid cedulas without touching Redis or the file', async () => {
        const redis = makeRedis();
        const service = makeService(redis);

        expect(await service.lookup('123')).toBeNull(); // too short
        expect(await service.lookup('abcdefghi')).toBeNull(); // non-numeric
        expect(redis.get).not.toHaveBeenCalled();
    });

    it('serves a cached lookup without scanning the file', async () => {
        const cached = {
            fullName: 'CACHED PERSON',
            dni: '100000001',
            dateOfBirth: '',
            nationality: 'COSTARRICENSE',
            source: 'PADRON' as const,
        };
        const redis = makeRedis({ get: vi.fn(async () => JSON.stringify(cached)) });
        const set = redis.set as ReturnType<typeof vi.fn>;

        const person = await makeService(redis).lookup('100000001');

        expect(person).toEqual(cached); // came from cache, not the file (file says "JUAN PEREZ GOMEZ")
        expect(set).not.toHaveBeenCalled();
    });
});
