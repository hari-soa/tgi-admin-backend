import { pool } from "../config/db";
import {
  CreateAnnualResultDto,
  UpdateAnnualResultDto,
} from "../dtos/resultDto";

export class GradeRepository {
  public static async createGrade(data: {
    studentId: string;
    subjectId: string;
    classGroup: string;
    secretaryId: string;
    examType: string;
    term: string;
    value: number;
    evaluationDate: Date;
  }): Promise<any> {
    const query = `
      INSERT INTO grades (student_id, subject_id, class_group, created_by_secretary_id, exam_type, term, value, evaluation_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, student_id AS "studentId", subject_id AS "subjectId", value, exam_type AS "examType", term, created_at AS "createdAt";
    `;
    const values = [
      data.studentId,
      data.subjectId,
      data.classGroup,
      data.secretaryId,
      data.examType,
      data.term,
      data.value,
      data.evaluationDate,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  public static async createAnnualResult(
    dto: CreateAnnualResultDto,
    secretaryId: string,
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      let decision = dto.decision;
      if (decision === "PENDING" && dto.overallAverage >= 12) {
        decision = "PASS";
      }

      const resultQuery = `
        INSERT INTO annual_results (student_id, class_group, academic_year, status, total_coefficients, overall_average, decision, class_rank, created_by_secretary_id, pdf_export_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, student_id AS "studentId", class_group AS "classGroup", academic_year AS "academicYear", status, overall_average AS "overallAverage", decision;
      `;
      const resultValues = [
        dto.studentId,
        dto.classGroup,
        dto.academicYear,
        dto.status,
        dto.totalCoefficients,
        dto.overallAverage,
        decision,
        dto.classRank || null,
        secretaryId,
        dto.pdfExportUrl || null,
      ];

      const { rows } = await client.query(resultQuery, resultValues);
      const annualResult = rows[0];
      for (const sub of dto.subjects) {
        const breakdownQuery = `
          INSERT INTO annual_result_subject_breakdowns 
          (annual_result_id, subject_id, coefficient, term1_semi_trimester_grade, term1_trimester_grade, term2_semi_trimester_grade, term2_trimester_grade, term3_semi_trimester_grade, term3_trimester_grade, subject_overall_average)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
        `;
        await client.query(breakdownQuery, [
          annualResult.id,
          sub.subjectId,
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
      return this.findAnnualResultById(annualResult.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public static async findAnnualResultById(id: string): Promise<any | null> {
    const query = `
      SELECT 
        ar.id, ar.student_id AS "studentId", ar.class_group AS "classGroup", 
        ar.academic_year AS "academicYear", ar.status, ar.total_coefficients AS "totalCoefficients",
        ar.overall_average AS "overallAverage", ar.decision, ar.class_rank AS "classRank",
        COALESCE((
          SELECT json_agg(json_build_object(
            'subjectId', sb.subject_id,
            'coefficient', sb.coefficient,
            'term1SemiGr', sb.term1_semi_trimester_grade,
            'term1TrimGr', sb.term1_trimester_grade,
            'term2SemiGr', sb.term2_semi_trimester_grade,
            'term2TrimGr', sb.term2_trimester_grade,
            'term3SemiGr', sb.term3_semi_trimester_grade,
            'term3TrimGr', sb.term3_trimester_grade,
            'subjectAverage', sb.subject_overall_average
          ))
          FROM annual_result_subject_breakdowns sb
          WHERE sb.annual_result_id = ar.id
        ), '[]'::json) AS subjects
      FROM annual_results ar
      WHERE ar.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  public static async updateAnnualResultStatusAndDecision(
    id: string,
    status: string,
    decision: string,
    adminId: string,
  ): Promise<any> {
    const query = `
      UPDATE annual_results
      SET status = $1, decision = $2, approved_by_admin_id = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, status, decision, approved_by_admin_id AS "approvedByAdminId";
    `;
    const { rows } = await pool.query(query, [status, decision, adminId, id]);
    return rows[0] || null;
  }
}
