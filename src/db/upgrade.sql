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

CREATE TABLE IF NOT EXISTS grade_session_absences (
    session_id UUID NOT NULL REFERENCES grade_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    motif TEXT,
    history_record_id UUID REFERENCES student_history_records(id) ON DELETE SET NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (session_id, student_id)
);

ALTER TABLE annual_result_subject_breakdowns
ALTER COLUMN term1_semi_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN term1_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN term2_semi_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN term2_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN term3_semi_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN term3_trimester_grade TYPE NUMERIC(6, 2),
ALTER COLUMN subject_overall_average TYPE NUMERIC(6, 2),
ALTER COLUMN subject_overall_average DROP NOT NULL;

ALTER TABLE teacher_attendance_slots ALTER COLUMN classroom DROP NOT NULL;

ALTER TABLE students
ALTER COLUMN date_of_birth DROP NOT NULL,
ALTER COLUMN address DROP NOT NULL,
ALTER COLUMN parents_email DROP NOT NULL,
ALTER COLUMN parents_contact_number DROP NOT NULL;
