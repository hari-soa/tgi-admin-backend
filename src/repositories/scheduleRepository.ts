import { pool } from "../config/db";
import { CreateTimetableDto } from "../dtos/scheduleDto";

export const scheduleRepository = {
  create: async (dto: CreateTimetableDto, adminId: string): Promise<any> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const timetableQuery = `
        INSERT INTO timetables (title, academic_year)
        VALUES ($1, $2)
        RETURNING id, title, academic_year AS "academicYear", created_at AS "createdAt";
      `;
      const { rows } = await client.query(timetableQuery, [
        dto.title,
        dto.academicYear,
      ]);
      const timetable = rows[0];

      for (const event of dto.events) {
        let classroom = null;
        let label = null;
        let location = null;
        let subjectId = null;
        let teacherId = null;

        if (event.type === "COURSE") {
          classroom = event.classroom;
          subjectId = event.subjectId;
          teacherId = event.teacherId || null;
        } else if (event.type === "EXAM") {
          classroom = event.classroom || null;
        } else if (event.type === "OTHER") {
          label = event.label;
          location = event.location;
        }

        const eventQuery = `
          INSERT INTO schedule_events (timetable_id, type, start_time, end_time, classroom, label, location, subject_id, teacher_id, created_by_admin_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id;
        `;
        const eventResult = await client.query(eventQuery, [
          timetable.id,
          event.type,
          event.startTime,
          event.endTime,
          classroom,
          label,
          location,
          subjectId,
          teacherId,
          adminId,
        ]);
        const eventId = eventResult.rows[0].id;

        if (event.type === "COURSE") {
          await client.query(
            `INSERT INTO schedule_event_target_classes (event_id, target_class) VALUES ($1, $2);`,
            [eventId, event.targetClass],
          );
        } else if (event.type === "EXAM") {
          for (const targetClass of event.targetClasses) {
            await client.query(
              `INSERT INTO schedule_event_target_classes (event_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [eventId, targetClass],
            );
          }
          for (const subDetail of event.subjects) {
            await client.query(
              `INSERT INTO exam_event_subject_details (event_id, subject_id, duration_in_minutes) VALUES ($1, $2, $3);`,
              [eventId, subDetail.subjectId, subDetail.durationInMinutes],
            );
          }
        } else if (event.type === "OTHER") {
          for (const targetClass of event.targetClasses) {
            await client.query(
              `INSERT INTO schedule_event_target_classes (event_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
              [eventId, targetClass],
            );
          }
        }
      }

      await client.query("COMMIT");
      return scheduleRepository.findById(timetable.id);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<any | null> => {
    const timetableQuery = `
      SELECT id, title, academic_year AS "academicYear", created_at AS "createdAt"
      FROM timetables
      WHERE id = $1
      LIMIT 1;
    `;
    const timetableResult = await pool.query(timetableQuery, [id]);
    if (timetableResult.rows.length === 0) return null;

    const timetable = timetableResult.rows[0];

    const eventsQuery = `
      SELECT id, type, start_time AS "startTime", end_time AS "endTime", 
             classroom, label, location, subject_id AS "subjectId", teacher_id AS "teacherId"
      FROM schedule_events
      WHERE timetable_id = $1;
    `;
    const eventsResult = await pool.query(eventsQuery, [id]);
    timetable.events = eventsResult.rows;

    return timetable;
  },

  findAll: async (): Promise<any[]> => {
    const query = `
      SELECT id, title, academic_year AS "academicYear", created_at AS "createdAt"
      FROM timetables
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  },

  delete: async (id: string): Promise<void> => {
    await pool.query(`DELETE FROM timetables WHERE id = $1;`, [id]);
  },
};
