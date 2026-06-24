'use client';

import { useState, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { Member, MemberRoutine } from '../lib/training-types';

interface AssignRoutineDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    routineId: string;
    members: Member[];
    assignments: MemberRoutine[];
    onAssign: (data: Omit<MemberRoutine, 'id' | 'assignedAt'>) => Promise<{ success: boolean; error?: string }>;
}

export function AssignRoutineDialog({
    open,
    onOpenChange,
    routineId,
    members,
    assignments,
    onAssign,
}: AssignRoutineDialogProps) {
    const [memberId, setMemberId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const alreadyAssignedIds = useMemo(
        () => new Set(assignments.filter((a) => a.routineId === routineId).map((a) => a.memberId)),
        [assignments, routineId],
    );

    const availableMembers = useMemo(
        () => members.filter((m) => !alreadyAssignedIds.has(m.id)),
        [members, alreadyAssignedIds],
    );

    const handleOpenChange = (openState: boolean) => {
        if (!openState) {
            setMemberId('');
            setError(null);
        }
        onOpenChange(openState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!memberId) {
            setError('Selecciona un miembro.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await onAssign({ memberId, routineId, status: 'ACTIVE' });
            if (result.success) {
                handleOpenChange(false);
            } else {
                setError(result.error || 'Ocurrió un error');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="bg-card border-border sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Asignar rutina</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Selecciona el miembro al que deseas asignar esta rutina.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="member-select">Miembro</Label>
                        <Select value={memberId} onValueChange={setMemberId}>
                            <SelectTrigger id="member-select" className="bg-secondary/50 border-border">
                                <SelectValue placeholder="Selecciona un miembro" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {availableMembers.length === 0 && (
                                    <SelectItem value="none" disabled>
                                        No hay miembros disponibles
                                    </SelectItem>
                                )}
                                {availableMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            className="border-border"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading || availableMembers.length === 0}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Asignar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
