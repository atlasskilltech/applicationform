# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in this project, please report it
**privately**. Do not open a public GitHub issue, pull request, or discussion
for security matters.

- Email: security contact for ATLAS SkillTech University
- Include: a description of the issue, steps to reproduce, and any relevant
  logs or proof-of-concept (with secrets redacted).

We will acknowledge your report and work with you on remediation and
disclosure timing.

## Handling secrets

- Never commit credentials, API keys, tokens, or `.env` files to the
  repository. `.env` is git-ignored.
- Supply all secrets through environment variables or a secret manager.
- If a secret is ever exposed — in code, history, logs, an issue, or a PR —
  treat it as compromised and **rotate it immediately**.

## Operational guidance

- Serve the application over HTTPS in production.
- Keep dependencies patched; run `npm audit` and apply fixes promptly.
- Enable reCAPTCHA on the public form in production.
- Restrict database and object-storage credentials to the minimum privileges
  the application needs.
