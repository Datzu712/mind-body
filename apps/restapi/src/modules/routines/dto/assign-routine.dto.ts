import { IsUUID } from 'class-validator';

export class AssignRoutineDto {
    @IsUUID()
    member_id!: string;
}
