import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID, Matches } from 'class-validator';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const toBool = ({ value }: { value: unknown }) => value === true || value === 'true';

export class ListSessionsQueryDto {
    /** Fecha local inclusiva. El rango máximo permitido es 31 días. */
    @Matches(DATE_RE, { message: 'from must be YYYY-MM-DD' })
    from!: string;

    @Matches(DATE_RE, { message: 'to must be YYYY-MM-DD' })
    to!: string;

    @IsOptional()
    @IsUUID()
    classId?: string;

    @IsOptional()
    @IsUUID()
    trainerId?: string;

    @IsOptional()
    @Transform(toBool)
    @IsBoolean()
    includeCancelled?: boolean;
}

export class MoveSessionDto {
    @Matches(DATE_RE, { message: 'date must be YYYY-MM-DD' })
    date!: string;

    @Matches(TIME_RE, { message: 'startTime must be HH:mm' })
    startTime!: string;
}

// El booking no lleva body en v1 (sin waitlist no hay modo): el miembro se
// deriva SIEMPRE del token y una sesión llena responde 409 SESSION_FULL.
