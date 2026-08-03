// apps/restapi/scripts/generate-exercises-seed.mjs
//
// Generador ONE-SHOT del seed de ejercicios. Se corre una vez a mano:
//     node scripts/generate-exercises-seed.mjs
// Descarga exercises.json del commit PINEADO (inmutable) y emite
// sql/seed-exercises.sql (idempotente, se aplica con psql -f).
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SHA = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd';
const BASE = `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/${SHA}`;

const res = await fetch(`${BASE}/data/exercises.json`);
if (!res.ok) throw new Error(`HTTP ${res.status} bajando exercises.json`);
const exercises = await res.json();
if (!Array.isArray(exercises) || exercises.length < 1000) {
    throw new Error(`JSON inesperado: ${Array.isArray(exercises) ? exercises.length : typeof exercises}`);
}

const q = (s) => (s == null || s === '' ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a) => (!a || a.length === 0 ? 'NULL' : `ARRAY[${a.map((x) => q(x)).join(', ')}]::text[]`);

// app.exercises tiene UNIQUE(name) y el dataset trae 6 nombres duplicados:
// se desambiguan con el equipo ("lever chest press (leverage machine)").
const seen = new Set();
function uniqueName(e) {
    let name = e.name;
    if (seen.has(name)) name = `${e.name} (${e.equipment})`;
    for (let i = 2; seen.has(name); i++) name = `${e.name} (${e.equipment} ${i})`;
    seen.add(name);
    return name;
}

const rows = exercises.map((e) => {
    const cols = [
        q(e.id),
        q(uniqueName(e)),
        q(e.instructions?.es ?? null),
        q(e.muscle_group),
        q(e.body_part),
        q(e.equipment),
        q(e.target),
        arr(e.secondary_muscles),
        arr(e.instruction_steps?.es),
        arr(e.instruction_steps?.en),
        q(`${BASE}/${e.image}`),
        q(`${BASE}/${e.gif_url}`),
    ];
    return `    (${cols.join(', ')})`;
});

const CHUNK = 100;
const inserts = [];
for (let i = 0; i < rows.length; i += CHUNK) {
    inserts.push(
        'INSERT INTO app.exercises (source_id, name, description, muscle_group, body_part, equipment, target, secondary_muscles, instructions_es, instructions_en, image_url, gif_url) VALUES\n' +
            rows.slice(i, i + CHUNK).join(',\n') +
            '\nON CONFLICT (source_id) DO NOTHING;',
    );
}

const sql = `-- ═══════════════════════════════════════════════════════════════════════════
-- Seed del catálogo de EJERCICIOS (dataset hasaneyldrm/exercises-dataset).
-- Generado por scripts/generate-exercises-seed.mjs — NO editar a mano.
-- Idempotente: columnas con IF NOT EXISTS, inserts con ON CONFLICT DO NOTHING.
--
--     psql -h localhost -U mab -d mab -f seed-exercises.sql
--
-- Media (imagen/GIF © Gym visual — https://gymvisual.com/) servido desde
-- GitHub raw pineado al commit ${SHA} (inmutable).
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS source_id VARCHAR(20);
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS body_part VARCHAR(80);
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS equipment VARCHAR(80);
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS target VARCHAR(80);
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[];
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS instructions_es TEXT[];
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS instructions_en TEXT[];
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE app.exercises ADD COLUMN IF NOT EXISTS gif_url TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_source_id ON app.exercises (source_id);

${inserts.join('\n\n')}

COMMIT;
`;

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'sql', 'seed-exercises.sql');
writeFileSync(out, sql);
console.log(`OK: ${exercises.length} ejercicios → ${out}`);
