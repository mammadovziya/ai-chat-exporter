# Security

Please report security issues privately before opening a public issue.

Recommended report contents:

- The affected browser and extension version.
- Steps to reproduce.
- Expected and actual behavior.
- Whether conversation content could leave the browser.

Project safety principles:

- Keep permissions narrow.
- Do not add server-side processing for conversation content.
- Do not add analytics or remote logging.
- Treat supported AI chat page markup as untrusted input and sanitize exported
  HTML.
- Prefer transparent, inspectable code over opaque dependencies.
- Keep release artifacts reproducible from the source tree.

For the detailed threat model, permission rationale, sanitization notes, and
security checklist, see `docs/SECURITY_REVIEW.md`.
