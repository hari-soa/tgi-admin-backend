import { pool } from "../config/db";
import { CreateAnnouncementDto } from "../dtos/announcementDto";

export class AnnouncementRepository {
  public static async create(
    dto: CreateAnnouncementDto,
    authorId: string,
    targetClasses?: string[],
  ): Promise<any> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        INSERT INTO announcements (title, content, author_id, target_scope, target_value, priority)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, title, content, author_id AS "authorId", target_scope AS "targetScope", target_value AS "targetValue", priority, created_at AS "createdAt";
      `;
      const values = [
        dto.title,
        dto.content,
        authorId,
        dto.targetScope,
        dto.targetValue || null,
        dto.priority || "NORMAL",
      ];

      const { rows } = await client.query(query, values);
      const announcement = rows[0];
      if (
        dto.targetScope === "CLASS" &&
        targetClasses &&
        targetClasses.length > 0
      ) {
        for (const targetClass of targetClasses) {
          await client.query(
            `INSERT INTO announcement_target_classes (announcement_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
            [announcement.id, targetClass],
          );
        }
      }

      await client.query("COMMIT");
      return announcement;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  public static async findAll(): Promise<any[]> {
    const query = `
      SELECT 
        a.id, a.title, a.content, a.target_scope AS "targetScope", 
        a.target_value AS "targetValue", a.priority, a.created_at AS "createdAt",
        u.first_name AS "authorFirstName", u.last_name AS "authorLastName"
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  public static async findById(id: string): Promise<any | null> {
    const query = `
      SELECT 
        a.id, a.title, a.content, a.target_scope AS "targetScope", 
        a.target_value AS "targetValue", a.priority, a.created_at AS "createdAt",
        u.first_name AS "authorFirstName", u.last_name AS "authorLastName"
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  public static async delete(id: string): Promise<void> {
    await pool.query(`DELETE FROM announcements WHERE id = $1;`, [id]);
  }
}
