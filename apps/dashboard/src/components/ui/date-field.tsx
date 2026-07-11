import * as React from 'react';
import { format, isValid, parse } from 'date-fns';
import { IconCalendar } from '@tabler/icons-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const ISO_FORMAT = 'yyyy-MM-dd';
const DISPLAY_FORMAT = 'dd/MM/yyyy';

/** Parse an ISO `yyyy-MM-dd` string to a local Date (avoids UTC off-by-one). */
function parseIso(iso: string): Date | undefined {
    if (!iso) return undefined;
    const date = new Date(`${iso}T00:00:00`);
    return isValid(date) ? date : undefined;
}

function isoToDisplay(iso: string): string {
    const date = parseIso(iso);
    return date ? format(date, DISPLAY_FORMAT) : '';
}

/** Mask raw input into `DD/MM/YYYY` as the user types. */
function maskDate(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)];
    return parts.filter(Boolean).join('/');
}

/** Convert a fully-typed `DD/MM/YYYY` display value to ISO, or '' if incomplete/invalid. */
function displayToIso(display: string): string {
    if (display.length !== DISPLAY_FORMAT.length) return '';
    const date = parse(display, DISPLAY_FORMAT, new Date());
    if (!isValid(date)) return '';
    // Reject calendar overflow (e.g. 31/02 rolling into March)
    if (format(date, DISPLAY_FORMAT) !== display) return '';
    return format(date, ISO_FORMAT);
}

export interface DateFieldProps {
    /** Controlled value, ISO `yyyy-MM-dd`. Pass to control externally. */
    value?: string;
    /** Initial value for uncontrolled usage, ISO `yyyy-MM-dd`. */
    defaultValue?: string;
    /** Emits ISO `yyyy-MM-dd`, or '' when cleared/invalid. */
    onChange?: (value: string) => void;
    /** Renders a hidden input so the ISO value is picked up by FormData. */
    name?: string;
    id?: string;
    placeholder?: string;
    /** Earliest selectable year in the dropdown. Default 1900. */
    fromYear?: number;
    /** Latest selectable year in the dropdown. Default current year. */
    toYear?: number;
    /** Disable dates after today. Default false. */
    disableFuture?: boolean;
    disabled?: boolean;
    className?: string;
    inputClassName?: string;
}

export function DateField({
    value,
    defaultValue,
    onChange,
    name,
    id,
    placeholder = 'DD/MM/AAAA',
    fromYear = 1900,
    toYear = new Date().getFullYear(),
    disableFuture = false,
    disabled,
    className,
    inputClassName,
}: DateFieldProps) {
    const isControlled = value !== undefined;
    const [internalIso, setInternalIso] = React.useState(defaultValue ?? '');
    const iso = isControlled ? value : internalIso;

    const [text, setText] = React.useState(() => isoToDisplay(iso));
    const [open, setOpen] = React.useState(false);
    const lastSynced = React.useRef(iso);

    // Sync the display buffer when the controlled value changes externally
    // (calendar pick, programmatic set, TSE autocomplete, etc.).
    React.useEffect(() => {
        if (!isControlled) return;
        if (value === lastSynced.current) return;
        lastSynced.current = value;
        setText(isoToDisplay(value));
    }, [value, isControlled]);

    const emit = (nextIso: string) => {
        lastSynced.current = nextIso;
        if (!isControlled) setInternalIso(nextIso);
        onChange?.(nextIso);
    };

    const handleText = (raw: string) => {
        const masked = maskDate(raw);
        setText(masked);
        const nextIso = displayToIso(masked);
        if (nextIso) emit(nextIso);
        else if (masked === '') emit('');
        // Partial/invalid input: keep the buffer but don't emit a bad value.
    };

    const handleSelect = (date: Date | undefined) => {
        if (!date) {
            setText('');
            emit('');
        } else {
            setText(format(date, DISPLAY_FORMAT));
            emit(format(date, ISO_FORMAT));
        }
        setOpen(false);
    };

    const selectedDate = parseIso(iso);

    return (
        <div className={cn('relative', className)}>
            <Input
                id={id}
                inputMode="numeric"
                autoComplete="off"
                value={text}
                onChange={(e) => handleText(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn('pr-10', inputClassName)}
            />
            {name && <input type="hidden" name={name} value={iso} />}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={disabled}
                        aria-label="Abrir calendario"
                        className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                    >
                        <IconCalendar className="size-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleSelect}
                        captionLayout="dropdown"
                        startMonth={new Date(fromYear, 0)}
                        endMonth={new Date(toYear, 11)}
                        defaultMonth={selectedDate ?? new Date(toYear, 0)}
                        disabled={disableFuture ? { after: new Date() } : undefined}
                        autoFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
