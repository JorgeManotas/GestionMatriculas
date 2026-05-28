DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS payment_reports CASCADE;
DROP TABLE IF EXISTS monthly_fees CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS payment_report_status CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TYPE payment_report_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    document_number VARCHAR(40) UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role_attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(180) NOT NULL
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    grade VARCHAR(40) NOT NULL,
    academic_year INTEGER NOT NULL,
    monthly_fee_amount NUMERIC(12, 2) NOT NULL CHECK (monthly_fee_amount >= 0),
    enrollment_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (enrollment_fee_amount >= 0),
    UNIQUE (grade, academic_year)
);

CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, course_id)
);

CREATE TABLE monthly_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (enrollment_id, period)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monthly_fee_id UUID NOT NULL REFERENCES monthly_fees(id) ON DELETE RESTRICT,
    paid_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    method VARCHAR(40) NOT NULL,
    reference VARCHAR(100) UNIQUE,
    notes TEXT
);

CREATE TABLE payment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    installments INTEGER NOT NULL CHECK (installments > 0),
    receipt_url VARCHAR(500) NOT NULL,
    status payment_report_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_role_attributes ON users USING GIN (role_attributes);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_monthly_fees_status ON monthly_fees (status);
CREATE INDEX idx_monthly_fees_due_date ON monthly_fees (due_date);
CREATE INDEX idx_payment_reports_status ON payment_reports (status);

INSERT INTO roles (name, description) VALUES
('ADMIN', 'Administrador del sistema'),
('SECRETARY', 'Secretaria academica y financiera'),
('RECTOR', 'Rector con permisos de aprobacion y seguimiento institucional'),
('TEACHER', 'Profesor del colegio'),
('GUARDIAN', 'Acudiente responsable de pagos'),
('STUDENT', 'Estudiante matriculado');

INSERT INTO users (id, first_name, last_name, email, password_hash, document_number, role_attributes) VALUES
('00000000-0000-0000-0000-000000000001', 'Laura', 'Rincon', 'admin@colegiosol.edu.co', 'User12345*', '100000001', '{"admin":{"area":"Direccion general"}}'),
('00000000-0000-0000-0000-000000000002', 'Marta', 'Caceres', 'secretaria@colegiosol.edu.co', 'User12345*', '100000002', '{"secretary":{"office":"Tesoreria","extension":"101"},"guardian":{"phone":"+57 300 111 2233","relationship":"Madre"}}'),
('00000000-0000-0000-0000-000000000003', 'Andres', 'Salazar', 'andres.salazar@colegiosol.edu.co', 'User12345*', '100000003', '{"docente":{"materias":[{"curso":"Primero A","nombre":"Matematicas"}]},"teacher":{"specialty":"Matematicas","contract_type":"Tiempo completo"}}'),
('00000000-0000-0000-0000-000000000004', 'Paula', 'Mejia', 'paula.mejia@colegiosol.edu.co', 'User12345*', '100000004', '{"docente":{"materias":[{"curso":"Tercero A","nombre":"Lengua castellana"}]},"teacher":{"specialty":"Lengua castellana","contract_type":"Medio tiempo"}}'),
('00000000-0000-0000-0000-000000000005', 'Carlos', 'Torres', 'carlos.torres@colegiosol.edu.co', 'User12345*', '100000005', '{"guardian":{"phone":"+57 310 555 7788","relationship":"Padre","address":"Calle 10 #20-30"}}'),
('00000000-0000-0000-0000-000000000006', 'Diana', 'Moreno', 'diana.moreno@colegiosol.edu.co', 'User12345*', '100000006', '{"guardian":{"phone":"+57 320 456 8899","relationship":"Madre","address":"Carrera 7 #15-90"}}'),
('00000000-0000-0000-0000-000000000007', 'Sofia', 'Torres', 'sofia.torres@colegiosol.edu.co', 'User12345*', '100000007', '{"estudiante":{"documento_identidad":"100000007","acudiente_id":"00000000-0000-0000-0000-000000000005"},"student":{"birth_date":"2016-04-12","medical_notes":"Sin restricciones"}}'),
('00000000-0000-0000-0000-000000000008', 'Mateo', 'Torres', 'mateo.torres@colegiosol.edu.co', 'User12345*', '100000008', '{"estudiante":{"documento_identidad":"100000008","acudiente_id":"00000000-0000-0000-0000-000000000005"},"student":{"birth_date":"2014-09-23","medical_notes":"Alergia leve al polvo"}}'),
('00000000-0000-0000-0000-000000000009', 'Valentina', 'Moreno', 'valentina.moreno@colegiosol.edu.co', 'User12345*', '100000009', '{"estudiante":{"documento_identidad":"100000009","acudiente_id":"00000000-0000-0000-0000-000000000006"},"student":{"birth_date":"2015-02-02","medical_notes":"Sin restricciones"}}'),
('00000000-0000-0000-0000-000000000010', 'Samuel', 'Caceres', 'samuel.caceres@colegiosol.edu.co', 'User12345*', '100000010', '{"estudiante":{"documento_identidad":"100000010","acudiente_id":"00000000-0000-0000-0000-000000000002"},"student":{"birth_date":"2017-11-17","medical_notes":"Usa lentes"}}');

INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM roles WHERE name = 'ADMIN';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM roles WHERE name = 'SECRETARY';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM roles WHERE name = 'GUARDIAN';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM roles WHERE name = 'TEACHER';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM roles WHERE name = 'TEACHER';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM roles WHERE name = 'GUARDIAN';
INSERT INTO user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM roles WHERE name = 'GUARDIAN';
INSERT INTO user_roles (user_id, role_id)
SELECT id, (SELECT id FROM roles WHERE name = 'STUDENT')
FROM users
WHERE email IN ('sofia.torres@colegiosol.edu.co', 'mateo.torres@colegiosol.edu.co', 'valentina.moreno@colegiosol.edu.co', 'samuel.caceres@colegiosol.edu.co');

INSERT INTO courses (id, name, grade, academic_year, monthly_fee_amount, enrollment_fee_amount) VALUES
(1, 'Primero A', '1', 2026, 420000.00, 630000.00),
(2, 'Tercero A', '3', 2026, 450000.00, 675000.00),
(3, 'Cuarto B', '4', 2026, 470000.00, 705000.00);

INSERT INTO enrollments (id, student_id, guardian_id, course_id, enrollment_date, status, notes) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', 1, '2026-01-15', 'ACTIVE', 'Matricula completa'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 3, '2026-01-15', 'ACTIVE', 'Hermano de Sofia Torres'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000006', 2, '2026-01-16', 'ACTIVE', NULL),
('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000002', 1, '2026-01-17', 'ACTIVE', 'Acudiente tambien es secretaria');

INSERT INTO monthly_fees (id, enrollment_id, period, amount, due_date, status) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-02', 420000.00, '2026-02-10', 'PAID'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '2026-03', 420000.00, '2026-03-10', 'PENDING'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '2026-02', 470000.00, '2026-02-10', 'PAID'),
('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '2026-03', 470000.00, '2026-03-10', 'OVERDUE'),
('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', '2026-02', 450000.00, '2026-02-10', 'PENDING'),
('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', '2026-02', 420000.00, '2026-02-10', 'PAID');

INSERT INTO payments (monthly_fee_id, paid_by_user_id, amount, method, reference, notes) VALUES
('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 420000.00, 'TRANSFER', 'TRX-COLEGIO-0001', 'Pago febrero Sofia'),
('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 470000.00, 'CARD', 'TRX-COLEGIO-0002', 'Pago febrero Mateo'),
('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 420000.00, 'CASH', 'TRX-COLEGIO-0003', 'Pago febrero Samuel');
