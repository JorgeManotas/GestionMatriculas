DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_report_status') THEN
        CREATE TYPE payment_report_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    installments INTEGER NOT NULL CHECK (installments > 0),
    receipt_url VARCHAR(500) NOT NULL,
    status payment_report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_reports_status ON payment_reports (status);
CREATE INDEX IF NOT EXISTS idx_payment_reports_student ON payment_reports (student_id);

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS enrollment_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0;

UPDATE courses
SET enrollment_fee_amount = monthly_fee_amount * 1.5
WHERE enrollment_fee_amount = 0;

INSERT INTO roles (name, description) VALUES
('RECTOR', 'Rector con permisos de aprobacion y seguimiento institucional')
ON CONFLICT (name) DO NOTHING;

UPDATE users
SET role_attributes = jsonb_set(
    role_attributes,
    '{estudiante}',
    jsonb_build_object(
        'documento_identidad', COALESCE(document_number, ''),
        'acudiente_id', COALESCE(role_attributes->'student'->>'guardian_id', '')
    ),
    true
)
WHERE id IN (
    SELECT user_id
    FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE roles.name = 'STUDENT'
);

UPDATE users
SET role_attributes = jsonb_set(
    role_attributes,
    '{docente}',
    jsonb_build_object(
        'materias',
        jsonb_build_array(jsonb_build_object('curso', 'Primero A', 'nombre', 'Matematicas'))
    ),
    true
)
WHERE id IN (
    SELECT user_id
    FROM user_roles
    JOIN roles ON roles.id = user_roles.role_id
    WHERE roles.name = 'TEACHER'
)
AND NOT (role_attributes ? 'docente');
