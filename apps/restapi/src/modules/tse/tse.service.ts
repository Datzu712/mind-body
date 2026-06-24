/// <reference lib="DOM" />

// Adapted from: https://github.com/Datzu712/tse-webscrapper

import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import type { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

import { REDIS_KEY } from '@/infra/database/redis/redis-provider';

const TSE_URL = 'https://servicioselectorales.tse.go.cr/chc/consulta_cedula.aspx';
const CACHE_TTL = 60 * 60 * 24; // 24 hours

export interface TsePersonData {
    fullName: string;
    dni: string;
    dateOfBirth: string;
    nationality: string;
    /** Which registry resolved the lookup. `''` dateOfBirth accompanies `'PADRON'`. */
    source?: 'TSE' | 'PADRON';
}

// todo: move puppeteer to its own dedicated service
@Injectable()
export class TseService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TseService.name);
    private browser!: Browser;
    private pagePool: Page[] = [];
    private readonly poolSize = 3;
    private waitingQueue: ((page: Page) => void)[] = [];

    constructor(@Inject(REDIS_KEY) private readonly redis: Redis) {}

    async onModuleInit() {
        this.browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        for (let i = 0; i < this.poolSize; i++) {
            const page = await this.browser.newPage();

            this.pagePool.push(page);
        }

        this.logger.log(`Browser launched with ${this.poolSize} pages`);
    }

    async onModuleDestroy() {
        await this.browser?.close().catch(() => {});
    }

    async lookup(cedula: string): Promise<TsePersonData | null> {
        const cacheKey = `tse:${cedula}`;
        const cached = await this.redis.get(cacheKey);

        if (cached) {
            this.logger.debug(`Cache hit for cedula ${cedula}`);
            return JSON.parse(cached) as TsePersonData;
        }

        const page = await this.acquirePage();
        try {
            await page.goto(TSE_URL, { waitUntil: 'networkidle2' });
            const result = await this.scrape(page, cedula);

            if (result) {
                await this.redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
            }

            await page.goto('about:blank');

            return result;
        } catch (error) {
            this.logger.error(`Error scraping cedula ${cedula}`, error);
            throw error;
        } finally {
            this.releasePage(page);
        }
    }

    private async scrape(page: Page, cedula: string): Promise<TsePersonData | null> {
        await page.waitForSelector('input[name=txtcedula]');
        await page.type('input[name=txtcedula]', cedula);
        await page.click('#btnConsultaCedula');

        const found = await Promise.race([
            page.waitForSelector('#UpdatePanel4', { visible: true }).then(() => true),
            //  page.waitForSelector('#lblmensajes', { visible: false }).then(() => false),
        ]);

        if (!found) return null;

        const raw = (await page.evaluate(() => {
            const get = (id: string) => document.getElementById(id)?.innerText ?? '';

            return {
                fullName: get('lblnombrecompleto'),
                dni: get('lblcedula'),
                dateOfBirth: get('lblfechaNacimiento'),
                nationality: get('lblnacionalidad'),
            };
        })) satisfies TsePersonData;

        return {
            ...raw,
            dateOfBirth: this.parseTseDate(raw.dateOfBirth),
        };
    }

    private async acquirePage(): Promise<Page> {
        const page = this.pagePool.pop();

        if (page) return page;

        return new Promise((resolve) => {
            this.waitingQueue.push(resolve);
        });
    }

    private releasePage(page: Page) {
        const next = this.waitingQueue.shift();
        if (next) {
            next(page);
        } else {
            this.pagePool.push(page);
        }
    }

    /** Converts TSE date format (e.g. "15/06/1995" or "15 de junio de 1995") to YYYY-MM-DD */
    private parseTseDate(raw: string): string {
        // Try DD/MM/YYYY
        const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
        if (slashMatch) {
            const [, d, m, y] = slashMatch;
            return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
        }

        // Try parsing as Date directly
        const date = new Date(raw);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0]!;
        }

        return raw;
    }
}
