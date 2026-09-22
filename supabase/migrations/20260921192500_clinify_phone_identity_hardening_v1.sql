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

create or replace function public.public_create_booking(
  p_service_id uuid,
  p_appointment_date timestamp with time zone,
  p_full_name text,
  p_phone text,
  p_email text default null::text,
  p_notes text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clean_phone text;
  v_clean_email text;
  v_person_id uuid;
  v_patient_id uuid;
  v_lead_id uuid;
  v_appointment_id uuid;
  v_phone_person public.people%rowtype;
  v_email_person public.people%rowtype;
  v_existing_person public.people%rowtype;
  v_service public.services%rowtype;
  v_end_date timestamptz;
begin
  if nullif(btrim(coalesce(p_full_name, '')), '') is null then
    raise exception 'שם מלא נדרש';
  end if;

  v_clean_phone := public.normalize_contact_phone(p_phone);
  if v_clean_phone is null or length(v_clean_phone) < 7 then
    raise exception 'מספר טלפון אינו תקין';
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is not null then
    v_clean_email := lower(btrim(p_email));
  end if;

  select * into v_service
  from public.services
  where id = p_service_id
  limit 1;

  if v_service.id is null then
    raise exception 'שירות לא נמצא';
  end if;

  v_end_date := p_appointment_date
    + make_interval(mins => coalesce(v_service.duration_minutes, 30));

  select * into v_phone_person
  from public.people
  where normalized_phone = v_clean_phone
  limit 1;

  if v_clean_email is not null then
    select * into v_email_person
    from public.people
    where normalized_email = v_clean_email
    limit 1;
  end if;

  if v_phone_person.id is not null
     and v_email_person.id is not null
     and v_phone_person.id <> v_email_person.id then
    raise exception 'Identity Conflict: Phone and Email belong to two different existing profiles.';
  end if;

  if v_phone_person.id is not null then
    v_existing_person := v_phone_person;
  elsif v_email_person.id is not null then
    v_existing_person := v_email_person;
  end if;

  if v_existing_person.id is not null then
    v_person_id := v_existing_person.id;

    update public.people
    set
      full_name = coalesce(nullif(btrim(full_name), ''), btrim(p_full_name)),
      phone = coalesce(phone, nullif(btrim(p_phone), '')),
      email = coalesce(email, nullif(btrim(p_email), '')),
      updated_at = timezone('utc'::text, now())
    where id = v_person_id;
  else
    insert into public.people (
      full_name, phone, email, client_status, source
    ) values (
      btrim(p_full_name),
      btrim(p_phone),
      nullif(btrim(p_email), ''),
      'lead',
      'Public Booking'
    )
    returning id into v_person_id;
  end if;

  select id into v_patient_id
  from public.patients
  where person_id = v_person_id
  limit 1;

  if v_patient_id is null then
    insert into public.patients (person_id, status)
    values (v_person_id, 'active')
    returning id into v_patient_id;
  end if;

  if coalesce(v_existing_person.client_status, 'lead') <> 'customer' then
    select id into v_lead_id
    from public.leads
    where person_id = v_person_id
    limit 1;

    if v_lead_id is null then
      insert into public.leads (person_id, source, status)
      values (v_person_id, 'Public Booking', 'scheduled')
      returning id into v_lead_id;
    else
      update public.leads
      set status = 'scheduled'
      where id = v_lead_id
        and status in ('new', 'contacted', 'qualified');
    end if;
  end if;

  begin
    insert into public.appointments (
      person_id, patient_id, service_id, appointment_date, end_date, notes, status, source
    ) values (
      v_person_id, v_patient_id, p_service_id, p_appointment_date, v_end_date,
      p_notes, 'scheduled', 'public_booking'
    )
    returning id into v_appointment_id;
  exception
    when exclusion_violation then
      raise exception 'מועד זה אינו פנוי יותר. אנא בחר מועד אחר.';
  end;

  return jsonb_build_object(
    'success', true,
    'appointment_date', p_appointment_date
  );
end;
$function$;

create or replace function public.public_subscribe_performance_list(
  p_full_name text,
  p_email text default null::text,
  p_phone text default null::text,
  p_utm_source text default null::text,
  p_utm_medium text default null::text,
  p_utm_campaign text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clean_phone text := null;
  v_clean_email text := null;
  v_person_id uuid := null;
  v_lead_id uuid := null;
  v_existing_person public.people%rowtype;
  v_phone_person public.people%rowtype;
  v_email_person public.people%rowtype;
begin
  if nullif(btrim(coalesce(p_full_name, '')), '') is null then
    raise exception 'שם מלא נדרש';
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is null
     and nullif(btrim(coalesce(p_phone, '')), '') is null then
    raise exception 'דוא"ל או טלפון נדרשים להרשמה';
  end if;

  if nullif(btrim(coalesce(p_phone, '')), '') is not null then
    v_clean_phone := public.normalize_contact_phone(p_phone);
    if v_clean_phone is null or length(v_clean_phone) < 7 then
      raise exception 'מספר טלפון אינו תקין';
    end if;
  end if;

  if nullif(btrim(coalesce(p_email, '')), '') is not null then
    v_clean_email := lower(btrim(p_email));
  end if;

  if v_clean_phone is not null then
    select * into v_phone_person
    from public.people
    where normalized_phone = v_clean_phone
    limit 1;
  end if;

  if v_clean_email is not null then
    select * into v_email_person
    from public.people
    where normalized_email = v_clean_email
    limit 1;
  end if;

  if v_phone_person.id is not null
     and v_email_person.id is not null
     and v_phone_person.id <> v_email_person.id then
    raise exception 'Identity conflict detected';
  end if;

  if v_phone_person.id is not null then
    v_existing_person := v_phone_person;
  elsif v_email_person.id is not null then
    v_existing_person := v_email_person;
  end if;

  if v_existing_person.id is not null then
    v_person_id := v_existing_person.id;

    update public.people
    set
      full_name = coalesce(nullif(btrim(full_name), ''), btrim(p_full_name)),
      phone = coalesce(phone, nullif(btrim(p_phone), '')),
      email = coalesce(email, nullif(btrim(p_email), '')),
      source = coalesce(source, p_utm_source, 'Pre-Launch Signup'),
      updated_at = timezone('utc'::text, now())
    where id = v_person_id;

    if v_existing_person.client_status = 'customer' then
      return jsonb_build_object('success', true);
    end if;
  else
    insert into public.people (
      full_name, phone, email, client_status, source
    ) values (
      btrim(p_full_name),
      nullif(btrim(p_phone), ''),
      nullif(btrim(p_email), ''),
      'lead',
      coalesce(nullif(btrim(p_utm_source), ''), 'Pre-Launch Signup')
    )
    returning id into v_person_id;
  end if;

  select id into v_lead_id
  from public.leads
  where person_id = v_person_id
  limit 1;

  if v_lead_id is null then
    insert into public.leads (
      person_id, source, campaign, utm_source, utm_medium, utm_campaign, status
    ) values (
      v_person_id,
      coalesce(nullif(btrim(p_utm_source), ''), 'Website'),
      coalesce(nullif(btrim(p_utm_campaign), ''), 'Pre-Launch'),
      nullif(btrim(p_utm_source), ''),
      nullif(btrim(p_utm_medium), ''),
      nullif(btrim(p_utm_campaign), ''),
      'new'
    );
  else
    update public.leads
    set
      campaign = coalesce(campaign, nullif(btrim(p_utm_campaign), '')),
      utm_source = coalesce(utm_source, nullif(btrim(p_utm_source), '')),
      utm_medium = coalesce(utm_medium, nullif(btrim(p_utm_medium), '')),
      utm_campaign = coalesce(utm_campaign, nullif(btrim(p_utm_campaign), ''))
    where id = v_lead_id;
  end if;

  return jsonb_build_object('success', true);
end;
$function$;
