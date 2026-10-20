-- Manual QR top-up flow.
-- Users submit a payment claim; only an active admin can approve it and credit
-- the wallet after checking the bank account. Approval is atomic and idempotent.

alter table public.wallet_topup_requests
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
  add column if not exists review_note text;

alter table public.wallet_topup_requests
  drop constraint if exists wallet_topup_requests_status_check;
alter table public.wallet_topup_requests
  add constraint wallet_topup_requests_status_check
  check (status in ('pending', 'submitted', 'paid', 'expired', 'cancelled'));

create or replace function public.create_topup_request(
  requested_amount bigint,
  requested_method text default 'vietqr'
)
returns table (
  id uuid,
  amount bigint,
  currency text,
  method text,
  payment_code text,
  status text,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  code_prefix text;
  generated_code text;
  configured_account text;
  custom_qr text;
  vietqr_enabled boolean;
begin
  if current_user_id is null or not public.is_active_user() then
    raise exception 'Active account required' using errcode = '42501';
  end if;
  if requested_method <> 'vietqr' then
    raise exception 'Only VietQR top-ups are enabled' using errcode = '22023';
  end if;
  if requested_amount < 10000 or requested_amount > 50000000 then
    raise exception 'Amount must be between 10,000 and 50,000,000 VND' using errcode = '22023';
  end if;
  if (
    select count(*) from public.wallet_topup_requests as requests
    where requests.user_id = current_user_id
      and requests.created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many top-up requests. Please wait and try again.' using errcode = 'P0001';
  end if;

  update public.wallet_topup_requests as requests
  set status = 'expired'
  where requests.user_id = current_user_id
    and requests.status = 'pending'
    and requests.expires_at <= now();

  select
    upper(regexp_replace(coalesce(bank ->> 'memoPrefix', 'CVNAP'), '[^A-Za-z0-9]', '', 'g')),
    regexp_replace(coalesce(bank ->> 'accountNumber', ''), '[^0-9]', '', 'g'),
    coalesce(bank ->> 'customQrUrl', ''),
    coalesce((methods ->> 'vietqr')::boolean, false)
  into code_prefix, configured_account, custom_qr, vietqr_enabled
  from public.payment_settings where payment_settings.id = 1;

  if not vietqr_enabled or (configured_account = '' and custom_qr = '') then
    raise exception 'QR payment is not configured by the administrator' using errcode = 'P0001';
  end if;
  code_prefix := left(coalesce(nullif(code_prefix, ''), 'CVNAP'), 8);

  loop
    generated_code := code_prefix || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (
      select 1 from public.wallet_topup_requests as requests
      where requests.payment_code = generated_code
    );
  end loop;

  return query
  insert into public.wallet_topup_requests (
    user_id, amount, method, payment_code
  ) values (
    current_user_id, requested_amount, requested_method, generated_code
  )
  returning wallet_topup_requests.id, wallet_topup_requests.amount,
    wallet_topup_requests.currency, wallet_topup_requests.method,
    wallet_topup_requests.payment_code, wallet_topup_requests.status,
    wallet_topup_requests.expires_at;
end;
$$;

create or replace function public.submit_topup_for_review(target_request_id uuid)
returns table (
  id uuid,
  amount bigint,
  currency text,
  method text,
  payment_code text,
  status text,
  expires_at timestamptz,
  submitted_at timestamptz,
  paid_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_request public.wallet_topup_requests%rowtype;
begin
  if current_user_id is null or not public.is_active_user() then
    raise exception 'Active account required' using errcode = '42501';
  end if;

  select * into target_request
  from public.wallet_topup_requests
  where wallet_topup_requests.id = target_request_id
    and wallet_topup_requests.user_id = current_user_id
  for update;

  if not found then
    raise exception 'Top-up request not found' using errcode = 'P0002';
  end if;
  if target_request.status = 'submitted' then
    return query
    select r.id, r.amount, r.currency, r.method, r.payment_code, r.status,
      r.expires_at, r.submitted_at, r.paid_at
    from public.wallet_topup_requests as r where r.id = target_request_id;
    return;
  end if;
  if target_request.status <> 'pending' or target_request.expires_at <= now() then
    update public.wallet_topup_requests as requests
    set status = 'expired'
    where requests.id = target_request_id and requests.status = 'pending';
    raise exception 'Top-up request expired or closed' using errcode = 'P0001';
  end if;

  return query
  update public.wallet_topup_requests as r
  set status = 'submitted', submitted_at = now()
  where r.id = target_request_id
  returning r.id, r.amount, r.currency, r.method, r.payment_code, r.status,
    r.expires_at, r.submitted_at, r.paid_at;
end;
$$;

create or replace function public.admin_review_topup(
  target_request_id uuid,
  approve boolean,
  admin_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_request public.wallet_topup_requests%rowtype;
  new_balance bigint;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into target_request
  from public.wallet_topup_requests
  where wallet_topup_requests.id = target_request_id
  for update;

  if not found then
    raise exception 'Top-up request not found' using errcode = 'P0002';
  end if;
  if target_request.status = 'paid' then
    select balance into new_balance from public.wallet_accounts
    where user_id = target_request.user_id;
    return jsonb_build_object('status', 'paid', 'balance', coalesce(new_balance, 0));
  end if;
  if target_request.status <> 'submitted' then
    raise exception 'Top-up request is not awaiting review' using errcode = 'P0001';
  end if;

  if not approve then
    update public.wallet_topup_requests
    set status = 'cancelled', reviewed_at = now(), reviewed_by = auth.uid(),
        review_note = left(trim(coalesce(admin_note, '')), 500)
    where id = target_request_id;
    return jsonb_build_object('status', 'cancelled');
  end if;

  insert into public.wallet_accounts (user_id) values (target_request.user_id)
  on conflict (user_id) do nothing;

  select balance into new_balance
  from public.wallet_accounts
  where user_id = target_request.user_id
  for update;

  new_balance := new_balance + target_request.amount;

  update public.wallet_accounts
  set balance = new_balance, version = version + 1
  where user_id = target_request.user_id;

  update public.wallet_topup_requests
  set status = 'paid', provider = 'manual_qr', paid_at = now(),
      reviewed_at = now(), reviewed_by = auth.uid(),
      review_note = left(trim(coalesce(admin_note, '')), 500)
  where id = target_request_id;

  insert into public.wallet_ledger_entries (
    user_id, topup_request_id, entry_type, amount, balance_after,
    description, provider, metadata
  ) values (
    target_request.user_id, target_request.id, 'topup', target_request.amount,
    new_balance, 'Nap tien QR duoc admin xac nhan', 'manual_qr',
    jsonb_build_object('adminUserId', auth.uid(), 'note', left(trim(coalesce(admin_note, '')), 500))
  );

  return jsonb_build_object('status', 'paid', 'balance', new_balance);
end;
$$;

create or replace function public.admin_update_payment_settings(new_settings jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  account_number text;
  custom_qr text;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if jsonb_typeof(new_settings -> 'methods') <> 'object'
    or jsonb_typeof(new_settings -> 'bank') <> 'object'
    or jsonb_typeof(new_settings -> 'presetPackages') <> 'array' then
    raise exception 'Invalid payment settings' using errcode = '22023';
  end if;

  account_number := regexp_replace(coalesce(new_settings #>> '{bank,accountNumber}', ''), '[^0-9]', '', 'g');
  custom_qr := coalesce(new_settings #>> '{bank,customQrUrl}', '');
  if pg_column_size(new_settings) > 1048576
    or (custom_qr = '' and char_length(account_number) not between 6 and 30)
    or (custom_qr <> '' and custom_qr !~ '^(data:image/(png|jpeg|webp);base64,|https://)')
    or upper(regexp_replace(coalesce(new_settings #>> '{bank,memoPrefix}', ''), '[^A-Za-z0-9]', '', 'g')) !~ '^[A-Z0-9]{2,8}$' then
    raise exception 'Invalid QR payment configuration' using errcode = '22023';
  end if;

  update public.payment_settings
  set methods = new_settings -> 'methods',
      bank = new_settings -> 'bank',
      momo = coalesce(new_settings -> 'momo', '{}'::jsonb),
      zalopay = coalesce(new_settings -> 'zalopay', '{}'::jsonb),
      card = coalesce(new_settings -> 'card', '{}'::jsonb),
      preset_packages = new_settings -> 'presetPackages',
      currency = 'VND'
  where id = 1
  returning jsonb_build_object(
    'methods', methods, 'bank', bank, 'momo', momo, 'zalopay', zalopay,
    'card', card, 'presetPackages', preset_packages, 'currency', currency,
    'updatedAt', updated_at
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_list_wallet_transactions()
returns table (
  id text,
  user_id uuid,
  user_name text,
  user_email text,
  type text,
  amount bigint,
  description text,
  created_at timestamptz,
  status text,
  method text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select combined.id, combined.user_id, combined.user_name, combined.user_email,
    combined.type, combined.amount, combined.description, combined.created_at,
    combined.status, combined.method
  from (
    select
      topups.id::text as id,
      topups.user_id,
      profiles.display_name as user_name,
      coalesce(users.email, '') as user_email,
      'topup'::text as type,
      topups.amount,
      ('Nap tien ' || topups.payment_code)::text as description,
      topups.created_at,
      case when topups.status = 'paid' then 'success' else topups.status end as status,
      case when topups.provider = 'sepay'
        then 'VietQR / SePay'::text
        else 'QR chuyen khoan'::text
      end as method
    from public.wallet_topup_requests as topups
    join public.profiles as profiles on profiles.id = topups.user_id
    join auth.users as users on users.id = topups.user_id

    union all

    select
      ledger.id::text,
      ledger.user_id,
      profiles.display_name,
      coalesce(users.email, ''),
      case when ledger.entry_type in ('vip_month', 'vip_year')
        then ledger.entry_type else 'topup' end,
      ledger.amount,
      ledger.description,
      ledger.created_at,
      'success'::text,
      'Vi CineVerse'::text
    from public.wallet_ledger_entries as ledger
    join public.profiles as profiles on profiles.id = ledger.user_id
    join auth.users as users on users.id = ledger.user_id
    where ledger.topup_request_id is null
  ) as combined
  order by combined.created_at desc
  limit 500;
end;
$$;

revoke all on function public.submit_topup_for_review(uuid) from public, anon, authenticated;
revoke all on function public.admin_review_topup(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.submit_topup_for_review(uuid) to authenticated;
grant execute on function public.admin_review_topup(uuid, boolean, text) to authenticated;

