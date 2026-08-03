import { Inject, Injectable, Logger } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { type ModelMessage, stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';
import type Redis from 'ioredis';
import { DateTime } from 'luxon';

import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { type User } from '@/infra/database/pg/schemas/schema';
import { ClockService } from '@/common/clock/clock.service';
import { MeasurementsService } from '@/modules/measurements/measurements.service';
import { ActivityService } from '@/modules/activity/activity.service';
import { ReservationsService } from '@/modules/reservations/reservations.service';
import { ClassSessionsService } from '@/modules/class-sessions/class-sessions.service';
import { ExercisesService } from '@/modules/exercises/exercises.service';

const HISTORY_TTL_SECONDS = 86_400; // 24 h
const MAX_HISTORY_MESSAGES = 50;

interface MeasurementRow {
    measuredAt: string;
    weightKg: string | null;
    heightCm: string | null;
    bodyFatPercentage: string | null;
    waistCm: string | null;
}

const slimMeasurement = (m: MeasurementRow | null) =>
    m && {
        measuredAt: m.measuredAt,
        weightKg: m.weightKg,
        heightCm: m.heightCm,
        bodyFatPercentage: m.bodyFatPercentage,
        waistCm: m.waistCm,
    };

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);

    constructor(
        @Inject(REDIS_KEY) private readonly redis: Redis,
        private readonly clock: ClockService,
        private readonly measurements: MeasurementsService,
        private readonly activity: ActivityService,
        private readonly reservations: ReservationsService,
        private readonly classSessions: ClassSessionsService,
        private readonly exercises: ExercisesService,
    ) {}

    async *streamChat(userMessage: string, currentUser: User): AsyncGenerator<string> {
        const [history, latestMeasurement] = await Promise.all([
            this.loadHistory(currentUser.keycloakSubject),
            this.loadLatestMeasurement(currentUser),
        ]);
        const inputMessages: ModelMessage[] = [...history, { role: 'user', content: userMessage }];

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: this.buildSystemPrompt(currentUser, latestMeasurement),
            messages: inputMessages,
            tools: { ...this.buildCatalogTools(), ...this.buildUserTools(currentUser) },
            stopWhen: stepCountIs(5),
            onStepFinish: ({ toolCalls, toolResults }) => {
                if (toolCalls?.length) {
                    this.logger.debug(`tools called: ${toolCalls.map((c) => c.toolName).join(', ')}`);
                    this.logger.debug(`tool results: ${toolResults.map((r) => r.toolName).join(', ')}`);
                }
            },
        });

        for await (const token of result.textStream) {
            yield token;
        }

        const { messages: responseMessages } = await result.response;
        await this.saveHistory(currentUser.keycloakSubject, [...inputMessages, ...responseMessages]);
    }

    /** Tools over the gym's exercise catalog (seeded, read-only). */
    private buildCatalogTools() {
        return {
            getExerciseFilters: tool({
                description:
                    'Get the valid filter values of the exercise catalog: body parts, equipment types and target ' +
                    'muscles. Call this before searchExercises when you need to filter by one of those fields.',
                inputSchema: z.object({}),
                execute: async () => {
                    try {
                        return await this.exercises.facets();
                    } catch (err) {
                        return this.toolError('getExerciseFilters', err);
                    }
                },
            }),
            searchExercises: tool({
                description:
                    "Search the app's exercise library. Every exercise you recommend must come from here so the " +
                    'user can find it (with demo GIF and instructions) in the Exercises section of the app. ' +
                    'Filters must use values returned by getExerciseFilters.',
                inputSchema: z.object({
                    q: z.string().max(120).optional().describe('Free-text search on the exercise name (English)'),
                    bodyPart: z.string().max(80).optional(),
                    equipment: z.string().max(80).optional(),
                    target: z.string().max(80).optional().describe('Primary muscle worked'),
                    limit: z.number().int().min(1).max(25).default(10),
                }),
                execute: async ({ q, bodyPart, equipment, target, limit }) => {
                    try {
                        const page = await this.exercises.list({
                            limit,
                            offset: 0,
                            ...(q && { q }),
                            ...(bodyPart && { bodyPart }),
                            ...(equipment && { equipment }),
                            ...(target && { target }),
                        });
                        return {
                            total: page.total,
                            items: page.items.map((e) => ({
                                id: e.id,
                                name: e.name,
                                bodyPart: e.bodyPart,
                                equipment: e.equipment,
                                target: e.target,
                            })),
                        };
                    } catch (err) {
                        return this.toolError('searchExercises', err);
                    }
                },
            }),
            getExerciseDetails: tool({
                description:
                    'Get the full details of one exercise from the library by its id (from searchExercises): ' +
                    'step-by-step instructions, secondary muscles and description. Use it when explaining form ' +
                    'or technique for a specific exercise.',
                inputSchema: z.object({
                    id: z.string().describe('Exercise id returned by searchExercises'),
                }),
                execute: async ({ id }) => {
                    try {
                        const e = await this.exercises.detail(id);
                        return {
                            name: e.name,
                            bodyPart: e.bodyPart,
                            equipment: e.equipment,
                            target: e.target,
                            secondaryMuscles: e.secondaryMuscles,
                            instructions: e.instructions,
                            description: e.description,
                        };
                    } catch (err) {
                        return this.toolError('getExerciseDetails', err);
                    }
                },
            }),
        };
    }

    /** Tools backed by real per-user data. Errors are returned as data so a
     *  missing member profile degrades to a normal answer instead of killing the stream. */
    private buildUserTools(user: User) {
        return {
            getBodyProgress: tool({
                description:
                    "Get the user's real body measurement progress: first and latest recorded measurements " +
                    '(weight, body fat %, waist) with the variation between them.',
                inputSchema: z.object({}),
                execute: async () => {
                    try {
                        const summary = await this.measurements.getSummary(user.id);
                        return {
                            first: slimMeasurement(summary.first),
                            latest: slimMeasurement(summary.latest),
                            variations: summary.variations,
                            totalRecords: summary.totalRecords,
                        };
                    } catch (err) {
                        return this.toolError('getBodyProgress', err);
                    }
                },
            }),
            getRecentActivity: tool({
                description:
                    "Get the user's real daily activity (steps and calories burned, synced from their smartwatch/phone) " +
                    'for the last N days.',
                inputSchema: z.object({
                    days: z.number().int().min(1).max(31).default(7).describe('How many days back to look (default 7)'),
                }),
                execute: async ({ days }) => {
                    try {
                        const to = this.clock.nowLocal();
                        const from = to.minus({ days: days - 1 });
                        const rows = await this.activity.getRange(user.id, from.toISODate()!, to.toISODate()!);
                        return { from: from.toISODate(), to: to.toISODate(), days: rows };
                    } catch (err) {
                        return this.toolError('getRecentActivity', err);
                    }
                },
            }),
            getMyReservations: tool({
                description: "Get the user's class reservations at the gym (upcoming bookings or past history).",
                inputSchema: z.object({
                    scope: z.enum(['UPCOMING', 'HISTORY']).default('UPCOMING'),
                }),
                execute: async ({ scope }) => {
                    try {
                        const rows = await this.reservations.listMine({ scope }, user.id);
                        return rows.map((r) => ({
                            className: r.session.className,
                            trainerName: r.session.trainerName,
                            startsAtLocal: this.clock.toLocal(r.session.startsAt).toFormat('yyyy-MM-dd HH:mm'),
                            status: r.status,
                            room: r.session.room,
                        }));
                    } catch (err) {
                        return this.toolError('getMyReservations', err);
                    }
                },
            }),
            getUpcomingClasses: tool({
                description:
                    'Get the gym class schedule for the next days: available group classes with trainer, time, ' +
                    'category, level and free spots. Useful to recommend a concrete class the user can book in the app.',
                inputSchema: z.object({
                    days: z
                        .number()
                        .int()
                        .min(1)
                        .max(31)
                        .default(7)
                        .describe('How many days ahead to look (default 7)'),
                }),
                execute: async ({ days }) => {
                    try {
                        const from = this.clock.nowLocal();
                        const to = from.plus({ days: days - 1 });
                        const sessions = await this.classSessions.list(
                            { from: from.toISODate()!, to: to.toISODate()! },
                            user.id,
                        );
                        return sessions
                            .filter((s) => s.status === 'SCHEDULED')
                            .map((s) => ({
                                className: s.className,
                                description: s.description,
                                trainerName: s.trainerName,
                                date: s.localDate,
                                time: `${s.startTime}-${s.endTime}`,
                                category: s.category,
                                level: s.level,
                                availableSpots: s.availableSpots,
                                alreadyReserved: s.viewer?.reservationId != null,
                            }));
                    } catch (err) {
                        return this.toolError('getUpcomingClasses', err);
                    }
                },
            }),
        };
    }

    /** Latest body measurement for the system prompt. Null (silently) when the
     *  user has no member profile or no records — the coach just asks instead. */
    private async loadLatestMeasurement(user: User) {
        try {
            const summary = await this.measurements.getSummary(user.id);
            return slimMeasurement(summary.latest);
        } catch {
            return null;
        }
    }

    private toolError(toolName: string, err: unknown): { error: string } {
        this.logger.warn(`${toolName} failed: ${err instanceof Error ? err.message : String(err)}`);
        return { error: 'This data is not available for the user right now.' };
    }

    private historyKey(userId: string): string {
        return `chat:history:${userId}`;
    }

    private async loadHistory(userId: string): Promise<ModelMessage[]> {
        const raw = await this.redis.get(this.historyKey(userId));
        if (!raw) return [];
        try {
            return JSON.parse(raw) as ModelMessage[];
        } catch {
            return [];
        }
    }

    private async saveHistory(userId: string, messages: ModelMessage[]): Promise<void> {
        const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
        await this.redis.set(this.historyKey(userId), JSON.stringify(trimmed), 'EX', HISTORY_TTL_SECONDS);
    }

    private buildSystemPrompt(user: User, latestMeasurement: ReturnType<typeof slimMeasurement>): string {
        const name = user.fullName || 'the user';
        const today = this.clock.nowLocal();
        const age = user.birthDate ? Math.floor(-DateTime.fromISO(user.birthDate).diffNow('years').years) : null;

        const m = latestMeasurement;
        const measurementLines = m
            ? [
                  m.weightKg && `- Weight: ${m.weightKg} kg`,
                  m.heightCm && `- Height: ${m.heightCm} cm`,
                  m.bodyFatPercentage && `- Body fat: ${m.bodyFatPercentage} %`,
                  m.waistCm && `- Waist: ${m.waistCm} cm`,
              ].filter(Boolean)
            : [];
        const measurementBlock = m
            ? `Latest body measurement (recorded ${m.measuredAt}):\n${measurementLines.join('\n')}`
            : 'No body measurements recorded yet — ask before giving weight-dependent advice.';

        return `
            You are a knowledgeable and motivating personal fitness coach inside the Mind&Body app.
            You are talking to ${name}${age ? ` (${age} years old)` : ''}.
            Today is ${today.toFormat('cccc, yyyy-MM-dd')} (${today.toFormat('HH:mm')} local time).

            ## User data (real, already loaded)
            ${measurementBlock}
            Use getBodyProgress when the user asks about progress or changes over time.

            ## Personality
            - Encouraging and direct — no fluff
            - Adapt your tone: casual for general questions, precise and technical when discussing form or programming
            - Use bullet points and short paragraphs; avoid walls of text

            ## What you help with
            - Personalized workout routines (strength, hypertrophy, cardio, fat loss)
            - Exercise technique and form cues
            - Workout split design and volume management
            - Basic nutrition guidance (macros, meal timing, hydration)
            - Warm-up, cool-down, and recovery advice
            - Progress tracking and programme adjustments

            ## Rules
            - Ground your advice in the user's REAL data whenever relevant: body progress (getBodyProgress),
              recent activity (getRecentActivity), their reservations (getMyReservations) and the gym's
              class schedule (getUpcomingClasses)
            - When recommending exercises or building workout plans, pick exercises from the app's library:
              use searchExercises (and getExerciseFilters for valid filters); use getExerciseDetails when
              explaining technique. Tell the user they can see each exercise with its demo GIF and
              instructions in the Exercises section of the app
            - Exercise names in the library are in English; keep the official name and add a short Spanish
              explanation when the user writes in Spanish
            - When recommending group classes, only suggest concrete sessions returned by getUpcomingClasses
              and mention day, time and trainer; the user books them from the reservations tab in the app
            - Never diagnose medical conditions — refer to a doctor when pain or injury is involved
            - Do not recommend specific supplements or medications
            - Keep recommendations realistic and sustainable
            - End every response with a clear next step or follow-up question

            ## Response format
            - Use markdown: bold key terms, bullet lists for exercises, tables when comparing options
            - Workout plans: list exercises with sets x reps and rest periods
            - Keep responses concise — aim for clarity over completeness
        `.trim();
    }
}
