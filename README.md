# TGI Admin – Backend

REST API of the school administration application of Collège Saint Michel (TGI Amparibe).
Node.js, TypeScript, Express and PostgreSQL.

## OpenAPI-first design

`docs/openAPI.yml` is the single source of truth. There is no route file.

| Concern           | How the specification drives it                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Routing           | every operation has a unique `operationId`, resolved to a controller handler of the same name (`src/utils/operationRegistry.ts`)    |
| Authentication    | `bearerAuth` security scheme, verified by `authenticateWithSpecification` (`src/middlewares/authMiddleware.ts`)                     |
| Authorization     | the `x-roles` list of each operation                                                                                                |
| Validation        | request schemas, validated by `express-openapi-validator` (`src/middlewares/validateMiddlewares.ts`)                                |
| Frontend contract | `GET /api/v1/spec` serves the document; the frontend finds the path, method and parameters of each operation from its `operationId` |

To add an endpoint: describe it in `docs/openAPI.yml` (with `operationId` and `x-roles`), add a handler named
after the `operationId` in the matching controller, then run `npm run check:spec`.

## Requirements

- Node.js 20 or later
- PostgreSQL 14 or later with the `uuid-ossp` extension

## Getting started

```bash
npm install
# create a .env file with the variables listed below
psql -h localhost -U <user> -d <database> -f src/db/schema.sql
npm run dev
```

Once running:

| URL            | Content                                                   |
| -------------- | --------------------------------------------------------- |
| `/`            | paths of the API, the documentation and the specification |
| `/api/v1/docs` | Swagger UI                                                |
| `/api/v1/spec` | the OpenAPI document as JSON                              |

## Environment variables

| Variable                                                  | Description                                                                        |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `PORT`                                                    | HTTP port (default `3000`)                                                         |
| `JWT_SECRET`                                              | secret used to sign the tokens                                                     |
| `JWT_EXPIRES_IN`                                          | token lifetime, for example `24h`                                                  |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection                                                              |
| `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`               | account created or promoted as super administrator at startup                      |
| `SCHOOL_TIME_ZONE`                                        | time zone used to decide whether a teacher is late (default `Indian/Antananarivo`) |

Never commit the `.env` file.

## Scripts

| Command              | Description                                                     |
| -------------------- | --------------------------------------------------------------- |
| `npm run dev`        | start with reload (`tsx watch`)                                 |
| `npm run build`      | compile to `dist/`                                              |
| `npm start`          | run the compiled server                                         |
| `npm run check:spec` | fail when the specification and the controllers are out of sync |

## Database

- `src/db/schema.sql`: full schema for a new database.
- `src/db/upgrade.sql`: idempotent migration for an existing database. Run it before deploying a new version.

## Project structure

```
docs/openAPI.yml          API specification
scripts/                  checkOpenApiSpec.js
src/
  config/                 database pool
  controllers/            one handler per operationId
  db/                     schema.sql, upgrade.sql
  dtos/                   TypeScript request types
  middlewares/            authentication, spec validation, error handler
  models/                 TypeScript entities
  repositories/           SQL queries
  seeders/                super administrator seeding
  services/               business rules, PDF generation
  utils/                  specification loader, operation registry, access control, helpers
  index.ts                application entry point
```

Flow of a request: specification middleware (route, token, role, validation) → controller → service → repository.

## Business rules

### Roles

`ADMIN`, `SECRETARY`, `TEACHER`, `STUDENT`. The allowed roles of each operation are in `x-roles`.

### Super administrator

- Only the super administrator can read or update the account.
- Other accounts do not see it in `GET /users` and `GET /users/staff`.
- Nobody can delete it, including itself.
- It cannot be created through the API.

### Accounts

- The login is the email and the password is the matricule.
- Email and contact number are not set at creation; they are added when the profile is updated.
- Changing the matricule renews the password unless one is given.

### Grades

1. The admin opens a session (class, subject, exam type, term) with `createGradeSession`.
2. The secretary fills the grades out of 20 and sends the session with `submitGradeSession`.
3. The admin can correct the submitted grades and write absence motifs with `reviseGradeSession`.
4. The admin publishes with `validateGradeSession`; report cards are recomputed.

A grade is optional. Every active student of the class without a grade is absent: an `ABSENCE` record is
added to the student file with the current date and time, the motif is written by the admin, and the student
is not ranked for the subject.

### Report cards

- Each grade of the report card is the grade out of 20 multiplied by the coefficient of the subject.
- A missing grade stays empty and is not counted in the averages.
- The overall average is the sum of the weighted subject averages divided by the sum of the coefficients of the counted subjects.
- Rank is computed per class and academic year; students without any counted subject have no report card.
- The PDF is generated by `exportResultPdf` and stored in `uploads/report-cards/`.

## Deployment (Render)

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Set the environment variables above. Use the internal database URL host when the service and the database share a region; with an external host, the connection needs SSL.
- Run `src/db/upgrade.sql` (or `schema.sql` on an empty database) before the first start.
