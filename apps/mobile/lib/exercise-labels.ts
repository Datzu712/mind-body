// Valores del dataset en inglés → español. Fallback: capitalizado tal cual,
// así un valor nuevo del catálogo nunca rompe la UI.
const BODY_PART_ES: Record<string, string> = {
    back: 'Espalda',
    cardio: 'Cardio',
    chest: 'Pecho',
    'lower arms': 'Antebrazos',
    'lower legs': 'Pantorrillas',
    neck: 'Cuello',
    shoulders: 'Hombros',
    'upper arms': 'Brazos',
    'upper legs': 'Piernas',
    waist: 'Core',
};

const EQUIPMENT_ES: Record<string, string> = {
    assisted: 'Asistido',
    band: 'Banda',
    barbell: 'Barra',
    'body weight': 'Peso corporal',
    'bosu ball': 'Bosu',
    cable: 'Polea',
    dumbbell: 'Mancuerna',
    'elliptical machine': 'Elíptica',
    'ez barbell': 'Barra EZ',
    hammer: 'Máquina hammer',
    kettlebell: 'Kettlebell',
    'leverage machine': 'Máquina de palanca',
    'medicine ball': 'Balón medicinal',
    'olympic barbell': 'Barra olímpica',
    'resistance band': 'Banda de resistencia',
    roller: 'Rodillo',
    rope: 'Cuerda',
    'skierg machine': 'Máquina SkiErg',
    'sled machine': 'Trineo',
    'smith machine': 'Máquina Smith',
    'stability ball': 'Balón de estabilidad',
    'stationary bike': 'Bicicleta estática',
    'stepmill machine': 'Escaladora',
    tire: 'Llanta',
    'trap bar': 'Barra hexagonal',
    'upper body ergometer': 'Ergómetro de brazos',
    weighted: 'Con peso',
    'wheel roller': 'Rueda abdominal',
};

const TARGET_ES: Record<string, string> = {
    abductors: 'Abductores',
    abs: 'Abdominales',
    adductors: 'Aductores',
    biceps: 'Bíceps',
    calves: 'Pantorrillas',
    'cardiovascular system': 'Cardiovascular',
    delts: 'Deltoides',
    forearms: 'Antebrazos',
    glutes: 'Glúteos',
    hamstrings: 'Isquiotibiales',
    lats: 'Dorsales',
    'levator scapulae': 'Elevador de la escápula',
    pectorals: 'Pectorales',
    quads: 'Cuádriceps',
    'serratus anterior': 'Serrato anterior',
    spine: 'Erectores de columna',
    traps: 'Trapecios',
    triceps: 'Tríceps',
    'upper back': 'Espalda alta',
};

function labelFrom(map: Record<string, string>, value: string | null): string {
    if (!value) return '—';
    return map[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

export const bodyPartLabel = (v: string | null) => labelFrom(BODY_PART_ES, v);
export const equipmentLabel = (v: string | null) => labelFrom(EQUIPMENT_ES, v);
export const targetLabel = (v: string | null) => labelFrom(TARGET_ES, v);
