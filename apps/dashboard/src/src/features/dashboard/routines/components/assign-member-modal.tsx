import { useMemo, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { useMembers } from '../hooks';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AssignMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAssign: (memberId: string) => void;
    isPending?: boolean;
}

export function AssignMemberModal({ open, onOpenChange, onAssign, isPending = false }: AssignMemberModalProps) {
    const { data: membersResponse, isLoading } = useMembers({ status: 'ACTIVE', limit: 100 });
    const [selectedId, setSelectedId] = useState('');

    const members = useMemo(() => membersResponse?.data ?? [], [membersResponse]);

    const handleClose = (next: boolean) => {
        if (!next) setSelectedId('');
        onOpenChange(next);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId) return;
        onAssign(selectedId);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Asignar a miembro
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Seleccioná el miembro al que querés asignar esta rutina.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="member-select">Miembro</Label>
                        <Select value={selectedId} onValueChange={setSelectedId} disabled={isLoading || isPending}>
                            <SelectTrigger id="member-select" className="bg-secondary/50 border-border">
                                <SelectValue placeholder={isLoading ? 'Cargando...' : 'Seleccionar miembro'} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border max-h-60">
                                {members.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.fullName} {m.email ? `(${m.email})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!selectedId || isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Asignar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
