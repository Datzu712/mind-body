-- ═══════════════════════════════════════════════════════════════════════════
-- Seed de demo: CATÁLOGO (entrenadores, series de clases, planes).
-- Idempotente: los ids son fijos y todo usa ON CONFLICT DO NOTHING.
--
--   psql -h localhost -U mab -d mab -f seed-demo-catalog.sql
--
-- Las SESIONES no se insertan acá: el SessionMaterializerService del restapi
-- las genera cada hora (cron min 7) a partir de las series ACTIVE. Tras correr
-- este seed, esperá la corrida del cron (o reiniciá el restapi) para verlas.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Identidad "sistema" dueña del catálogo (created_by de las series).
INSERT INTO app.users (id, keycloak_subject, full_name, email) VALUES
    ('aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-0000000000f1', 'Sistema Demo', 'seed@mindandbody.demo')
ON CONFLICT (keycloak_subject) DO NOTHING;

-- Entrenadores: users + perfil trainer.
INSERT INTO app.users (id, keycloak_subject, full_name, email, phone) VALUES
    ('aaaa0000-0000-4000-8000-000000000011', 'aaaa0000-0000-4000-8000-000000000f11', 'Carolina Vargas', 'carolina.vargas@mindandbody.demo', '+50688880001'),
    ('aaaa0000-0000-4000-8000-000000000012', 'aaaa0000-0000-4000-8000-000000000f12', 'Andrés Solano', 'andres.solano@mindandbody.demo', '+50688880002'),
    ('aaaa0000-0000-4000-8000-000000000013', 'aaaa0000-0000-4000-8000-000000000f13', 'Marco Jiménez', 'marco.jimenez@mindandbody.demo', '+50688880003')
ON CONFLICT (keycloak_subject) DO NOTHING;

INSERT INTO app.trainers (id, user_id, specialty, biography) VALUES
    ('bbbb0000-0000-4000-8000-000000000011', 'aaaa0000-0000-4000-8000-000000000011', 'Ciclismo indoor y HIIT', 'Instructora certificada de spinning con 8 años de experiencia en entrenamiento cardiovascular de alta intensidad.'),
    ('bbbb0000-0000-4000-8000-000000000012', 'aaaa0000-0000-4000-8000-000000000012', 'Yoga y pilates', 'Profesor de yoga (RYT-200) enfocado en movilidad, respiración y fuerza de core.'),
    ('bbbb0000-0000-4000-8000-000000000013', 'aaaa0000-0000-4000-8000-000000000013', 'Entrenamiento funcional y boxeo', 'Preparador físico especializado en fuerza funcional y acondicionamiento para deportes de combate.')
ON CONFLICT (user_id) DO NOTHING;

-- Series de clases (la plantilla semanal reservable vía sesiones).
INSERT INTO app.class_series
    (id, trainer_id, name, description, local_start_time, duration_minutes, capacity, starts_on, category, level, room, zone, created_by_user_id, updated_by_user_id)
VALUES
    ('cccc0000-0000-4000-8000-000000000001', 'bbbb0000-0000-4000-8000-000000000011',
     'Spinning Power', 'Ciclismo indoor de alta intensidad con intervalos y música. Trae toalla e hidratación.',
     '06:00', 50, 14, CURRENT_DATE, 'Cardio', 'HIGH', 'Sala Spinning', 'Zona A',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001'),
    ('cccc0000-0000-4000-8000-000000000002', 'bbbb0000-0000-4000-8000-000000000012',
     'Yoga Flow', 'Vinyasa suave para empezar el día: movilidad, equilibrio y respiración. Apto para principiantes.',
     '07:00', 60, 16, CURRENT_DATE, 'Yoga', 'LOW', 'Sala 2', 'Zona B',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001'),
    ('cccc0000-0000-4000-8000-000000000003', 'bbbb0000-0000-4000-8000-000000000011',
     'HIIT Total', 'Circuito de intervalos de cuerpo completo: quema calórica máxima en 45 minutos.',
     '18:00', 45, 12, CURRENT_DATE, 'Cardio', 'HIGH', 'Área Funcional', 'Zona A',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001'),
    ('cccc0000-0000-4000-8000-000000000004', 'bbbb0000-0000-4000-8000-000000000013',
     'Funcional Cross', 'Fuerza funcional con kettlebells, cajones y barras. Escalable a todo nivel.',
     '19:00', 60, 10, CURRENT_DATE, 'Fuerza', 'MEDIUM', 'Área Funcional', 'Zona A',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001'),
    ('cccc0000-0000-4000-8000-000000000005', 'bbbb0000-0000-4000-8000-000000000012',
     'Pilates Core', 'Trabajo de core, postura y control corporal en colchoneta.',
     '09:00', 55, 12, CURRENT_DATE, 'Pilates', 'MEDIUM', 'Sala 2', 'Zona B',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001'),
    ('cccc0000-0000-4000-8000-000000000006', 'bbbb0000-0000-4000-8000-000000000013',
     'Box Fit', 'Boxeo sin contacto: técnica de golpeo, saco y acondicionamiento. Guantes disponibles en recepción.',
     '18:00', 50, 14, CURRENT_DATE, 'Combate', 'MEDIUM', 'Sala de Boxeo', 'Zona C',
     'aaaa0000-0000-4000-8000-000000000001', 'aaaa0000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Días ISO de cada serie (lunes=1 … domingo=7). Sin solapes por entrenador:
--   Carolina: L/M/V 06:00 + K/J 18:00 · Andrés: K/J 07:00 + S 09:00
--   Marco:    L/M 19:00 + V 18:00
INSERT INTO app.class_series_weekdays (class_series_id, iso_weekday) VALUES
    ('cccc0000-0000-4000-8000-000000000001', 1),
    ('cccc0000-0000-4000-8000-000000000001', 3),
    ('cccc0000-0000-4000-8000-000000000001', 5),
    ('cccc0000-0000-4000-8000-000000000002', 2),
    ('cccc0000-0000-4000-8000-000000000002', 4),
    ('cccc0000-0000-4000-8000-000000000003', 2),
    ('cccc0000-0000-4000-8000-000000000003', 4),
    ('cccc0000-0000-4000-8000-000000000004', 1),
    ('cccc0000-0000-4000-8000-000000000004', 3),
    ('cccc0000-0000-4000-8000-000000000005', 6),
    ('cccc0000-0000-4000-8000-000000000006', 5)
ON CONFLICT DO NOTHING;

-- Planes de membresía (visibles desde el dashboard).
INSERT INTO app.membership_plans (name, duration_days, price, description) VALUES
    ('Mensual', 30, 25000.00, 'Acceso completo al gimnasio y clases grupales por un mes.'),
    ('Trimestral', 90, 65000.00, 'Tres meses de acceso completo con descuento sobre el plan mensual.'),
    ('Anual', 365, 220000.00, 'Un año de acceso completo: el mejor precio por mes.')
ON CONFLICT (name) DO NOTHING;

COMMIT;
