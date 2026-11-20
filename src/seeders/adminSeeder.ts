import bcrypt from "bcrypt";
import { pool } from "../config/db";

const PASSWORD_SALT_ROUNDS = 10;
const SUPER_ADMIN_MATRICULE = "ADM-001";

/**
 * Returns the id of the first administrator user, creating the super admin
 * account (email and password come from the environment) when none exists.
 */
const findOrCreateAdminUserId = async (): Promise<string> => {
  const existingAdmin = await pool.query(
    `SELECT id FROM users WHERE user_type = $1 LIMIT 1;`,
    ["ADMIN"],
  );
  if (existingAdmin.rows.length > 0) {
    return existingAdmin.rows[0].id;
  }

  const hashedPassword = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD!,
    PASSWORD_SALT_ROUNDS,
  );
  const insertedAdmin = await pool.query(
    `INSERT INTO users (first_name, last_name, contact_number, email, password, matricule, user_type, gender)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id;`,
    [
      "Super",
      "Admin",
      "0000000000",
      process.env.SUPER_ADMIN_EMAIL,
      hashedPassword,
      SUPER_ADMIN_MATRICULE,
      "ADMIN",
      "MALE",
    ],
  );
  return insertedAdmin.rows[0].id;
};

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    const adminId = await findOrCreateAdminUserId();

    const administratorRow = await pool.query(
      `SELECT user_id FROM administrators WHERE user_id = $1 LIMIT 1;`,
      [adminId],
    );

    if (administratorRow.rows.length === 0) {
      await pool.query(
        `INSERT INTO administrators (user_id, role) VALUES ($1, $2);`,
        [adminId, "SUPER_ADMIN"],
      );
      console.log("Super Admin successfully linked to administrators table");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    throw error;
  }
};
