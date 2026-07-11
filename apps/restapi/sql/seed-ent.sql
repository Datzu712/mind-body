-- Seed ENT: 2 rutinas, 8 ejercicios, 1 asignación al member admin@mab.com
DO $$
DECLARE
    v_trainer_id uuid;
    v_member_id uuid;
    v_routine1_id uuid;
    v_routine2_id uuid;
BEGIN
    -- Primer trainer activo disponible
    SELECT t.id INTO v_trainer_id
    FROM app.trainers t
    JOIN app.users u ON t.user_id = u.id
    WHERE t.status = 'ACTIVE'
    LIMIT 1;

    -- Member admin@mab.com
    SELECT m.id INTO v_member_id
    FROM app.members m
    JOIN app.users u ON m.user_id = u.id
    WHERE u.email = 'admin@mab.com'
      AND m.status = 'ACTIVE'
    LIMIT 1;

    IF v_trainer_id IS NULL OR v_member_id IS NULL THEN
        RAISE NOTICE 'ENT seed skipped: trainer or admin member not found';
        RETURN;
    END IF;

    -- Catálogo de ejercicios
    INSERT INTO app.exercises (name, description, muscle_group) VALUES
        ('Press de banca', 'Press de banca con barra olímpica', 'Pecho'),
        ('Press inclinado con mancuernas', 'Press en banco inclinado', 'Pecho'),
        ('Cruces en polea baja', 'Aperturas en polea baja', 'Pecho'),
        ('Extensión de tríceps en polea', 'Extensión con cuerda o barra', 'Tríceps'),
        ('Fondos en paralelas', 'Fondos para tríceps/pecho', 'Tríceps'),
        ('Sentadilla con barra', 'Sentadilla trasera', 'Piernas'),
        ('Burpees', 'Burpees con salto', 'Full body'),
        ('Plancha abdominal', 'Plancha isométrica', 'Core')
    ON CONFLICT (name) DO NOTHING;

    -- Rutina 1: PECHO & TRÍCEPS
    IF NOT EXISTS (
        SELECT 1 FROM app.routines
        WHERE trainer_id = v_trainer_id AND name = 'PECHO & TRÍCEPS' AND deleted_at IS NULL
    ) THEN
        INSERT INTO app.routines (trainer_id, name, objective, status)
        VALUES (v_trainer_id, 'PECHO & TRÍCEPS', 'Rutina de hipertrofia para pecho y tríceps', 'ACTIVE')
        RETURNING id INTO v_routine1_id;
    ELSE
        SELECT id INTO v_routine1_id
        FROM app.routines
        WHERE trainer_id = v_trainer_id AND name = 'PECHO & TRÍCEPS' AND deleted_at IS NULL;
    END IF;

    DELETE FROM app.routine_exercises re
    WHERE re.routine_id = v_routine1_id
      AND NOT EXISTS (SELECT 1 FROM app.exercise_logs el WHERE el.routine_exercise_id = re.id);

    INSERT INTO app.routine_exercises (routine_id, exercise_id, display_order, sets, reps, notes)
    SELECT v_routine1_id, e.id, 1, 4, '8-10', 'Controlar descenso'
    FROM app.exercises e WHERE e.name = 'Press de banca'
    UNION ALL
    SELECT v_routine1_id, e.id, 2, 3, '10-12', 'Arco completo'
    FROM app.exercises e WHERE e.name = 'Press inclinado con mancuernas'
    UNION ALL
    SELECT v_routine1_id, e.id, 3, 3, '12-15', 'Apretar al final'
    FROM app.exercises e WHERE e.name = 'Cruces en polea baja'
    UNION ALL
    SELECT v_routine1_id, e.id, 4, 4, '10-12', 'Codos quietos'
    FROM app.exercises e WHERE e.name = 'Extensión de tríceps en polea'
    UNION ALL
    SELECT v_routine1_id, e.id, 5, 3, '8-10', 'Profundidad controlada'
    FROM app.exercises e WHERE e.name = 'Fondos en paralelas';

    -- Rutina 2: FULL BODY HIIT
    IF NOT EXISTS (
        SELECT 1 FROM app.routines
        WHERE trainer_id = v_trainer_id AND name = 'FULL BODY HIIT' AND deleted_at IS NULL
    ) THEN
        INSERT INTO app.routines (trainer_id, name, objective, status)
        VALUES (v_trainer_id, 'FULL BODY HIIT', 'Rutina metabólica de cuerpo completo', 'ACTIVE')
        RETURNING id INTO v_routine2_id;
    ELSE
        SELECT id INTO v_routine2_id
        FROM app.routines
        WHERE trainer_id = v_trainer_id AND name = 'FULL BODY HIIT' AND deleted_at IS NULL;
    END IF;

    DELETE FROM app.routine_exercises re
    WHERE re.routine_id = v_routine2_id
      AND NOT EXISTS (SELECT 1 FROM app.exercise_logs el WHERE el.routine_exercise_id = re.id);

    INSERT INTO app.routine_exercises (routine_id, exercise_id, display_order, sets, reps, notes)
    SELECT v_routine2_id, e.id, 1, 4, '12', 'Ritmo rápido'
    FROM app.exercises e WHERE e.name = 'Sentadilla con barra'
    UNION ALL
    SELECT v_routine2_id, e.id, 2, 3, 'AMRAP 30s', 'Máxima intensidad'
    FROM app.exercises e WHERE e.name = 'Burpees'
    UNION ALL
    SELECT v_routine2_id, e.id, 3, 3, '45s', 'Core activado'
    FROM app.exercises e WHERE e.name = 'Plancha abdominal';

    -- Asignación al member admin@mab.com
    IF NOT EXISTS (
        SELECT 1 FROM app.member_routines
        WHERE member_id = v_member_id AND routine_id = v_routine1_id AND status = 'ACTIVE'
    ) THEN
        INSERT INTO app.member_routines (member_id, routine_id, assigned_by_trainer_id, status)
        VALUES (v_member_id, v_routine1_id, v_trainer_id, 'ACTIVE');
    END IF;

    -- Versión inicial de la rutina asignada
    INSERT INTO app.routine_versions (routine_id, version_number, snapshot, changed_by)
    SELECT v_routine1_id, 1, jsonb_build_object(
        'id', v_routine1_id,
        'name', 'PECHO & TRÍCEPS',
        'objective', 'Rutina de hipertrofia para pecho y tríceps',
        'exercises', (
            SELECT jsonb_agg(jsonb_build_object(
                'exercise_id', re.exercise_id,
                'display_order', re.display_order,
                'sets', re.sets,
                'reps', re.reps,
                'notes', re.notes
            ) ORDER BY re.display_order)
            FROM app.routine_exercises re WHERE re.routine_id = v_routine1_id
        )
    ), v_trainer_id
    ON CONFLICT DO NOTHING;

    INSERT INTO app.routine_versions (routine_id, version_number, snapshot, changed_by)
    SELECT v_routine2_id, 1, jsonb_build_object(
        'id', v_routine2_id,
        'name', 'FULL BODY HIIT',
        'objective', 'Rutina metabólica de cuerpo completo',
        'exercises', (
            SELECT jsonb_agg(jsonb_build_object(
                'exercise_id', re.exercise_id,
                'display_order', re.display_order,
                'sets', re.sets,
                'reps', re.reps,
                'notes', re.notes
            ) ORDER BY re.display_order)
            FROM app.routine_exercises re WHERE re.routine_id = v_routine2_id
        )
    ), v_trainer_id
    ON CONFLICT DO NOTHING;
END $$;
