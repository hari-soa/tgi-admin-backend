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
}
