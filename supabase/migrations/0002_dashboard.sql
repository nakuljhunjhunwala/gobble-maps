-- Gobble Maps — admin dashboard RPC
-- 0002_dashboard.sql
--
-- admin_dashboard(p_from) returns every number the dashboard needs in one call.
-- p_from is the start of the selected date range (today / this week / this
-- month / all time). DAU/WAU/MAU always use fixed 1/7/30-day windows.

create or replace function public.admin_dashboard(p_from timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total_users  bigint;
  v_new_signups  bigint;
  v_dau          bigint;
  v_wau          bigint;
  v_mau          bigint;
  v_map_opens    bigint;
  v_shares       bigint;
  v_open_reports bigint;
  v_map_opens_7d jsonb;
  v_top_saved    jsonb;
  v_top_visited  jsonb;
  v_top_shared   jsonb;
  v_top_areas    jsonb;
  v_top_cuisines jsonb;
  v_top_filters  jsonb;
begin
  if not public.is_admin() then
    raise exception 'admin_dashboard: not authorized';
  end if;

  select count(*) into v_total_users from public.profiles;

  select count(*) into v_new_signups
  from public.profiles
  where created_at >= p_from;

  -- Active users over fixed windows (distinct users opening the app)
  select count(distinct user_id) into v_dau
  from public.analytics_events
  where event_type = 'app_open' and user_id is not null
    and created_at >= now() - interval '1 day';

  select count(distinct user_id) into v_wau
  from public.analytics_events
  where event_type = 'app_open' and user_id is not null
    and created_at >= now() - interval '7 days';

  select count(distinct user_id) into v_mau
  from public.analytics_events
  where event_type = 'app_open' and user_id is not null
    and created_at >= now() - interval '30 days';

  -- Range-filtered counters
  select count(*) into v_map_opens
  from public.analytics_events
  where event_type = 'map_open' and created_at >= p_from;

  select count(*) into v_shares
  from public.analytics_events
  where event_type = 'place_share' and created_at >= p_from;

  select count(*) into v_open_reports
  from public.issue_reports
  where status = 'open';

  -- Map opens per day for the last 7 days (oldest first), label like 'Fri'
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'label', trim(to_char(d.day, 'Dy')),
        'count', coalesce(e.cnt, 0)
      )
      order by d.day
    ),
    '[]'::jsonb
  )
  into v_map_opens_7d
  from generate_series(
    date_trunc('day', now()) - interval '6 days',
    date_trunc('day', now()),
    interval '1 day'
  ) as d(day)
  left join (
    select date_trunc('day', created_at) as day, count(*) as cnt
    from public.analytics_events
    where event_type = 'map_open'
      and created_at >= date_trunc('day', now()) - interval '6 days'
    group by 1
  ) e on e.day = d.day;

  -- Most saved (Can't Wait to Go) — top 10
  select coalesce(
    jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'count', t.cnt) order by t.cnt desc, t.name),
    '[]'::jsonb
  )
  into v_top_saved
  from (
    select p.id, p.name, count(*) as cnt
    from public.saved_places sp
    join public.places p on p.id = sp.place_id
    where sp.kind = 'wishlist'
    group by p.id, p.name
    order by cnt desc, p.name
    limit 10
  ) t;

  -- Most visited (Been There) — top 10
  select coalesce(
    jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'count', t.cnt) order by t.cnt desc, t.name),
    '[]'::jsonb
  )
  into v_top_visited
  from (
    select p.id, p.name, count(*) as cnt
    from public.saved_places sp
    join public.places p on p.id = sp.place_id
    where sp.kind = 'been_there'
    group by p.id, p.name
    order by cnt desc, p.name
    limit 10
  ) t;

  -- Most shared — top 10 from place_share events
  select coalesce(
    jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'count', t.cnt) order by t.cnt desc, t.name),
    '[]'::jsonb
  )
  into v_top_shared
  from (
    select p.id, p.name, count(*) as cnt
    from public.analytics_events ae
    join public.places p on p.id = ae.place_id
    where ae.event_type = 'place_share' and ae.created_at >= p_from
    group by p.id, p.name
    order by cnt desc, p.name
    limit 10
  ) t;

  -- Most popular areas — integer % of place views, via places.area_id
  select coalesce(
    jsonb_agg(jsonb_build_object('label', t.label, 'pct', t.pct) order by t.pct desc, t.label),
    '[]'::jsonb
  )
  into v_top_areas
  from (
    select fo.label,
           (round(100.0 * count(*) / sum(count(*)) over ()))::int as pct
    from public.analytics_events ae
    join public.places p on p.id = ae.place_id
    join public.filter_options fo on fo.id = p.area_id
    where ae.event_type = 'place_view' and ae.created_at >= p_from
    group by fo.label
    order by count(*) desc
    limit 8
  ) t;

  -- Most popular cuisines — integer % of place views, via place_tags
  select coalesce(
    jsonb_agg(jsonb_build_object('label', t.label, 'pct', t.pct) order by t.pct desc, t.label),
    '[]'::jsonb
  )
  into v_top_cuisines
  from (
    select fo.label,
           (round(100.0 * count(*) / sum(count(*)) over ()))::int as pct
    from public.analytics_events ae
    join public.place_tags pt on pt.place_id = ae.place_id
    join public.filter_options fo on fo.id = pt.filter_option_id and fo.category = 'cuisine'
    where ae.event_type = 'place_view' and ae.created_at >= p_from
    group by fo.label
    order by count(*) desc
    limit 8
  ) t;

  -- Most used filters — top 6 from filter_apply metadata
  select coalesce(
    jsonb_agg(jsonb_build_object('label', t.label, 'count', t.cnt) order by t.cnt desc, t.label),
    '[]'::jsonb
  )
  into v_top_filters
  from (
    select ae.metadata->>'filter' as label, count(*) as cnt
    from public.analytics_events ae
    where ae.event_type = 'filter_apply'
      and ae.created_at >= p_from
      and ae.metadata ? 'filter'
    group by 1
    order by cnt desc
    limit 6
  ) t;

  return jsonb_build_object(
    'total_users', v_total_users,
    'new_signups', v_new_signups,
    'dau', v_dau,
    'wau', v_wau,
    'mau', v_mau,
    'map_opens', v_map_opens,
    'shares', v_shares,
    'open_reports', v_open_reports,
    'map_opens_7d', v_map_opens_7d,
    'top_saved', v_top_saved,
    'top_visited', v_top_visited,
    'top_shared', v_top_shared,
    'top_areas', v_top_areas,
    'top_cuisines', v_top_cuisines,
    'top_filters', v_top_filters
  );
end;
$$;

revoke all on function public.admin_dashboard(timestamptz) from public;
revoke all on function public.admin_dashboard(timestamptz) from anon;
grant execute on function public.admin_dashboard(timestamptz) to authenticated, service_role;
