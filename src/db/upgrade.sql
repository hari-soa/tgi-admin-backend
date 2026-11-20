-- Run once on a database created with the previous version of schema.sql.
-- Every statement is idempotent.

ALTER TABLE students ADD COLUMN IF NOT EXISTS comments TEXT;

CREATE TABLE IF NOT EXISTS grade_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_group class_group_enum NOT NULL,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type exam_type_enum NOT NULL,
    term term_enum NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING_REVIEW', 'VALIDATED')),
    draft_grades JSONB NOT NULL DEFAULT '[]',
    created_by_admin_id UUID NOT NULL REFERENCES administrators(user_id),
    submitted_by_secretary_id UUID REFERENCES secretaries(user_id),
    validated_by_admin_id UUID REFERENCES administrators(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_grade_session
ON grade_sessions (class_group, subject_id, exam_type, term, academic_year);

ALTER TABLE grades
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
ADD COLUMN IF NOT EXISTS approved_by_admin_id UUID REFERENCES administrators(user_id),
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES grade_sessions(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS unique_annual_result_per_student_year
ON annual_results (student_id, academic_year);
