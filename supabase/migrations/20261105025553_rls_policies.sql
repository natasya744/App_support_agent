-- RLS policies for server-side (service role / postgres) access.
-- The app connects with the service role key, which bypasses RLS by default,
-- but we add explicit policies here so the intent is clear and auditable.

-- events: full access for the backend service
create policy "service: full access to events"
  on events for all
  using (true)
  with check (true);

-- tickets: full access for the backend service
create policy "service: full access to tickets"
  on tickets for all
  using (true)
  with check (true);

-- messages: full access for the backend service
create policy "service: full access to messages"
  on messages for all
  using (true)
  with check (true);

-- knowledge_base: allow insert/update from the backend seed script,
-- and select from the backend agent at runtime.
create policy "service: full access to knowledge_base"
  on knowledge_base for all
  using (true)
  with check (true);
