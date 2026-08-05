import { cn } from '@/lib/utils';

const MIND = ['M', 'I', 'N', 'D'];

/**
 * The wordmark as a lockup: MIND justified across the exact width of BODY, with
 * the ampersand as the hinge. Purely decorative — the accessible name carries
 * the brand, the glyphs are hidden from assistive tech.
 */
export function BrandLockup({ className }: { className?: string }) {
    return (
        <div className={cn('lp-lockup', className)} role="img" aria-label="Mind & Body">
            <span className="lp-lockup-amp" aria-hidden="true">
                &amp;
            </span>
            <span className="lp-lockup-words" aria-hidden="true">
                <span className="lp-lockup-mind">
                    {MIND.map((letter) => (
                        <span key={letter}>{letter}</span>
                    ))}
                </span>
                <span className="lp-lockup-body">BODY</span>
            </span>
        </div>
    );
}
