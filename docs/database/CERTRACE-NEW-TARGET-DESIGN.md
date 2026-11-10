# Database design for certrace-new

The implemented design is the [compact schema guide](CERTRACE-V2-SCHEMA.md): 37 Prisma models in 569 lines, with complete JSONB documents and revision control. It supersedes the earlier proposed domain-table splits and the withdrawn 73-table migration.

The user authorized deleting old report/verification inputs while preserving users and all onboarding data. The executable migration and updated backend adapter implement that boundary. The [parity plan](../CERTRACE-NEW-PARITY-PLAN.md) covers the remaining UI/API port. `certrace-new` remains a read-only reference.
