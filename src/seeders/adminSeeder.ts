import bcrypt from "bcrypt";
import { pool } from "../config/db";

const PASSWORD_SALT_ROUNDS = 10;
const SUPER_ADMIN_MATRICULE = "ADM-001";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";

const findAdminUserId = async (): Promise<string | null> => {
  const { rows } = await pool.query(
    `SELECT u.id
     FROM users u
     WHERE u.user_type = 'ADMIN'
     ORDER BY (LOWER(u.email) = LOWER($1)) DESC NULLS LAST, u.created_at ASC
     LIMIT 1;`,
    [process.env.SUPER_ADMIN_EMAIL],
  );
  return rows[0]?.id ?? null;
};

const createAdminUser = async (): Promise<string> => {
  const hashedPassword = await bcrypt.hash(
    process.env.SUPER_ADMIN_PASSWORD!,
    PASSWORD_SALT_ROUNDS,
  );
  const { rows } = await pool.query(
    `INSERT INTO users (first_name, last_name, contact_number, email, password, matricule, user_type, gender)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id;`,
    [
      "Super",
      "Admin",
      "",
      process.env.SUPER_ADMIN_EMAIL,
      hashedPassword,
      SUPER_ADMIN_MATRICULE,
      "ADMIN",
      "MALE",
    ],
  );
  return rows[0].id;
};

const hasSuperAdmin = async (): Promise<boolean> => {
  const { rows } = await pool.query(
    `SELECT 1 FROM administrators WHERE role = $1 LIMIT 1;`,
    [SUPER_ADMIN_ROLE],
  );
  return rows.length > 0;
};

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    if (await hasSuperAdmin()) {
      return;
    }

    const adminId = (await findAdminUserId()) ?? (await createAdminUser());

    await pool.query(
      `INSERT INTO administrators (user_id, role) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;`,
      [adminId, SUPER_ADMIN_ROLE],
    );
    console.log("Super Admin successfully linked to administrators table");
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    throw error;
  }
};
