import { PoolClient } from "pg";
import { pool } from "../config/db";
import { User, UserRole } from "../models/userModel";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
  CreateTeacherDto,
} from "../dtos/userDto";
import { buildUpdateStatement } from "../utils/sqlUpdate";

const EMPTY_CONTACT_NUMBER = "";

export interface UserFilters {
  role?: UserRole;
  classGroup?: string;
  search?: string;
}

const USER_BASE_RETURNING = `
  id, first_name AS "firstName", last_name AS "lastName", email, matricule,
  user_type AS "role", gender, contact_number AS "contactNumber",
  profile_picture_url AS "profilePictureUrl"
`;

const USER_WITH_DETAILS_SELECT = `
  SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email,
         u.contact_number AS "contactNumber", u.profile_picture_url AS "profilePictureUrl",
         u.user_type AS "role", u.matricule, u.gender, u.created_at AS "createdAt",
         s.class_roll_number AS "classRollNumber", s.class_group AS "classGroup",
         s.date_of_birth AS "dateOfBirth", s.address,
         s.parents_email AS "parentsEmail", s.parents_contact_number AS "parentsContactNumber",
         s.entry_year AS "entryYear", s.graduation_year AS "graduationYear",
         s.comments, s.is_active AS "isActive",
         t.homeroom_class AS "homeroomClass", sec.department,
         COALESCE(adm.role = 'SUPER_ADMIN', FALSE) AS "isSuperAdmin"
  FROM users u
  LEFT JOIN students s ON u.id = s.user_id
  LEFT JOIN teachers t ON u.id = t.user_id
  LEFT JOIN secretaries sec ON u.id = sec.user_id
  LEFT JOIN administrators adm ON u.id = adm.user_id
`;

const USER_COLUMN_MAPPING: Record<string, string> = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  password: "password",
  matricule: "matricule",
  gender: "gender",
  contactNumber: "contact_number",
  profilePictureUrl: "profile_picture_url",
};

const STUDENT_COLUMN_MAPPING: Record<string, string> = {
  classRollNumber: "class_roll_number",
  classGroup: "class_group",
  dateOfBirth: "date_of_birth",
  gender: "gender",
  address: "address",
  parentsEmail: "parents_email",
  parentsContactNumber: "parents_contact_number",
  entryYear: "entry_year",
  graduationYear: "graduation_year",
  comments: "comments",
  isActive: "is_active",
};

interface BaseUserData {
  firstName: string;
  lastName: string;
  gender: string;
  profilePictureUrl?: string;
}

const insertBaseUser = async (
  client: PoolClient,
  data: BaseUserData,
  userType: UserRole,
  matricule: string,
  hashedPassword: string,
): Promise<User> => {
  const { rows } = await client.query<User>(
    `INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, user_type, gender)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING ${USER_BASE_RETURNING};`,
    [
      data.firstName,
      data.lastName,
      hashedPassword,
      matricule,
      EMPTY_CONTACT_NUMBER,
      null,
      data.profilePictureUrl || null,
      userType,
      data.gender,
    ],
  );
  return rows[0];
};

const createUserWithRoleDetails = async (
  data: BaseUserData,
  userType: UserRole,
  matricule: string,
  hashedPassword: string,
  insertRoleDetails: (client: PoolClient, userId: string) => Promise<unknown>,
): Promise<User> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const newUser = await insertBaseUser(
      client,
      data,
      userType,
      matricule,
      hashedPassword,
    );
    await insertRoleDetails(client, newUser.id);
    await client.query("COMMIT");
    return newUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const userRepository = {
  getAllUsers: async (filters: UserFilters = {}): Promise<User[]> => {
    const conditions = [
      filters.role
        ? { sql: `u.user_type = $PARAM`, value: filters.role }
        : null,
      filters.classGroup
        ? { sql: `s.class_group = $PARAM`, value: filters.classGroup }
        : null,
      filters.search
        ? {
            sql: `(u.first_name ILIKE $PARAM OR u.last_name ILIKE $PARAM OR u.email ILIKE $PARAM OR u.matricule ILIKE $PARAM)`,
            value: `%${filters.search}%`,
          }
        : null,
    ].filter((condition) => condition !== null);

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions
            .map((condition, index) =>
              condition.sql.replaceAll("$PARAM", `$${index + 1}`),
            )
            .join(" AND ")}`
        : "";

    const { rows } = await pool.query<User>(
      `${USER_WITH_DETAILS_SELECT} ${whereClause} ORDER BY u.created_at DESC;`,
      conditions.map((condition) => condition.value),
    );
    return rows;
  },

  findByEmail: async (email: string): Promise<User | null> => {
    const query = `
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.password,
             u.matricule, u.user_type AS "role", u.contact_number AS "contactNumber",
             u.profile_picture_url AS "profilePictureUrl", u.gender, s.is_active AS "isActive"
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE LOWER(u.email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [email]);
    return rows[0] || null;
  },

  findById: async (id: string): Promise<User | null> => {
    const { rows } = await pool.query<User>(
      `${USER_WITH_DETAILS_SELECT} WHERE u.id = $1 LIMIT 1;`,
      [id],
    );
    return rows[0] || null;
  },

  findByMatricule: async (matricule: string): Promise<User | null> => {
    const { rows } = await pool.query<User>(
      `SELECT id, matricule FROM users WHERE matricule = $1 LIMIT 1;`,
      [matricule],
    );
    return rows[0] || null;
  },

  findActiveStudentIdsByClassGroup: async (
    classGroup: string,
  ): Promise<string[]> => {
    const { rows } = await pool.query<{ userId: string }>(
      `SELECT user_id AS "userId" FROM students WHERE class_group = $1 AND is_active = TRUE;`,
      [classGroup],
    );
    return rows.map((row) => row.userId);
  },

  createAdministrator: async (
    data: CreateAdministratorDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> =>
    createUserWithRoleDetails(
      data,
      "ADMIN",
      matricule,
      hashedPassword,
      (client, userId) =>
        client.query(
          `INSERT INTO administrators (user_id, role) VALUES ($1, 'ADMIN');`,
          [userId],
        ),
    ),

  createStudent: async (
    data: CreateStudentDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> =>
    createUserWithRoleDetails(
      data,
      "STUDENT",
      matricule,
      hashedPassword,
      (client, userId) =>
        client.query(
          `INSERT INTO students (user_id, class_roll_number, class_group, date_of_birth, gender, address, parents_email, parents_contact_number, entry_year, graduation_year, comments, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE);`,
          [
            userId,
            data.classRollNumber,
            data.classGroup,
            data.dateOfBirth || null,
            data.gender,
            data.address || null,
            data.parentsEmail || null,
            data.parentsContactNumber || null,
            data.entryYear || new Date().getFullYear(),
            data.graduationYear || null,
            data.comments || null,
          ],
        ),
    ),

  createSecretary: async (
    data: CreateSecretaryDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> =>
    createUserWithRoleDetails(
      data,
      "SECRETARY",
      matricule,
      hashedPassword,
      (client, userId) =>
        client.query(
          `INSERT INTO secretaries (user_id, department) VALUES ($1, $2);`,
          [userId, data.department || null],
        ),
    ),

  createTeacher: async (
    data: CreateTeacherDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> =>
    createUserWithRoleDetails(
      data,
      "TEACHER",
      matricule,
      hashedPassword,
      (client, userId) =>
        client.query(
          `INSERT INTO teachers (user_id, homeroom_class) VALUES ($1, $2);`,
          [userId, data.homeroomClass || null],
        ),
    ),

  updateUserBase: async (
    id: string,
    data: Record<string, unknown>,
  ): Promise<void> => {
    const statement = buildUpdateStatement(USER_COLUMN_MAPPING, data);
    if (!statement) {
      return;
    }
    await pool.query(
      `UPDATE users SET ${statement.setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${statement.values.length + 1};`,
      [...statement.values, id],
    );
  },

  updateStudentDetails: async (
    userId: string,
    data: Record<string, unknown>,
  ): Promise<void> => {
    const statement = buildUpdateStatement(STUDENT_COLUMN_MAPPING, data);
    if (!statement) {
      return;
    }
    await pool.query(
      `UPDATE students SET ${statement.setClause} WHERE user_id = $${statement.values.length + 1};`,
      [...statement.values, userId],
    );
  },

  updateSecretaryDetails: async (
    userId: string,
    data: { department?: string },
  ): Promise<void> => {
    if (data.department !== undefined) {
      await pool.query(
        `UPDATE secretaries SET department = $1 WHERE user_id = $2;`,
        [data.department, userId],
      );
    }
  },

  updateTeacherDetails: async (
    userId: string,
    data: { homeroomClass?: string },
  ): Promise<void> => {
    if (data.homeroomClass !== undefined) {
      await pool.query(
        `UPDATE teachers SET homeroom_class = $1 WHERE user_id = $2;`,
        [data.homeroomClass, userId],
      );
    }
  },

  deactivateStudent: async (userId: string): Promise<void> => {
    await pool.query(
      `UPDATE students SET is_active = FALSE WHERE user_id = $1;`,
      [userId],
    );
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1;`, [
      userId,
    ]);
    return (rowCount ?? 0) > 0;
  },
};
