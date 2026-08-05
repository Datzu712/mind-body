import { motion, useReducedMotion } from 'motion/react';
import { Smartphone } from 'lucide-react';

interface AgendaSession {
    time: string;
    name: string;
    trainer: string;
    taken: number;
    capacity: number;
    /** The session running right now — gets the live dot. */
    live?: boolean;
}

/** Illustrative day: the card is labelled DEMO so nobody reads it as live data. */
const SESSIONS: AgendaSession[] = [
    { time: '06:30', name: 'Funcional AM', trainer: 'D. Rojas', taken: 18, capacity: 20 },
    { time: '08:00', name: 'Yoga básico', trainer: 'M. Cordero', taken: 11, capacity: 18 },
    { time: '12:15', name: 'HIIT Express', trainer: 'S. Vargas', taken: 14, capacity: 16, live: true },
    { time: '17:30', name: 'CrossFit intensivo', trainer: 'A. Mora', taken: 20, capacity: 20 },
    { time: '19:00', name: 'Spinning', trainer: 'K. Jiménez', taken: 9, capacity: 22 },
];

/** "Miércoles 5" for today — the sessions are illustrative, the date is not. */
function todayLabel() {
    const parts = new Intl.DateTimeFormat('es-CR', { weekday: 'long', day: 'numeric' }).format(new Date());
    return parts.charAt(0).toUpperCase() + parts.slice(1);
}

/**
 * The hero's product proof: a gym's day is a column of sessions filling up, so
 * that is what the page leads with instead of a screenshot.
 */
export function LiveAgenda() {
    const reduceMotion = useReducedMotion();

    return (
        <div className="rounded-2xl border border-[var(--lp-hairline)] bg-[linear-gradient(160deg,var(--lp-surface),var(--lp-ink))] p-5 shadow-[0_30px_80px_-40px_oklch(0_0_0/80%)] sm:p-6">
            <div className="flex items-baseline justify-between gap-4">
                <div>
                    <h2 className="font-heading text-base font-semibold">Agenda de hoy</h2>
                    <p className="lp-mono mt-1.5 text-muted-foreground/70">
                        {todayLabel()} · {SESSIONS.length} sesiones
                    </p>
                </div>
                <span className="lp-mono rounded-full border border-[var(--lp-hairline)] px-2.5 py-1 text-[0.625rem] text-muted-foreground/60">
                    Demo
                </span>
            </div>

            <ul className="mt-5">
                {SESSIONS.map((session, index) => {
                    const full = session.taken >= session.capacity;
                    const ratio = session.taken / session.capacity;

                    return (
                        <li
                            key={session.time}
                            className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 border-t border-[var(--lp-hairline)] py-3.5 first:border-t-0 first:pt-0"
                        >
                            <span
                                className={`lp-mono text-xs ${session.live ? 'text-primary' : 'text-muted-foreground/70'}`}
                            >
                                {session.time}
                            </span>

                            <div className="min-w-0">
                                <p className="flex items-center gap-2 truncate text-sm font-medium">
                                    {session.name}
                                    {session.live && <span className="lp-live" aria-hidden="true" />}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground/60">{session.trainer}</p>
                            </div>

                            <span className={`lp-mono text-xs ${full ? 'text-primary' : 'text-muted-foreground/70'}`}>
                                {session.taken}/{session.capacity}
                            </span>

                            <div className="col-start-2 col-end-4 h-[3px] overflow-hidden rounded-full bg-white/8">
                                <motion.div
                                    className={`h-full rounded-full ${full ? 'bg-primary' : 'bg-primary/55'}`}
                                    initial={reduceMotion ? false : { width: 0 }}
                                    whileInView={{ width: `${Math.round(ratio * 100)}%` }}
                                    viewport={{ once: true }}
                                    transition={{
                                        duration: 0.9,
                                        delay: 0.15 + index * 0.09,
                                        ease: [0.16, 1, 0.3, 1],
                                    }}
                                    style={reduceMotion ? { width: `${Math.round(ratio * 100)}%` } : undefined}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            <p className="lp-mono mt-5 flex items-center gap-2 border-t border-[var(--lp-hairline)] pt-4 text-muted-foreground/60">
                <Smartphone className="size-3.5" aria-hidden="true" />
                Las reservas entran desde la app
            </p>
        </div>
    );
}
