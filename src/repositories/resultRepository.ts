import { pool } from "../config/db";
import { CreateAnnualResultDto } from "../dtos/resultDto";
import { AnnualResult, SubjectGradeBreakdown } from "../models/resultModel";

export type AnnualResultInput = Omit<CreateAnnualResultDto, "decision"> & {
  decision?: CreateAnnualResultDto["decision"];
};

const RESULT_COLUMNS = `
  id, student_id AS "studentId", class_group AS "classGroup",
  academic_year AS "academicYear", status, total_coefficients::float AS "totalCoefficients",
  overall_average::float AS "overallAverage", decision, class_rank AS "classRank",
  created_by_secretary_id AS "createdBySecretaryId", approved_by_admin_id AS "approvedByAdminId",
  pdf_export_url AS "pdfExportUrl", created_at AS "createdAt", updated_at AS "updatedAt"
`;

const BREAKDOWN_COLUMNS = `
  annual_result_id AS "annualResultId", subject_id AS "subjectId", subject_name AS "subjectName",
  coefficient::float AS coefficient,
  term1_semi_trimester_grade::float AS "term1SemiTrimesterGrade",
  term1_trimester_grade::float AS "term1TrimesterGrade",
  term2_semi_trimester_grade::float AS "term2SemiTrimesterGrade",
  term2_trimester_grade::float AS "term2TrimesterGrade",
  term3_semi_trimester_grade::float AS "term3SemiTrimesterGrade",
  term3_trimester_grade::float AS "term3TrimesterGrade",
  subject_overall_average::float AS "subjectOverallAverage"
`;

type BreakdownRow = SubjectGradeBreakdown & { annualResultId: string };

const attachSubjects = async (
  headers: Omit<AnnualResult, "subjects">[],
): Promise<AnnualResult[]> => {
  if (headers.length === 0) {
    return [];
  }

  const { rows } = await pool.query<BreakdownRow>(
    `SELECT ${BREAKDOWN_COLUMNS}
     FROM annual_result_subject_breakdowns
     WHERE annual_result_id = ANY($1::uuid[])
     ORDER BY subject_name ASC;`,
    [headers.map((header) => header.id)],
  );

  return headers.map((header) => ({
    ...header,
    subjects: rows
      .filter((row) => row.annualResultId === header.id)
      .map(({ annualResultId: _annualResultId, ...subject }) => subject),
  }));
};

export const resultRepository = {
  /**
   * Creates the annual result of a student, or replaces it when one already
   * exists for the same academic year (one report card per student and year).
   */
  upsertAnnualResult: async (
    dto: AnnualResultInput,
    secretaryId: string,
    approvedByAdminId?: string,
  ): Promise<AnnualResult> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const existing = await client.query(
        `SELECT id FROM annual_results WHERE student_id = $1 AND academic_year = $2 FOR UPDATE;`,
        [dto.studentId, dto.academicYear],
      );

      const savedResultId = await (async (): Promise<string> => {
        if (existing.rows.length > 0) {
          const resultId = existing.rows[0].id;
          await client.query(
            `UPDATE annual_results
             SET class_group = $1, status = $2, total_coefficients = $3, overall_average = $4,
                 decision = COALESCE($5::academic_decision_enum, decision), class_rank = $6,
                 approved_by_admin_id = COALESCE($7, approved_by_admin_id),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8;`,
            [
              dto.classGroup,
              dto.status,
              dto.totalCoefficients,
              dto.overallAverage,
              dto.decision ?? null,
              dto.classRank ?? null,
              approvedByAdminId ?? null,
              resultId,
            ],
          );
          await client.query(
            `DELETE FROM annual_result_subject_breakdowns WHERE annual_result_id = $1;`,
            [resultId],
          );
          return resultId;
        }

        const inserted = await client.query(
          `INSERT INTO annual_results
           (student_id, class_group, academic_year, status, total_coefficients, overall_average, decision, class_rank, created_by_secretary_id, approved_by_admin_id)
           VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::academic_decision_enum, 'PENDING'), $8, $9, $10)
           RETURNING id;`,
          [
            dto.studentId,
            dto.classGroup,
            dto.academicYear,
            dto.status,
            dto.totalCoefficients,
            dto.overallAverage,
            dto.decision ?? null,
            dto.classRank ?? null,
            secretaryId,
            approvedByAdminId ?? null,
          ],
        );
        return inserted.rows[0].id;
      })();

      const insertBreakdown = `
        INSERT INTO annual_result_subject_breakdowns
        (annual_result_id, subject_id, subject_name, coefficient, term1_semi_trimester_grade, term1_trimester_grade, term2_semi_trimester_grade, term2_trimester_grade, term3_semi_trimester_grade, term3_trimester_grade, subject_overall_average)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
      `;

      await Promise.all(
        dto.subjects.map((subject) =>
          client.query(insertBreakdown, [
            savedResultId,
            subject.subjectId,
            subject.subjectName,
            subject.coefficient,
            subject.term1SemiTrimesterGrade ?? null,
            subject.term1TrimesterGrade ?? null,
            subject.term2SemiTrimesterGrade ?? null,
            subject.term2TrimesterGrade ?? null,
            subject.term3SemiTrimesterGrade ?? null,
            subject.term3TrimesterGrade ?? null,
            subject.subjectOverallAverage,
          ]),
        ),
      );

      await client.query("COMMIT");
      return (await resultRepository.findById(savedResultId)) as AnnualResult;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  recomputeClassRanks: async (
    classGroup: string,
    academicYear: string,
  ): Promise<void> => {
    await pool.query(
      `UPDATE annual_results AS target
       SET class_rank = ranked.position
       FROM (
         SELECT id, RANK() OVER (ORDER BY overall_average DESC) AS position
         FROM annual_results
         WHERE class_group = $1 AND academic_year = $2
       ) AS ranked
       WHERE target.id = ranked.id;`,
      [classGroup, academicYear],
    );
  },

  findById: async (id: string): Promise<AnnualResult | null> => {
    const { rows } = await pool.query(
      `SELECT ${RESULT_COLUMNS} FROM annual_results WHERE id = $1 LIMIT 1;`,
      [id],
    );
    const [result] = await attachSubjects(rows);
    return result || null;
  },

  findByStudentId: async (studentId: string): Promise<AnnualResult[]> => {
    const { rows } = await pool.query(
      `SELECT ${RESULT_COLUMNS} FROM annual_results
       WHERE student_id = $1 ORDER BY academic_year DESC;`,
      [studentId],
    );
    return attachSubjects(rows);
  },

  updateStatusAndDecision: async (
    id: string,
    status: string | undefined,
    decision: string | undefined,
    adminId: string,
  ): Promise<AnnualResult | null> => {
    const { rowCount } = await pool.query(
      `UPDATE annual_results
       SET status = COALESCE($1::result_status_enum, status),
           decision = COALESCE($2::academic_decision_enum, decision),
           approved_by_admin_id = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4;`,
      [status ?? null, decision ?? null, adminId, id],
    );
    return rowCount ? resultRepository.findById(id) : null;
  },

  updatePdfExportUrl: async (id: string, pdfUrl: string): Promise<void> => {
    await pool.query(
      `UPDATE annual_results SET pdf_export_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2;`,
      [pdfUrl, id],
    );
  },
};
