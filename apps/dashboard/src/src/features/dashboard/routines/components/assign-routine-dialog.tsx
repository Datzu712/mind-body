import { useEffect, useState } from 'react';
import { sileo } from 'sileo';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Search, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useUsers } from '@/src/features/dashboard/users/hooks';
import { useAssignRoutine } from '../hooks';

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
}

interface AssignRoutineDialogProps {
    routineId: string;
    routineName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignRoutineDialog({ routineId, routineName, open, onOpenChange }: AssignRoutineDialogProps) {
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data: page, isLoading } = useUsers({
        profile: 'MEMBER',
        status: 'ACTIVE',
        limit: 8,
        ...(debounced && { name: debounced }),
    });
    // El listado no trae el id del perfil member: se carga el detalle del
    // usuario seleccionado para sacar memberProfile.id.
    const { data: selectedUser, isLoading: loadingDetail } = useUser(selectedUserId ?? '');
    const assign = useAssignRoutine(routineId);

    const memberId = selectedUser?.memberProfile?.id ?? null;

    const handleAssign = () => {
        if (!memberId) return;
        assign
            .mutateAsync(memberId)
            .then(() => {
                sileo.success({
                    title: 'Rutina asignada',
                    description: `"${routineName}" → ${selectedUser?.fullName}`,
                });
                onOpenChange(false);
            })
            .catch((e: Error) => sileo.error({ title: 'No se pudo asignar', description: e.message }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Asignar rutina</DialogTitle>
                    <DialogDescription>Elegí el miembro que recibirá &quot;{routineName}&quot;.</DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar miembro por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <div className="max-h-64 space-y-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Buscando...
                        </div>
                    ) : !page?.data.length ? (
                        <div className="flex flex-col items-center gap-2 p-6 text-sm text-muted-foreground">
                            <UserRound className="h-6 w-6" />
                            Sin resultados
                        </div>
                    ) : (
                        page.data.map((user) => (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => setSelectedUserId(user.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-md border border-transparent p-2 text-left transition-colors hover:bg-secondary/60',
                                    selectedUserId === user.id && 'border-primary/40 bg-secondary/80',
                                )}
                            >
                                <Avatar className="h-8 w-8 shrink-0">
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                        {initials(user.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-medium text-foreground">
                                        {user.fullName}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">{user.email ?? '—'}</span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={!selectedUserId || loadingDetail || !memberId || assign.isPending}
                    >
                        {assign.isPending || (selectedUserId && loadingDetail) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        Asignar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
