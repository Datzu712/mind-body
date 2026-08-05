import { createFileRoute } from '@tanstack/react-router';
import {
    ArrowDown,
    ArrowRight,
    CalendarClock,
    HeartPulse,
    KeyRound,
    ListChecks,
    MonitorSmartphone,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getLoginUrl } from '@/lib/api';
import { BrandLockup } from '@/src/features/landing/components/brand-lockup';
import { LiveAgenda } from '@/src/features/landing/components/live-agenda';
import { ModuleGrid } from '@/src/features/landing/components/module-grid';
import { PhoneFrame } from '@/src/features/landing/components/phone-frame';
import { ImagePlaceholder } from '@/src/features/landing/components/image-placeholder';
import { Reveal } from '@/src/features/landing/components/reveal';
import '@/src/features/landing/landing.css';

export const Route = createFileRoute('/')({
    component: LandingPage,
});

const HERO_FACTS = ['Todo el gimnasio en un panel', 'Tus miembros reservan desde el celular', 'Sin instalar nada'];

const APP_FEATURES: { icon: LucideIcon; text: string }[] = [
    { icon: CalendarClock, text: 'Reserva, cancela y reprograma clases desde el celular.' },
    { icon: ListChecks, text: 'Sigue la rutina que le asignó su entrenador, ejercicio por ejercicio.' },
    { icon: TrendingUp, text: 'Registra sus medidas y ve su progreso mes a mes.' },
    { icon: Sparkles, text: 'Le consulta al entrenador con inteligencia artificial cuando le queda una duda.' },
    { icon: HeartPulse, text: 'Sus pasos y calorías del día se registran solos.' },
];

const TRUST: { icon: LucideIcon; title: string; text: string }[] = [
    {
        icon: KeyRound,
        title: 'Cada quien con su cuenta',
        text: 'Nadie comparte usuarios ni anota contraseñas en un papel. El gimnasio tampoco las almacena.',
    },
    {
        icon: ShieldCheck,
        title: 'Cada quien ve lo suyo',
        text: 'Administración, recepción, entrenadores y miembros entran por la misma puerta a pantallas distintas.',
    },
    {
        icon: MonitorSmartphone,
        title: 'Desde donde trabajes',
        text: 'Funciona en el navegador y también como aplicación instalada en la computadora de recepción.',
    },
];

function goToLogin() {
    window.location.href = getLoginUrl();
}

function LandingPage() {
    return (
        <div className="landing min-h-screen">
            <header className="sticky top-0 z-50 border-b border-[var(--lp-hairline)] bg-[color-mix(in_oklab,var(--lp-ink)_78%,transparent)] backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
                    <a href="#top" className="flex items-center gap-2.5 rounded-md">
                        <img src="/icon-no-bg.png" alt="" className="size-8" />
                        <span className="font-heading text-[0.9375rem] font-semibold tracking-tight">
                            Mind &amp; Body
                        </span>
                    </a>

                    <nav aria-label="Secciones" className="hidden items-center gap-8 md:flex">
                        {[
                            { href: '#modulos', label: 'Qué incluye' },
                            { href: '#app', label: 'App móvil' },
                            { href: '#acceso', label: 'Acceso' },
                        ].map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="lp-mono rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <Button size="sm" onClick={goToLogin}>
                        Iniciar sesión
                        <ArrowRight className="size-3.5" />
                    </Button>
                </div>
            </header>

            <main id="top">
                {/* ── Hero ── */}
                <section className="relative overflow-hidden">
                    <div className="lp-field absolute inset-0" aria-hidden="true" />

                    <div className="relative mx-auto grid w-full max-w-6xl gap-16 px-6 pt-20 pb-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pt-28 lg:pb-32">
                        <Reveal>
                            <p className="lp-mono flex items-center gap-2.5 text-muted-foreground">
                                <span className="inline-block size-1.5 rounded-[2px] bg-primary" aria-hidden="true" />
                                Panel administrativo
                            </p>

                            <BrandLockup className="mt-7" />

                            <h1 className="font-heading mt-9 max-w-lg text-2xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-[1.75rem]">
                                Todo lo que pasa en el gimnasio, en un solo panel.
                            </h1>

                            <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground text-pretty">
                                Miembros, clases, reservas, rutinas y progreso. Das de alta a una persona, programas la
                                clase, y la reserva le aparece en el teléfono.
                            </p>

                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <Button size="lg" className="px-5" onClick={goToLogin}>
                                    Acceder al panel
                                    <ArrowRight className="size-4" />
                                </Button>
                                <Button size="lg" variant="ghost" className="px-4 text-muted-foreground" asChild>
                                    <a href="#modulos">
                                        Ver qué incluye
                                        <ArrowDown className="size-4" />
                                    </a>
                                </Button>
                            </div>

                            <ul className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[var(--lp-hairline)] pt-6">
                                {HERO_FACTS.map((fact) => (
                                    <li key={fact} className="lp-mono text-muted-foreground/60">
                                        {fact}
                                    </li>
                                ))}
                            </ul>
                        </Reveal>

                        <Reveal delay={0.12}>
                            <LiveAgenda />
                        </Reveal>
                    </div>
                </section>

                {/* ── Product shot ── */}
                <section className="border-t border-[var(--lp-hairline)]">
                    <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
                        <Reveal className="max-w-2xl">
                            <p className="lp-mono text-primary/80">El panel</p>
                            <h2 className="font-heading mt-4 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                                Abres el panel y ya sabes cómo va el mes.
                            </h2>
                            <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">
                                Miembros activos, reservas del día, clases con más demanda y quién no se presentó, en la
                                primera pantalla. Debajo, cada sección con su listado y sus filtros.
                            </p>
                        </Reveal>

                        <Reveal delay={0.1} className="lp-shot mt-14">
                            <div className="overflow-hidden rounded-2xl border border-[var(--lp-hairline)] bg-[var(--lp-surface)] shadow-[0_50px_120px_-50px_oklch(0_0_0/90%)]">
                                <div className="flex items-center gap-2 border-b border-[var(--lp-hairline)] px-4 py-3">
                                    <span className="flex gap-1.5" aria-hidden="true">
                                        <span className="size-2 rounded-full bg-white/15" />
                                        <span className="size-2 rounded-full bg-white/15" />
                                        <span className="size-2 rounded-full bg-white/15" />
                                    </span>
                                    <span className="lp-mono ml-2 text-muted-foreground/50">
                                        Mind &amp; Body · Dashboard
                                    </span>
                                </div>
                                <ImagePlaceholder className="aspect-[1406/732]" label="Vista del panel" />
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* ── Modules ── */}
                <section id="modulos" className="scroll-mt-16 border-t border-[var(--lp-hairline)]">
                    <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
                        <Reveal className="max-w-2xl">
                            <p className="lp-mono text-primary/80">Qué incluye</p>
                            <h2 className="font-heading mt-4 text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                                Seis áreas, una sola información.
                            </h2>
                            <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">
                                Nada de exportar ni volver a digitar: lo que cambias en un lado se ve de inmediato en el
                                resto y en la app.
                            </p>
                        </Reveal>

                        <Reveal delay={0.1} className="mt-14">
                            <ModuleGrid />
                        </Reveal>
                    </div>
                </section>

                {/* ── Member app ── */}
                <section id="app" className="scroll-mt-16 border-t border-[var(--lp-hairline)]">
                    <div className="mx-auto grid w-full max-w-6xl gap-16 px-6 py-24 lg:grid-cols-[1fr_auto] lg:items-center sm:py-28">
                        <Reveal>
                            <p className="lp-mono text-primary/80">App móvil</p>
                            <h2 className="font-heading mt-4 max-w-xl text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
                                Del otro lado está el teléfono del miembro.
                            </h2>
                            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground text-pretty">
                                La app usa la misma cuenta y las mismas clases que administras en el panel. Lo que
                                publicas hoy es lo que el miembro reserva hoy.
                            </p>

                            <ul className="mt-10 max-w-xl">
                                {APP_FEATURES.map((feature) => (
                                    <li
                                        key={feature.text}
                                        className="flex items-start gap-4 border-t border-[var(--lp-hairline)] py-4"
                                    >
                                        <feature.icon
                                            className="mt-0.5 size-4 shrink-0 text-primary"
                                            aria-hidden="true"
                                        />
                                        <span className="text-sm leading-relaxed text-muted-foreground">
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>

                        <Reveal delay={0.12} className="flex justify-center lg:justify-end">
                            <PhoneFrame />
                        </Reveal>
                    </div>
                </section>

                {/* ── Access ── */}
                <section
                    id="acceso"
                    className="relative scroll-mt-16 overflow-hidden border-t border-[var(--lp-hairline)]"
                >
                    <div
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(38rem_22rem_at_50%_100%,color-mix(in_oklab,var(--lp-amber)_11%,transparent),transparent_70%)]"
                        aria-hidden="true"
                    />

                    <div className="relative mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
                        <Reveal>
                            <ul className="grid gap-px overflow-hidden rounded-2xl border border-[var(--lp-hairline)] bg-[var(--lp-hairline)] sm:grid-cols-3">
                                {TRUST.map((item) => (
                                    <li key={item.title} className="bg-[var(--lp-ink)] p-7">
                                        <item.icon className="size-4.5 text-primary" aria-hidden="true" />
                                        <h3 className="font-heading mt-4 text-sm font-semibold tracking-tight">
                                            {item.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                            {item.text}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>

                        <Reveal delay={0.1} className="mt-20 text-center">
                            <h2 className="font-heading mx-auto max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl">
                                Entra al panel de Mind &amp; Body.
                            </h2>
                            <p className="mx-auto mt-5 max-w-md leading-relaxed text-muted-foreground text-pretty">
                                Inicia sesión con tu cuenta. Si todavía no tienes una, pídesela a un administrador del
                                gimnasio.
                            </p>
                            <Button size="lg" className="mt-9 px-6" onClick={goToLogin}>
                                Acceder al panel
                                <ArrowRight className="size-4" />
                            </Button>
                        </Reveal>
                    </div>
                </section>
            </main>

            <footer className="border-t border-[var(--lp-hairline)]">
                <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
                    <div className="flex items-center gap-2.5">
                        <img src="/icon-no-bg.png" alt="" className="size-6" />
                        <span className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Mind &amp; Body
                        </span>
                    </div>
                    <p className="lp-mono text-muted-foreground/50">Sistema de gestión para gimnasios</p>
                </div>
            </footer>
        </div>
    );
}
