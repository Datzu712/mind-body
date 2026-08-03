import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_BASE, apiFetch } from '@/lib/api';
import { routineKeys } from './hooks';
import { isForgeActivityKind, type ForgeActivityKind } from './forge-activity';

/** TEMPORAL (métricas de prueba): detalle del turno que reporta el backend. */
export interface ForgeTurnMeta {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    reasoningTokens: number;
    steps: number;
    toolCalls: number;
    durationMs: number;
    finishReason: string | null;
    modelId: string;
}

export interface ForgeMessage {
    role: 'user' | 'assistant';
    content: string;
    /** Presente solo en respuestas de turnos vivos de esta sesión. */
    meta?: ForgeTurnMeta;
}

/** TEMPORAL (métricas de prueba): acumulado de tokens de la sesión de UI. */
export interface ForgeSessionUsage {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
    turns: number;
    modelId: string | null;
}

export interface ForgeChat {
    messages: ForgeMessage[];
    send: (text: string) => void;
    /** true durante el turno de Forge — el builder se lockea con esto. */
    isStreaming: boolean;
    /** Último kind de actividad del turno vivo (null fuera de un turno). */
    activityKind: ForgeActivityKind | null;
    /** true mientras se hidrata la conversación guardada tras un reload. */
    isLoadingHistory: boolean;
    /** Borra la memoria de Forge para esta rutina y limpia el panel. */
    reset: () => void;
    usage: ForgeSessionUsage;
}

/**
 * Cliente SSE de Forge (adaptación web del parser del coach mobile).
 * Protocolo: `data: "<token>"` (texto), `event: draft-updated` (refetch del
 * borrador) y `data: [DONE]` (fin de turno).
 */
export function useForgeChat(routineId: string): ForgeChat {
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<ForgeMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [activityKind, setActivityKind] = useState<ForgeActivityKind | null>(null);
    const [usage, setUsage] = useState<ForgeSessionUsage>({
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        turns: 0,
        modelId: null,
    });

    // Hidratación: la memoria real vive en el backend (Redis); al montar se
    // trae la conversación para que lo visible = lo que Forge recuerda.
    const { data: savedHistory, isPending: isLoadingHistory } = useQuery({
        queryKey: ['routines', 'forge-history', routineId],
        queryFn: async () => apiFetch<ForgeMessage[]>(`/api/v1/routines/${routineId}/forge/history`),
        staleTime: Infinity,
        retry: false,
    });
    const hydrated = useRef(false);
    useEffect(() => {
        if (hydrated.current || !savedHistory) return;
        hydrated.current = true;
        // Solo si el panel sigue vacío: nunca pisar mensajes de esta sesión.
        setMessages((prev) => (prev.length === 0 ? savedHistory : prev));
    }, [savedHistory]);

    const reset = useCallback(() => {
        setMessages([]);
        void apiFetch(`/api/v1/routines/${routineId}/forge/history`, { method: 'DELETE' }).catch(() => undefined);
    }, [routineId]);

    const appendToAssistant = useCallback((chunk: string) => {
        setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === 'assistant') {
                next[next.length - 1] = { ...last, content: last.content + chunk };
            }
            return next;
        });
    }, []);

    const send = useCallback(
        (text: string) => {
            const message = text.trim();
            if (!message || isStreaming) return;

            setMessages((prev) => [...prev, { role: 'user', content: message }, { role: 'assistant', content: '' }]);
            setIsStreaming(true);
            setActivityKind(null);

            void (async () => {
                try {
                    const res = await fetch(`${API_BASE}/api/v1/routines/${routineId}/forge`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message }),
                    });
                    if (!res.ok || !res.body) {
                        throw new Error(`Error ${res.status}`);
                    }

                    const reader = res.body.getReader();
                    const decoder = new TextDecoder();
                    let buffer = '';
                    for (;;) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const frames = buffer.split('\n\n');
                        buffer = frames.pop() ?? '';
                        for (const frame of frames) {
                            if (frame.includes('event: draft-updated')) {
                                void queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
                                continue;
                            }
                            if (frame.includes('event: activity')) {
                                const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
                                if (dataLine) {
                                    try {
                                        const { kind } = JSON.parse(dataLine.slice(6)) as { kind?: unknown };
                                        // Kind desconocido o malformado: se ignora, es decoración.
                                        if (isForgeActivityKind(kind)) setActivityKind(kind);
                                    } catch {
                                        /* activity malformado: se ignora */
                                    }
                                }
                                continue;
                            }
                            if (frame.includes('event: usage')) {
                                const dataLine = frame.split('\n').find((l) => l.startsWith('data: '));
                                if (dataLine) {
                                    try {
                                        const u = JSON.parse(dataLine.slice(6)) as ForgeTurnMeta;
                                        // El detalle queda pegado a la respuesta del turno...
                                        setMessages((prev) => {
                                            const next = [...prev];
                                            const last = next[next.length - 1];
                                            if (last?.role === 'assistant') {
                                                next[next.length - 1] = { ...last, meta: u };
                                            }
                                            return next;
                                        });
                                        // ...y el acumulado alimenta la franja de sesión.
                                        setUsage((prev) => ({
                                            inputTokens: prev.inputTokens + u.inputTokens,
                                            outputTokens: prev.outputTokens + u.outputTokens,
                                            cachedInputTokens: prev.cachedInputTokens + u.cachedInputTokens,
                                            turns: prev.turns + 1,
                                            modelId: u.modelId,
                                        }));
                                    } catch {
                                        /* usage malformado: se ignora, es solo telemetría de UI */
                                    }
                                }
                                continue;
                            }
                            const data = frame.replace(/^data: /, '');
                            if (!data || data === '[DONE]') continue;
                            try {
                                appendToAssistant(JSON.parse(data) as string);
                            } catch {
                                /* frame no-JSON (keep-alive u otro): se ignora */
                            }
                        }
                    }
                } catch {
                    appendToAssistant('\n\n⚠️ Se perdió la conexión con Forge. Intenta de nuevo.');
                } finally {
                    // El lock SIEMPRE se libera, incluso si el stream murió.
                    setIsStreaming(false);
                    setActivityKind(null);
                    void queryClient.invalidateQueries({ queryKey: routineKeys.detail(routineId) });
                }
            })();
        },
        [routineId, isStreaming, queryClient, appendToAssistant],
    );

    return { messages, send, isStreaming, activityKind, isLoadingHistory, reset, usage };
}
