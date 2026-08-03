import { IsDateString, IsOptional } from 'class-validator';

import { MeasurementValuesDto } from './measurement-values.dto';

/**
 * Crear = los valores + la fecha de la medición. `measuredAt` solo existe acá:
 * la corrección no lo toca (ver `PUT /measurements/:id`) porque mobile nunca lo
 * manda, así que no hay forma de digitarlo mal, y moverlo al futuro desordenaría
 * el historial y `summary.latest`.
 */
export class CreateMeasurementDto extends MeasurementValuesDto {
    @IsOptional()
    @IsDateString()
    measuredAt?: string;
}
