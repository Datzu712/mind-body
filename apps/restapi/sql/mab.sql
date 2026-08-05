
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

-- Membership lifecycle. Payments happen at the front desk, so a membership is
-- just a dated flag: EXPIRED means "lapsed but still worth a renewal reminder",
-- CANCELLED means "the member left — stop reminding".
DO $$ BEGIN CREATE TYPE app.membership_status AS ENUM ('ACTIVE', 'SUSPENDED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Live databases created before CANCELLED existed: the CREATE TYPE above is a
-- no-op there, so the value has to be appended (same convention as the
-- ADD COLUMN IF NOT EXISTS statements used elsewhere in this repo).
ALTER TYPE app.membership_status ADD VALUE IF NOT EXISTS 'CANCELLED';

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
    source_id VARCHAR(20),
    body_part VARCHAR(80),
    equipment VARCHAR(80),
    target VARCHAR(80),
    secondary_muscles TEXT[],
    instructions_es TEXT[],
    instructions_en TEXT[],
    image_url TEXT,
    gif_url TEXT,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_exercises_updated_at
BEFORE UPDATE ON app.exercises
FOR EACH ROW EXECUTE FUNCTION app.set_updated_at();

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercises_source_id ON app.exercises (source_id);

CREATE TABLE IF NOT EXISTS app.routines (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    created_by_user_id UUID REFERENCES app.users(id), -- dueño: quien creó la rutina (trainer o staff); NULL solo en datos legacy/seed
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
    assigned_by_user_id UUID REFERENCES app.users(id),
    assigned_at DATE NOT NULL DEFAULT CURRENT_DATE,
    ended_at DATE,
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    -- Espejo de drizzle/0007: un plan es un split semanal, así que el miembro
    -- tiene varias asignaciones ACTIVE a la vez. `focused` es la que el home del
    -- móvil muestra — preferencia de vista, no estado del plan.
    focused BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_member_routine_dates CHECK (ended_at IS NULL OR ended_at >= assigned_at)
);

-- Bases creadas antes de 0007: el CREATE TABLE de arriba es no-op para ellas.
ALTER TABLE app.member_routines ADD COLUMN IF NOT EXISTS focused BOOLEAN NOT NULL DEFAULT false;

-- "Como máximo una enfocada por miembro" como garantía de la base, no convención
-- del servicio. Solo cuenta filas vivas, así el miembro puede re-enfocar libremente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_member_routines_focused
    ON app.member_routines (member_id)
    WHERE focused AND status = 'ACTIVE' AND deleted_at IS NULL;

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
CREATE INDEX IF NOT EXISTS idx_routines_created_by_status ON app.routines(created_by_user_id, status);
CREATE INDEX IF NOT EXISTS idx_member_routines_member_status ON app.member_routines(member_id, status);
CREATE INDEX IF NOT EXISTS idx_member_measurements_member_date ON app.member_measurements(member_id, measured_at DESC);
-- ═══════════════════════════════════════════════════════════════════════════
-- Clases, sesiones y reservas (2026-07-15)
--
-- ⚠️ Este archivo es documentación espejo. La FUENTE DE EJECUCIÓN son las
-- migraciones Drizzle (apps/restapi/drizzle/*); esta sección refleja
-- 0002_bright_northstar.sql. Nota: 0001_slow_havok.sql movió birth_date de
-- members a users y eliminó member_measurements.created_by_user_id (las
-- secciones antiguas de arriba no se reescribieron).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE app.class_session_status AS ENUM ('SCHEDULED', 'CANCELLED');
CREATE TYPE app.class_session_cancel_reason AS ENUM ('MANUAL', 'SERIES_INACTIVE', 'SERIES_ARCHIVED', 'SCHEDULE_REMOVED');
CREATE TYPE app.reservation_status AS ENUM ('CONFIRMED', 'WAITLISTED', 'ATTENDED', 'NO_SHOW', 'CANCELLED');
CREATE TYPE app.reservation_reason AS ENUM ('MEMBER_BOOKED', 'MEMBER_JOINED_WAITLIST', 'WAITLIST_PROMOTED', 'MEMBER_CANCELLED', 'ADMIN_CANCELLED', 'LATE_CANCELLATION', 'SESSION_CANCELLED', 'SERIES_CHANGED', 'WAITLIST_REMOVED', 'WAITLIST_EXPIRED', 'RESCHEDULED', 'ATTENDANCE');
CREATE TYPE app.class_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- Serie semanal (plantilla/recurrencia). No es reservable por sí misma.
CREATE TABLE IF NOT EXISTS app.class_series (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    trainer_id UUID NOT NULL REFERENCES app.trainers(id),
    name VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    local_start_time TIME NOT NULL,           -- hora local (BUSINESS_TIME_ZONE)
    duration_minutes SMALLINT NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500),
    allow_waitlist BOOLEAN NOT NULL DEFAULT false,
    starts_on DATE NOT NULL,                  -- fecha local desde la que se materializa
    category VARCHAR(80),
    level app.class_level,
    room VARCHAR(120),
    zone VARCHAR(120),
    status app.record_status NOT NULL DEFAULT 'ACTIVE',
    created_by_user_id UUID NOT NULL REFERENCES app.users(id),
    updated_by_user_id UUID NOT NULL REFERENCES app.users(id),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),  -- If-Match optimista
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_class_series_archived_deleted_at CHECK ((status = 'ARCHIVED') = (deleted_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_class_series_status ON app.class_series(status);
CREATE INDEX IF NOT EXISTS idx_class_series_trainer_status ON app.class_series(trainer_id, status);

-- Días ISO (lunes=1 … domingo=7) de la recurrencia; la PK impide duplicados.
CREATE TABLE IF NOT EXISTS app.class_series_weekdays (
    class_series_id UUID NOT NULL REFERENCES app.class_series(id) ON DELETE RESTRICT,
    iso_weekday SMALLINT NOT NULL CHECK (iso_weekday BETWEEN 1 AND 7),
    PRIMARY KEY (class_series_id, iso_weekday)
);

-- Ocurrencia materializada: fila propia, movible/cancelable individualmente.
CREATE TABLE IF NOT EXISTS app.class_sessions (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    class_series_id UUID NOT NULL REFERENCES app.class_series(id),
    origin_date DATE NOT NULL,                -- clave local de la ocurrencia, inmutable
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    class_name VARCHAR(120) NOT NULL,         -- snapshots de la serie
    description TEXT NOT NULL,
    trainer_id UUID NOT NULL REFERENCES app.trainers(id),
    capacity INTEGER NOT NULL CHECK (capacity BETWEEN 1 AND 500),
    allow_waitlist BOOLEAN NOT NULL,
    category VARCHAR(80),
    level app.class_level,
    room VARCHAR(120),
    zone VARCHAR(120),
    status app.class_session_status NOT NULL DEFAULT 'SCHEDULED',
    schedule_overridden BOOLEAN NOT NULL DEFAULT false,  -- movida a mano: la serie no la pisa
    source_series_version INTEGER NOT NULL,
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    cancel_reason app.class_session_cancel_reason,
    cancelled_at TIMESTAMPTZ,
    cancelled_by_user_id UUID REFERENCES app.users(id), -- NULL = sistema
    updated_by_user_id UUID REFERENCES app.users(id),   -- NULL = materialización
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT class_sessions_series_origin_key UNIQUE (class_series_id, origin_date),
    CONSTRAINT class_sessions_time_range_check CHECK (ends_at > starts_at),
    CONSTRAINT chk_class_sessions_cancel_coherence CHECK (
        (status = 'SCHEDULED' AND cancel_reason IS NULL AND cancelled_at IS NULL)
        OR (status = 'CANCELLED' AND cancel_reason IS NOT NULL AND cancelled_at IS NOT NULL)
    ),
    -- Un entrenador no imparte dos sesiones programadas solapadas (SQLSTATE 23P01 → 409)
    CONSTRAINT excl_class_sessions_trainer_overlap
        EXCLUDE USING gist (trainer_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
        WHERE (status = 'SCHEDULED')
);
CREATE INDEX IF NOT EXISTS idx_class_sessions_starts_status ON app.class_sessions(starts_at, status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_series_starts ON app.class_sessions(class_series_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_class_sessions_trainer_starts ON app.class_sessions(trainer_id, starts_at);

-- Reserva/espera. La ocupación SIEMPRE se deriva de acá (no hay contadores).
-- booked = CONFIRMED|ATTENDED|NO_SHOW; waitlist = WAITLISTED (posición FIFO derivada).
CREATE TABLE IF NOT EXISTS app.reservations (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    session_id UUID NOT NULL REFERENCES app.class_sessions(id),
    member_id UUID NOT NULL REFERENCES app.members(id),
    status app.reservation_status NOT NULL,
    status_reason app.reservation_reason NOT NULL,
    waitlisted_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    attendance_marked_at TIMESTAMPTZ,
    rescheduled_from_reservation_id UUID REFERENCES app.reservations(id), -- solo en la reserva destino
    created_by_user_id UUID NOT NULL REFERENCES app.users(id),
    updated_by_user_id UUID REFERENCES app.users(id),   -- NULL = transición del sistema
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_reservations_not_self_reschedule CHECK (rescheduled_from_reservation_id IS NULL OR rescheduled_from_reservation_id <> id),
    CONSTRAINT chk_reservations_status_timestamps CHECK (
        (status = 'WAITLISTED' AND waitlisted_at IS NOT NULL AND cancelled_at IS NULL)
        OR (status = 'CONFIRMED' AND confirmed_at IS NOT NULL AND cancelled_at IS NULL)
        OR (status = 'ATTENDED' AND confirmed_at IS NOT NULL AND attendance_marked_at IS NOT NULL)
        OR (status = 'NO_SHOW' AND confirmed_at IS NOT NULL AND (attendance_marked_at IS NOT NULL OR status_reason = 'LATE_CANCELLATION'))
        OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL)
    ),
    CONSTRAINT chk_reservations_status_reason CHECK (
        (status = 'CONFIRMED' AND status_reason IN ('MEMBER_BOOKED', 'WAITLIST_PROMOTED', 'RESCHEDULED'))
        OR (status = 'WAITLISTED' AND status_reason = 'MEMBER_JOINED_WAITLIST')
        OR (status = 'ATTENDED' AND status_reason = 'ATTENDANCE')
        OR (status = 'NO_SHOW' AND status_reason IN ('LATE_CANCELLATION', 'ATTENDANCE'))
        OR (status = 'CANCELLED' AND status_reason IN ('MEMBER_CANCELLED', 'ADMIN_CANCELLED', 'SESSION_CANCELLED', 'SERIES_CHANGED', 'WAITLIST_REMOVED', 'WAITLIST_EXPIRED', 'RESCHEDULED'))
    )
);
CREATE INDEX IF NOT EXISTS idx_reservations_session_status_fifo ON app.reservations(session_id, status, waitlisted_at, id);
CREATE INDEX IF NOT EXISTS idx_reservations_member_created ON app.reservations(member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reservations_member_status_session ON app.reservations(member_id, status, session_id);
-- nunca dos reservas vigentes del mismo miembro en la misma sesión
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_active_member_session ON app.reservations(session_id, member_id) WHERE status <> 'CANCELLED';
-- una reserva origen produce a lo sumo un destino
CREATE UNIQUE INDEX IF NOT EXISTS uq_reservations_reschedule_source ON app.reservations(rescheduled_from_reservation_id) WHERE rescheduled_from_reservation_id IS NOT NULL;

-- Auditoría append-only de reservas (un evento por transición, misma transacción).
CREATE TABLE IF NOT EXISTS app.reservation_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    reservation_id UUID NOT NULL REFERENCES app.reservations(id),
    actor_user_id UUID REFERENCES app.users(id),        -- NULL = sistema
    from_status app.reservation_status,                 -- NULL en el evento de creación
    to_status app.reservation_status NOT NULL,
    reason app.reservation_reason NOT NULL,
    from_session_id UUID REFERENCES app.class_sessions(id),
    to_session_id UUID REFERENCES app.class_sessions(id),
    metadata JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reservation_events_reservation_occurred ON app.reservation_events(reservation_id, occurred_at);

-- Auditoría append-only de series/sesiones.
CREATE TABLE IF NOT EXISTS app.class_schedule_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    class_series_id UUID REFERENCES app.class_series(id),
    class_session_id UUID REFERENCES app.class_sessions(id),
    event_type VARCHAR(80) NOT NULL, -- CREATED|UPDATED|STATUS_CHANGED|ARCHIVED|MATERIALIZED|MOVED|CANCELLED|RECONCILED
    actor_user_id UUID REFERENCES app.users(id),        -- NULL = sistema
    before_state JSONB,
    after_state JSONB,
    reason TEXT,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_class_schedule_events_target CHECK (num_nonnulls(class_series_id, class_session_id) = 1)
);
CREATE INDEX IF NOT EXISTS idx_class_schedule_events_series_occurred ON app.class_schedule_events(class_series_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_class_schedule_events_session_occurred ON app.class_schedule_events(class_session_id, occurred_at);
