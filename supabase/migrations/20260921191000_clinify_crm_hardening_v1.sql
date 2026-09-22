-- Clinify CRM hardening V1
-- Safe forward-compatible constraints and person-level communication linkage.

alter table public.lead_communications
  add column if not exists person_id uuid references public.people(id) on delete cascade;

update public.lead_communications c
set person_id = l.person_id
from public.leads l
where c.lead_id = l.id
  and c.person_id is null;

create index if not exists idx_lead_communications_person_id
  on public.lead_communications(person_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lead_communications_identity_required'
      and conrelid = 'public.lead_communications'::regclass
  ) then
    alter table public.lead_communications
      add constraint lead_communications_identity_required
      check (lead_id is not null or person_id is not null);
  end if;
end $$;

create unique index if not exists idx_leads_person_id_unique
  on public.leads(person_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_status_valid'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_status_valid
      check (status in ('new','contacted','qualified','scheduled','lost','won'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'people_client_status_valid'
      and conrelid = 'public.people'::regclass
  ) then
    alter table public.people
      add constraint people_client_status_valid
      check (client_status in ('lead','customer'));
  end if;
end $$;
