import { pool } from "../config/db";
import {
  CreateAnnualResultDto,
  UpdateAnnualResultDto,
} from "../dtos/resultDto";

export const resultRepository = {
  createAnnualResult: async (
    dto: CreateAnnualResultDto,
    secretaryId: string,
  ): Promise<any> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const resultQuery = `
        INSERT INTO annual_results 
        (student_id, class_group, academic_year, status, total_coefficients, overall_average, decision, class_rank, created_by_secretary_id, pdf_export_url, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id, student_id AS "studentId", class_group AS "classGroup", academic_year AS "academicYear", status, overall_average AS "overallAverage", decision;
      `;

      const resultValues = [
        dto.studentId,
        dto.classGroup,
        dto.academicYear,
        dto.status,
        dto.totalCoefficients,
        dto.overallAverage,
        dto.decision,
        dto.classRank || null,
        secretaryId,
        dto.pdfExportUrl || null,
      ];

      const { rows } = await client.query(resultQuery, resultValues);
      const createdResult = rows[0];

      for (const sub of dto.subjects) {
        const breakdownQuery = `
    INSERT INTO annual_result_subject_breakdowns 
    (annual_result_id, subject_id, subject_name, coefficient, term1_semi_trimester_grade, term1_trimester_grade, term2_semi_trimester_grade, term2_trimester_grade, term3_semi_trimester_grade, term3_trimester_grade, subject_overall_average)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
  `;

        await client.query(breakdownQuery, [
          createdResult.id,
          sub.subjectId,
          sub.subjectName, // Le nom figé au moment de la création
          sub.coefficient,
          sub.term1SemiTrimesterGrade ?? null,
          sub.term1TrimesterGrade ?? null,
          sub.term2SemiTrimesterGrade ?? null,
          sub.term2TrimesterGrade ?? null,
          sub.term3SemiTrimesterGrade ?? null,
          sub.term3TrimesterGrade ?? null,
          sub.subjectOverallAverage,
        ]);
      }

      await client.query("COMMIT");
      return await resultRepository.findById(createdResult.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<any | null> => {
    const headerQuery = `
      SELECT id, student_id AS "studentId", class_group AS "classGroup", 
             academic_year AS "academicYear", status, total_coefficients AS "totalCoefficients",
             overall_average AS "overallAverage", decision, class_rank AS "classRank",
             created_by_secretary_id AS "createdBySecretaryId", approved_by_admin_id AS "approvedByAdminId",
             pdf_export_url AS "pdfExportUrl", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM annual_results
      WHERE id = $1
      LIMIT 1;
    `;
    const headerResult = await pool.query(headerQuery, [id]);
    if (headerResult.rows.length === 0) return null;

    const annualResult = headerResult.rows[0];

    const subjectsQuery = `
    SELECT subject_id AS "subjectId", 
         subject_name AS "subjectName", 
         coefficient, 
         term1_semi_trimester_grade AS "term1SemiTrimesterGrade", 
         term1_trimester_grade AS "term1TrimesterGrade", 
         term2_semi_trimester_grade AS "term2SemiTrimesterGrade", 
         term2_trimester_grade AS "term2TrimesterGrade", 
         term3_semi_trimester_grade AS "term3SemiTrimesterGrade", 
         term3_trimester_grade AS "term3TrimesterGrade", 
         subject_overall_average AS "subjectOverallAverage"
    FROM annual_result_subject_breakdowns
    WHERE annual_result_id = $1;
    `;

    const subjectsResult = await pool.query(subjectsQuery, [id]);
    annualResult.subjects = subjectsResult.rows;
    return annualResult;
  },

  updateStatusAndDecision: async (
    id: string,
    status: string,
    decision: string,
    adminId: string,
  ): Promise<any | null> => {
    const query = `
      UPDATE annual_results
      SET status = $1, decision = $2, approved_by_admin_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, status, decision, approved_by_admin_id AS "approvedByAdminId", updated_at AS "updatedAt";
    `;
    const { rows } = await pool.query(query, [status, decision, adminId, id]);
    return rows[0] || null;
  },

  findByStudentId: async (studentId: string): Promise<any[]> => {
    const query = `
      SELECT id, class_group AS "classGroup", academic_year AS "academicYear", 
             status, overall_average AS "overallAverage", decision, class_rank AS "classRank"
      FROM annual_results
      WHERE student_id = $1
      ORDER BY academic_year DESC;
    `;
    const { rows } = await pool.query(query, [studentId]);
    return rows;
  },
};
