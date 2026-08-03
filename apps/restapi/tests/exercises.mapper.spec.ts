import { describe, expect, it } from 'vitest';
import { toDetailDto, toSlimDto, type ExerciseRow } from '../src/modules/exercises/exercises.mapper';

const row: ExerciseRow = {
    id: '0198c0de-0000-7000-8000-000000000001',
    sourceId: '0001',
    name: '3/4 sit-up',
    description: 'Lie flat on your back...',
    muscleGroup: 'hip flexors',
    bodyPart: 'waist',
    equipment: 'body weight',
    target: 'abs',
    secondaryMuscles: ['hip flexors', 'lower back'],
    instructionsEs: ['Acuéstate boca arriba.', 'Sube el torso.'],
    instructionsEn: ['Lie flat.', 'Raise your torso.'],
    imageUrl: 'https://raw.example/i.jpg',
    gifUrl: 'https://raw.example/v.gif',
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
};

describe('exercises mapper', () => {
    it('slim: proyecta solo los campos de lista (sin instrucciones ni timestamps)', () => {
        expect(toSlimDto(row)).toEqual({
            id: row.id,
            name: '3/4 sit-up',
            bodyPart: 'waist',
            equipment: 'body weight',
            target: 'abs',
            muscleGroup: 'hip flexors',
            imageUrl: 'https://raw.example/i.jpg',
            gifUrl: 'https://raw.example/v.gif',
        });
    });

    it('detail: usa instrucciones en español cuando existen', () => {
        expect(toDetailDto(row).instructions).toEqual(['Acuéstate boca arriba.', 'Sube el torso.']);
    });

    it('detail: cae a inglés si ES viene null o vacío', () => {
        expect(toDetailDto({ ...row, instructionsEs: null }).instructions).toEqual(['Lie flat.', 'Raise your torso.']);
        expect(toDetailDto({ ...row, instructionsEs: [] }).instructions).toEqual(['Lie flat.', 'Raise your torso.']);
    });

    it('detail: sin instrucciones en ningún idioma → array vacío; secondaryMuscles null → []', () => {
        const bare = toDetailDto({ ...row, instructionsEs: null, instructionsEn: null, secondaryMuscles: null });
        expect(bare.instructions).toEqual([]);
        expect(bare.secondaryMuscles).toEqual([]);
    });
});
