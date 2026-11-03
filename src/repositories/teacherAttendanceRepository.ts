import { pool } from "../config/db";
import { CreateAttendanceSlotDto } from "../dtos/teacherAttendanceDto";

export const teacherAttendanceRepository = {
  createSlot: async (dto: CreateAttendanceSlotDto): Promise<any> => {
    const query = `
      INSERT INTO teacher_attendance_slots (teacher_id, subject_id, target_class, day_of_week, start_time, end_time, classroom)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const values = [
      dto.teacherId,
      dto.subjectId,
      dto.targetClass,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.classroom,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  countOverlappingSlots: async (
    teacherId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<number> => {
    let query = `
      SELECT COUNT(*) as count
      FROM teacher_attendance_slots
      WHERE teacher_id = $1
        AND day_of_week = $2
        AND start_time < $4
        AND end_time > $3
    `;
    const values: any[] = [teacherId, dayOfWeek, startTime, endTime];

    if (excludeSlotId) {
      query += ` AND id != $5`;
      values.push(excludeSlotId);
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count, 10);
  },

  getDailyCards: async (
    dayOfWeek: string,
    attendanceDate: string,
  ): Promise<any[]> => {
    const query = `
      SELECT 
        tas.id AS "slotId",
        ta.id AS "attendanceId",
        tas.teacher_id AS "teacherId",
        u.first_name AS "teacherFirstName",
        u.last_name AS "teacherLastName",
        tas.subject_id AS "subjectId",
        s.name AS "subjectName",
        tas.target_class AS "targetClass",
        tas.classroom,
        tas.start_time AS "startTime",
        tas.end_time AS "endTime",
        COALESCE(ta.status, 'PENDING') AS "status",
        ta.actual_check_in_time AS "actualCheckInTime",
        COALESCE(ta.late_duration_minutes, 0) AS "lateDurationMinutes",
        ta.motif
      FROM teacher_attendance_slots tas
      JOIN teachers t ON tas.teacher_id = t.user_id
      JOIN users u ON t.user_id = u.id
      JOIN subjects s ON tas.subject_id = s.id
      LEFT JOIN teacher_attendances ta ON tas.id = ta.slot_id AND ta.attendance_date = $2
      WHERE tas.day_of_week = $1
      ORDER BY tas.start_time ASC;
    `;
    const { rows } = await pool.query(query, [dayOfWeek, attendanceDate]);
    return rows;
  },

  upsertAttendance: async (
    slotId: string,
    attendanceDate: string,
    status: string,
    checkInTime: Date,
    lateMinutes: number,
    recordedBy: string,
  ): Promise<any> => {
    const query = `
      INSERT INTO teacher_attendances (slot_id, attendance_date, status, actual_check_in_time, late_duration_minutes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (slot_id, attendance_date)
      DO UPDATE SET 
        status = EXCLUDED.status,
        actual_check_in_time = EXCLUDED.actual_check_in_time,
        late_duration_minutes = EXCLUDED.late_duration_minutes,
        recorded_by = EXCLUDED.recorded_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [
      slotId,
      attendanceDate,
      status,
      checkInTime,
      lateMinutes,
      recordedBy,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  updateMotif: async (
    slotId: string,
    attendanceDate: string,
    motif: string,
  ): Promise<any> => {
    const query = `
      UPDATE teacher_attendances
      SET motif = $3, updated_at = CURRENT_TIMESTAMP
      WHERE slot_id = $1 AND attendance_date = $2
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [slotId, attendanceDate, motif]);
    return rows[0];
  },

  getSummaryCards: async (teacherId?: string): Promise<any[]> => {
    let query = `
      SELECT 
        t.user_id AS "teacherId",
        u.first_name AS "teacherFirstName",
        u.last_name AS "teacherLastName",
        s.id AS "subjectId",
        s.name AS "subjectName",
        tas.target_class AS "targetClass",
        ta.status,
        COUNT(ta.id) AS "occurrenceCount",
        SUM(ta.late_duration_minutes) AS "totalLateMinutes"
      FROM teacher_attendances ta
      JOIN teacher_attendance_slots tas ON ta.slot_id = tas.id
      JOIN teachers t ON tas.teacher_id = t.user_id
      JOIN users u ON t.user_id = u.id
      JOIN subjects s ON tas.subject_id = s.id
      WHERE ta.status IN ('LATE', 'ABSENT')
    `;

    const params: any[] = [];
    if (teacherId) {
      query += ` AND t.user_id = $1`;
      params.push(teacherId);
    }

    query += `
      GROUP BY t.user_id, u.first_name, u.last_name, s.id, s.name, tas.target_class, ta.status
      ORDER BY "occurrenceCount" DESC;
    `;

    const { rows } = await pool.query(query, params);

    for (const row of rows) {
      const motifsQuery = `
        SELECT ta.motif, ta.attendance_date AS "attendanceDate"
        FROM teacher_attendances ta
        JOIN teacher_attendance_slots tas ON ta.slot_id = tas.id
        WHERE tas.teacher_id = $1 
          AND tas.subject_id = $2 
          AND tas.target_class = $3 
          AND ta.status = $4 
          AND ta.motif IS NOT NULL;
      `;
      const motifsResult = await pool.query(motifsQuery, [
        row.teacherId,
        row.subjectId,
        row.targetClass,
        row.status,
      ]);
      row.motifs = motifsResult.rows;
    }

    return rows;
  },

  findSlotById: async (slotId: string): Promise<any> => {
    const { rows } = await pool.query(
      `SELECT * FROM teacher_attendance_slots WHERE id = $1`,
      [slotId],
    );
    return rows[0];
  },

  updateSlot: async (slotId: string, dto: any): Promise<any> => {
    const query = `
      UPDATE teacher_attendance_slots 
      SET teacher_id = COALESCE($2, teacher_id),
          subject_id = COALESCE($3, subject_id),
          target_class = COALESCE($4, target_class),
          day_of_week = COALESCE($5, day_of_week),
          start_time = COALESCE($6, start_time),
          end_time = COALESCE($7, end_time),
          classroom = COALESCE($8, classroom),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `;
    const values = [
      slotId,
      dto.teacherId,
      dto.subjectId,
      dto.targetClass,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
      dto.classroom,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  },

  deleteSlot: async (slotId: string): Promise<any> => {
    const query = `DELETE FROM teacher_attendance_slots WHERE id = $1 RETURNING *;`;
    const { rows } = await pool.query(query, [slotId]);
    return rows[0];
  },
};
