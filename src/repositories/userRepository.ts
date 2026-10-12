import { pool } from "../config/db";
import { User } from "../models";
import {
  CreateAdministratorDto,
  CreateStudentDto,
  CreateSecretaryDto,
} from "../dtos";

export class UserRepository {
  public static async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl"
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [email]);
    return rows[0] || null;
  }

  public static async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl"
      FROM users
      WHERE id = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [id]);
    return rows[0] || null;
  }

  public static async findByMatricule(matricule: string): Promise<User | null> {
    const query = `
      SELECT id, first_name AS "firstName", last_name AS "lastName", email, password, matricule, role
      FROM users
      WHERE matricule = $1
      LIMIT 1;
    `;
    const { rows } = await pool.query<User>(query, [matricule]);
    return rows[0] || null;
  }

  public static async createAdministrator(
    data: CreateAdministratorDto,
    matricule: string,
  ): Promise<User> {
    const query = `
      INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl";
    `;
    const values = [
      data.firstName,
      data.lastName,
      data.password,
      matricule,
      data.contactNumber,
      data.email || null,
      data.profilePictureUrl || null,
      data.role || "ADMIN",
    ];
    const { rows } = await pool.query<User>(query, values);
    return rows[0];
  }

  public static async createStudent(
    data: CreateStudentDto,
    matricule: string,
  ): Promise<User> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userQuery = `
        INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'STUDENT')
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl";
      `;
      const userValues = [
        data.firstName,
        data.lastName,
        data.password,
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

      const studentDetailsQuery = `
        INSERT INTO students (user_id, class_roll_number, class_group, date_of_birth, gender, address, parents_email, parents_contact_number, comments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
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
  }

  public static async createSecretary(
    data: CreateSecretaryDto,
    matricule: string,
  ): Promise<User> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userQuery = `
        INSERT INTO users (first_name, last_name, password, matricule, contact_number, email, profile_picture_url, role)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'SECRETARY')
        RETURNING id, first_name AS "firstName", last_name AS "lastName", email, matricule, role, contact_number AS "contactNumber", profile_picture_url AS "profilePictureUrl";
      `;
      const userValues = [
        data.firstName,
        data.lastName,
        data.password,
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
  }

  public static async findUserWithDetailsById(id: string): Promise<any | null> {
    const query = `
      SELECT 
        u.id, u.first_name AS "firstName", u.last_name AS "lastName", u.email, 
        u.contact_number AS "contactNumber", u.profile_picture_url AS "profilePictureUrl", 
        u.user_type AS "role",
        s.class_roll_number AS "classRollNumber", s.class_group AS "classGroup", 
        s.date_of_birth AS "dateOfBirth", s.gender, s.address, 
        s.parents_email AS "parentsEmail", s.parents_contact_number AS "parentsContactNumber", s.comments,
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
  }
  public static async updateUserBase(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      contactNumber?: string;
      profilePictureUrl?: string;
    },
  ): Promise<void> {
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
  }

  public static async updateStudentDetails(
    userId: string,
    data: any,
  ): Promise<void> {
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
  }

  public static async updateSecretaryDetails(
    userId: string,
    data: any,
  ): Promise<void> {
    if (data.department !== undefined) {
      await pool.query(
        `UPDATE secretaries SET department = $1 WHERE user_id = $2;`,
        [data.department, userId],
      );
    }
  }

  public static async updateTeacherDetails(
    userId: string,
    data: any,
  ): Promise<void> {
    if (data.homeroomClass !== undefined) {
      await pool.query(
        `UPDATE teachers SET homeroom_class = $1 WHERE user_id = $2;`,
        [data.homeroomClass, userId],
      );
    }
  }
}
