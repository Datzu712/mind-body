import { DomainHttpException } from './domain-http.exception';

/** Valida la precondición If-Match contra la versión vigente (bajo lock). */
export function assertVersion(ifMatch: string | undefined, version: number): void {
    if (!ifMatch?.trim()) {
        throw new DomainHttpException(428, 'PRECONDITION_REQUIRED', 'El header If-Match es obligatorio.', {
            currentVersion: version,
        });
    }
    if (ifMatch.replaceAll('"', '').trim() !== String(version)) {
        throw new DomainHttpException(412, 'VERSION_CONFLICT', 'La versión enviada está obsoleta.', {
            currentVersion: version,
        });
    }
}
