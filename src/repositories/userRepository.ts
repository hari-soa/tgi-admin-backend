import { pool } from "../config/db";
import { User } from "../models/userModel";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos/userDto";

export const userRepository = {
  findByEmail: async (email: string): Promise<User | null> => {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, user_type AS "role", contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl", gender
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [email]);
    return rows[0] || null;
  },

  findById: async (id: string): Promise<User | null> => {
    const query = `
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, u.matricule, u.user_type AS "role", u.contact_number AS "contactNumber", u.profile_picture_url AS "profilePictureUrl", u.gender,
             s.class_roll_number AS "classRollNumber", s.class_group AS "classGroup", s.entry_year AS "entryYear", s.graduation_year AS "graduationYear", s.is_active AS "isActive"
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  findByMatricule: async (matricule: string): Promise<User | null> => {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, user_type AS "role", gender
      FROM users
      WHERE matricule = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [matricule]);
    return rows[0] || null;
  },

  createAdministrator: async (
    data: CreateAdministratorDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> => {
    const query = `
      INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, user_type, gender)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'ADMIN', 'MALE')
      RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, user_type AS "role", contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl";
    `;
    const values = [
      data.firstName,
      data.lastName,
      hashedPassword,
      matricule,
      data.contactNumber,
      data.email || null,
      data.profilePictureUrl || null,
    ];
    const { rows } = await pool.query<User>(query, values);
    return rows[0];
  },

  createStudent: async (
    data: CreateStudentDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userQuery = `
        INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, user_type, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'STUDENT', $8)
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, user_type AS "role", contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl", gender;
      `;
      const userValues = [
        data.firstName,
        data.lastName,
        hashedPassword,
        matricule,
        data.contactNumber,
        data.email || null,
        data.profilePictureUrl || null,
        data.gender,
      ];
      const { rows: userRows } = await client.query<User>(
        userQuery,
        userValues,
      );
      const newUser = userRows[0];

      const studentDetailsQuery = `
        INSERT INTO students (user_id, class_roll_number, class_group, date_of_birth, gender, address, parents_email, parents_contact_number, comments, entry_year, graduation_year, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE);
      `;
      const studentValues = [
        newUser.id,
        data.classRollNumber,
        data.classGroup,
        data.dateOfBirth,
        data.gender,
        data.address,
        data.parentsEmail,
        data.parentsContactNumber,
        data.comments || null,
        data.entryYear,
        data.graduationYear || null,
      ];
      await client.query(studentDetailsQuery, studentValues);

      await client.query("COMMIT");
      return newUser;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  createSecretary: async (
    data: CreateSecretaryDto,
    matricule: string,
    hashedPassword: string,
  ): Promise<User> => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userQuery = `
        INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, user_type, gender)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'SECRETARY', 'FEMALE')
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, user_type AS "role", contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl";
      `;
      const userValues = [
        data.firstName,
        data.lastName,
        hashedPassword,
        matricule,
        data.contactNumber,
        data.email || null,
        data.profilePictureUrl || null,
      ];
      const { rows: userRows } = await client.query<User>(
        userQuery,
        userValues,
      );
      const newUser = userRows[0];

      const secretaryDetailsQuery = `
        INSERT INTO secretaries (user_id, department)
        VALUES ($1, $2);
      `;
      await client.query(secretaryDetailsQuery, [
        newUser.id,
        data.department || null,
      ]);

      await client.query("COMMIT");
      return newUser;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  },

  findUserWithDetailsById: async (id: string): Promise<any | null> => {
    const query = `
      SELECT u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, 
             u.contact_number AS "contactNumber", u.profile_picture_url AS "profilePictureUrl", 
             u.user_type AS "role", u.matricule, u.gender,
             s.class_roll_number AS "classRollNumber", s.class_group AS "classGroup", 
             s.date_of_birth AS "dateOfBirth", s.address, 
             s.parents_email AS "parentsEmail", s.parents_contact_number AS "parentsContactNumber", s.comments,
             s.entry_year AS "entryYear", s.graduation_year AS "graduationYear", s.is_active AS "isActive",
             sec.department,
             t.homeroom_class AS "homeroomClass"
      FROM users u
      LEFT JOIN administrators a ON u.id = a.user_id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN secretaries sec ON u.id = sec.user_id
      LEFT JOIN teachers t ON u.id = t.user_id
      WHERE u.id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  },

  updateUserBase: async (id: string, data: any): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbColumn = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`,
        );
        fields.push(`${dbColumn} = $${idx++}`);
        values.push(value);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx};`;
    await pool.query(query, values);
  },

  updateStudentDetails: async (userId: string, data: any): Promise<void> => {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      classRollNumber: "class_roll_number",
      classGroup: "class_group",
      dateOfBirth: "date_of_birth",
      gender: "gender",
      address: "address",
      parentsEmail: "parents_email",
      parentsContactNumber: "parents_contact_number",
      comments: "comments",
      graduationYear: "graduation_year",
    };

    for (const [key, dbCol] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${dbCol} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length > 0) {
      values.push(userId);
      const query = `UPDATE students SET ${fields.join(", ")} WHERE user_id = $${idx};`;
      await pool.query(query, values);
    }
  },

  updateSecretaryDetails: async (userId: string, data: any): Promise<void> => {
    if (data.department !== undefined) {
      await pool.query(
        `UPDATE secretaries SET department = $1 WHERE user_id = $2;`,
        [data.department, userId],
      );
    }
  },

  updateTeacherDetails: async (userId: string, data: any): Promise<void> => {
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
};
