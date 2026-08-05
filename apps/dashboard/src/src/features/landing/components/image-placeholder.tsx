import { ImageIcon } from 'lucide-react';

/**
 * Stands in for artwork that is not final. Deliberately not a screenshot: a shot
 * of seeded data reads as a real gym's numbers, and a visitor cannot tell the
 * difference. An honest empty frame is better than a convincing fake one.
 */
export function ImagePlaceholder({ className, label }: { className?: string; label: string }) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center gap-3 bg-[var(--lp-surface)] ${className ?? ''}`}
            role="img"
            aria-label={label}
        >
            {/* The dashes read as "placeholder" at a glance, without needing a caption. */}
            <span className="flex size-12 items-center justify-center rounded-xl border border-dashed border-[var(--lp-hairline)] text-muted-foreground/40">
                <ImageIcon className="size-5" aria-hidden="true" />
            </span>
            <span className="lp-mono text-muted-foreground/40">{label}</span>
        </div>
    );
}
