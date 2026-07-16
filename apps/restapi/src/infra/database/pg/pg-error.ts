/** SQLSTATE de un error de postgres-js, aunque venga envuelto (cause chain). */
export function pgErrorCode(error: unknown): string | undefined {
    let current: unknown = error;
    for (let depth = 0; current && depth < 5; depth++) {
        const code = (current as { code?: unknown }).code;
        if (typeof code === 'string') return code;
        current = (current as { cause?: unknown }).cause;
    }
    return undefined;
}
