import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    // Scroll horizontal: el contenedor de Table ya aplica overflow-x-auto (sin overflow-hidden que lo recorte).
    return (
        <div className="rounded-lg border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">Miembro</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => {
                        const isSelected = member.id === selectedMemberId;
                        return (
                            <TableRow
                                key={member.id}
                                onClick={() => onSelectMember?.(member)}
                                aria-selected={isSelected}
                                className={cn(
                                    'cursor-pointer border-border',
                                    isSelected && 'bg-primary/5 hover:bg-primary/5',
                                )}
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
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
