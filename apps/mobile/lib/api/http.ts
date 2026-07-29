/**
 * Error de una respuesta HTTP del API. Extiende Error para que los consumidores
 * que hacen `error instanceof Error ? error.message : ...` sigan funcionando, y
 * expone el `code` estable de `DomainHttpException` para los casos en que la UI
 * necesita reaccionar distinto según el motivo y no solo mostrar el mensaje.
 */
export class ApiError extends Error {
    constructor(
        readonly status: number,
        message: string,
        readonly code?: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/** Extrae el mensaje del body: `string` en DomainHttpException, `string[]` en los 400 de class-validator. */
function messageOf(body: { message?: unknown }): string | undefined {
    if (typeof body.message === 'string') return body.message || undefined;
    if (Array.isArray(body.message)) {
        const joined = body.message.filter((m): m is string => typeof m === 'string').join('. ');
        return joined || undefined;
    }
    return undefined;
}

/**
 * Parsea la respuesta o lanza `ApiError`. Sin esto un body de error se parsea
 * como si fuera el recurso pedido y el fallo aparece más tarde y en otro lado.
 */
export async function okJson<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let message = `Error ${res.status}`;
        let code: string | undefined;

        try {
            const body = (await res.json()) as { message?: unknown; code?: unknown };
            message = messageOf(body) ?? message;
            if (typeof body.code === 'string') code = body.code;
        } catch {
            /* body no-JSON: queda el mensaje genérico */
        }

        throw new ApiError(res.status, message, code);
    }

    return (await res.json()) as T;
}
