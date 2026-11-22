import { PoolClient } from "pg";
import { pool } from "../config/db";
import {
  ClassAssignmentDto,
  CreateSubjectDto,
  UpdateSubjectDto,
} from "../dtos/subjectDto";
import { Subject } from "../models/subjectModel";
import { AppError } from "../utils/AppError";
import { buildUpdateStatement } from "../utils/sqlUpdate";

const SUBJECT_SELECT = `
  SELECT s.id, s.name, s.coefficient::float AS coefficient, s.is_active AS "isActive",
         s.created_at AS "createdAt",
         COALESCE(
           json_agg(
             json_build_object(
               'classGroup', ts.class_group,
               'teacherId', ts.teacher_id,
               'teacherFirstName', u.first_name,
               'teacherLastName', u.last_name
             ) ORDER BY ts.class_group
           ) FILTER (WHERE ts.subject_id IS NOT NULL),
           '[]'::json
         ) AS assignments
  FROM subjects s
  LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id
  LEFT JOIN users u ON u.id = ts.teacher_id
`;

const SUBJECT_GROUP_BY = `GROUP BY s.id`;

const SUBJECT_UPDATE_COLUMN_MAPPING: Record<string, string> = {
  name: "name",
  coefficient: "coefficient",
};

const assertNameIsFreeForEachClass = async (
  client: PoolClient,
  name: string,
  assignments: ClassAssignmentDto[],
  currentSubjectId?: string,
): Promise<void> => {
  const results = await Promise.all(
    assignments.map(({ classGroup }) =>
      client.query(
        `SELECT s.id
         FROM subjects s
         JOIN subject_target_classes stc ON s.id = stc.subject_id
         WHERE LOWER(s.name) = LOWER($1) AND stc.target_class = $2
           AND s.is_active = TRUE AND ($3::uuid IS NULL OR s.id <> $3)
         LIMIT 1;`,
        [name, classGroup, currentSubjectId ?? null],
      ),
    ),
  );

  const conflictIndex = results.findIndex((result) => result.rows.length > 0);
  if (conflictIndex >= 0) {
    throw new AppError(
      `Subject '${name}' already exists and is active for class '${assignments[conflictIndex].classGroup}'`,
      400,
    );
  }
};

const replaceAssignments = async (
  client: PoolClient,
  subjectId: string,
  assignments: ClassAssignmentDto[],
): Promise<void> => {
  await client.query(`DELETE FROM teacher_subjects WHERE subject_id = $1`, [
    subjectId,
  ]);
  await client.query(
    `DELETE FROM subject_target_classes WHERE subject_id = $1`,
    [subjectId],
  );

  await Promise.all(
    assignments.flatMap(({ classGroup, teacherId }) => [
      client.query(
        `INSERT INTO subject_target_classes (subject_id, target_class) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
        [subjectId, classGroup],
      ),
      client.query(
        `INSERT INTO teacher_subjects (subject_id, class_group, teacher_id) VALUES ($1, $2, $3)
         ON CONFLICT (subject_id, class_group) DO UPDATE SET teacher_id = EXCLUDED.teacher_id;`,
        [subjectId, classGroup, teacherId],
      ),
    ]),
  );
};

export const subjectRepository = {
  create: async (dto: CreateSubjectDto): Promise<Subject> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await assertNameIsFreeForEachClass(client, dto.name, dto.assignments);

      const { rows } = await client.query(
        `INSERT INTO subjects (name, coefficient, is_active)
         VALUES ($1, $2, TRUE)
         RETURNING id;`,
        [dto.name, dto.coefficient],
      );
      const subjectId: string = rows[0].id;

      await replaceAssignments(client, subjectId, dto.assignments);
      await client.query("COMMIT");
      return (await subjectRepository.findById(subjectId)) as Subject;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  update: async (id: string, dto: UpdateSubjectDto): Promise<Subject> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const statement = buildUpdateStatement(SUBJECT_UPDATE_COLUMN_MAPPING, {
        ...dto,
      });
      if (statement) {
        await client.query(
          `UPDATE subjects SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${statement.values.length + 1}`,
          [...statement.values, id],
        );
      }

      if (dto.assignments) {
        const subjectName =
          dto.name ??
          (await client.query(`SELECT name FROM subjects WHERE id = $1`, [id]))
            .rows[0].name;
        await assertNameIsFreeForEachClass(
          client,
          subjectName,
          dto.assignments,
          id,
        );
        await replaceAssignments(client, id, dto.assignments);
      }

      await client.query("COMMIT");
      return (await subjectRepository.findById(id)) as Subject;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findById: async (id: string): Promise<Subject | null> => {
    const { rows } = await pool.query<Subject>(
      `${SUBJECT_SELECT} WHERE s.id = $1 ${SUBJECT_GROUP_BY};`,
      [id],
    );
    return rows[0] || null;
  },

  findAll: async (): Promise<Subject[]> => {
    const { rows } = await pool.query<Subject>(
      `${SUBJECT_SELECT} WHERE s.is_active = TRUE ${SUBJECT_GROUP_BY} ORDER BY s.name ASC;`,
    );
    return rows;
  },

  deactivate: async (id: string): Promise<void> => {
    await pool.query(
      `UPDATE subjects SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1;`,
      [id],
    );
  },
};
