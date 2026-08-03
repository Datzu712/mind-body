import { Transform, type TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ForgeChatDto {
    @Transform(({ value }: TransformFnParams): unknown =>
        typeof value === 'string' ? value.trim() : (value as unknown),
    )
    @IsString()
    @IsNotEmpty()
    // Un entrenador puede incluir objetivo, nivel, equipo, tiempo y
    // restricciones en un solo briefing sin que la API lo corte.
    @MaxLength(4000)
    message!: string;
}
