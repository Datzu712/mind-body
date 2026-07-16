import { HttpException } from '@nestjs/common';
import type { DomainErrorCode } from './domain-error-codes';

/**
 * Error de dominio con contrato estable:
 * `{ statusCode, code, message, details }`. Se construye el body explícito
 * porque Nest NO agrega statusCode automáticamente a objects custom.
 */
export class DomainHttpException extends HttpException {
    constructor(statusCode: number, code: DomainErrorCode, message: string, details: Record<string, unknown> = {}) {
        super({ statusCode, code, message, details }, statusCode);
    }
}
