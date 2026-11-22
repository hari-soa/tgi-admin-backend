import { PoolClient } from "pg";
import { pool } from "../config/db";
import {
  AbsenceMotifDto,
  CreateGradeDto,
  MAX_GRADE,
  SessionGradeDto,
  UpdateGradeDto,
} from "../dtos/gradeDto";
import { Grade, GradeSession, GradeSessionStatus } from "../models/gradeModel";

const GRADE_COLUMNS = `
  id, student_id AS "studentId", subject_id AS "subjectId", class_group AS "classGroup",
  created_by_secretary_id AS "createdBySecretaryId", approved_by_admin_id AS "approvedByAdminId",
  exam_type AS "examType", term, value::float AS value,
  status, session_id AS "sessionId", evaluation_date AS "evaluationDate",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const SESSION_SELECT = `
  SELECT gs.id, gs.class_group AS "classGroup", gs.subject_id AS "subjectId", s.name AS "subjectName",
         s.coefficient::float AS "subjectCoefficient",
         gs.exam_type AS "examType", gs.term, gs.academic_year AS "academicYear", gs.status,
         gs.draft_grades AS "draftGrades", gs.created_by_admin_id AS "createdByAdminId",
         gs.submitted_by_secretary_id AS "submittedBySecretaryId",
         gs.validated_by_admin_id AS "validatedByAdminId",
         gs.created_at AS "createdAt", gs.submitted_at AS "submittedAt", gs.validated_at AS "validatedAt",
         COALESCE(
           (SELECT json_agg(
                     json_build_object('studentId', gsa.student_id, 'motif', gsa.motif, 'recordedAt', gsa.recorded_at)
                     ORDER BY gsa.recorded_at
                   )
            FROM grade_session_absences gsa WHERE gsa.session_id = gs.id),
           '[]'::json
         ) AS absences
  FROM grade_sessions gs
  JOIN subjects s ON s.id = gs.subject_id
`;

const EXAM_TYPE_LABELS: Record<string, string> = {
  SEMI_TRIMESTER: "Semi-trimestre",
  TRIMESTER: "Trimestre",
};

const TERM_LABELS: Record<string, string> = {
  FIRST_TRIMESTER: "1er trimestre",
  SECOND_TRIMESTER: "2e trimestre",
  THIRD_TRIMESTER: "3e trimestre",
};

export interface PublishedGradeRow {
  subjectId: string;
  subjectName: string;
  coefficient: number;
  examType: string;
  term: string;
  value: number;
}

export interface AbsentSubjectRow {
  subjectId: string;
  subjectName: string;
  coefficient: number;
}

export interface ValidatedSessionResult {
  session: GradeSession;
  studentIds: string[];
}

export interface SessionSubmission {
  entries: SessionGradeDto[];
  absentStudentIds: string[];
  motifs: AbsenceMotifDto[];
}

const buildAbsenceReason = (
  subjectName: string,
  examType: string,
  term: string,
  motif: string | null,
): string => {
  const description = `Absence à l'examen de ${subjectName} (${EXAM_TYPE_LABELS[examType]}, ${TERM_LABELS[term]})`;
  return motif ? `${description} — Motif : ${motif}` : description;
};

const insertGradeRows = async (
  client: PoolClient,
  sessionId: string,
  secretaryId: string,
  entries: SessionGradeDto[],
): Promise<void> => {
  const { rows } = await client.query(
    `SELECT class_group, subject_id, exam_type, term FROM grade_sessions WHERE id = $1;`,
    [sessionId],
  );
  const session = rows[0];

  await client.query(`DELETE FROM grades WHERE session_id = $1;`, [sessionId]);

  await Promise.all(
    entries
      .filter((entry) => entry.value !== null && entry.value !== undefined)
      .map((entry) =>
        client.query(
          `INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status, session_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, 'PENDING', $9);`,
          [
            entry.studentId,
            session.subject_id,
            session.class_group,
            secretaryId,
            session.exam_type,
            session.term,
            entry.value,
            MAX_GRADE,
            sessionId,
          ],
        ),
      ),
  );
};

const syncSessionAbsences = async (
  client: PoolClient,
  sessionId: string,
  absentStudentIds: string[],
  motifs: AbsenceMotifDto[],
): Promise<void> => {
  const { rows: sessionRows } = await client.query(
    `SELECT gs.exam_type, gs.term, gs.created_by_admin_id, s.name AS subject_name
     FROM grade_sessions gs JOIN subjects s ON s.id = gs.subject_id
     WHERE gs.id = $1;`,
    [sessionId],
  );
  const session = sessionRows[0];

  const { rows: staleRows } = await client.query(
    `DELETE FROM grade_session_absences
     WHERE session_id = $1 AND NOT (student_id = ANY($2::uuid[]))
     RETURNING history_record_id;`,
    [sessionId, absentStudentIds],
  );
  const staleRecordIds = staleRows
    .map((row) => row.history_record_id)
    .filter((recordId) => recordId !== null);
  await client.query(
    `DELETE FROM student_history_records WHERE id = ANY($1::uuid[]);`,
    [staleRecordIds],
  );

  await Promise.all(
    absentStudentIds.map(async (studentId) => {
      const submittedMotif =
        motifs.find((motif) => motif.studentId === studentId)?.motif ?? null;
      const { rows: existingRows } = await client.query(
        `SELECT motif, history_record_id FROM grade_session_absences
         WHERE session_id = $1 AND student_id = $2;`,
        [sessionId, studentId],
      );
      const existing = existingRows[0];
      const motif = submittedMotif ?? existing?.motif ?? null;
      const reason = buildAbsenceReason(
        session.subject_name,
        session.exam_type,
        session.term,
        motif,
      );

      if (existing?.history_record_id) {
        await client.query(
          `UPDATE grade_session_absences SET motif = $3 WHERE session_id = $1 AND student_id = $2;`,
          [sessionId, studentId, motif],
        );
        await client.query(
          `UPDATE student_history_records SET reason = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
          [existing.history_record_id, reason],
        );
        return;
      }

      const { rows: recordRows } = await client.query(
        `INSERT INTO student_history_records (student_id, type, start_date, end_date, reason, created_by_admin_id)
         VALUES ($1, 'ABSENCE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $2, $3)
         RETURNING id;`,
        [studentId, reason, session.created_by_admin_id],
      );
      await client.query(
        `INSERT INTO grade_session_absences (session_id, student_id, motif, history_record_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (session_id, student_id) DO UPDATE
         SET motif = EXCLUDED.motif, history_record_id = EXCLUDED.history_record_id;`,
        [sessionId, studentId, motif, recordRows[0].id],
      );
    }),
  );
};

const runInTransaction = async <TResult>(
  work: (client: PoolClient) => Promise<TResult>,
): Promise<TResult> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const gradeRepository = {
  create: async (dto: CreateGradeDto, secretaryId: string): Promise<Grade> => {
    const { rows } = await pool.query(
      `INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT')
       RETURNING ${GRADE_COLUMNS};`,
      [
        dto.studentId,
        dto.subjectId,
        dto.classGroup,
        secretaryId,
        dto.examType,
        dto.term,
        dto.value,
        MAX_GRADE,
        dto.evaluationDate,
      ],
    );
    return rows[0];
  },

  findAll: async (): Promise<Grade[]> => {
    const { rows } = await pool.query(
      `SELECT ${GRADE_COLUMNS} FROM grades ORDER BY created_at DESC;`,
    );
    return rows;
  },

  findById: async (id: string): Promise<Grade | null> => {
    const { rows } = await pool.query(
      `SELECT ${GRADE_COLUMNS} FROM grades WHERE id = $1 LIMIT 1;`,
      [id],
    );
    return rows[0] || null;
  },

  update: async (id: string, dto: UpdateGradeDto): Promise<Grade | null> => {
    const { rows } = await pool.query(
      `UPDATE grades
       SET value = COALESCE($1, value),
           evaluation_date = COALESCE($2, evaluation_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING ${GRADE_COLUMNS};`,
      [dto.value ?? null, dto.evaluationDate ?? null, id],
    );
    return rows[0] || null;
  },

  updateStatus: async (
    id: string,
    status: string,
    adminId: string,
  ): Promise<Grade | null> => {
    const { rows } = await pool.query(
      `UPDATE grades
       SET status = $1, approved_by_admin_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING ${GRADE_COLUMNS};`,
      [status, adminId, id],
    );
    return rows[0] || null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { rows } = await pool.query(
      `DELETE FROM grades WHERE id = $1 RETURNING id;`,
      [id],
    );
    return rows.length > 0;
  },

  createSession: async (
    classGroup: string,
    subjectId: string,
    examType: string,
    term: string,
    academicYear: string,
    adminId: string,
  ): Promise<GradeSession> => {
    const { rows } = await pool.query(
      `INSERT INTO grade_sessions (class_group, subject_id, exam_type, term, academic_year, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id;`,
      [classGroup, subjectId, examType, term, academicYear, adminId],
    );
    return (await gradeRepository.findSessionById(rows[0].id)) as GradeSession;
  },

  findSessions: async (
    statuses: GradeSessionStatus[],
  ): Promise<GradeSession[]> => {
    const { rows } = await pool.query(
      `${SESSION_SELECT} WHERE gs.status = ANY($1::text[]) ORDER BY gs.created_at DESC;`,
      [statuses],
    );
    return rows;
  },

  findSessionById: async (id: string): Promise<GradeSession | null> => {
    const { rows } = await pool.query(`${SESSION_SELECT} WHERE gs.id = $1;`, [
      id,
    ]);
    return rows[0] || null;
  },

  saveSessionDraft: async (
    id: string,
    entries: SessionGradeDto[],
  ): Promise<boolean> => {
    const { rows } = await pool.query(
      `UPDATE grade_sessions SET draft_grades = $2::jsonb
       WHERE id = $1 AND status = 'OPEN' RETURNING id;`,
      [id, JSON.stringify(entries)],
    );
    return rows.length > 0;
  },

  submitSession: async (
    id: string,
    submission: SessionSubmission,
    secretaryId: string,
  ): Promise<boolean> =>
    runInTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE grade_sessions
         SET status = 'PENDING_REVIEW', draft_grades = $2::jsonb,
             submitted_by_secretary_id = $3, submitted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'OPEN'
         RETURNING id;`,
        [id, JSON.stringify(submission.entries), secretaryId],
      );
      if (rows.length === 0) {
        return false;
      }

      await insertGradeRows(client, id, secretaryId, submission.entries);
      await syncSessionAbsences(
        client,
        id,
        submission.absentStudentIds,
        submission.motifs,
      );
      return true;
    }),

  reviseSession: async (
    id: string,
    submission: SessionSubmission,
  ): Promise<boolean> =>
    runInTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE grade_sessions SET draft_grades = $2::jsonb
         WHERE id = $1 AND status = 'PENDING_REVIEW'
         RETURNING submitted_by_secretary_id;`,
        [id, JSON.stringify(submission.entries)],
      );
      if (rows.length === 0) {
        return false;
      }

      await insertGradeRows(
        client,
        id,
        rows[0].submitted_by_secretary_id,
        submission.entries,
      );
      await syncSessionAbsences(
        client,
        id,
        submission.absentStudentIds,
        submission.motifs,
      );
      return true;
    }),

  validateSession: async (
    id: string,
    adminId: string,
  ): Promise<ValidatedSessionResult | null> => {
    const studentIds = await runInTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE grade_sessions
         SET status = 'VALIDATED', validated_by_admin_id = $2, validated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'PENDING_REVIEW'
         RETURNING id;`,
        [id, adminId],
      );
      if (rows.length === 0) {
        return null;
      }

      const published = await client.query(
        `UPDATE grades
         SET status = 'PUBLISHED', approved_by_admin_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $1
         RETURNING student_id AS "studentId";`,
        [id, adminId],
      );
      const absent = await client.query(
        `SELECT student_id AS "studentId" FROM grade_session_absences WHERE session_id = $1;`,
        [id],
      );
      return [...published.rows, ...absent.rows].map(
        (row: { studentId: string }) => row.studentId,
      );
    });

    if (!studentIds) {
      return null;
    }
    const session = (await gradeRepository.findSessionById(id)) as GradeSession;
    return { session, studentIds };
  },

  findPublishedForStudent: async (
    studentId: string,
    classGroup: string,
    startDate: string,
    endDate: string,
  ): Promise<PublishedGradeRow[]> => {
    const { rows } = await pool.query(
      `SELECT g.subject_id AS "subjectId", s.name AS "subjectName", s.coefficient::float AS coefficient,
              g.exam_type AS "examType", g.term, g.value::float AS value
       FROM grades g
       JOIN subjects s ON s.id = g.subject_id
       WHERE g.student_id = $1 AND g.class_group = $2 AND g.status = 'PUBLISHED'
         AND g.evaluation_date >= $3 AND g.evaluation_date < $4
       ORDER BY g.evaluation_date ASC, g.created_at ASC;`,
      [studentId, classGroup, startDate, endDate],
    );
    return rows;
  },

  findAbsentSubjectsForStudent: async (
    studentId: string,
    classGroup: string,
    academicYear: string,
  ): Promise<AbsentSubjectRow[]> => {
    const { rows } = await pool.query(
      `SELECT DISTINCT s.id AS "subjectId", s.name AS "subjectName", s.coefficient::float AS coefficient
       FROM grade_session_absences gsa
       JOIN grade_sessions gs ON gs.id = gsa.session_id
       JOIN subjects s ON s.id = gs.subject_id
       WHERE gsa.student_id = $1 AND gs.class_group = $2
         AND gs.academic_year = $3 AND gs.status = 'VALIDATED';`,
      [studentId, classGroup, academicYear],
    );
    return rows;
  },
};
