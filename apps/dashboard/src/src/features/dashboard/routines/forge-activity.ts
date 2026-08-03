import type { OrbState } from 'thinking-orbs';

/** Espejo del contrato del backend (routines-forge.activity.ts). */
export type ForgeActivityKind = 'thinking' | 'searching' | 'reading' | 'editing' | 'composing';

export const IDLE_MESSAGE = 'Listo para ayudarte';
export const IDLE_ORB_STATE: OrbState = 'listening';

/** Anti-parpadeo: con parallelToolCalls pueden llegar varios kinds en ráfaga;
 *  la fase visible aguanta al menos esto antes de ceder. */
export const PHASE_MIN_HOLD_MS = 1500;
/** Cadencia de rotación de frases dentro de una fase larga. */
export const MESSAGE_ROTATE_MS = 4000;

/** La PRIMERA frase de cada pool es la literal (dice qué pasa de verdad);
 *  el resto es relleno con sabor a fragua. Round-robin nunca repite consecutivas. */
export const FORGE_PHASES: Record<ForgeActivityKind, { orb: OrbState; messages: string[] }> = {
    thinking: {
        orb: 'solving',
        messages: ['Pensando…', 'Martillando ideas…', 'Sopesando opciones…', 'Midiendo el hierro…'],
    },
    searching: {
        orb: 'searching',
        messages: ['Buscando ejercicios…', 'Revisando el catálogo…', 'Hurgando en el arsenal…'],
    },
    reading: {
        orb: 'working',
        messages: ['Leyendo el borrador…', 'Repasando la rutina…'],
    },
    editing: {
        orb: 'shaping',
        messages: ['Ajustando la rutina…', 'Forjando en el yunque…', 'Templando series y reps…', 'Puliendo detalles…'],
    },
    composing: {
        orb: 'composing',
        messages: ['Redactando…', 'Sacando chispas…', 'Poniendo en palabras…'],
    },
};

export function isForgeActivityKind(value: unknown): value is ForgeActivityKind {
    return typeof value === 'string' && value in FORGE_PHASES;
}

/** Máquina pura de presentación; el hook (use-forge-activity) solo la conecta a React. */
export interface ActivityViewState {
    phase: ForgeActivityKind;
    /** Índice dentro de FORGE_PHASES[phase].messages. */
    messageIndex: number;
    /** Timestamp en que la fase visible entró en pantalla. */
    phaseSince: number;
    /** Timestamp de la última rotación de frase. */
    rotatedAt: number;
    /** Último kind recibido aún no aplicado (esperando el min-hold). Última señal gana. */
    pending: ForgeActivityKind | null;
}

/** El turno arranca en 'thinking': es el fallback si nunca llega un activity. */
export function initialViewState(now: number): ActivityViewState {
    return { phase: 'thinking', messageIndex: 0, phaseSince: now, rotatedAt: now, pending: null };
}

/** Registra un kind del stream: aplica ya si venció el hold, si no lo encola. */
export function queueKind(state: ActivityViewState, kind: ForgeActivityKind, now: number): ActivityViewState {
    if (kind === state.phase) return state.pending === null ? state : { ...state, pending: null };
    if (now - state.phaseSince >= PHASE_MIN_HOLD_MS) {
        return { phase: kind, messageIndex: 0, phaseSince: now, rotatedAt: now, pending: null };
    }
    return { ...state, pending: kind };
}

/** Tick del heartbeat: promueve el pending si venció el hold, o rota la frase si tocó. */
export function tick(state: ActivityViewState, now: number): ActivityViewState {
    if (state.pending && now - state.phaseSince >= PHASE_MIN_HOLD_MS) {
        return { phase: state.pending, messageIndex: 0, phaseSince: now, rotatedAt: now, pending: null };
    }
    const pool = FORGE_PHASES[state.phase].messages;
    if (pool.length > 1 && now - state.rotatedAt >= MESSAGE_ROTATE_MS) {
        return { ...state, messageIndex: (state.messageIndex + 1) % pool.length, rotatedAt: now };
    }
    return state;
}

export function viewMessage(state: ActivityViewState): string {
    return FORGE_PHASES[state.phase].messages[state.messageIndex];
}

export function viewOrbState(state: ActivityViewState): OrbState {
    return FORGE_PHASES[state.phase].orb;
}
