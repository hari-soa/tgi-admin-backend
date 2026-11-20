import { PoolClient } from "pg";
import { pool } from "../config/db";
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from "../dtos/announcementDto";
import { Announcement } from "../models/announcementModel";
import { buildUpdateStatement } from "../utils/sqlUpdate";

const ANNOUNCEMENT_SELECT = `
  SELECT a.id, a.title, a.content, a.author_id AS "authorId",
         a.target_scope AS "targetScope", a.target_value AS "targetValue", a.priority,
         ARRAY(
           SELECT atc.target_class::text FROM announcement_target_classes atc
           WHERE atc.announcement_id = a.id ORDER BY atc.target_class
         ) AS "targetClasses",
         a.created_at AS "createdAt", a.updated_at AS "updatedAt",
         u.first_name AS "authorFirstName", u.last_name AS "authorLastName"
  FROM announcements a
  JOIN users u ON a.author_id = u.id
`;

const UPDATE_COLUMN_MAPPING: Record<string, string> = {
  title: "title",
  content: "content",
  targetScope: "target_scope",
  targetValue: "target_value",
  priority: "priority",
};

const replaceTargetClasses = async (
  client: PoolClient,
  announcementId: string,
  targetClasses: string[],
): Promise<void> => {
  await client.query(
    `DELETE FROM announcement_target_classes WHERE announcement_id = $1;`,
    [announcementId],
  );
  await Promise.all(
    targetClasses.map((targetClass) =>
      client.query(
        `INSERT INTO announcement_target_classes (announcement_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [announcementId, targetClass],
      ),
    ),
  );
};

export const announcementRepository = {
  create: async (
    dto: CreateAnnouncementDto,
    authorId: string,
  ): Promise<Announcement> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `INSERT INTO announcements (title, content, author_id, target_scope, target_value, priority)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id;`,
        [
          dto.title,
          dto.content,
          authorId,
          dto.targetScope,
          dto.targetValue || null,
          dto.priority,
        ],
      );
      const announcementId: string = rows[0].id;

      if (dto.targetScope === "CLASS") {
        await replaceTargetClasses(
          client,
          announcementId,
          dto.targetClasses ?? [],
        );
      }

      await client.query("COMMIT");
      return (await announcementRepository.findById(
        announcementId,
      )) as Announcement;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  update: async (
    id: string,
    dto: UpdateAnnouncementDto,
  ): Promise<Announcement | null> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const statement = buildUpdateStatement(UPDATE_COLUMN_MAPPING, dto);
      if (statement) {
        await client.query(
          `UPDATE announcements SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${statement.values.length + 1};`,
          [...statement.values, id],
        );
      }

      if (dto.targetScope === "ALL") {
        await replaceTargetClasses(client, id, []);
      } else if (dto.targetClasses !== undefined) {
        await replaceTargetClasses(client, id, dto.targetClasses);
      }

      await client.query("COMMIT");
      return announcementRepository.findById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * With a class group, only the announcements for everyone or for that
   * class are returned.
   */
  findAll: async (visibleToClassGroup?: string): Promise<Announcement[]> => {
    const { rows } = await pool.query<Announcement>(
      `${ANNOUNCEMENT_SELECT}
       WHERE $1::text IS NULL
          OR a.target_scope = 'ALL'
          OR EXISTS (
            SELECT 1 FROM announcement_target_classes atc
            WHERE atc.announcement_id = a.id AND atc.target_class::text = $1
          )
       ORDER BY a.created_at DESC;`,
      [visibleToClassGroup ?? null],
    );
    return rows;
  },

  findById: async (id: string): Promise<Announcement | null> => {
    const { rows } = await pool.query<Announcement>(
      `${ANNOUNCEMENT_SELECT} WHERE a.id = $1 LIMIT 1;`,
      [id],
    );
    return rows[0] || null;
  },

  delete: async (id: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `DELETE FROM announcements WHERE id = $1;`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },
};
