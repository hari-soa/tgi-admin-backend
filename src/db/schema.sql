CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'TEACHER', 'SECRETARY', 'STUDENT');
CREATE TYPE gender_enum AS ENUM ('MALE', 'FEMALE', 'OTHER');
CREATE TYPE class_group_enum AS ENUM ('SECONDE', 'PREMIERE', 'TERMINALE');

CREATE TYPE remark_category_enum AS ENUM ('BEHAVIOR', 'ACADEMIC', 'WARNING', 'ENCOURAGEMENT', 'OTHER');
CREATE TYPE student_history_type_enum AS ENUM ('ABSENCE', 'LATENESS', 'SUSPENSION', 'INFIRMARY', 'EARLY_LEAVE_PERMIT');

CREATE TYPE event_type_enum AS ENUM ('COURSE', 'EXAM', 'OTHER');

CREATE TYPE exam_type_enum AS ENUM ('SEMI_TRIMESTER', 'TRIMESTER');
CREATE TYPE term_enum AS ENUM ('FIRST_TRIMESTER', 'SECOND_TRIMESTER', 'THIRD_TRIMESTER');

CREATE TYPE result_status_enum AS ENUM ('DRAFT', 'APPROVED', 'PUBLISHED');
CREATE TYPE academic_decision_enum AS ENUM ('PASS', 'FAIL', 'PENDING');

CREATE TYPE target_scope_enum AS ENUM ('ALL', 'CLASS', 'TEACHERS_ONLY', 'STUDENTS_ONLY');
CREATE TYPE announcement_priority_enum AS ENUM ('NORMAL', 'URGENT');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    contact_number VARCHAR(30) NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NOT NULL,
    profile_picture_url TEXT,
    user_type user_role_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE administrators (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'ADMIN'
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    coefficient NUMERIC(3, 1) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subject_target_classes (
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    target_class class_group_enum NOT NULL,
    PRIMARY KEY (subject_id, target_class)
);

CREATE TABLE teachers (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    homeroom_class class_group_enum
);

CREATE TABLE teacher_subjects (
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_group class_group_enum NOT NULL,
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE CASCADE,
    PRIMARY KEY (subject_id, class_group)
);

CREATE TABLE secretaries (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100)
);

CREATE TABLE students (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    class_roll_number INT NOT NULL,
    class_group class_group_enum NOT NULL, -- Choix unique (Seconde, Première, Terminale)
    date_of_birth DATE NOT NULL,
    gender gender_enum NOT NULL,
    address TEXT NOT NULL,
    parents_email VARCHAR(255) NOT NULL,
    parents_contact_number VARCHAR(30) NOT NULL,
    profile_picture_url TEXT NOT NULL,
    comments TEXT
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

CREATE TABLE student_history_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    type student_history_type_enum NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    created_by_admin_id UUID NOT NULL REFERENCES administrators(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE timetables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedule_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timetable_id UUID REFERENCES timetables(id) ON DELETE CASCADE,
    type event_type_enum NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    classroom VARCHAR(50),
    label VARCHAR(150), -- Utilisé pour OTHER
    location VARCHAR(150), -- Utilisé pour OTHER
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL, -- Pour COURSE
    teacher_id UUID REFERENCES teachers(user_id) ON DELETE SET NULL, -- Pour COURSE
    created_by_admin_id UUID NOT NULL REFERENCES administrators(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE schedule_event_target_classes (
    event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
    target_class class_group_enum NOT NULL,
    PRIMARY KEY (event_id, target_class)
);

CREATE TABLE exam_event_subject_details (
    event_id UUID REFERENCES schedule_events(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    duration_in_minutes INT NOT NULL,
    PRIMARY KEY (event_id, subject_id)
);

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
    subject_id UUID NOT NULL REFERENCES subjects(id),
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