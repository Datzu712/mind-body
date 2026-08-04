import type { FastifyReply } from 'fastify';

/**
 * Opens an SSE stream by taking over the raw socket.
 *
 * `reply.hijack()` pulls Fastify out of the response lifecycle, so the headers
 * plugins queued up via `reply.header()` — including the CORS ones set by
 * @fastify/cors — never make it out: `writeHead()` only sends what it is given.
 * Without `Access-Control-Allow-Origin` the browser blocks the response even
 * though the status is 200, and it never shows up in dev because the Vite proxy
 * keeps the call same-origin.
 *
 * Hence: read the pending headers BEFORE hijacking and carry them over to
 * `writeHead`.
 */
export function openSseStream(reply: FastifyReply): void {
    const pending = Object.fromEntries(
        Object.entries(reply.getHeaders()).filter(([, value]) => value !== undefined),
    ) as Record<string, number | string | string[]>;

    reply.hijack();
    reply.raw.writeHead(200, {
        ...pending,
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
}
