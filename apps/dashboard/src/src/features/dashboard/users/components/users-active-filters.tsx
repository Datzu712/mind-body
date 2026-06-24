import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { defaultFilters, type UsersFilters } from './users-filter-sheet';

const profileLabels: Record<string, string> = {
    MEMBER: 'Miembro',
    TRAINER: 'Entrenador',
    STAFF: 'Staff',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    ARCHIVED: 'Archivado',
};

interface UsersActiveFiltersProps {
    filters: UsersFilters;
    onChange: (filters: UsersFilters) => void;
}

export function UsersActiveFilters({ filters, onChange }: UsersActiveFiltersProps) {
    const chips: { key: keyof UsersFilters; label: string }[] = [];
    if (filters.name) chips.push({ key: 'name', label: `Nombre: ${filters.name}` });
    if (filters.email) chips.push({ key: 'email', label: `Email: ${filters.email}` });
    if (filters.phone) chips.push({ key: 'phone', label: `Teléfono: ${filters.phone}` });
    if (filters.dni) chips.push({ key: 'dni', label: `Cédula: ${filters.dni}` });
    if (filters.profile !== 'ALL') chips.push({ key: 'profile', label: `Perfil: ${profileLabels[filters.profile]}` });
    if (filters.status !== 'ALL') chips.push({ key: 'status', label: `Estado: ${statusLabels[filters.status]}` });

    if (chips.length === 0) return null;

    const remove = (key: keyof UsersFilters) => onChange({ ...filters, [key]: defaultFilters[key] });

    return (
        <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtros activos:</span>
            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/50 py-1 pl-3 pr-1 text-xs text-foreground"
                >
                    {chip.label}
                    <button
                        type="button"
                        onClick={() => remove(chip.key)}
                        aria-label={`Quitar filtro ${chip.label}`}
                        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </span>
            ))}
            {chips.length > 1 && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => onChange(defaultFilters)}
                >
                    Limpiar todo
                </Button>
            )}
        </div>
    );
}
