# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | ✅ |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Email or message the maintainer via GitHub (@vnmoorthy) with:

- description of the issue
- steps to reproduce
- impact assessment
- any suggested fix

We aim to acknowledge within **72 hours**.

## Scope notes

Continuum ships in **DEMO mode** by default (workspace-isolated SQLite, labeled simulations).  
Connected sponsor integrations use **server-side env credentials only** — never put API keys in the client, README examples with real secrets, or committed `.env` files.

Known intentional limitations (not vulnerabilities by themselves):

- Demo session auth is for hackathon/demo isolation, not enterprise IAM
- Single-process SQLite is not a multi-tenant production profile
- Provider adapters fall back to labeled DEMO when credentials are absent
