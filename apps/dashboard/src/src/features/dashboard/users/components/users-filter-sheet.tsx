import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import type { ProfileType, RecordStatus } from '../types';

export interface UsersFilters {
    profile: ProfileType | 'ALL';
    status: RecordStatus | 'ALL';
    name: string;
    email: string;
    phone: string;
}

export const defaultFilters: UsersFilters = {
    profile: 'ALL',
    status: 'ALL',
    name: '',
    email: '',
    phone: '',
};

interface UsersFilterSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    filters: UsersFilters;
    onApply: (filters: UsersFilters) => void;
}

export function UsersFilterSheet({ open, onOpenChange, filters, onApply }: UsersFilterSheetProps) {
    const [local, setLocal] = useState<UsersFilters>(filters);

    useEffect(() => {
        if (open) {
            setLocal(filters);
        }
    }, [open]);

    const handleApply = () => {
        onApply(local);
        onOpenChange(false);
    };

    const handleClear = () => {
        setLocal(defaultFilters);
    };

    const update = (field: keyof UsersFilters, value: string) => {
        setLocal((prev) => ({ ...prev, [field]: value }));
    };

    const activeCount = [
        local.profile !== 'ALL',
        local.status !== 'ALL',
        local.name !== '',
        local.email !== '',
        local.phone !== '',
    ].filter(Boolean).length;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-card border-border flex flex-col" side="right">
                <SheetHeader>
                    <SheetTitle className="text-foreground text-lg">Filtros</SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-4 pt-1 pb-4">
                    <div className="grid grid-cols-1 gap-5">
                        {/* Nombre */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-foreground">Nombre</Label>
                            <Input
                                placeholder="Buscar por nombre..."
                                value={local.name}
                                onChange={(e) => update('name', e.target.value)}
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        {/* Email */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-foreground">Email</Label>
                            <Input
                                placeholder="Buscar por email..."
                                value={local.email}
                                onChange={(e) => update('email', e.target.value)}
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        {/* Telefono */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-sm font-medium text-foreground">Telefono</Label>
                            <Input
                                placeholder="Buscar por telefono..."
                                value={local.phone}
                                onChange={(e) => update('phone', e.target.value)}
                                className="bg-secondary/50 border-border"
                            />
                        </div>

                        {/* Tipo de perfil + Estado en grid 2 cols */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-foreground">Tipo de perfil</Label>
                                <Select value={local.profile} onValueChange={(v) => update('profile', v)}>
                                    <SelectTrigger className="bg-secondary/50 border-border">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border" position="popper">
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        <SelectItem value="MEMBER">Miembros</SelectItem>
                                        <SelectItem value="TRAINER">Entrenadores</SelectItem>
                                        <SelectItem value="STAFF">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label className="text-sm font-medium text-foreground">Estado</Label>
                                <Select value={local.status} onValueChange={(v) => update('status', v)}>
                                    <SelectTrigger className="bg-secondary/50 border-border">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border" position="popper">
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        <SelectItem value="ACTIVE">Activo</SelectItem>
                                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                                        <SelectItem value="ARCHIVED">Archivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <SheetFooter className="flex-row gap-3 border-t border-border pt-4">
                    <Button onClick={handleApply} className="flex-1">
                        <Search className="mr-2 h-4 w-4" />
                        Aplicar filtros
                        {activeCount > 0 && (
                            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[10px]">
                                {activeCount}
                            </span>
                        )}
                    </Button>
                    <Button variant="outline" onClick={handleClear} className="flex-1">
                        <X className="mr-2 h-4 w-4" />
                        Limpiar filtros
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
