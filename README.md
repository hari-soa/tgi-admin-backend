TGI Admin Backend
REST API for the modern school-management system used by the TGI (Technologie Générale Industriel) branch of Collège Saint Michel Amparibe.

Features
JWT authentication and role-based access control
Administration of students, teachers, secretaries, and administrators
Subjects, class assignments, and teacher schedules
Grade sessions with secretary submission and administrator approval
Annual results and PDF report-card generation
Teacher attendance tracking
Student disciplinary records and remarks
Targeted announcements
Interactive Swagger/OpenAPI documentation
Stack
Language: TypeScript
Runtime: Node.js
Framework: Express 5
Database: PostgreSQL
Validation: Zod
Authentication: JSON Web Tokens and bcrypt
API documentation: OpenAPI 3, Swagger UI
PDF generation: PDFKit
Project Structure
Text
src/
  config/       PostgreSQL connection configuration
  controllers/  HTTP request and response handling
  db/           PostgreSQL schema and upgrades
  dtos/         Zod schemas and typed request data
  middlewares/  Authentication, validation, and error handling
  models/       Domain types and role/class enumerations
  repositories/ Direct PostgreSQL queries
  routes/       Express route definitions
  seeders/      Initial super-administrator setup
  services/     Business logic and PDF generation
  utils/        JWT, access control, and shared helpers
  index.ts      Application entry point

docs/
  openAPI.yml   API specification

scripts/
  checkOpenApiSpec.js  Verifies routes against OpenAPI operations
API Areas
Area	Base route
Authentication	/api/v1/auth
Users	/api/v1/users
Subjects	/api/v1/subjects
Announcements	/api/v1/announcements
Disciplinary records	/api/v1/disciplinary
Attendance	/api/v1/attendance
Grades	/api/v1/grades
Results	/api/v1/results
API documentation	/api/v1/docs
Swagger documentation is available at:

Text
http://localhost:3000/api/v1/docs
Requirements
Node.js 20 or newer
PostgreSQL
npm
Environment Variables
Create a .env file in the repository root:

Dotenv
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=tgi_admin

SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=change-this-password

JWT_SECRET=replace-with-a-long-random-secret
Installation
bash
git clone https://github.com/hari-soa/tgi-admin-backend.git
cd tgi-admin-backend
npm install
Create the database and apply the SQL schema:

bash
createdb tgi_admin
psql tgi_admin -f src/db/schema.sql
Then start the development server:

bash
npm run dev
The API will listen on http://localhost:3000 by default.

Scripts
bash
npm run dev          # Start with automatic reload
npm run build        # Compile TypeScript into dist/
npm start            # Run the compiled application
npm run check:spec   # Check routes against docs/openAPI.yml
Database
The PostgreSQL schema is defined in src/db/schema.sql. It includes:

User roles: administrator, teacher, secretary, and student
Student history, remarks, and disciplinary records
Subjects and teacher/class assignments
Teacher attendance schedules and records
Grade sessions and grade approval workflow
Annual results and PDF report-card breakdowns
Announcements and class targets
Authentication
Users log in with an email and matricule. Successful authentication returns a JWT; send it with protected requests:

HTTP
Authorization: Bearer <token>
On startup, the application creates or reuses a super-administrator using SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD.

PDF Report Cards
Annual results can be exported as PDF report cards under:

Text
uploads/report-cards/
PDF files are exposed through the /uploads static route.

API Specification
The committed OpenAPI specification is docs/openAPI.yml. Keep it synchronized with the route definitions:

bash
npm run check:spec
