import { pool } from "../config/db";
import { CreateSubjectDto } from "../dtos/subjectDto";

export const subjectRepository = {
  create: async (dto: CreateSubjectDto): Promise<any> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const assignment of dto.assignments) {
        const checkQuery = `
          SELECT s.id 
          FROM subjects s
          JOIN subject_target_classes stc ON s.id = stc.subject_id
          WHERE LOWER(s.name) = LOWER($1) AND stc.target_class = $2 AND s.is_active = TRUE
          LIMIT 1;
        `;
        const existing = await client.query(checkQuery, [
          dto.name,
          assignment.classGroup,
        ]);
        if (existing.rows.length > 0) {
          throw new Error(
            `Subject '${dto.name}' already exists and is active for class '${assignment.classGroup}'`,
          );
        }
      }

      const subjectQuery = `
        INSERT INTO subjects (name, coefficient, description, is_active)
        VALUES ($1, $2, $3, TRUE)
        RETURNING id, name, coefficient, description, is_active AS "isActive", created_at AS "createdAt";
      `;
      const { rows } = await client.query(subjectQuery, [
        dto.name,
        dto.coefficient,
        dto.description || null,
      ]);

      const subject = rows[0];
      for (const assignment of dto.assignments) {
        await client.query(
          `INSERT INTO subject_target_classes (subject_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [subject.id, assignment.classGroup],
        );

        await client.query(
          `INSERT INTO teacher_subject_classes (subject_id, class_group, teacher_id) VALUES ($1, $2, $3)
           ON CONFLICT (subject_id, class_group) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;`,
          [subject.id, assignment.classGroup, assignment.teacherId],
        );
      }
      await client.query("COMMIT");
      return subjectRepository.findById(subject.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<any | null> => {
    const subjectQuery = `
      SELECT id, name, coefficient, description, is_active AS "isActive", created_at AS "createdAt"
      FROM subjects
      WHERE id = $1
      LIMIT 1;
    `;
    const subjectResult = await pool.query(subjectQuery, [id]);
    if (subjectResult.rows.length === 0) return null;

    const subject = subjectResult.rows[0];

    const assignmentsQuery = `
      SELECT tsc.class_group AS "classGroup", tsc.teacher_id AS "teacherId", 
             u.first_name AS "teacherFirstName", u.last_name AS "teacherLastName"
      FROM teacher_subject_classes tsc
      JOIN users u ON tsc.teacher_id = u.id
      WHERE tsc.subject_id = $1;
    `;
    const assignmentsResult = await pool.query(assignmentsQuery, [id]);
    subject.assignments = assignmentsResult.rows;

    return subject;
  },

  findAll: async (): Promise<any[]> => {
    const subjectsQuery = `
      SELECT id, name, coefficient, description, is_active AS "isActive", created_at AS "createdAt"
      FROM subjects
      WHERE is_active = TRUE
      ORDER BY name ASC;
    `;
    const subjectsResult = await pool.query(subjectsQuery);
    const subjects = subjectsResult.rows;

    for (const subject of subjects) {
      const assignmentsQuery = `
        SELECT tsc.class_group AS "classGroup", tsc.teacher_id AS "teacherId", 
               u.first_name AS "teacherFirstName", u.last_name AS "teacherLastName"
        FROM teacher_subject_classes tsc
        JOIN users u ON tsc.teacher_id = u.id
        WHERE tsc.subject_id = $1;
      `;
      const assignmentsResult = await pool.query(assignmentsQuery, [
        subject.id,
      ]);
      subject.assignments = assignmentsResult.rows;
    }

    return subjects;
  },

  deactivate: async (id: string): Promise<void> => {
    await pool.query(
      `UPDATE subjects SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
      [id],
    );
  },
};
