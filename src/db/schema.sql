CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TEACHER', 'SECRETARY', 'STUDENT');
CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE');
CREATE TYPE class_group_enum AS ENUM ('SECONDE', 'PREMIERE', 'TERMINALE', 'ANCIEN');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'LATE', 'ABSENT');

CREATE TYPE remark_category_enum AS ENUM ('BEHAVIOR', 'ACADEMIC', 'WARNING', 'ENCOURAGEMENT', 'OTHER');
CREATE TYPE student_history_type_enum AS ENUM ('ABSENCE', 'LATENESS', 'SUSPENSION', 'INFIRMARY', 'EARLY_LEAVE_PERMIT');

CREATE TYPE exam_type_enum AS ENUM ('SEMI_TRIMESTER', 'TRIMESTER');
CREATE TYPE term_enum AS ENUM ('FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER');

CREATE TYPE result_status_enum AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');
CREATE TYPE academic_decision_enum AS ENUM ('PROMOTE', 'REPEAT', 'ORIENTED', 'PENDING');

CREATE TYPE target_scope_enum AS ENUM ('ALL', 'CLASS');
CREATE TYPE announcement_priority_enum AS ENUM ('NORMAL', 'URGENT');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    matricule VARCHAR(50) UNIQUE NOT NULL,
    profile_picture_url TEXT,
    user_type user_role_enum NOT NULL,
    gender gender_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE administrators (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN'
);

CREATE TABLE teachers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    homeroom_class class_group_enum
);

CREATE TABLE secretaries (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE students (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    class_roll_number INT NOT NULL,
    class_group class_group_enum NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender_enum NOT NULL,
    address TEXT NOT NULL,
    parents_email VARCHAR(255) NOT NULL,
    parents_contact_number VARCHAR(30) NOT NULL,
    entry_year INT NOT NULL,
    graduation_year INT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    coefficient NUMERIC(3, 1) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX unique_active_subject_per_class 
ON subject_target_classes (subject_id, target_class); 

CREATE TABLE subject_target_classes (
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    target_class class_group_enum NOT NULL,
    PRIMARY KEY (subject_id, target_class)
);

CREATE TABLE teacher_subjects (
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group class_group_enum NOT NULL,
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, class_group)
);

CREATE TABLE student_history_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    type student_history_type_enum NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    created_by_admin_id UUID NOT NULL REFERENCES administrators(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE student_remarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_role VARCHAR(50) NOT NULL,
    category remark_category_enum NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_attendance_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    target_class class_group_enum NOT NULL,
    day_of_week VARCHAR(15) NOT NULL, -- 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE teacher_attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES teacher_attendance_slots(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status attendance_status_enum NOT NULL DEFAULT 'PRESENT',
    actual_check_in_time TIMESTAMP WITH TIME ZONE,
    late_duration_minutes INT DEFAULT 0,
    motif TEXT, -- Saisissable et modifiable UNIQUEMENT par un ADMIN
    recorded_by UUID NOT NULL REFERENCES users(id), -- Admin ou Secrétaire
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_slot_per_day UNIQUE (slot_id, attendance_date)
);

CREATE INDEX idx_teacher_attendance_slots_teacher ON teacher_attendance_slots(teacher_id);
CREATE INDEX idx_teacher_attendance_slots_day ON teacher_attendance_slots(day_of_week);
CREATE INDEX idx_teacher_attendances_date ON teacher_attendances(attendance_date);

CREATE TABLE grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_group class_group_enum NOT NULL,
    created_by_secretary_id UUID NOT NULL REFERENCES secretaries(user_id),
    exam_type exam_type_enum NOT NULL,
    term term_enum NOT NULL,
    value NUMERIC(4, 2) NOT NULL,
    max_score NUMERIC(4, 2) NOT NULL DEFAULT 20.00,
    evaluation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE annual_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    class_group class_group_enum NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    status result_status_enum NOT NULL DEFAULT 'DRAFT',
    total_coefficients NUMERIC(5, 2) NOT NULL,
    overall_average NUMERIC(4, 2) NOT NULL,
    decision academic_decision_enum NOT NULL DEFAULT 'PENDING',
    class_rank INT,
    created_by_secretary_id UUID NOT NULL REFERENCES secretaries(user_id),
    approved_by_admin_id UUID REFERENCES administrators(user_id),
    pdf_export_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE annual_result_subject_breakdowns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    annual_result_id UUID NOT NULL REFERENCES annual_results(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, 
    subject_name VARCHAR(100) NOT NULL, 
    coefficient NUMERIC(3, 1) NOT NULL,
    term1_semi_trimester_grade NUMERIC(4, 2),
    term1_trimester_grade NUMERIC(4, 2),
    term2_semi_trimester_grade NUMERIC(4, 2),
    term2_trimester_grade NUMERIC(4, 2),
    term3_semi_trimester_grade NUMERIC(4, 2),
    term3_trimester_grade NUMERIC(4, 2),
    subject_overall_average NUMERIC(4, 2) NOT NULL
);

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_scope target_scope_enum NOT NULL,
    target_value VARCHAR(100), -- Utilisé si besoin de spécifier plus précisément
    priority announcement_priority_enum NOT NULL DEFAULT 'NORMAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE announcement_target_classes (
    announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
    target_class class_group_enum NOT NULL,
    PRIMARY KEY (announcement_id, target_class)
);