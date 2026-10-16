import { pool } from "../config/db";
import { CreateEventDto, UpdateEventDto } from "../dtos/eventDto";

export const eventRepository = {
  create: async (dto: CreateEventDto, adminId: string): Promise<any> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const eventQuery = `
        INSERT INTO school_events (type, title, description, start_time, end_time, location, created_by_admin_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, type, title, description, start_time AS "startTime", end_time AS "endTime", location, created_at AS "createdAt";
      `;
      const { rows } = await client.query(eventQuery, [
        dto.type,
        dto.title,
        dto.description || null,
        dto.startTime,
        dto.endTime,
        dto.location || null,
        adminId,
      ]);
      const event = rows[0];

      for (const targetClass of dto.targetClasses) {
        await client.query(
          `INSERT INTO school_event_target_classes (event_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
          [event.id, targetClass],
        );
      }

      await client.query("COMMIT");
      return eventRepository.findById(event.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<any | null> => {
    const eventQuery = `
      SELECT id, type, title, description, start_time AS "startTime", end_time AS "endTime", location, created_at AS "createdAt"
      FROM school_events
      WHERE id = $1
      LIMIT 1;
    `;
    const eventResult = await pool.query(eventQuery, [id]);
    if (eventResult.rows.length === 0) return null;

    const event = eventResult.rows[0];

    const classesQuery = `
      SELECT target_class AS "targetClass"
      FROM school_event_target_classes
      WHERE event_id = $1;
    `;
    const classesResult = await pool.query(classesQuery, [id]);
    event.targetClasses = classesResult.rows.map((r) => r.targetClass);

    return event;
  },

  findAll: async (): Promise<any[]> => {
    const query = `
      SELECT id, type, title, description, start_time AS "startTime", end_time AS "endTime", location, created_at AS "createdAt"
      FROM school_events
      ORDER BY start_time DESC;
    `;
    const { rows } = await pool.query(query);
    const events = rows;

    for (const event of events) {
      const classesQuery = `
        SELECT target_class AS "targetClass"
        FROM school_event_target_classes
        WHERE event_id = $1;
      `;
      const classesResult = await pool.query(classesQuery, [event.id]);
      event.targetClasses = classesResult.rows.map((r) => r.targetClass);
    }

    return events;
  },

  delete: async (id: string): Promise<void> => {
    await pool.query(`DELETE FROM school_events WHERE id = $1;`, [id]);
  },
};
