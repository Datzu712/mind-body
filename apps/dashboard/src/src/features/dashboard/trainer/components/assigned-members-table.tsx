'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type AssignedMember, type AssignedMemberStatus, assignedMemberStatusLabels } from '@/src/shared/lib/mock-data';

interface AssignedMembersTableProps {
    members: AssignedMember[];
    selectedMemberId?: string;
    onSelectMember?: (member: AssignedMember) => void;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Badge local: etiquetas femeninas + tokens semánticos (no usa StatusBadge compartido)
const statusClasses: Record<AssignedMemberStatus, string> = {
    active: 'bg-success/20 text-success hover:bg-success/30 border-success/30',
    frozen: 'bg-warning/20 text-warning hover:bg-warning/30 border-warning/30',
    expired: 'bg-destructive/20 text-destructive hover:bg-destructive/30 border-destructive/30',
};

function MembershipStatusBadge({ status }: { status: AssignedMemberStatus }) {
    return (
        <Badge variant="outline" className={cn('font-medium border', statusClasses[status])}>
            {assignedMemberStatusLabels[status]}
        </Badge>
    );
}

export function AssignedMembersTable({ members, selectedMemberId, onSelectMember }: AssignedMembersTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">Miembro</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Objetivo principal</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Última sesión</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => {
                        const isSelected = member.id === selectedMemberId;
                        return (
                            <TableRow
                                key={member.id}
                                className={cn('border-border', isSelected && 'bg-primary/5 hover:bg-primary/5')}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9">
                                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                                {getInitials(member.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{member.name}</span>
                                            <span className="font-mono text-xs text-muted-foreground">{member.id}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <MembershipStatusBadge status={member.membershipStatus} />
                                </TableCell>
                                <TableCell className="text-foreground">{member.mainGoal}</TableCell>
                                <TableCell className="text-muted-foreground">{member.lastSessionAt}</TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-end">
                                        <Button
                                            type="button"
                                            variant={isSelected ? 'secondary' : 'outline'}
                                            size="sm"
                                            onClick={() => onSelectMember?.(member)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver perfil
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
