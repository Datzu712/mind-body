import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

/**
 * Cancelación administrativa: la intención es explícita, no se infiere del rol.
 * MEMBER_REQUEST aplica la misma ventana de 12h del miembro; ADMIN_OVERRIDE
 * siempre cancela liberando cupo y exige nota auditada.
 *
 * `reason` es opcional a nivel de pipe porque el owner cancela SIN body
 * (ValidationPipe valida `{}` cuando no llega body); el service exige la
 * intención cuando el actor no es el dueño.
 */
export class AdminCancelReservationDto {
    @IsOptional()
    @IsIn(['MEMBER_REQUEST', 'ADMIN_OVERRIDE'])
    reason?: 'MEMBER_REQUEST' | 'ADMIN_OVERRIDE';

    @ValidateIf((o: AdminCancelReservationDto) => o.reason === 'ADMIN_OVERRIDE')
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    note!: string;
}

export class RescheduleReservationDto {
    @IsUUID()
    targetSessionId!: string;

    /**
     * Solo ADMIN/STAFF y solo cuando la reserva está dentro de la ventana
     * tardía; para MEMBER no se acepta.
     */
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    lateOverrideNote?: string;
}

export class MarkAttendanceDto {
    @IsBoolean()
    attended!: boolean;

    /** Se guarda en el evento de auditoría, nunca en el DTO público. */
    @IsOptional()
    @IsString()
    @MaxLength(500)
    note?: string;
}

export class ListMyReservationsQueryDto {
    @IsIn(['UPCOMING', 'HISTORY'])
    scope!: 'UPCOMING' | 'HISTORY';
}
