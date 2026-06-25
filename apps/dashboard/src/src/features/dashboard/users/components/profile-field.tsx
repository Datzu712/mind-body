import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProfileFieldProps {
    id: string;
    label: string;
    /** When true the field is editable; otherwise it renders read-only text. */
    editing: boolean;
    /** Controlled value shown while editing. */
    value: string;
    onChange: (value: string) => void;
    /** Text shown when not editing (often a different source than `value`). */
    readonlyValue?: string | null;
    placeholder?: string;
    /** Render a multi-line textarea instead of a single-line input. */
    multiline?: boolean;
}

/**
 * Labelled profile field that swaps between an editable control and read-only
 * text depending on `editing`. Shared by the member / trainer / staff detail
 * sections, which previously each inlined this pattern.
 */
export function ProfileField({
    id,
    label,
    editing,
    value,
    onChange,
    readonlyValue,
    placeholder,
    multiline = false,
}: ProfileFieldProps) {
    return (
        <div className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-muted-foreground text-xs">
                {label}
            </Label>
            {editing ? (
                multiline ? (
                    <Textarea
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="bg-secondary/50 border-border min-h-[100px]"
                    />
                ) : (
                    <Input
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="bg-secondary/50 border-border"
                    />
                )
            ) : (
                <p className="text-sm text-foreground h-9 flex items-center">{readonlyValue || '—'}</p>
            )}
        </div>
    );
}
