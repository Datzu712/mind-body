import { Inject, Injectable, Logger } from '@nestjs/common';
import { openai, type OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import { type ModelMessage, stepCountIs, streamText } from 'ai';
import type Redis from 'ioredis';

import { TypedConfigService } from '@/config/typed-config.service';
import { REDIS_KEY } from '@/infra/database/redis/redis-provider';
import { ExercisesService } from '@/modules/exercises/exercises.service';
import { buildExerciseCatalogTools } from '@/modules/exercises/exercise-agent-tools';
import { RoutinesService } from './routines.service';
import { createActivityTracker, type ForgeActivityKind } from './routines-forge.activity';
import { buildForgeSystemPrompt, getForgeMutationPermissions } from './routines-forge.prompt';
import { buildRoutineTools } from './routines-forge.tools';

const HISTORY_TTL_SECONDS = 86_400; // 24 h — expira solo; no se limpia al publicar
const MAX_HISTORY_MESSAGES = 50;
const FORGE_MAX_STEPS = 16;

export interface ForgeTurnUsage {
    inputTokens: number;
    outputTokens: number;
    /** Parte del input servida desde el caché de prefijos de OpenAI (~10% del precio). */
    cachedInputTokens: number;
    /** Tokens de razonamiento (incluidos en outputTokens para facturación). */
    reasoningTokens: number;
    /** Steps del loop agéntico (llamadas al modelo dentro del turno). */
    steps: number;
    /** Tool calls ejecutadas en el turno. */
    toolCalls: number;
    durationMs: number;
    finishReason: string | null;
    modelId: string;
}

export type ForgeStreamEvent =
    | { type: 'token'; value: string }
    | { type: 'draft-updated' }
    | { type: 'activity'; value: { kind: ForgeActivityKind } }
    | { type: 'usage'; value: ForgeTurnUsage };

interface StoredForgeHistory {
    messages: ModelMessage[];
    /** updatedAt del borrador al CERRAR el último turno: si al abrir el
     *  siguiente difiere, hubo ediciones manuales fuera del chat. */
    lastDraftUpdatedAt?: string;
}

@Injectable()
export class RoutinesForgeService {
    private readonly logger = new Logger(RoutinesForgeService.name);

    constructor(
        @Inject(REDIS_KEY) private readonly redis: Redis,
        private readonly routines: RoutinesService,
        private readonly exercises: ExercisesService,
        private readonly config: TypedConfigService,
    ) {}

    /** Para que el controller pueda responder 404 ANTES de hijackear la reply. */
    async assertRoutineExists(routineId: string): Promise<void> {
        await this.routines.detail(routineId);
    }

    /** Conversación visible para hidratar el panel: solo texto user/assistant,
     *  sin tool calls ni resultados (esos son internos del modelo). */
    async getChatHistory(routineId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
        await this.routines.detail(routineId); // 404 si la rutina no existe
        const { messages } = await this.loadHistory(routineId);
        const out: { role: 'user' | 'assistant'; content: string }[] = [];
        for (const m of messages) {
            if (m.role !== 'user' && m.role !== 'assistant') continue;
            const content =
                typeof m.content === 'string'
                    ? m.content
                    : m.content.map((part) => (part.type === 'text' ? part.text : '')).join('');
            if (content.trim()) out.push({ role: m.role, content });
        }
        return out;
    }

    async clearChatHistory(routineId: string): Promise<void> {
        await this.redis.del(this.historyKey(routineId));
    }

    async *streamChat(routineId: string, userMessage: string): AsyncGenerator<ForgeStreamEvent> {
        const startedAt = Date.now();
        const draft = await this.routines.detail(routineId);
        const { messages: history, lastDraftUpdatedAt } = await this.loadHistory(routineId);
        const inputMessages: ModelMessage[] = [...history, { role: 'user', content: userMessage }];

        // Ediciones manuales entre turnos: el historial de Forge quedó viejo y
        // el prompt debe decírselo explícitamente (si no, le cree a su memoria).
        const editedOutsideChat =
            history.length > 0 && lastDraftUpdatedAt !== undefined && lastDraftUpdatedAt !== draft.updatedAt;

        if (editedOutsideChat) {
            this.logger.debug(
                `forge draft ${routineId} edited outside chat: lastDraftUpdatedAt=${lastDraftUpdatedAt} updatedAt=${draft.updatedAt}`,
            );
        }
        // Regla de producto: Forge solo escribe sobre borradores. Fuera de
        // DRAFT las tools de escritura ni se montan (modo solo lectura).
        const readOnly = draft.status !== 'DRAFT';
        const mutationPermissions = getForgeMutationPermissions(draft, userMessage);

        // Las tools corren dentro del loop de streamText; los marcadores se
        // encolan ahí y se emiten intercalados con los tokens de texto.
        const pending: ForgeStreamEvent[] = [];
        const onWrite = () => pending.push({ type: 'draft-updated' });
        // Una tool de escritura solo puede usar IDs que Forge vio en el
        // borrador o en resultados de catálogo de ESTE turno.
        const observedExerciseIds = new Set(draft.exercises.map((item) => item.exerciseId));

        const modelId = this.config.get('FORGE_ROUTINES_MODEL');
        const supportsReasoning = /^(gpt-5|o[1-9])/.test(modelId);
        const openaiOptions = {
            parallelToolCalls: true,
            // El historial útil ya se persiste en Redis; no se necesita
            // retención server-side del proveedor para briefs de entrenamiento.
            store: false,
            ...(supportsReasoning && {
                reasoningEffort: this.config.get('FORGE_ROUTINES_REASONING_EFFORT'),
                textVerbosity: 'low' as const,
            }),
        } satisfies OpenAIResponsesProviderOptions;

        const result = streamText({
            // AI SDK 6 usa Responses API por defecto; se deja explícito porque
            // Forge combina razonamiento con varias tools en el mismo turno.
            model: openai.responses(modelId),
            system: buildForgeSystemPrompt(draft, readOnly, editedOutsideChat),
            messages: inputMessages,
            providerOptions: { openai: openaiOptions },
            tools: {
                ...buildExerciseCatalogTools(this.exercises, (t, e) => this.toolError(t, e), {
                    onSearchResults: (ids) => ids.forEach((id) => observedExerciseIds.add(id)),
                }),
                ...buildRoutineTools(this.routines, routineId, onWrite, (t, e) => this.toolError(t, e), {
                    readOnly,
                    observedExerciseIds,
                    ...mutationPermissions,
                }),
            },
            stopWhen: stepCountIs(FORGE_MAX_STEPS),
            onStepFinish: ({ toolCalls }) => {
                if (toolCalls?.length) {
                    this.logger.debug(`forge tools: ${toolCalls.map((c) => c.toolName).join(', ')}`);
                }
            },
            onFinish: ({ finishReason, steps, totalUsage, warnings }) => {
                const summary =
                    `forge finish model=${modelId} reason=${finishReason} steps=${steps.length} ` +
                    `tokens=${totalUsage.totalTokens ?? 'unknown'} warnings=${warnings?.length ?? 0}`;
                if (steps.length >= FORGE_MAX_STEPS && finishReason === 'tool-calls') this.logger.warn(summary);
                else this.logger.debug(summary);
            },
        });

        let sentText = false;
        let finalFinishReason: string | undefined;
        const nextActivity = createActivityTracker();
        for await (const part of result.fullStream) {
            // fullStream permite emitir el refetch inmediatamente después de
            // una tool de escritura, aunque el modelo todavía no haya enviado texto.
            while (pending.length) yield pending.shift()!;
            const activityKind = nextActivity(part);
            if (activityKind) yield { type: 'activity', value: { kind: activityKind } };
            if (part.type === 'text-delta') {
                sentText = true;
                yield { type: 'token', value: part.text };
            } else if (part.type === 'finish') {
                finalFinishReason = part.finishReason;
            } else if (part.type === 'error' || part.type === 'tool-error') {
                throw part.error instanceof Error ? part.error : new Error(String(part.error));
            } else if (part.type === 'abort') {
                throw new Error(part.reason ?? 'El stream de Forge fue cancelado');
            }
        }
        while (pending.length) yield pending.shift()!;

        // Un turno puede agotar los pasos en puras tool calls y morir mudo:
        // el trainer SIEMPRE recibe al menos una línea.
        if (finalFinishReason === 'tool-calls') {
            yield {
                type: 'token',
                value: '\n\n⚠️ Me quedé sin pasos antes de terminar. Decime «continuá» y sigo desde donde quedé.',
            };
        } else if (!sentText) {
            yield {
                type: 'token',
                value: '⚠️ Forge terminó el turno sin una respuesta. Intenta formular el pedido de nuevo.',
            };
        }

        // Métricas del turno para la UI (contador temporal de pruebas). Se
        // esperan las promesas del resultado — el closure de onFinish corría
        // en carrera con el fin del loop y a veces llegaba tarde.
        const totalUsage = await Promise.resolve(result.totalUsage).catch(() => undefined);
        const steps = await Promise.resolve(result.steps).catch(() => []);
        if (totalUsage) {
            yield {
                type: 'usage',
                value: {
                    inputTokens: totalUsage.inputTokens ?? 0,
                    outputTokens: totalUsage.outputTokens ?? 0,
                    cachedInputTokens: totalUsage.inputTokenDetails.cacheReadTokens ?? 0,
                    reasoningTokens: totalUsage.outputTokenDetails.reasoningTokens ?? 0,
                    steps: steps.length,
                    toolCalls: steps.reduce((n, s) => n + s.toolCalls.length, 0),
                    durationMs: Date.now() - startedAt,
                    finishReason: finalFinishReason ?? null,
                    modelId,
                },
            };
        }

        const { messages: responseMessages } = await result.response;
        try {
            // Se guarda el updatedAt POST-turno (incluye las escrituras de este
            // turno) para poder detectar ediciones manuales antes del próximo.
            const finalDraft = await this.routines.detail(routineId).catch(() => null);
            await this.saveHistory(
                routineId,
                [...inputMessages, ...responseMessages],
                finalDraft?.updatedAt ?? draft.updatedAt,
            );
        } catch (err) {
            // La rutina y la respuesta ya pueden haberse aplicado/transmitido;
            // fallar al guardar memoria no convierte el turno en un error.
            this.logger.warn(`forge history save failed: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    /** El mensaje real llega al modelo como data para que pueda adaptarse
     *  (p. ej. "ese itemId no existe") sin matar el stream. */
    private toolError(toolName: string, err: unknown): { error: string } {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(`${toolName} failed: ${message}`);
        return { error: message };
    }

    // v2 abandona historiales previos con pares tool-call/tool-result partidos
    // y separa el cambio de modelo/contrato sin esperar al TTL.
    private historyKey(routineId: string): string {
        return `forge:v2:history:${routineId}`;
    }

    private async loadHistory(routineId: string): Promise<StoredForgeHistory> {
        const raw = await this.redis.get(this.historyKey(routineId));
        if (!raw) return { messages: [] };
        try {
            const parsed = JSON.parse(raw) as ModelMessage[] | StoredForgeHistory;
            // Compat: los payloads previos eran el array pelado, sin envelope.
            return Array.isArray(parsed) ? { messages: parsed } : parsed;
        } catch {
            return { messages: [] };
        }
    }

    private async saveHistory(routineId: string, messages: ModelMessage[], lastDraftUpdatedAt: string): Promise<void> {
        // El recorte NO puede partir un par tool-call/tool-result (OpenAI
        // rechaza el request): se recorta y luego se descarta todo lo anterior
        // al primer mensaje de usuario, que siempre es una frontera limpia.
        let trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
        const firstUser = trimmed.findIndex((m) => m.role === 'user');
        trimmed = firstUser === -1 ? [] : trimmed.slice(firstUser);
        const stored: StoredForgeHistory = { messages: trimmed, lastDraftUpdatedAt };
        await this.redis.set(this.historyKey(routineId), JSON.stringify(stored), 'EX', HISTORY_TTL_SECONDS);
    }
}
