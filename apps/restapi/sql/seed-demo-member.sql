-- ═══════════════════════════════════════════════════════════════════════════
-- Seed de demo: DATOS PERSONALES del usuario logueado (perfil member,
-- mediciones, actividad diaria y una reserva de muestra).
--
-- ⚠️ Correr DESPUÉS del primer login en la app móvil: el login crea la fila
-- en app.users (sincronizada desde el token de Keycloak) y este script la
-- busca por email.
--
--   psql -h localhost -U mab -d mab -v email=abenavidescr@gmail.com -f seed-demo-member.sql
--
-- Idempotente: mediciones/actividad solo se insertan si el member no tiene.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Perfil member para el usuario (las tools del coach y mediciones lo requieren).
INSERT INTO app.members (user_id, emergency_contact_name, emergency_contact_phone, notes)
SELECT u.id, 'Contacto Demo', '+50688889999', 'Perfil creado por seed de demo'
FROM app.users u
WHERE u.email = :'email'
ON CONFLICT (user_id) DO NOTHING;

-- Mediciones: progresión realista de ~6 meses (peso ↓7.8 kg, grasa ↓6.4 pts).
WITH m AS (
    SELECT mem.id
    FROM app.members mem
    JOIN app.users u ON u.id = mem.user_id
    WHERE u.email = :'email'
)
INSERT INTO app.member_measurements (member_id, measured_at, weight_kg, height_cm, body_fat_percentage, waist_cm, notes)
SELECT m.id, CURRENT_DATE - d.days_ago, d.weight, 175.00, d.body_fat, d.waist, d.notes
FROM m,
    (VALUES
        (180, 86.40, 27.80, 96.50, 'Medición inicial'),
        (150, 85.20, 26.90, 95.20, NULL),
        (120, 84.00, 26.10, 94.00, NULL),
        ( 90, 82.60, 24.90, 92.50, 'Buen progreso del trimestre'),
        ( 60, 81.40, 23.80, 91.00, NULL),
        ( 30, 80.10, 22.70, 89.80, NULL),
        ( 14, 79.30, 22.00, 89.00, NULL),
        (  3, 78.60, 21.40, 88.20, 'Última medición')
    ) AS d(days_ago, weight, body_fat, waist, notes)
WHERE NOT EXISTS (SELECT 1 FROM app.member_measurements mm WHERE mm.member_id = m.id);

-- Actividad diaria de los últimos 14 días (como si Health Connect ya hubiera
-- sincronizado). El unique (member_id, date) evita chocar con syncs reales.
WITH m AS (
    SELECT mem.id
    FROM app.members mem
    JOIN app.users u ON u.id = mem.user_id
    WHERE u.email = :'email'
)
INSERT INTO app.daily_activity_summaries
    (member_id, date, steps, calories_total, active_minutes, exercise_count, distance_meters, source)
SELECT m.id, CURRENT_DATE - d.days_ago, d.steps, d.calories, d.active_min, d.exercises, d.distance, 'HEALTH_CONNECT'
FROM m,
    (VALUES
        (13,  8200, 2150.50, 45, 1, 6150.00),
        (12, 11500, 2480.00, 70, 1, 8625.00),
        (11,  6300, 1950.25, 25, 0, 4725.00),
        (10,  9800, 2290.75, 55, 1, 7350.00),
        ( 9, 12100, 2530.00, 80, 2, 9075.00),
        ( 8,  5400, 1880.50, 20, 0, 4050.00),
        ( 7, 10250, 2340.00, 60, 1, 7687.50),
        ( 6,  7600, 2080.25, 40, 1, 5700.00),
        ( 5, 13200, 2610.75, 90, 2, 9900.00),
        ( 4,  6900, 2010.00, 30, 0, 5175.00),
        ( 3,  9100, 2245.50, 50, 1, 6825.00),
        ( 2, 11800, 2495.25, 75, 1, 8850.00),
        ( 1,  8700, 2180.00, 48, 1, 6525.00),
        ( 0,  4200, 1760.00, 15, 0, 3150.00)
    ) AS d(days_ago, steps, calories, active_min, exercises, distance)
ON CONFLICT (member_id, date) DO NOTHING;

-- Una reserva CONFIRMED en la próxima sesión con cupo, para que "Mis reservas"
-- no llegue vacío. Si el materializador aún no generó sesiones, no inserta
-- nada (reintentá luego, o reservá desde la app que para eso es la demo).
WITH me AS (
    SELECT mem.id AS member_id, u.id AS user_id
    FROM app.members mem
    JOIN app.users u ON u.id = mem.user_id
    WHERE u.email = :'email'
),
next_session AS (
    SELECT cs.id
    FROM app.class_sessions cs
    WHERE cs.status = 'SCHEDULED'
      AND cs.starts_at > now()
      AND (SELECT count(*) FROM app.reservations r
           WHERE r.session_id = cs.id AND r.status IN ('CONFIRMED', 'ATTENDED', 'NO_SHOW')) < cs.capacity
    ORDER BY cs.starts_at
    LIMIT 1
)
INSERT INTO app.reservations (session_id, member_id, status, status_reason, confirmed_at, created_by_user_id)
SELECT ns.id, me.member_id, 'CONFIRMED', 'MEMBER_BOOKED', now(), me.user_id
FROM me, next_session ns
WHERE NOT EXISTS (
    SELECT 1 FROM app.reservations r
    WHERE r.member_id = me.member_id AND r.status <> 'CANCELLED'
);

COMMIT;
