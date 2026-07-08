import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import type { ClassStatus } from '../mock-classes';

interface ClassesToolbarProps {
    search: string;
    onSearchChange: (search: string) => void;
    statusFilter: 'all' | ClassStatus;
    onStatusChange: (status: 'all' | ClassStatus) => void;
    onCreateClick: () => void;
}

export function ClassesToolbar({
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    onCreateClick,
}: ClassesToolbarProps) {
    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clases o entrenadores..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-secondary/50 border-border"
                    />
                </div>
                <Select
                    value={statusFilter}
                    onValueChange={(value) => onStatusChange(value as 'all' | ClassStatus)}
                >
                    <SelectTrigger className="bg-secondary/50 border-border sm:w-48">
                        <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                        <SelectItem value="all">Todos los estados</SelectItem>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                        <SelectItem value="full">Cupo lleno</SelectItem>
                        <SelectItem value="waitlist">Lista de espera</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={onCreateClick}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva clase
            </Button>
        </div>
    );
}
