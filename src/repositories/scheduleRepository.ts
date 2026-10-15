import { pool } from "../config/db";
import { CreateTimetableDto } from "../dtos/scheduleDto";

export class ScheduleRepository {
  public static async create(
    dto: CreateTimetableDto,
    adminId: string,
  ): Promise<any> {
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
        const eventQuery = `
          INSERT INTO schedule_events (timetable_id, type, start_time, end_time, classroom, label, location, subject_id, teacher_id, created_by_admin_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING id;
        `;
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

        const eventValues = [
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
        ];

        const eventResult = await client.query(eventQuery, eventValues);
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
      return this.findById(timetable.id);
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
        t.id, t.title, t.academic_year AS "academicYear", t.created_at AS "createdAt",
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', e.id,
            'type', e.type,
            'startTime', e.start_time,
            'endTime', e.end_time,
            'classroom', e.classroom,
            'label', e.label,
            'location', e.location,
            'subjectId', e.subject_id,
            'teacherId', e.teacher_id
          ))
          FROM schedule_events e
          WHERE e.timetable_id = t.id
        ), '[]'::json) AS events
      FROM timetables t
      WHERE t.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  public static async findAll(): Promise<any[]> {
    const query = `
      SELECT id, title, academic_year AS "academicYear", created_at AS "createdAt"
      FROM timetables
      ORDER BY created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  public static async delete(id: string): Promise<void> {
    await pool.query(`DELETE FROM timetables WHERE id = $1;`, [id]);
  }
}
