import { CalendarClock, Dumbbell, House, ListChecks, TrendingUp } from 'lucide-react';

/** Member app palette (apps/mobile/constants/theme.ts) — kept literal so the
 *  mock reads as the phone it is, not as another dashboard surface. */
const APP = {
    bg: '#0A0A0A',
    card: '#141416',
    yellow: '#FFD600',
    muted: '#8A8A8F',
} as const;

const CLASSES = [
    { time: '12:15', name: 'HIIT Express', trainer: 'S. Vargas', state: 'Reservada' },
    { time: '17:30', name: 'CrossFit', trainer: 'A. Mora', state: 'Llena' },
    { time: '19:00', name: 'Spinning', trainer: 'K. Jiménez', state: '13 cupos' },
];

const TABS = [
    { icon: House, label: 'Inicio' },
    { icon: ListChecks, label: 'Rutinas' },
    { icon: CalendarClock, label: 'Reservas', active: true },
    { icon: Dumbbell, label: 'Ejercicios' },
    { icon: TrendingUp, label: 'Progreso' },
];

/** The member side of the product, drawn rather than screenshotted so it stays
 *  in sync with the real app's theme tokens. */
export function PhoneFrame() {
    return (
        <div
            className="w-[272px] shrink-0 rounded-[2.75rem] border border-white/10 bg-[#141416] p-2.5 shadow-[0_40px_90px_-40px_oklch(0_0_0/90%)]"
            role="img"
            aria-label="La app móvil de Mind & Body mostrando la pantalla de reservas"
        >
            <div
                className="flex h-[556px] flex-col overflow-hidden rounded-[2.15rem]"
                style={{ backgroundColor: APP.bg }}
            >
                {/* Status bar */}
                <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <span className="text-[0.6875rem] font-semibold text-white">07:24</span>
                    <span className="flex items-center gap-1" aria-hidden="true">
                        <span className="h-2 w-2 rounded-full bg-white/30" />
                        <span className="h-2 w-2 rounded-full bg-white/30" />
                        <span className="h-2 w-4 rounded-sm bg-white/50" />
                    </span>
                </div>

                {/* Screen */}
                <div className="flex-1 px-5 pt-3">
                    <p className="text-[1.35rem] font-bold tracking-tight text-white">Reservas</p>
                    <p className="mt-0.5 text-[0.6875rem]" style={{ color: APP.muted }}>
                        Martes 5 de agosto
                    </p>

                    <div className="mt-4 flex gap-1.5">
                        <span
                            className="rounded-full px-3 py-1 text-[0.625rem] font-semibold"
                            style={{ backgroundColor: APP.yellow, color: '#0A0A0A' }}
                        >
                            Todas
                        </span>
                        {['Funcional', 'Yoga'].map((chip) => (
                            <span
                                key={chip}
                                className="rounded-full px-3 py-1 text-[0.625rem] font-medium"
                                style={{ backgroundColor: APP.card, color: APP.muted }}
                            >
                                {chip}
                            </span>
                        ))}
                    </div>

                    <div className="mt-4 space-y-2.5">
                        {CLASSES.map((item) => (
                            <div
                                key={item.time}
                                className="flex items-center gap-2.5 rounded-2xl p-3"
                                style={{ backgroundColor: APP.card }}
                            >
                                <span
                                    className="shrink-0 text-[0.6875rem] font-semibold tabular-nums"
                                    style={{ color: APP.yellow }}
                                >
                                    {item.time}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[0.8125rem] font-semibold text-white">
                                        {item.name}
                                    </span>
                                    <span className="block truncate text-[0.625rem]" style={{ color: APP.muted }}>
                                        {item.trainer}
                                    </span>
                                </span>
                                <span
                                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.5rem] font-semibold"
                                    style={
                                        item.state === 'Reservada'
                                            ? { backgroundColor: 'rgba(255,214,0,0.14)', color: APP.yellow }
                                            : { backgroundColor: 'rgba(255,255,255,0.06)', color: APP.muted }
                                    }
                                >
                                    {item.state}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-2xl p-3.5" style={{ backgroundColor: APP.card }}>
                        <p className="text-[0.625rem]" style={{ color: APP.muted }}>
                            Pasos de hoy · Health Connect
                        </p>
                        <p className="mt-1 flex items-baseline gap-1.5 text-[1.35rem] font-bold tabular-nums text-white">
                            7 412
                            <span className="text-[0.625rem] font-medium" style={{ color: APP.muted }}>
                                / 8 000
                            </span>
                        </p>
                        <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10">
                            <span
                                className="block h-full rounded-full"
                                style={{ width: '92%', backgroundColor: APP.yellow }}
                            />
                        </span>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="flex items-center justify-between border-t border-white/8 px-5 pt-3 pb-5">
                    {TABS.map((tab) => (
                        <span key={tab.label} className="flex flex-col items-center gap-1">
                            <tab.icon
                                className="size-[1.05rem]"
                                style={{ color: tab.active ? APP.yellow : APP.muted }}
                            />
                            <span
                                className="text-[0.5rem] font-medium"
                                style={{ color: tab.active ? APP.yellow : APP.muted }}
                            >
                                {tab.label}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
