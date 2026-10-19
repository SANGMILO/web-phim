# Supabase database backup

The `Encrypted Supabase backup` GitHub Actions workflow runs every day at
02:15 Asia/Bangkok and keeps encrypted artifacts for 30 days. It can also be
started manually from the Actions tab.

## Required GitHub Actions secrets

- `SUPABASE_DB_URL`: the production database connection URI from Supabase
  **Connect > Direct connection**. Keep SSL enabled.
- `BACKUP_ENCRYPTION_PASSWORD`: a long, unique password also stored in a
  separate password manager. Losing it makes the backups unrecoverable.

Never commit either value. The workflow fails closed when a secret is absent,
and the unencrypted database dump is never written to disk.

## Restore test

Download an artifact, verify its checksum, decrypt it, and restore it into a
separate Supabase test project. Never test a restore against production.

```bash
sha256sum -c supabase-*.dump.enc.sha256
openssl enc -d -aes-256-cbc -pbkdf2 \
  -pass env:BACKUP_ENCRYPTION_PASSWORD \
  -in supabase-*.dump.enc > supabase.dump
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname "$TEST_DATABASE_URL" supabase.dump
```

Run a manual restore test after first setup and at least once per quarter.
