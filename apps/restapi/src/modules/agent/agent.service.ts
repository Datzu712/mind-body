import { Inject, Injectable, Logger } from '@nestjs/common';
import { openai } from '@ai-sdk/openai';
import { type ModelMessage, stepCountIs, streamText, tool } from 'ai';
import { z } from 'zod';
import type Redis from 'ioredis';

import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { type User } from '@/infra/database/pg/schemas/drizzle.schema';

const HISTORY_TTL_SECONDS = 86_400; // 24 h
const MAX_HISTORY_MESSAGES = 50;

const fitnessTools = {
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

@Injectable()
export class AgentService {
    private readonly logger = new Logger(AgentService.name);

    constructor(@Inject(REDIS_KEY) private readonly redis: Redis) {}

    async *streamChat(userMessage: string, currentUser: User): AsyncGenerator<string> {
        const history = await this.loadHistory(currentUser.keycloakId);
        const inputMessages: ModelMessage[] = [...history, { role: 'user', content: userMessage }];

        const result = streamText({
            model: openai('gpt-4o-mini'),
            system: this.buildSystemPrompt(currentUser),
            messages: inputMessages,
            tools: fitnessTools,
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
        await this.saveHistory(currentUser.keycloakId, [...inputMessages, ...responseMessages]);
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
        const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'the user';
        return `
            You are a knowledgeable and motivating personal fitness coach inside the Mind&Body app.
            You are talking to ${name}.

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
