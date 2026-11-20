import { pool } from "../config/db";
import { CreateGradeDto, SessionGradeDto } from "../dtos/gradeDto";
import { Grade, GradeSession, GradeSessionStatus } from "../models/gradeModel";

const GRADE_COLUMNS = `
  id, student_id AS "studentId", subject_id AS "subjectId", class_group AS "classGroup",
  created_by_secretary_id AS "createdBySecretaryId", approved_by_admin_id AS "approvedByAdminId",
  exam_type AS "examType", term, value::float AS value, max_score::float AS "maxScore",
  status, session_id AS "sessionId", evaluation_date AS "evaluationDate",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const SESSION_SELECT = `
  SELECT gs.id, gs.class_group AS "classGroup", gs.subject_id AS "subjectId", s.name AS "subjectName",
         gs.exam_type AS "examType", gs.term, gs.academic_year AS "academicYear", gs.status,
         gs.draft_grades AS "draftGrades", gs.created_by_admin_id AS "createdByAdminId",
         gs.submitted_by_secretary_id AS "submittedBySecretaryId",
         gs.validated_by_admin_id AS "validatedByAdminId",
         gs.created_at AS "createdAt", gs.submitted_at AS "submittedAt", gs.validated_at AS "validatedAt"
  FROM grade_sessions gs
  JOIN subjects s ON s.id = gs.subject_id
`;

export interface PublishedGradeRow {
  subjectId: string;
  subjectName: string;
  coefficient: number;
  examType: string;
  term: string;
  value: number;
  maxScore: number;
}

export interface ValidatedSessionResult {
  session: GradeSession;
  studentIds: string[];
}

export const gradeRepository = {
  create: async (dto: CreateGradeDto, secretaryId: string): Promise<Grade> => {
    const query = `
      INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT')
      RETURNING ${GRADE_COLUMNS};
    `;
    const { rows } = await pool.query(query, [
      dto.studentId,
      dto.subjectId,
      dto.classGroup,
      secretaryId,
      dto.examType,
      dto.term,
      dto.value,
      dto.maxScore,
      dto.evaluationDate,
    ]);
    return rows[0];
  },

  findAll: async (): Promise<Grade[]> => {
    const query = `SELECT ${GRADE_COLUMNS} FROM grades ORDER BY created_at DESC;`;
    const { rows } = await pool.query(query);
    return rows;
  },

  findById: async (id: string): Promise<Grade | null> => {
    const query = `SELECT ${GRADE_COLUMNS} FROM grades WHERE id = $1 LIMIT 1;`;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  update: async (
    id: string,
    dto: Partial<CreateGradeDto>,
  ): Promise<Grade | null> => {
    const query = `
      UPDATE grades
      SET value = COALESCE($1, value),
          max_score = COALESCE($2, max_score),
          evaluation_date = COALESCE($3, evaluation_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING ${GRADE_COLUMNS};
    `;
    const { rows } = await pool.query(query, [
      dto.value,
      dto.maxScore,
      dto.evaluationDate,
      id,
    ]);
    return rows[0] || null;
  },

  updateStatus: async (
    id: string,
    status: string,
    adminId: string,
  ): Promise<Grade | null> => {
    const query = `
      UPDATE grades
      SET status = $1, approved_by_admin_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING ${GRADE_COLUMNS};
    `;
    const { rows } = await pool.query(query, [status, adminId, id]);
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
    const insertQuery = `
      INSERT INTO grade_sessions (class_group, subject_id, exam_type, term, academic_year, created_by_admin_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;
    const { rows } = await pool.query(insertQuery, [
      classGroup,
      subjectId,
      examType,
      term,
      academicYear,
      adminId,
    ]);
    const session = await gradeRepository.findSessionById(rows[0].id);
    return session as GradeSession;
  },

  findSessions: async (
    statuses: GradeSessionStatus[],
  ): Promise<GradeSession[]> => {
    const query = `${SESSION_SELECT} WHERE gs.status = ANY($1::text[]) ORDER BY gs.created_at DESC;`;
    const { rows } = await pool.query(query, [statuses]);
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

  /**
   * Stores the grades of an OPEN session as PENDING and moves the session to
   * PENDING_REVIEW, atomically. Returns false when the session was not OPEN.
   */
  submitSession: async (
    id: string,
    entries: SessionGradeDto[],
    secretaryId: string,
  ): Promise<boolean> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sessionUpdate = await client.query(
        `UPDATE grade_sessions
         SET status = 'PENDING_REVIEW', draft_grades = $2::jsonb,
             submitted_by_secretary_id = $3, submitted_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'OPEN'
         RETURNING class_group, subject_id, exam_type, term;`,
        [id, JSON.stringify(entries), secretaryId],
      );

      if (sessionUpdate.rows.length === 0) {
        await client.query("ROLLBACK");
        return false;
      }

      const session = sessionUpdate.rows[0];
      const insertGrade = `
        INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status, session_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, 'PENDING', $9);
      `;

      await Promise.all(
        entries.map((entry) =>
          client.query(insertGrade, [
            entry.studentId,
            session.subject_id,
            session.class_group,
            secretaryId,
            session.exam_type,
            session.term,
            entry.value,
            entry.maxScore,
            id,
          ]),
        ),
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Publishes every grade of a PENDING_REVIEW session and marks the session
   * as VALIDATED, atomically. Returns null when the session was not pending.
   */
  validateSession: async (
    id: string,
    adminId: string,
  ): Promise<ValidatedSessionResult | null> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const sessionUpdate = await client.query(
        `UPDATE grade_sessions
         SET status = 'VALIDATED', validated_by_admin_id = $2, validated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'PENDING_REVIEW'
         RETURNING id;`,
        [id, adminId],
      );

      if (sessionUpdate.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const publishedGrades = await client.query(
        `UPDATE grades
         SET status = 'PUBLISHED', approved_by_admin_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE session_id = $1
         RETURNING student_id AS "studentId";`,
        [id, adminId],
      );

      await client.query("COMMIT");

      const session = (await gradeRepository.findSessionById(
        id,
      )) as GradeSession;
      const studentIds = publishedGrades.rows.map(
        (row: { studentId: string }) => row.studentId,
      );
      return { session, studentIds };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findPublishedForStudent: async (
    studentId: string,
    classGroup: string,
    startDate: string,
    endDate: string,
  ): Promise<PublishedGradeRow[]> => {
    const query = `
      SELECT g.subject_id AS "subjectId", s.name AS "subjectName", s.coefficient::float AS coefficient,
             g.exam_type AS "examType", g.term, g.value::float AS value, g.max_score::float AS "maxScore"
      FROM grades g
      JOIN subjects s ON s.id = g.subject_id
      WHERE g.student_id = $1 AND g.class_group = $2 AND g.status = 'PUBLISHED'
        AND g.evaluation_date >= $3 AND g.evaluation_date < $4
      ORDER BY g.evaluation_date ASC, g.created_at ASC;
    `;
    const { rows } = await pool.query(query, [
      studentId,
      classGroup,
      startDate,
      endDate,
    ]);
    return rows;
  },
};
