import { pool } from "../config/db";
import { CreateSubjectDto, UpdateSubjectDto } from "../dtos/subjectDto";

export class SubjectRepository {
  public static async create(dto: CreateSubjectDto): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const subjectQuery = `
        INSERT INTO subjects (name, coefficient, description)
        VALUES ($1, $2, $3)
        RETURNING id, name, coefficient, description, created_at AS "createdAt";
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

        // Association du prof pour cette classe
        await client.query(
          `INSERT INTO teacher_subject_classes (subject_id, class_group, teacher_id) VALUES ($1, $2, $3)
           ON CONFLICT (subject_id, class_group) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;`,
          [subject.id, assignment.classGroup, assignment.teacherId],
        );
      }
      await client.query("COMMIT");
      return this.findById(subject.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public static async findById(id: string): Promise<any | null> {
    const query = `
      SELECT 
        s.id, s.name, s.coefficient, s.description, s.created_at AS "createdAt",
        COALESCE((
          SELECT json_agg(json_build_object(
            'classGroup', tsc.class_group,
            'teacherId', tsc.teacher_id,
            'teacherFirstName', u.first_name,
            'teacherLastName', u.last_name
          ))
          FROM teacher_subject_classes tsc
          JOIN users u ON tsc.teacher_id = u.id
          WHERE tsc.subject_id = s.id
        ), '[]'::json) AS assignments
      FROM subjects s
      WHERE s.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  public static async findAll(): Promise<any[]> {
    const query = `
      SELECT 
        s.id, s.name, s.coefficient, s.description, s.created_at AS "createdAt",
        COALESCE((
          SELECT json_agg(json_build_object(
            'classGroup', tsc.class_group,
            'teacherId', tsc.teacher_id,
            'teacherFirstName', u.first_name,
            'teacherLastName', u.last_name
          ))
          FROM teacher_subject_classes tsc
          JOIN users u ON tsc.teacher_id = u.id
          WHERE tsc.subject_id = s.id
        ), '[]'::json) AS assignments
      FROM subjects s
      ORDER BY s.name ASC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  public static async delete(id: string): Promise<void> {
    await pool.query(`DELETE FROM subjects WHERE id = $1;`, [id]);
  }
}
