-- Clinify contact identity hardening V1
-- Canonicalizes Israeli phone formats (05..., +972..., 00972...) to one normalized value.

create or replace function public.normalize_contact_phone(p_phone text)
returns text
language plpgsql
immutable
set search_path = public
as $$
declare
  v_digits text;
begin
  if nullif(btrim(coalesce(p_phone, '')), '') is null then
    return null;
  end if;

  v_digits := regexp_replace(p_phone, '\D', '', 'g');

  if v_digits like '00972%' then
    v_digits := '972' || substr(v_digits, 6);
  elsif v_digits like '9720%' then
    v_digits := '972' || substr(v_digits, 5);
  elsif v_digits like '0%' and length(v_digits) between 9 and 10 then
    v_digits := '972' || substr(v_digits, 2);
  end if;

  return nullif(v_digits, '');
end;
$$;

create or replace function public.sync_people_normalized_contacts()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.normalized_phone := public.normalize_contact_phone(new.phone);
  new.normalized_email := case
    when nullif(btrim(coalesce(new.email, '')), '') is null then null
    else lower(btrim(new.email))
  end;
  return new;
end;
$$;

drop trigger if exists trg_people_normalized_contacts on public.people;
create trigger trg_people_normalized_contacts
before insert or update of phone, email
on public.people
for each row
execute function public.sync_people_normalized_contacts();

update public.people
set normalized_phone = public.normalize_contact_phone(phone),
    normalized_email = case
      when nullif(btrim(coalesce(email, '')), '') is null then null
      else lower(btrim(email))
    end,
    updated_at = timezone('utc'::text, now());

-- Public RPCs are updated in the live migration to use normalize_contact_phone()
-- while preserving their existing signatures and grants.
