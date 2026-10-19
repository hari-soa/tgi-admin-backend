import { pool } from "../config/db";
import { CreateGradeDto, SubmitGradeSessionDto } from "../dtos/gradeDto";

export const gradeRepository = {
  create: async (dto: CreateGradeDto, secretaryId: string): Promise<any> => {
    const query = `
      INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DRAFT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, student_id AS "studentId", subject_id AS "subjectId", class_group AS "classGroup", 
                exam_type AS "examType", term, value, max_score AS "maxScore", status, 
                created_at AS "createdAt", updated_at AS "updatedAt";
    `;
    const values = [
      dto.studentId,
      dto.subjectId,
      dto.classGroup,
      secretaryId,
      dto.examType,
      dto.term,
      dto.value,
      dto.maxScore,
      dto.evaluationDate,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  submitSession: async (
    dto: SubmitGradeSessionDto,
    secretaryId: string,
  ): Promise<any[]> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insertedGrades = [];

      for (const gradeItem of dto.grades) {
        const query = `
          INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, max_score, evaluation_date, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id, student_id AS "studentId", subject_id AS "subjectId", value, status, created_at AS "createdAt";
        `;
        const { rows } = await client.query(query, [
          gradeItem.studentId,
          dto.subjectId,
          dto.classGroup,
          secretaryId,
          dto.examType,
          dto.term,
          gradeItem.value,
          gradeItem.maxScore,
        ]);
        insertedGrades.push(rows[0]);
      }

      await client.query("COMMIT");
      return insertedGrades;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<any | null> => {
    const query = `
      SELECT id, student_id AS "studentId", subject_id AS "subjectId", class_group AS "classGroup",
             created_by_secretary_id AS "createdBySecretaryId", approved_by_admin_id AS "approvedByAdminId",
             exam_type AS "examType", term, value, max_score AS "maxScore", status,
             evaluation_date AS "evaluationDate", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM grades
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  updateStatus: async (
    id: string,
    status: string,
    adminId: string,
  ): Promise<any | null> => {
    const query = `
      UPDATE grades
      SET status = $1, approved_by_admin_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, status, approved_by_admin_id AS "approvedByAdminId", updated_at AS "updatedAt";
    `;
    const { rows } = await pool.query(query, [status, adminId, id]);
    return rows[0] || null;
  },
};
