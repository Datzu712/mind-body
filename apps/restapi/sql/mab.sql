
-- MODELADO DE IDENTIDAD Y PERFILES
--
-- Identidad/autorización (quién es, qué puede hacer) -> IdP externo (Keycloak).
-- Perfil/datos de dominio (qué representa el usuario dentro de la lógica de negocios) -> esta BD.
-- No se duplican roles del IdP en la BD: el token es la fuente de verdad de
-- accesos y se lee en cada request, nunca se cachea acá (evita BD desfasada
-- ante revocación de roles).
--
-- members / trainers / staff NO son "tipos de usuario" de permisos: son
-- arquetipos de PERFIL DE DOMINIO. Cada uno cuelga 1:1 de users vía
-- user_id UNIQUE NOT NULL. La misma persona puede tener los tres perfiles a la
-- vez (member + trainer + staff); el UNIQUE solo impide DOS perfiles del MISMO
-- tipo para un mismo usuario. Esto refleja al IdP, que también devuelve roles
-- múltiples por token.

CREATE SCHEMA IF NOT EXISTS app;

-- DO $$ BEGIN CREATE TYPE app.user_type AS ENUM ('ADMIN', 'TRAINER', 'MEMBER');
-- EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE app.record_status AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EXPIRED SOLO indica que el miembro no volvera a pagar la membresía
DO $$ BEGIN CREATE TYPE app.membership_status AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE app.routine_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE app.dni_type AS ENUM ('CEDULA_NACIONAL', 'DIMEX', 'PASAPORTE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seguridad
CREATE TABLE IF NOT EXISTS app.users (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    keycloak_subject UUID UNIQUE NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    dni VARCHAR(20) UNIQUE,
    dni_type app.dni_type,
    birth_date DATE,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON app.users
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- Clientes / Miembros
CREATE TABLE IF NOT EXISTS app.members (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID UNIQUE NOT NULL REFERENCES app.users(id),
    emergency_contact_name VARCHAR(120),
    emergency_contact_phone VARCHAR(30),
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON app.members
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.trainers (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID UNIQUE NOT NULL REFERENCES app.users(id),
    specialty VARCHAR(120),
    biography TEXT,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_trainers_updated_at
BEFORE UPDATE ON app.trainers
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.staff (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID UNIQUE NOT NULL REFERENCES app.users(id),
    --position app.staff_position NOT NULL,
    hired_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_staff_updated_at
BEFORE UPDATE ON app.staff
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- CREATE TABLE IF NOT EXISTS app.trainer_member_assignments (
--     id UUID PRIMARY KEY DEFAULT uuidv7(),
--     trainer_id UUID NOT NULL REFERENCES app.trainers(id),
--     member_id UUID NOT NULL REFERENCES app.members(id),
--     assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
--     ended_at DATE,
--     status app.record_status NOT NULL DEFAULT 'ACTIVE',
--     CONSTRAINT chk_assignment_dates CHECK (ended_at IS NULL OR ended_at >= assigned_at),
--     CONSTRAINT uq_trainer_member_assignment UNIQUE (trainer_id, member_id, assigned_at)
-- );

CREATE TABLE IF NOT EXISTS app.membership_plans (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(80) UNIQUE NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_membership_plans_updated_at
BEFORE UPDATE ON app.membership_plans
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.memberships (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    member_id UUID NOT NULL REFERENCES app.members(id),
    plan_id UUID NOT NULL REFERENCES app.membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status app.membership_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_membership_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER trg_memberships_updated_at
BEFORE UPDATE ON app.memberships
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- Entrenamientos
CREATE TABLE IF NOT EXISTS app.exercises (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR(120) UNIQUE NOT NULL,
    description TEXT,
    muscle_group VARCHAR(80),
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_exercises_updated_at
BEFORE UPDATE ON app.exercises
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.routines (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    trainer_id UUID REFERENCES app.trainers(id), -- el entrenador que creó la rutina, puede ser NULL si es una rutina "genérica"
    name VARCHAR(120) NOT NULL,
    objective TEXT,
    status app.routine_status NOT NULL DEFAULT 'DRAFT',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_routines_updated_at
BEFORE UPDATE ON app.routines
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

-- entrenamientos de la rutina
CREATE TABLE IF NOT EXISTS app.routine_exercises (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    routine_id UUID NOT NULL REFERENCES app.routines(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES app.exercises(id),
    display_order INTEGER NOT NULL CHECK (display_order > 0),
    sets INTEGER CHECK (sets > 0),
    reps VARCHAR(40),
    notes TEXT,
    CONSTRAINT uq_routine_exercise_order UNIQUE (routine_id, display_order)
);


CREATE TABLE IF NOT EXISTS app.member_routines (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    member_id UUID NOT NULL REFERENCES app.members(id),
    routine_id UUID NOT NULL REFERENCES app.routines(id),
    assigned_by_trainer_id UUID REFERENCES app.trainers(id),
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    ended_at DATE,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_member_routine_dates CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

CREATE TRIGGER trg_member_routines_updated_at
BEFORE UPDATE ON app.member_routines
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.member_measurements (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    member_id UUID NOT NULL REFERENCES app.members(id),
    measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_kg NUMERIC(5,2),
    height_cm NUMERIC(5,2),
    body_fat_percentage NUMERIC(5,2),
    waist_cm NUMERIC(5,2),
    notes TEXT,
    created_by_user_id UUID REFERENCES app.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_keycloak_subject ON app.users(keycloak_subject);
CREATE INDEX IF NOT EXISTS idx_members_status ON app.members(status);
CREATE INDEX IF NOT EXISTS idx_trainers_status ON app.trainers(status);
CREATE INDEX IF NOT EXISTS idx_memberships_member_status_dates ON app.memberships(member_id, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_routines_trainer_status ON app.routines(trainer_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_routines_trainer_name_active ON app.routines(trainer_id, name) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_routines_member_status ON app.member_routines(member_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_routines_active ON app.member_routines(member_id, routine_id) WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_member_measurements_member_date ON app.member_measurements(member_id, measured_at DESC);

-- ENT (entrenamientos): sesiones, logs, versiones y notificaciones
DO $$ BEGIN CREATE TYPE app.training_session_status AS ENUM ('PENDING', 'CONFIRMED', 'VALIDATED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE app.notification_type AS ENUM ('ROUTINE_ASSIGNED', 'ROUTINE_UPDATED', 'SESSION_VALIDATED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS app.training_sessions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    member_routine_id UUID NOT NULL REFERENCES app.member_routines(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status app.training_session_status NOT NULL DEFAULT 'PENDING',
    confirmed_at TIMESTAMPTZ,
    confirmed_by UUID REFERENCES app.users(id),
    validated_by_trainer_id UUID REFERENCES app.trainers(id),
    validated_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_training_sessions_updated_at
BEFORE UPDATE ON app.training_sessions
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    session_id UUID NOT NULL REFERENCES app.training_sessions(id) ON DELETE CASCADE,
    routine_exercise_id UUID NOT NULL REFERENCES app.routine_exercises(id),
    target_sets INTEGER,
    target_reps VARCHAR(40),
    target_weight_kg NUMERIC(5,2),
    completed_sets INTEGER,
    completed_reps_log TEXT,
    weight_kg_actual NUMERIC(5,2),
    notes TEXT,
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_exercise_logs_session_routine_exercise UNIQUE (session_id, routine_exercise_id)
);

CREATE TRIGGER trg_exercise_logs_updated_at
BEFORE UPDATE ON app.exercise_logs
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE TABLE IF NOT EXISTS app.routine_versions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    routine_id UUID NOT NULL REFERENCES app.routines(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_by UUID REFERENCES app.trainers(id),
    change_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_routine_versions_routine_version UNIQUE (routine_id, version_number)
);

CREATE TABLE IF NOT EXISTS app.notifications (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    user_id UUID NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
    type app.notification_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    payload JSONB,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_member_routine_status ON app.training_sessions(member_routine_id, status);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_session_id ON app.exercise_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_routine_versions_routine_id ON app.routine_versions(routine_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON app.notifications(user_id, read);