import { Fragment, useEffect, useRef, useState } from 'react';
import { ForgeOrb } from './forge-orb';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Coins,
    Footprints,
    RotateCcw,
    SendHorizonal,
    Timer,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ForgeChat } from '../use-forge-chat';
import { useForgeActivity } from '../use-forge-activity';
import { ForgeMarkdown } from './forge-markdown';

const SUGGESTIONS = [
    'Rutina de espalda y bíceps · hipertrofia · intermedio',
    'Rutina full body para principiante, 45 min',
    '¿Qué opinás del estado actual de la rutina?',
    'Balanceá el volumen entre grupos musculares',
];

// TEMPORAL (métricas de prueba): USD por millón de tokens (in/out) para la
// estimación del footer. Quitar junto con el footer antes de la entrega.
const MODEL_PRICES: Record<string, { inPerM: number; outPerM: number }> = {
    'gpt-5.6-luna': { inPerM: 0.2, outPerM: 1.2 },
    'gpt-5.6-terra': { inPerM: 2, outPerM: 12 },
    'gpt-4o-mini': { inPerM: 0.15, outPerM: 0.6 },
};

const fmtTokens = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

function MetaChip({ icon: Icon, value, detail }: { icon: LucideIcon; value: string; detail?: string }) {
    return (
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2 py-0.5">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] font-medium tabular-nums text-foreground/90">{value}</span>
            {detail && <span className="text-[10px] tabular-nums text-muted-foreground">{detail}</span>}
        </span>
    );
}

function UsageStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
    return (
        <span className="flex items-center gap-1.5">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-semibold tabular-nums text-foreground">{value}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        </span>
    );
}

export function ForgePanel({ chat }: { chat: ForgeChat }) {
    const { messages, send, isStreaming, activityKind, isLoadingHistory, reset, usage } = chat;
    const { orbState, message, seconds } = useForgeActivity(activityKind, isStreaming);

    // Input cacheado ≈ 10% del precio de input en la familia gpt-5.
    const CACHED_DISCOUNT = 0.1;
    const prices = usage.modelId ? MODEL_PRICES[usage.modelId] : undefined;
    const estimatedCost = prices
        ? ((usage.inputTokens - usage.cachedInputTokens) * prices.inPerM +
              usage.cachedInputTokens * prices.inPerM * CACHED_DISCOUNT +
              usage.outputTokens * prices.outPerM) /
          1_000_000
        : null;
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Auto-scroll al fondo con cada token nuevo.
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || isStreaming) return;
        send(input);
        setInput('');
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b border-border p-4">
                <ForgeOrb state={orbState} size={64} aria-label="Estado de Forge" />
                <div className="flex flex-col">
                    <span className="font-semibold text-foreground">Forge</span>
                    <span className="text-xs text-muted-foreground">
                        {message}
                        {isStreaming && <span className="tabular-nums"> · {seconds}s</span>}
                    </span>
                </div>
                {messages.length > 0 && (
                    <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Reiniciar conversación"
                        aria-label="Reiniciar conversación"
                        disabled={isStreaming}
                        onClick={reset}
                    >
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                {isLoadingHistory && messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ForgeOrb state="searching" size={20} /> Recuperando la conversación…
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                        <p className="text-sm text-muted-foreground">
                            Pedime generar la rutina, completarla o darte una opinión.
                        </p>
                        <div className="flex flex-col gap-2">
                            {SUGGESTIONS.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => send(s)}
                                    className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary/80"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    messages.map((m, i) => (
                        <Fragment key={i}>
                            <div
                                className={cn(
                                    // wrap-anywhere: un token/URL largo del modelo no debe
                                    // inflar el ancho del panel (mismo bug que el textarea).
                                    // pre-wrap solo para el user: el markdown del assistant
                                    // maneja sus propios saltos (remark-breaks).
                                    'max-w-[90%] wrap-anywhere rounded-lg px-3 py-2 text-sm',
                                    m.role === 'user'
                                        ? 'ml-auto whitespace-pre-wrap bg-primary/15 text-foreground'
                                        : 'mr-auto bg-secondary/60 text-foreground',
                                )}
                            >
                                {m.role === 'assistant' && m.content ? (
                                    <ForgeMarkdown content={m.content} />
                                ) : (
                                    m.content ||
                                    (isStreaming && i === messages.length - 1 ? (
                                        <span className="inline-flex items-center gap-2 text-muted-foreground">
                                            <ForgeOrb state={orbState} size={20} /> {message}
                                        </span>
                                    ) : (
                                        ''
                                    ))
                                )}
                            </div>
                            {/* TEMPORAL (métricas de prueba): detalle del turno bajo la respuesta */}
                            {m.role === 'assistant' && m.meta && (
                                <div className="mr-auto -mt-1 flex flex-wrap items-center gap-1">
                                    <MetaChip icon={Footprints} value={`${m.meta.steps} pasos`} />
                                    <MetaChip icon={Wrench} value={`${m.meta.toolCalls} tools`} />
                                    <MetaChip
                                        icon={ArrowUpFromLine}
                                        value={fmtTokens(m.meta.inputTokens)}
                                        detail={
                                            m.meta.cachedInputTokens > 0
                                                ? `${Math.round((m.meta.cachedInputTokens / m.meta.inputTokens) * 100)}% caché`
                                                : undefined
                                        }
                                    />
                                    <MetaChip icon={ArrowDownToLine} value={fmtTokens(m.meta.outputTokens)} />
                                    <MetaChip icon={Timer} value={`${(m.meta.durationMs / 1000).toFixed(1)}s`} />
                                </div>
                            )}
                        </Fragment>
                    ))
                )}
            </div>

            <div className="border-t border-border p-3">
                <div className="flex items-center gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        maxLength={4000}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={isStreaming ? 'Forge está trabajando…' : 'Escribile a Forge…'}
                        disabled={isStreaming}
                        rows={2}
                        // min-w-0 + wrap-anywhere: field-sizing-content quiere el ancho
                        // de la línea más larga y una palabra sin espacios es inquebrable
                        // — su mínimo intrínseco se propaga por los flex ancestros (panel
                        // resizable incluido) y desborda el dashboard entero. anywhere
                        // permite quebrar en cualquier carácter Y colapsa ese mínimo.
                        className="min-w-0 wrap-anywhere max-h-40 resize-none"
                    />
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isStreaming || !input.trim()}
                        aria-label="Enviar"
                    >
                        <SendHorizonal className="h-4 w-4" />
                    </Button>
                </div>
                {/* TEMPORAL (métricas de prueba): tokens y costo estimado de la sesión */}
                {usage.turns > 0 && (
                    <div
                        className="mt-2 flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-1.5"
                        title={`${usage.modelId ?? 'modelo desconocido'} · ${usage.turns} ${usage.turns === 1 ? 'turno' : 'turnos'} en esta sesión · ${fmtTokens(usage.cachedInputTokens)} tokens desde caché`}
                    >
                        <UsageStat icon={ArrowUpFromLine} label="entrada" value={fmtTokens(usage.inputTokens)} />
                        <UsageStat icon={ArrowDownToLine} label="salida" value={fmtTokens(usage.outputTokens)} />
                        <UsageStat
                            icon={Coins}
                            label="costo est."
                            value={estimatedCost != null ? `$${estimatedCost.toFixed(4)}` : '—'}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
