import { IsNumber, IsOptional, IsString, MaxLength, Max, Min } from 'class-validator';

/**
 * Valores de una medición que el miembro digita. Lo comparten la creación
 * (`POST /measurements`) y la corrección (`PUT /measurements/:id`), así que
 * agregar una métrica es un solo cambio acá.
 *
 * En el PUT el reemplazo es total: un campo ausente borra el valor guardado.
 *
 * Las cotas superiores no son médicas, son las de las columnas `numeric(5,2)`;
 * sin ellas un valor de 4+ dígitos revienta en Postgres y sale como 500 en vez
 * de 400. `maxDecimalPlaces` evita el redondeo silencioso de la BD.
 */
const NUMERIC_5_2_MAX = 999.99;

export class MeasurementValuesDto {
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(NUMERIC_5_2_MAX)
    weightKg?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(NUMERIC_5_2_MAX)
    heightCm?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    bodyFatPercentage?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(NUMERIC_5_2_MAX)
    waistCm?: number;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    notes?: string;
}
