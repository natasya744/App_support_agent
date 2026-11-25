# Supabase setup

Supabase is the only persistent store. The Python backend connects to it with plain PostgreSQL (`psycopg`) using `DATABASE_URL`; there is **no Supabase SDK** in either the backend or the dashboard, and the frontend never talks to Supabase directly (Dashboard → FastAPI → Supabase).

## 1. What exists in this repository

```
supabase/
├── config.toml                                  # local CLI dev config
├── .gitignore                                   # ignores .temp, .env.local, ...
├── migrations/
│   ├── 20261103060853_create_tables.sql         # schema + RLS enable
│   └── 20261105025553_rls_policies.sql          # 4 service-role policies
└── .temp/                                       # gitignored CLI link state (not setup input)
```

There is **no `supabase/seed.sql`**, no storage bucket configuration, no custom auth setup, and no extra SQL files anywhere in the repo. `config.toml` declares a seed path `./seed.sql`, but that file is absent — the real seeding step is a Python script (section 6).

## 2. Prerequisites

- A Supabase project (hosted) **or** a local Supabase stack.
- PostgreSQL **major version 17** — `config.toml` sets `major_version = 17` and notes it must match the remote database (`SHOW server_version;`).
- A **database connection string** for the root `.env` (`DATABASE_URL`). In Supabase this is under Project Settings → Database → Connection string. Keep it out of git.
- For CLI workflows: the Supabase CLI. Local `.temp/cli-latest` records `v3.0.0` as the version last used here; it is gitignored local state, not a declared dependency.

## 3. Option A — hosted project (recommended for a real deployment)

1. Create a project in Supabase and note its database password.
2. Apply the two migrations **in filename order**:
   - `supabase/migrations/20261103060853_create_tables.sql`
   - `supabase/migrations/20261105025553_rls_policies.sql`

   Either paste each file into the Supabase SQL Editor and run it, or use the CLI:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

   `config.toml` explicitly enables migrations for `db push` / `db reset`, so the CLI will apply both files.

3. Copy the connection string into the root `.env`:

   ```dotenv
   DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
   ```

   The placeholder in `.env.example` is `postgresql://user:password@host:5432/postgres`. Use a password-bearing string: `app/db.py` opens the connection directly with `psycopg.connect(settings.database_url, autocommit=True, ...)`.

4. Continue with section 6 (seed the knowledge base).

Do not commit `.env`, `credentials.json`, `*.pem` or `*.key` — they are already ignored by the root `.gitignore`.

## 4. Option B — local development with the Supabase CLI

From the repository root (the directory containing `supabase/config.toml`):

```bash
supabase init      # only if you are creating a fresh config; this repo already has one
supabase start
```

`supabase start` starts the local services and applies the migrations. Local ports from `config.toml`:

| Service | Port |
| --- | --- |
| API / PostgREST | `54321` |
| PostgreSQL | `54322` (shadow DB `54320`) |
| Studio | `54323` |
| Inbucket (mail catcher) | `54324` |
| Analytics | `54327` |
| Connection pooler | `54329` (currently `enabled = false`) |
| Edge runtime inspector | `8083` |

Other configured defaults worth knowing:

- `[db.migrations] enabled = true`, `[db.seed] enabled = true` with `sql_paths = ["./seed.sql"]` (file missing — see section 6).
- `[auth]`: signup enabled, email confirmation disabled, JWT expiry 3600 s, site URL `http://127.0.0.1:3000`. All third-party providers are disabled.
- `[storage]`: enabled, 50 MiB file limit, **no buckets configured** (the bucket example is commented out).
- Studio reads `OPENAI_API_KEY` from the environment (`env(OPENAI_API_KEY)` in `config.toml`).
- `[experimental]` references `S3_HOST`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`; only relevant if you enable those S3 features.

Set `DATABASE_URL` in the root `.env` to the local connection string printed by `supabase start`, then continue with section 6.

## 5. Schema created by the migrations

### `20261103060853_create_tables.sql`

Four tables, one index, and RLS enabled on all four.

| Table | Columns | Constraints |
| --- | --- | --- |
| `events` | `id` identity PK, `gmail_message_id`, `status`, `attempts`, `error`, `result jsonb`, `created_at`, `processed_at` | `gmail_message_id` unique; `status ∈ (processing, processed, skipped, failed)`, default `processing`; `attempts` default `1`. |
| `tickets` | `id` identity PK, `gmail_thread_id`, `customer_email`, `subject`, `category`, `status`, `proposed_action`, `created_at`, `updated_at` | `gmail_thread_id` unique; `status ∈ (open, answered, escalated)`, default `open`. |
| `messages` | `id` identity PK, `ticket_id`, `gmail_message_id`, `direction`, `from_address`, `body`, `created_at` | `ticket_id` FK → `tickets(id) ON DELETE CASCADE`; `gmail_message_id` unique; `direction ∈ (in, out)`; index `messages_ticket_id_idx`. |
| `knowledge_base` | `id` identity PK, `section`, `title`, `content`, `updated_at` | unique `(section, title)`. |

The file ends with:

```sql
alter table events enable row level security;
alter table tickets enable row level security;
alter table messages enable row level security;
alter table knowledge_base enable row level security;
```

No extensions (including no `pgvector`), functions, triggers or seed rows are created.

### `20261105025553_rls_policies.sql`

Four policies, one per table, all defined as:

```sql
create policy "service: full access to <table>"
  on <table> for all
  using (true)
  with check (true);
```

The migration comment explains the intent: the backend connects with a service role that bypasses RLS by default; the explicit policies make that access auditable. There are no user-scoped policies using `auth.uid()`.

Practical consequence: the app must connect as a privileged Postgres role through `DATABASE_URL`. Passing an anon/supabase client key will not work — the code does not use Supabase Auth or PostgREST keys.

## 6. Seed the knowledge base

The migrations create an empty `knowledge_base` table. Populate it **after** the migrations and **before** starting the poller or the API, because the reply agent reads these rows through `app/db.py`.

```bash
uv run python scripts/seed_knowledge_base.py
```

The script:

1. Reads every `*.md` file in `knowledge_base/`.
2. Splits each file on `\n## ` so every `##` heading becomes one `(section, title, content)` row; `section` is the filename without extension.
3. Upserts with `on conflict (section, title) do update set content = excluded.content, updated_at = now()`.

It is idempotent — re-running updates existing rows rather than duplicating them. Source files in `knowledge_base/`:

- `brand-and-tone.md`
- `escalation-rules.md`
- `requiretments and support.md`
- `returns-and-warranty.md`
- `services and solutions.md`
- `shipping.md`

The resulting section names are the file stems, e.g. `brand-and-tone`, `escalation-rules`, `services and solutions`. The dashboard's "knowledge-base" tab reads and edits the same table through `/api/knowledge-base` and `PUT /api/knowledge-base/{id}`.

## 7. What the backend stores there

`app/db.py` uses `DATABASE_URL` for every operation:

- `events`: `start_event`, `finish_event`, `fail_event` — retries only rows whose status is `failed`.
- `tickets`: `upsert_ticket`, `update_ticket` (unique per Gmail thread).
- `messages`: `save_message` with `on conflict (gmail_message_id) do nothing` (idempotent).
- `knowledge_base`: `list_sections`, `get_section`, `list_knowledge_base`, `update_knowledge_base_entry`.

The dashboard lists events/tickets/messages through the FastAPI endpoints, not through Supabase.

## 8. Verify

```bash
# From the repo root, with DATABASE_URL set in .env:
uv run python -c "from app import db; print(db.list_knowledge_base()[:3])"
```

You should see seeded rows. An empty list means the seed script was not run or `DATABASE_URL` points at a different database.

Then start the backend and check `curl http://localhost:8000/api/knowledge-base` with the dashboard Basic credentials — see [backend_setup.md](backend_setup.md).

## 9. Gotchas

- `supabase/.temp/` contains local CLI link state (project ref, service versions, pooler URL). It is gitignored and is not required for a fresh setup.
- `config.toml` references `OPENAI_API_KEY` and S3 variables through `env(...)`; those are only used by local Studio/experimental features, not by the application's database access.
- `config.toml` declares `sql_paths = ["./seed.sql"]` for `db reset`, but that file does not exist — do not expect `supabase db reset` to populate the knowledge base. Use section 6.
