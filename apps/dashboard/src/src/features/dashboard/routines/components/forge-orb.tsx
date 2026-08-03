import { useEffect, useState } from 'react';
import { ThinkingOrb, type OrbState, type ThinkingOrbProps } from 'thinking-orbs';
import { cn } from '@/lib/utils';

/** thinking-orbs cambia de animación de un frame al otro (sin transición):
 *  al cambiar `state` se hace un crossfade manteniendo el orb saliente
 *  montado mientras se funde. Debe ser < PHASE_MIN_HOLD_MS para que los
 *  fundidos nunca se encadenen. Alineado con `duration-300` de Tailwind. */
const FADE_MS = 300;

/**
 * Orb de Forge: thinking-orbs no expone color (pinta tinta blanca en tema
 * dark), así que se vira a azul HALO con un filtro CSS sobre el wrapper.
 * theme="dark" fijo para que la tinta base sea siempre la clara.
 */
export function ForgeOrb({ className, state = 'working', size = 64, ...props }: ThinkingOrbProps) {
    const [shown, setShown] = useState<OrbState>(state);
    const [leaving, setLeaving] = useState<OrbState | null>(null);
    const [entered, setEntered] = useState(true);

    useEffect(() => {
        if (state === shown) return;
        setLeaving(shown);
        setShown(state);
        setEntered(false);
        // Doble rAF: el layer nuevo pinta un frame en opacity-0 (y el saliente
        // en opacity-100) antes del flip, para que la transición CSS enganche.
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => setEntered(true));
        });
        const timer = setTimeout(() => setLeaving(null), FADE_MS + 50);
        return () => {
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
            clearTimeout(timer);
        };
    }, [state, shown]);

    return (
        <span
            className={cn(
                'relative inline-block [filter:sepia(1)_saturate(4)_hue-rotate(185deg)_brightness(1.1)]',
                className,
            )}
            style={{ width: size, height: size }}
        >
            {leaving && (
                <ThinkingOrb
                    aria-hidden
                    theme="dark"
                    state={leaving}
                    size={size}
                    className={cn(
                        'absolute inset-0 transition-opacity duration-300 ease-out',
                        entered ? 'opacity-0' : 'opacity-100',
                    )}
                />
            )}
            <ThinkingOrb
                theme="dark"
                state={shown}
                size={size}
                className={cn(
                    'absolute inset-0 transition-opacity duration-300 ease-out',
                    entered ? 'opacity-100' : 'opacity-0',
                )}
                {...props}
            />
        </span>
    );
}
