import bcrypt from "bcrypt";
import { pool } from "../config/db";

export const seedSuperAdmin = async (): Promise<void> => {
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD!;
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const checkQuery = `SELECT id FROM users WHERE user_type = $1 LIMIT 1;`;
    const checkResult = await pool.query(checkQuery, ["ADMIN"]);

    if (checkResult.rows.length > 0) {
      return;
    }

    const insertQuery = `
      INSERT INTO users (first_name, last_name, contact_number, email, password, matricule, user_type, gender)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;

    const values = [
      "Super",
      "Admin",
      "0000000000",
      adminEmail,
      hashedPassword,
      "ADM-001",
      "ADMIN",
      "MALE",
    ];

    await pool.query(insertQuery, values);
    console.log("Super Admin seeded successfully");
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    throw error;
  }
};
