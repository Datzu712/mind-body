'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/src/shared/components/status-badge';
import { Eye, Pencil, IdCard } from 'lucide-react';
import { type Member, membershipLabels } from '@/src/shared/lib/mock-data';

interface MembersTableProps {
    members: Member[];
}

export function MembersTable({ members }: MembersTableProps) {
    return (
        <div className="rounded-lg border border-border overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-muted-foreground font-semibold">ID</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Nombre completo</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Correo</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Estado</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Membresía</TableHead>
                        <TableHead className="text-muted-foreground font-semibold">Fecha de vencimiento</TableHead>
                        <TableHead className="text-muted-foreground font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => (
                        <TableRow key={member.id} className="border-border">
                            {/* ID del miembro */}
                            <TableCell className="font-mono text-xs text-muted-foreground">{member.id}</TableCell>
                            {/* Nombre completo con avatar */}
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                                            {member.avatar}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-foreground">{member.name}</span>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{member.email}</TableCell>
                            {/* Estado: success (activo) / warning (en pausa, pendiente) / muted (inactivo) */}
                            <TableCell>
                                <StatusBadge status={member.status} />
                            </TableCell>
                            <TableCell className="text-foreground">{membershipLabels[member.membership]}</TableCell>
                            <TableCell className="text-muted-foreground">{member.expiresAt}</TableCell>
                            {/* Acciones por fila (solo visual, sin navegación real) */}
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver perfil">
                                        <Eye className="h-4 w-4" />
                                        <span className="sr-only">Ver perfil</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Editar">
                                        <Pencil className="h-4 w-4" />
                                        <span className="sr-only">Editar</span>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Gestionar membresía">
                                        <IdCard className="h-4 w-4" />
                                        <span className="sr-only">Gestionar membresía</span>
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
