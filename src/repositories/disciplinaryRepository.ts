import { pool } from "../config/db";

export const disciplinaryRepository = {
  createHistoryRecord: async (data: {
    studentId: string;
    type: string;
    startDate: Date;
    endDate: Date;
    reason: string;
    adminId: string;
  }): Promise<any> => {
    const query = `
      INSERT INTO student_history_records (student_id, type, start_date, end_date, reason, created_by_admin_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, student_id AS "studentId", type, start_date AS "startDate", end_date AS "endDate", reason, created_by_admin_id AS "createdByAdminId", created_at AS "createdAt";
    `;
    const values = [
      data.studentId,
      data.type,
      data.startDate,
      data.endDate,
      data.reason,
      data.adminId,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  updateHistoryRecord: async (id: string, data: any): Promise<any> => {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      type: "type",
      startDate: "start_date",
      endDate: "end_date",
      reason: "reason",
    };

    for (const [key, dbCol] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${dbCol} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE student_history_records 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${idx}
      RETURNING id, student_id AS "studentId", type, start_date AS "startDate", end_date AS "endDate", reason, updated_at AS "updatedAt";
    `;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },

  deleteHistoryRecord: async (id: string): Promise<void> => {
    await pool.query(`DELETE FROM student_history_records WHERE id = $1;`, [
      id,
    ]);
  },

  createRemark: async (data: {
    studentId: string;
    authorId: string;
    authorRole: string;
    category: string;
    content: string;
  }): Promise<any> => {
    const query = `
      INSERT INTO student_remarks (student_id, author_id, author_role, category, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, student_id AS "studentId", author_id AS "authorId", author_role AS "authorRole", category, content, created_at AS "createdAt";
    `;
    const values = [
      data.studentId,
      data.authorId,
      data.authorRole,
      data.category,
      data.content,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  updateRemark: async (id: string, data: any): Promise<any> => {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      category: "category",
      content: "content",
    };

    for (const [key, dbCol] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${dbCol} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) return null;

    values.push(id);
    const query = `
      UPDATE student_remarks 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${idx}
      RETURNING id, student_id AS "studentId", category, content, updated_at AS "updatedAt";
    `;
    const { rows } = await pool.query(query, values);
    return rows[0] || null;
  },

  deleteRemark: async (id: string): Promise<void> => {
    await pool.query(`DELETE FROM student_remarks WHERE id = $1;`, [id]);
  },
};
