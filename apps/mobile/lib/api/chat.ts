import { useCallback, useRef } from 'react';
import { useApiClient } from './client';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
    id: string;
    role: ChatRole;
    content: string;
    streaming?: boolean;
}

type OnTokenCallback = (token: string) => void;
type OnDoneCallback = () => void;
type OnErrorCallback = (error: string) => void;

/**
 * Parses a chunk of text from the stream and invokes onToken for each token found.
 * Handles two formats:
 *   - Standard SSE:            "data: <token>\n"
 *   - Vercel AI data stream:   "0:\"<token>\"\n"
 */
function parseChunk(chunk: string, onToken: OnTokenCallback): void {
    for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
            const raw = line.slice(6);
            if (raw === '[DONE]') return;
            if (raw) {
                try {
                    onToken(JSON.parse(raw) as string);
                } catch {
                    onToken(raw);
                }
            }
        } else if (line.startsWith('0:')) {
            try {
                const token = JSON.parse(line.slice(2)) as string;
                if (token) onToken(token);
            } catch {
                // ignore malformed lines during stream
            }
        }
    }
}

export function useChatStream() {
    const apiFetch = useApiClient();
    const abortRef = useRef<AbortController | null>(null);

    const sendMessage = useCallback(
        async (message: string, onToken: OnTokenCallback, onDone: OnDoneCallback, onError: OnErrorCallback) => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();

            try {
                const response = await apiFetch('/ai/chat', {
                    method: 'POST',
                    body: JSON.stringify({ message }),
                    signal: abortRef.current.signal,
                });

                if (!response.ok) {
                    onError(`Error ${response.status} al contactar al asistente`);
                    return;
                }

                if (!response.body) {
                    onError('La respuesta no tiene cuerpo de stream');
                    return;
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });

                    // Only process complete lines; keep any partial trailing line in buffer
                    const lastNewline = buffer.lastIndexOf('\n');
                    if (lastNewline === -1) continue;

                    parseChunk(buffer.slice(0, lastNewline + 1), onToken);
                    buffer = buffer.slice(lastNewline + 1);
                }

                if (buffer.length > 0) parseChunk(buffer, onToken);
                onDone();
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') return;
                onError('Ocurrio un error. Intenta de nuevo.');
            }
        },
        [apiFetch],
    );

    const abort = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    return { sendMessage, abort };
}
