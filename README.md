# ATLAS SkillTech University — Admission Application Form

A web application that renders the university admission form, validates and
processes submissions, handles document uploads, and sends applicants a
confirmation. Built with **Node.js + Express**, **EJS** views and a **MySQL**
backend.

## Features

- Server-rendered admission form with cascading, dependent select fields
- Server-side form validation
- Secure document uploads with type/size limits
- Application submission with confirmation email and generated PDF
- Optional SMS and reCAPTCHA integrations

## Tech stack

| Layer        | Technology            |
| ------------ | --------------------- |
| Runtime      | Node.js + Express     |
| Views        | EJS                   |
| Database     | MySQL (via `mysql2`)  |
| File uploads | `multer`              |
| Email        | `nodemailer` (SMTP)   |
| PDF          | `puppeteer-core`      |
| Object store | S3-compatible storage |

## Getting started

### Prerequisites

- Node.js 18+
- A reachable MySQL instance
- Credentials for the external services you intend to enable (email, SMS,
  object storage, reCAPTCHA)

### Install & run

```bash
npm install
cp .env.example .env     # fill in your own values — see .env.example
npm run dev              # development (auto-reload)
# or
npm start                # production
```

The app listens on the port defined by `PORT` (default `3000`).

## Configuration

All configuration is supplied through environment variables and is **never**
committed to the repository. Copy `.env.example` to `.env` and fill in values
for your environment. `.env` is git-ignored.

Configuration groups (see `.env.example` for the full list of keys):

- **Server** — port, environment, session secret
- **Database** — MySQL connection settings
- **Uploads** — upload directory and limits
- **Object storage** — S3-compatible credentials and bucket
- **Email** — SMTP host and credentials
- **SMS** — provider credentials (optional)
- **reCAPTCHA** — site/secret keys (optional)

> Provide credentials only through environment variables or your platform's
> secret manager. Do not hardcode secrets in source, and do not paste them
> into issues, pull requests, or logs.

## Project layout

```
server.js            # application entry point
config/              # database pool & upload configuration
controllers/         # request handlers and validation
models/              # data-access layer
routes/              # route definitions
services/            # external integrations (storage, mail, PDF, SMS, reCAPTCHA)
views/               # EJS templates (form, emails, PDF, partials)
public/              # static assets (CSS, client JS)
scripts/             # maintenance scripts
sql/                 # schema reference
```

## Security

Security is a first-class concern for this project. Please observe the
following:

- **Secrets** live only in environment variables / a secret manager — never in
  source control. If a credential is ever exposed, **rotate it immediately**.
- **Dependencies** should be kept current; run `npm audit` regularly.
- **Transport** — always serve the application over HTTPS in production so that
  session cookies and form data are encrypted in transit.
- **Uploads** are validated by type and size and stored outside the web root.
- **reCAPTCHA** should be enabled in production to protect the public form from
  automated abuse.
- To report a vulnerability, see [`SECURITY.md`](./SECURITY.md). Please do not
  open a public issue for security reports.

## License

Proprietary — © ATLAS SkillTech University. All rights reserved.
