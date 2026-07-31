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

const HISTORY_TTL_SECONDS = 86_400; // 24 h
const MAX_HISTORY_MESSAGES = 50;

// Mocked tools: no backend module exists yet for routines/equipment, so the
// coach keeps answering from a plausible static plan until those ship.
const mockedTools = {
    getAvailableEquipment: tool({
        description: 'Get the list of gym equipment available to the user for their workouts.',
        inputSchema: z.object({}),
        execute: () => ({
            equipment: [
                'Barbell',
                'Dumbbells (5 - 40 kg)',
                'EZ curl bar',
                'Pull-up bar',
                'Flat bench',
                'Incline bench',
                'Squat rack',
                'Cable machine (high & low pulley)',
                'Leg press machine',
                'Resistance bands',
            ],
        }),
    }),
    getUserFitnessProfile: tool({
        description:
            "Get the user's fitness profile: experience level, primary goals, training frequency, and any injuries or limitations.",
        inputSchema: z.object({}),
        execute: () => ({
            experienceLevel: 'Intermediate',
            trainingYears: 3,
            primaryGoal: 'Muscle hypertrophy',
            secondaryGoal: 'Improve strength in compound lifts',
            trainingDaysPerWeek: 5,
            currentSplit: 'Push / Pull / Legs (PPL x2 per week, one rest day)',
            injuries: 'None currently',
            preferredWorkoutDuration: '60-75 minutes',
        }),
    }),
    getTodaysWorkout: tool({
        description: "Get the user's planned workout session for today.",
        inputSchema: z.object({}),
        execute: () => ({
            day: 'Monday',
            split: 'Push - Chest, Shoulders & Triceps',
            exercises: [
                { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest: '2 min', notes: 'Main compound — go heavy' },
                { name: 'Incline Dumbbell Press', sets: 3, reps: '10-12', rest: '90 s' },
                { name: 'Cable Lateral Raise', sets: 4, reps: '15-20', rest: '60 s' },
                { name: 'Cable Fly (low to high)', sets: 3, reps: '12-15', rest: '60 s' },
                { name: 'Overhead Tricep Extension (cable)', sets: 3, reps: '10-12', rest: '75 s' },
                { name: 'Tricep Pushdown (rope)', sets: 3, reps: '12-15', rest: '60 s' },
            ],
            estimatedDuration: '65 minutes',
        }),
    }),
    getWeeklyPlan: tool({
        description: "Get the user's full weekly training split.",
        inputSchema: z.object({}),
        execute: () => ({
            split: 'PPL x2 (Push / Pull / Legs — 5 training days, 2 rest)',
            schedule: [
                { day: 'Monday', session: 'Push A - Chest, Shoulders, Triceps' },
                { day: 'Tuesday', session: 'Pull A - Back, Biceps, Rear Delts' },
                { day: 'Wednesday', session: 'Legs A - Quads, Hamstrings, Glutes, Calves' },
                { day: 'Thursday', session: 'Push B - Shoulders focus, Chest, Triceps' },
                { day: 'Friday', session: 'Pull B - Back width focus, Biceps' },
                { day: 'Saturday', session: 'Rest / Active recovery' },
                { day: 'Sunday', session: 'Rest' },
            ],
            weeklyVolume: {
                chest: '12-16 sets',
                back: '16-20 sets',
                shoulders: '16-20 sets',
                triceps: '10-14 sets',
                biceps: '10-14 sets',
                legs: '16-20 sets',
            },
        }),
    }),
};

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
    ) {}

    async *streamChat(userMessage: string, currentUser: User): AsyncGenerator<string> {
        const history = await this.loadHistory(currentUser.keycloakSubject);
        const inputMessages: ModelMessage[] = [...history, { role: 'user', content: userMessage }];

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: this.buildSystemPrompt(currentUser),
            messages: inputMessages,
            tools: { ...mockedTools, ...this.buildUserTools(currentUser) },
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

    private buildSystemPrompt(user: User): string {
        const name = user.fullName || 'the user';
        const today = this.clock.nowLocal();
        const age = user.birthDate ? Math.floor(-DateTime.fromISO(user.birthDate).diffNow('years').years) : null;
        return `
            You are a knowledgeable and motivating personal fitness coach inside the Mind&Body app.
            You are talking to ${name}${age ? ` (${age} years old)` : ''}.
            Today is ${today.toFormat('cccc, yyyy-MM-dd')} (${today.toFormat('HH:mm')} local time).

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
            - Always use your tools to check the user's equipment, profile, and current plan before making recommendations
            - Ground your advice in the user's REAL data whenever relevant: body progress (getBodyProgress),
              recent activity (getRecentActivity), their reservations (getMyReservations) and the gym's
              class schedule (getUpcomingClasses)
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
