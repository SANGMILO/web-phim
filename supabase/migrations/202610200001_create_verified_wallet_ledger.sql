-- Verified wallet ledger and SePay-backed bank transfer reconciliation.
-- Browser clients can never mutate balances or ledger rows directly.

create table if not exists public.payment_settings (
  id smallint primary key default 1 check (id = 1),
  methods jsonb not null default '{"vietqr":true,"momo":false,"zalopay":false,"card":false}'::jsonb,
  bank jsonb not null default '{"bankId":"MB","bankName":"MB BANK","accountNumber":"","accountHolder":"CINEVERSE VIETNAM","memoPrefix":"CVNAP","note":"Quet ma VietQR, he thong tu dong xac nhan giao dich."}'::jsonb,
  momo jsonb not null default '{"phone":"","accountHolder":"","note":"Chua kich hoat"}'::jsonb,
  zalopay jsonb not null default '{"phone":"","accountHolder":"","note":"Chua kich hoat"}'::jsonb,
  card jsonb not null default '{"gatewayName":"","note":"Chua kich hoat","instructions":""}'::jsonb,
  preset_packages jsonb not null default '[{"id":"p-50k","amount":50000,"badge":""},{"id":"p-100k","amount":100000,"badge":"Pho bien","isPopular":true},{"id":"p-200k","amount":200000,"badge":""},{"id":"p-500k","amount":500000,"badge":""},{"id":"p-1m","amount":1000000,"badge":""}]'::jsonb,
  currency text not null default 'VND' check (currency = 'VND'),
  updated_at timestamptz not null default now()
);

insert into public.payment_settings (id) values (1)
on conflict (id) do nothing;

create table if not exists public.wallet_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance bigint not null default 0 check (balance >= 0),
  version bigint not null default 0 check (version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_topup_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount bigint not null check (amount between 10000 and 50000000),
  currency text not null default 'VND' check (currency = 'VND'),
  method text not null default 'vietqr' check (method = 'vietqr'),
  payment_code text not null unique check (payment_code ~ '^[A-Z0-9]{8,32}$'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired', 'cancelled')),
  provider text,
  provider_transaction_id text,
  provider_reference_code text,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create index if not exists wallet_topups_user_created_idx
  on public.wallet_topup_requests (user_id, created_at desc);
create index if not exists wallet_topups_pending_code_idx
  on public.wallet_topup_requests (payment_code)
  where status = 'pending';

create table if not exists public.wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topup_request_id uuid unique references public.wallet_topup_requests(id) on delete restrict,
  entry_type text not null check (entry_type in ('topup', 'vip_month', 'vip_year', 'admin_credit', 'admin_debit')),
  amount bigint not null check (amount <> 0),
  balance_after bigint not null check (balance_after >= 0),
  description text not null check (char_length(description) between 1 and 500),
  provider text,
  provider_transaction_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_transaction_id)
);

create index if not exists wallet_ledger_user_created_idx
  on public.wallet_ledger_entries (user_id, created_at desc);

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_transaction_id text not null,
  event_status text not null check (event_status in ('processing', 'processed', 'duplicate', 'ignored', 'unmatched', 'rejected')),
  reason text not null default '',
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, provider_transaction_id)
);

alter table public.profiles
  add column if not exists vip_expires_at timestamptz;

drop trigger if exists payment_settings_set_updated_at on public.payment_settings;
create trigger payment_settings_set_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();

drop trigger if exists wallet_accounts_set_updated_at on public.wallet_accounts;
create trigger wallet_accounts_set_updated_at
before update on public.wallet_accounts
for each row execute function public.set_updated_at();

drop trigger if exists wallet_topups_set_updated_at on public.wallet_topup_requests;
create trigger wallet_topups_set_updated_at
before update on public.wallet_topup_requests
for each row execute function public.set_updated_at();

create or replace function public.ensure_wallet_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.wallet_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_create_wallet on public.profiles;
create trigger profiles_create_wallet
after insert on public.profiles
for each row execute function public.ensure_wallet_account();

insert into public.wallet_accounts (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

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
  vietqr_enabled boolean;
begin
  if current_user_id is null or not public.is_active_user() then
    raise exception 'Active account required' using errcode = '42501';
  end if;
  if requested_method <> 'vietqr' then
    raise exception 'Only verified VietQR top-ups are enabled' using errcode = '22023';
  end if;
  if requested_amount < 10000 or requested_amount > 50000000 then
    raise exception 'Amount must be between 10,000 and 50,000,000 VND' using errcode = '22023';
  end if;
  if (
    select count(*) from public.wallet_topup_requests
    where user_id = current_user_id
      and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Too many top-up requests. Please wait and try again.' using errcode = 'P0001';
  end if;

  update public.wallet_topup_requests
  set status = 'expired'
  where user_id = current_user_id
    and status = 'pending'
    and expires_at <= now();

  select
    upper(regexp_replace(coalesce(bank ->> 'memoPrefix', 'CVNAP'), '[^A-Za-z0-9]', '', 'g')),
    regexp_replace(coalesce(bank ->> 'accountNumber', ''), '[^0-9]', '', 'g'),
    coalesce((methods ->> 'vietqr')::boolean, false)
  into code_prefix, configured_account, vietqr_enabled
  from public.payment_settings where payment_settings.id = 1;
  if configured_account = '' or not vietqr_enabled then
    raise exception 'VietQR is not configured by the administrator' using errcode = 'P0001';
  end if;
  code_prefix := left(coalesce(nullif(code_prefix, ''), 'CVNAP'), 8);

  loop
    generated_code := code_prefix || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (
      select 1 from public.wallet_topup_requests where payment_code = generated_code
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

create or replace function public.purchase_vip(wallet_plan text)
returns table (balance bigint, vip_expires_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  plan_cost bigint;
  duration interval;
  new_balance bigint;
  new_expiry timestamptz;
begin
  if current_user_id is null or not public.is_active_user() then
    raise exception 'Active account required' using errcode = '42501';
  end if;

  if wallet_plan = 'vip_month' then
    plan_cost := 59000;
    duration := interval '30 days';
  elsif wallet_plan = 'vip_year' then
    plan_cost := 590000;
    duration := interval '365 days';
  else
    raise exception 'Invalid VIP plan' using errcode = '22023';
  end if;

  insert into public.wallet_accounts (user_id) values (current_user_id)
  on conflict (user_id) do nothing;

  select wallet_accounts.balance into new_balance
  from public.wallet_accounts
  where user_id = current_user_id
  for update;

  if new_balance < plan_cost then
    raise exception 'Insufficient wallet balance' using errcode = 'P0001';
  end if;

  new_balance := new_balance - plan_cost;
  select greatest(coalesce(profiles.vip_expires_at, now()), now()) + duration
  into new_expiry
  from public.profiles where profiles.id = current_user_id;

  update public.wallet_accounts
  set balance = new_balance, version = version + 1
  where user_id = current_user_id;

  update public.profiles
  set role = case when role = 'admin' then 'admin' else 'vip' end,
      vip_expires_at = new_expiry
  where id = current_user_id;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', case
      when raw_app_meta_data ->> 'role' = 'admin' then 'admin'
      else 'vip'
    end),
    updated_at = now()
  where id = current_user_id;

  insert into public.wallet_ledger_entries (
    user_id, entry_type, amount, balance_after, description
  ) values (
    current_user_id, wallet_plan, -plan_cost, new_balance,
    case when wallet_plan = 'vip_month'
      then 'Dang ky CINEVERSE VIP 1 thang'
      else 'Dang ky CINEVERSE VIP 1 nam'
    end
  );

  return query select new_balance, new_expiry;
end;
$$;

create or replace function public.process_sepay_webhook(
  p_provider_transaction_id text,
  p_provider_reference_code text,
  p_detected_payment_code text,
  p_transfer_amount bigint,
  p_transfer_type text,
  p_destination_account text,
  p_transaction_time timestamptz,
  p_raw_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_id uuid;
  target_request public.wallet_topup_requests%rowtype;
  configured_account text;
  normalized_code text;
  new_balance bigint;
begin
  if p_provider_transaction_id is null or p_provider_transaction_id = '' then
    raise exception 'Provider transaction id is required' using errcode = '22023';
  end if;

  insert into public.payment_webhook_events (
    provider, provider_transaction_id, event_status, payload
  ) values (
    'sepay', p_provider_transaction_id, 'processing', p_raw_payload
  )
  on conflict (provider, provider_transaction_id) do nothing
  returning id into webhook_id;

  if webhook_id is null then
    return jsonb_build_object('status', 'duplicate');
  end if;

  if lower(coalesce(p_transfer_type, '')) <> 'in' or p_transfer_amount <= 0 then
    update public.payment_webhook_events
    set event_status = 'ignored', reason = 'Not an incoming transfer', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'ignored');
  end if;

  select regexp_replace(coalesce(bank ->> 'accountNumber', ''), '[^0-9]', '', 'g')
  into configured_account
  from public.payment_settings where id = 1;

  if configured_account <> ''
    and regexp_replace(coalesce(p_destination_account, ''), '[^0-9]', '', 'g') <> configured_account then
    update public.payment_webhook_events
    set event_status = 'rejected', reason = 'Destination account mismatch', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'rejected', 'reason', 'account_mismatch');
  end if;

  normalized_code := upper(regexp_replace(coalesce(p_detected_payment_code, ''), '[^A-Za-z0-9]', '', 'g'));

  select * into target_request
  from public.wallet_topup_requests
  where payment_code = normalized_code
  for update;

  if not found then
    update public.payment_webhook_events
    set event_status = 'unmatched', reason = 'Payment code not found', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'unmatched');
  end if;

  if target_request.status = 'paid' then
    update public.payment_webhook_events
    set event_status = 'duplicate', reason = 'Top-up request already paid', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'duplicate');
  end if;

  if target_request.status <> 'pending' or target_request.expires_at <= now() then
    update public.wallet_topup_requests set status = 'expired'
    where id = target_request.id and status = 'pending';
    update public.payment_webhook_events
    set event_status = 'rejected', reason = 'Top-up request expired or closed', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'rejected', 'reason', 'request_expired');
  end if;

  if target_request.amount <> p_transfer_amount then
    update public.payment_webhook_events
    set event_status = 'rejected', reason = 'Transfer amount mismatch', processed_at = now()
    where id = webhook_id;
    return jsonb_build_object('status', 'rejected', 'reason', 'amount_mismatch');
  end if;

  insert into public.wallet_accounts (user_id) values (target_request.user_id)
  on conflict (user_id) do nothing;

  select balance into new_balance
  from public.wallet_accounts
  where user_id = target_request.user_id
  for update;

  new_balance := new_balance + p_transfer_amount;

  update public.wallet_accounts
  set balance = new_balance, version = version + 1
  where user_id = target_request.user_id;

  update public.wallet_topup_requests
  set status = 'paid', provider = 'sepay',
      provider_transaction_id = p_provider_transaction_id,
      provider_reference_code = p_provider_reference_code,
      paid_at = coalesce(p_transaction_time, now())
  where id = target_request.id;

  insert into public.wallet_ledger_entries (
    user_id, topup_request_id, entry_type, amount, balance_after,
    description, provider, provider_transaction_id, metadata
  ) values (
    target_request.user_id, target_request.id, 'topup', p_transfer_amount, new_balance,
    'Nap tien qua VietQR / SePay', 'sepay', p_provider_transaction_id,
    jsonb_build_object('referenceCode', p_provider_reference_code)
  );

  update public.payment_webhook_events
  set event_status = 'processed', reason = 'Wallet credited', processed_at = now()
  where id = webhook_id;

  return jsonb_build_object(
    'status', 'processed',
    'requestId', target_request.id,
    'userId', target_request.user_id,
    'balance', new_balance
  );
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
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if jsonb_typeof(new_settings -> 'methods') <> 'object'
    or jsonb_typeof(new_settings -> 'bank') <> 'object'
    or jsonb_typeof(new_settings -> 'presetPackages') <> 'array' then
    raise exception 'Invalid payment settings' using errcode = '22023';
  end if;
  if pg_column_size(new_settings) > 1048576
    or char_length(regexp_replace(coalesce(new_settings #>> '{bank,accountNumber}', ''), '[^0-9]', '', 'g')) not between 6 and 30
    or upper(regexp_replace(coalesce(new_settings #>> '{bank,memoPrefix}', ''), '[^A-Za-z0-9]', '', 'g')) !~ '^[A-Z0-9]{2,8}$' then
    raise exception 'Invalid bank payment configuration' using errcode = '22023';
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

create or replace function public.admin_adjust_wallet(
  target_user_id uuid,
  adjustment_amount bigint,
  adjustment_memo text
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_balance bigint;
  next_balance bigint;
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if adjustment_amount = 0 or abs(adjustment_amount) > 50000000 then
    raise exception 'Invalid adjustment amount' using errcode = '22023';
  end if;
  if char_length(trim(coalesce(adjustment_memo, ''))) < 3 then
    raise exception 'Adjustment memo is required' using errcode = '22023';
  end if;

  insert into public.wallet_accounts (user_id) values (target_user_id)
  on conflict (user_id) do nothing;
  select balance into current_balance from public.wallet_accounts
  where user_id = target_user_id for update;
  next_balance := current_balance + adjustment_amount;
  if next_balance < 0 then
    raise exception 'Wallet balance cannot be negative' using errcode = 'P0001';
  end if;

  update public.wallet_accounts
  set balance = next_balance, version = version + 1
  where user_id = target_user_id;

  insert into public.wallet_ledger_entries (
    user_id, entry_type, amount, balance_after, description, metadata
  ) values (
    target_user_id,
    case when adjustment_amount > 0 then 'admin_credit' else 'admin_debit' end,
    adjustment_amount, next_balance, trim(adjustment_memo),
    jsonb_build_object('adminUserId', auth.uid())
  );

  return next_balance;
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
      'VietQR / SePay'::text as method
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

alter table public.payment_settings enable row level security;
alter table public.wallet_accounts enable row level security;
alter table public.wallet_topup_requests enable row level security;
alter table public.wallet_ledger_entries enable row level security;
alter table public.payment_webhook_events enable row level security;

revoke all on public.payment_settings from anon, authenticated;
revoke all on public.wallet_accounts from anon, authenticated;
revoke all on public.wallet_topup_requests from anon, authenticated;
revoke all on public.wallet_ledger_entries from anon, authenticated;
revoke all on public.payment_webhook_events from anon, authenticated;

grant select on public.payment_settings to anon, authenticated;
grant select on public.wallet_accounts, public.wallet_topup_requests, public.wallet_ledger_entries to authenticated;
grant select on public.payment_webhook_events to authenticated;

drop policy if exists "Payment settings are public" on public.payment_settings;
create policy "Payment settings are public" on public.payment_settings
for select to anon, authenticated using (true);

drop policy if exists "Users read own wallet" on public.wallet_accounts;
create policy "Users read own wallet" on public.wallet_accounts
for select to authenticated using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Users read own topups" on public.wallet_topup_requests;
create policy "Users read own topups" on public.wallet_topup_requests
for select to authenticated using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Users read own ledger" on public.wallet_ledger_entries;
create policy "Users read own ledger" on public.wallet_ledger_entries
for select to authenticated using (user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "Admins read webhook events" on public.payment_webhook_events;
create policy "Admins read webhook events" on public.payment_webhook_events
for select to authenticated using ((select public.is_admin()));

revoke all on function public.ensure_wallet_account() from public, anon, authenticated;
revoke all on function public.create_topup_request(bigint, text) from public, anon, authenticated;
revoke all on function public.purchase_vip(text) from public, anon, authenticated;
revoke all on function public.process_sepay_webhook(text, text, text, bigint, text, text, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.admin_update_payment_settings(jsonb) from public, anon, authenticated;
revoke all on function public.admin_adjust_wallet(uuid, bigint, text) from public, anon, authenticated;
revoke all on function public.admin_list_wallet_transactions() from public, anon, authenticated;

grant execute on function public.create_topup_request(bigint, text) to authenticated;
grant execute on function public.purchase_vip(text) to authenticated;
grant execute on function public.process_sepay_webhook(text, text, text, bigint, text, text, timestamptz, jsonb) to service_role;
grant execute on function public.admin_update_payment_settings(jsonb) to authenticated;
grant execute on function public.admin_adjust_wallet(uuid, bigint, text) to authenticated;
grant execute on function public.admin_list_wallet_transactions() to authenticated;

