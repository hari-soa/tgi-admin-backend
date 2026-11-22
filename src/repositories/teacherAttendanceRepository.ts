import { pool } from "../config/db";
import {
  CreateAttendanceSlotDto,
  UpdateAttendanceSlotDto,
} from "../dtos/teacherAttendanceDto";
import {
  AttendanceCardView,
  AttendanceStatus,
  AttendanceSummaryCard,
  TeacherAttendance,
  TeacherAttendanceSlot,
} from "../models/teacherAttendanceModel";
import { buildUpdateStatement } from "../utils/sqlUpdate";

const SLOT_COLUMNS = `
  id, teacher_id AS "teacherId", subject_id AS "subjectId", target_class AS "targetClass",
  day_of_week AS "dayOfWeek", start_time AS "startTime", end_time AS "endTime",
  created_at AS "createdAt", updated_at AS "updatedAt"
`;

const ATTENDANCE_COLUMNS = `
  id, slot_id AS "slotId", attendance_date::text AS "attendanceDate", status,
  actual_check_in_time AS "actualCheckInTime", late_duration_minutes AS "lateDurationMinutes",
  motif, recorded_by AS "recordedBy", created_at AS "createdAt", updated_at AS "updatedAt"
`;

const SLOT_COLUMN_MAPPING: Record<string, string> = {
  teacherId: "teacher_id",
  subjectId: "subject_id",
  targetClass: "target_class",
  dayOfWeek: "day_of_week",
  startTime: "start_time",
  endTime: "end_time",
};

export interface UpsertAttendanceInput {
  slotId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkInTime: Date | null;
  lateMinutes: number;
  recordedBy: string;
  motif?: string;
}

export const teacherAttendanceRepository = {
  createSlot: async (
    dto: CreateAttendanceSlotDto,
  ): Promise<TeacherAttendanceSlot> => {
    const { rows } = await pool.query(
      `INSERT INTO teacher_attendance_slots (teacher_id, subject_id, target_class, day_of_week, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${SLOT_COLUMNS};`,
      [
        dto.teacherId,
        dto.subjectId,
        dto.targetClass,
        dto.dayOfWeek,
        dto.startTime,
        dto.endTime,
      ],
    );
    return rows[0];
  },

  countOverlappingSlots: async (
    teacherId: string,
    dayOfWeek: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string,
  ): Promise<number> => {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count
       FROM teacher_attendance_slots
       WHERE teacher_id = $1 AND day_of_week = $2
         AND start_time < $4 AND end_time > $3
         AND ($5::uuid IS NULL OR id <> $5);`,
      [teacherId, dayOfWeek, startTime, endTime, excludeSlotId ?? null],
    );
    return rows[0].count;
  },

  getDailyCards: async (
    dayOfWeek: string,
    attendanceDate: string,
  ): Promise<AttendanceCardView[]> => {
    const { rows } = await pool.query(
      `SELECT tas.id AS "slotId", ta.id AS "attendanceId",
              tas.teacher_id AS "teacherId",
              u.first_name AS "teacherFirstName", u.last_name AS "teacherLastName",
              tas.subject_id AS "subjectId", s.name AS "subjectName",
              tas.target_class AS "targetClass",
              tas.day_of_week AS "dayOfWeek",
              tas.start_time AS "startTime", tas.end_time AS "endTime",
              $2::text AS "attendanceDate",
              COALESCE(ta.status::text, 'PENDING') AS status,
              ta.actual_check_in_time AS "actualCheckInTime",
              COALESCE(ta.late_duration_minutes, 0) AS "lateDurationMinutes",
              ta.motif
       FROM teacher_attendance_slots tas
       JOIN teachers t ON tas.teacher_id = t.user_id
       JOIN users u ON t.user_id = u.id
       JOIN subjects s ON tas.subject_id = s.id
       LEFT JOIN teacher_attendances ta ON tas.id = ta.slot_id AND ta.attendance_date = $2
       WHERE tas.day_of_week = $1
       ORDER BY tas.start_time ASC;`,
      [dayOfWeek, attendanceDate],
    );
    return rows;
  },

  upsertAttendance: async (
    input: UpsertAttendanceInput,
  ): Promise<TeacherAttendance> => {
    const { rows } = await pool.query(
      `INSERT INTO teacher_attendances (slot_id, attendance_date, status, actual_check_in_time, late_duration_minutes, recorded_by, motif)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (slot_id, attendance_date)
       DO UPDATE SET status = EXCLUDED.status,
                     actual_check_in_time = EXCLUDED.actual_check_in_time,
                     late_duration_minutes = EXCLUDED.late_duration_minutes,
                     recorded_by = EXCLUDED.recorded_by,
                     motif = COALESCE(EXCLUDED.motif, teacher_attendances.motif),
                     updated_at = CURRENT_TIMESTAMP
       RETURNING ${ATTENDANCE_COLUMNS};`,
      [
        input.slotId,
        input.attendanceDate,
        input.status,
        input.checkInTime,
        input.lateMinutes,
        input.recordedBy,
        input.motif ?? null,
      ],
    );
    return rows[0];
  },

  updateMotif: async (
    slotId: string,
    attendanceDate: string,
    motif: string,
  ): Promise<TeacherAttendance | null> => {
    const { rows } = await pool.query(
      `UPDATE teacher_attendances
       SET motif = $3, updated_at = CURRENT_TIMESTAMP
       WHERE slot_id = $1 AND attendance_date = $2
       RETURNING ${ATTENDANCE_COLUMNS};`,
      [slotId, attendanceDate, motif],
    );
    return rows[0] || null;
  },

  getSummaryCards: async (
    teacherId?: string,
  ): Promise<AttendanceSummaryCard[]> => {
    const { rows } = await pool.query(
      `SELECT t.user_id AS "teacherId",
              u.first_name AS "teacherFirstName", u.last_name AS "teacherLastName",
              s.id AS "subjectId", s.name AS "subjectName",
              tas.target_class AS "targetClass", ta.status,
              COUNT(ta.id)::int AS "occurrenceCount",
              COALESCE(SUM(ta.late_duration_minutes), 0)::int AS "totalLateMinutes",
              COALESCE(
                json_agg(json_build_object('attendanceDate', ta.attendance_date::text, 'motif', ta.motif))
                  FILTER (WHERE ta.motif IS NOT NULL),
                '[]'::json
              ) AS motifs
       FROM teacher_attendances ta
       JOIN teacher_attendance_slots tas ON ta.slot_id = tas.id
       JOIN teachers t ON tas.teacher_id = t.user_id
       JOIN users u ON t.user_id = u.id
       JOIN subjects s ON tas.subject_id = s.id
       WHERE ta.status IN ('LATE', 'ABSENT')
         AND ($1::uuid IS NULL OR t.user_id = $1)
       GROUP BY t.user_id, u.first_name, u.last_name, s.id, s.name, tas.target_class, ta.status
       ORDER BY "occurrenceCount" DESC;`,
      [teacherId ?? null],
    );
    return rows;
  },

  findSlotById: async (
    slotId: string,
  ): Promise<TeacherAttendanceSlot | null> => {
    const { rows } = await pool.query(
      `SELECT ${SLOT_COLUMNS} FROM teacher_attendance_slots WHERE id = $1;`,
      [slotId],
    );
    return rows[0] || null;
  },

  updateSlot: async (
    slotId: string,
    dto: UpdateAttendanceSlotDto,
  ): Promise<TeacherAttendanceSlot | null> => {
    const statement = buildUpdateStatement(SLOT_COLUMN_MAPPING, dto);
    if (!statement) {
      return teacherAttendanceRepository.findSlotById(slotId);
    }
    const { rows } = await pool.query(
      `UPDATE teacher_attendance_slots
       SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${statement.values.length + 1}
       RETURNING ${SLOT_COLUMNS};`,
      [...statement.values, slotId],
    );
    return rows[0] || null;
  },

  deleteSlot: async (slotId: string): Promise<boolean> => {
    const { rowCount } = await pool.query(
      `DELETE FROM teacher_attendance_slots WHERE id = $1;`,
      [slotId],
    );
    return (rowCount ?? 0) > 0;
  },
};
