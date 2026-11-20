import { pool } from "../config/db";
import {
  CreateStudentHistoryRecordDto,
  UpdateStudentHistoryRecordDto,
} from "../dtos/studentHistoryDto";
import {
  CreateStudentRemarkDto,
  UpdateStudentRemarkDto,
} from "../dtos/studentRemarkDto";
import { StudentHistoryRecord } from "../models/studentHistoryModel";
import { StudentRemark } from "../models/studentRemarkModel";
import { buildUpdateStatement } from "../utils/sqlUpdate";

const HISTORY_COLUMNS = `
  id, student_id AS "studentId", type, start_date AS "startDate", end_date AS "endDate",
  reason, created_by_admin_id AS "createdByAdminId",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const REMARK_COLUMNS = `
  id, student_id AS "studentId", author_id AS "authorId", author_role AS "authorRole",
  category, content, created_at AS "createdAt", updated_at AS "updatedAt"
`;

const HISTORY_COLUMN_MAPPING: Record<string, string> = {
  type: "type",
  startDate: "start_date",
  endDate: "end_date",
  reason: "reason",
};

const REMARK_COLUMN_MAPPING: Record<string, string> = {
  category: "category",
  content: "content",
};

export const disciplinaryRepository = {
  createHistoryRecord: async (
    dto: CreateStudentHistoryRecordDto,
    adminId: string,
  ): Promise<StudentHistoryRecord> => {
    const { rows } = await pool.query(
      `INSERT INTO student_history_records (student_id, type, start_date, end_date, reason, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${HISTORY_COLUMNS};`,
      [
        dto.studentId,
        dto.type,
        dto.startDate,
        dto.endDate,
        dto.reason,
        adminId,
      ],
    );
    return rows[0];
  },

  findHistoryByStudentId: async (
    studentId: string,
  ): Promise<StudentHistoryRecord[]> => {
    const { rows } = await pool.query(
      `SELECT ${HISTORY_COLUMNS} FROM student_history_records
       WHERE student_id = $1 ORDER BY start_date DESC, created_at DESC;`,
      [studentId],
    );
    return rows;
  },

  updateHistoryRecord: async (
    id: string,
    dto: UpdateStudentHistoryRecordDto,
  ): Promise<StudentHistoryRecord | null> => {
    const statement = buildUpdateStatement(HISTORY_COLUMN_MAPPING, dto);
    if (!statement) {
      return null;
    }
    const { rows } = await pool.query(
      `UPDATE student_history_records
       SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${statement.values.length + 1}
       RETURNING ${HISTORY_COLUMNS};`,
      [...statement.values, id],
    );
    return rows[0] || null;
  },

  deleteHistoryRecord: async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `DELETE FROM student_history_records WHERE id = $1;`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },

  createRemark: async (
    dto: CreateStudentRemarkDto,
    authorId: string,
    authorRole: string,
  ): Promise<StudentRemark> => {
    const { rows } = await pool.query(
      `INSERT INTO student_remarks (student_id, author_id, author_role, category, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${REMARK_COLUMNS};`,
      [dto.studentId, authorId, authorRole, dto.category, dto.content],
    );
    return rows[0];
  },

  findRemarksByStudentId: async (
    studentId: string,
  ): Promise<StudentRemark[]> => {
    const { rows } = await pool.query(
      `SELECT ${REMARK_COLUMNS} FROM student_remarks
       WHERE student_id = $1 ORDER BY created_at DESC;`,
      [studentId],
    );
    return rows;
  },

  updateRemark: async (
    id: string,
    dto: UpdateStudentRemarkDto,
  ): Promise<StudentRemark | null> => {
    const statement = buildUpdateStatement(REMARK_COLUMN_MAPPING, dto);
    if (!statement) {
      return null;
    }
    const { rows } = await pool.query(
      `UPDATE student_remarks
       SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${statement.values.length + 1}
       RETURNING ${REMARK_COLUMNS};`,
      [...statement.values, id],
    );
    return rows[0] || null;
  },

  deleteRemark: async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `DELETE FROM student_remarks WHERE id = $1;`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};
