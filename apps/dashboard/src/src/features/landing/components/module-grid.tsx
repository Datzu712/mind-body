import { CalendarClock, CalendarDays, Dumbbell, ListChecks, Ruler, Users, type LucideIcon } from 'lucide-react';

interface Module {
    icon: LucideIcon;
    name: string;
    description: string;
    /** The one detail that proves the module is real work, not a checkbox. */
    detail: string;
}

const MODULES: Module[] = [
    {
        icon: Users,
        name: 'Usuarios',
        description:
            'Miembros, entrenadores y staff en una sola tabla, cada uno con su perfil, su membresía y su estado.',
        detail: 'Alta en Keycloak · cédula verificada contra el TSE',
    },
    {
        icon: CalendarDays,
        name: 'Clases',
        description: 'Defines la clase una vez con sus días y su hora; el sistema genera las sesiones de cada semana.',
        detail: 'Calendario semanal · cupo y entrenador por sesión',
    },
    {
        icon: CalendarClock,
        name: 'Reservas',
        description:
            'Cupos, reprogramaciones y asistencia. Las cancelaciones fuera de plazo quedan registradas como no-show.',
        detail: 'Detalle de sesión · lista de asistentes',
    },
    {
        icon: Dumbbell,
        name: 'Ejercicios',
        description: 'Catálogo con músculo objetivo, equipo necesario y demostración en video para cada movimiento.',
        detail: 'Filtros por zona del cuerpo y equipo',
    },
    {
        icon: ListChecks,
        name: 'Rutinas',
        description:
            'Armas la rutina ejercicio por ejercicio y la asignas al miembro. Forge la redacta contigo mientras describes lo que necesitas.',
        detail: 'Constructor visual · asistente Forge',
    },
    {
        icon: Ruler,
        name: 'Progreso',
        description: 'Mediciones corporales con historial y gráficas por período, dentro del perfil de cada miembro.',
        detail: 'Peso, grasa y perímetros en el tiempo',
    },
];

/** Hairline table of modules — the gap does the drawing, so it stays a clean
 *  1px grid at every breakpoint without nth-child gymnastics. */
export function ModuleGrid() {
    return (
        <div className="grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-hairline)] bg-[var(--lp-hairline)] sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module) => (
                <article
                    key={module.name}
                    className="group flex flex-col bg-[var(--lp-ink)] p-7 transition-colors duration-300 hover:bg-[color-mix(in_oklab,var(--lp-amber)_4%,var(--lp-ink))]"
                >
                    <span className="flex size-9 items-center justify-center rounded-lg border border-[var(--lp-hairline)] text-primary transition-colors duration-300 group-hover:border-primary/40">
                        <module.icon className="size-4.5" aria-hidden="true" />
                    </span>

                    <h3 className="font-heading mt-5 text-lg font-semibold tracking-tight">{module.name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{module.description}</p>
                    <p className="lp-mono mt-auto pt-6 text-[0.625rem] leading-relaxed tracking-[0.13em] text-muted-foreground/50">
                        {module.detail}
                    </p>
                </article>
            ))}
        </div>
    );
}
