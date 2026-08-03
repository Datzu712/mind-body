import { useEffect, useRef, useState } from 'react';
import type { OrbState } from 'thinking-orbs';

import {
    type ActivityViewState,
    type ForgeActivityKind,
    IDLE_MESSAGE,
    IDLE_ORB_STATE,
    initialViewState,
    queueKind,
    tick,
    viewMessage,
    viewOrbState,
} from './forge-activity';

const HEARTBEAT_MS = 250;

export interface ForgeActivityView {
    orbState: OrbState;
    message: string;
    /** Segundos transcurridos del turno en curso (0 en idle). */
    seconds: number;
}

/**
 * Presentación viva del orb: conecta el último kind del stream y el flag
 * isStreaming con la máquina pura de forge-activity.ts vía un heartbeat.
 * Fin del turno → idle inmediato y el interval se limpia solo.
 */
export function useForgeActivity(kind: ForgeActivityKind | null, isStreaming: boolean): ForgeActivityView {
    const [view, setView] = useState<ActivityViewState | null>(null);
    const [seconds, setSeconds] = useState(0);
    const startedAtRef = useRef(0);

    // Arranque del turno: entra en 'thinking' (fallback si nunca llega un
    // activity — backend viejo o frame perdido). Fin del turno: idle.
    useEffect(() => {
        if (isStreaming) {
            const now = Date.now();
            startedAtRef.current = now;
            setSeconds(0);
            setView(initialViewState(now));
        } else {
            setView(null);
            setSeconds(0);
        }
    }, [isStreaming]);

    // Kind nuevo del stream → se aplica o encola según el min-hold.
    useEffect(() => {
        if (!kind || !isStreaming) return;
        setView((prev) => (prev ? queueKind(prev, kind, Date.now()) : prev));
    }, [kind, isStreaming]);

    // Heartbeat: promueve pendings vencidos, rota frases y lleva el contador.
    // tick() devuelve el mismo objeto si nada cambió → React saltea el render.
    useEffect(() => {
        if (!isStreaming) return;
        const id = setInterval(() => {
            const now = Date.now();
            setView((prev) => (prev ? tick(prev, now) : prev));
            setSeconds(Math.floor((now - startedAtRef.current) / 1000));
        }, HEARTBEAT_MS);
        return () => clearInterval(id);
    }, [isStreaming]);

    if (!view || !isStreaming) {
        return { orbState: IDLE_ORB_STATE, message: IDLE_MESSAGE, seconds: 0 };
    }
    return { orbState: viewOrbState(view), message: viewMessage(view), seconds };
}
