do $$
declare
  v_plans_updated integer;
  v_prices_updated integer;
begin
  update public.commerce_plans
  set active = true, updated_at = now()
  where plan_key in ('personal', 'premium')
    and stripe_price_id in (
      'price_1U1ii4Lq4GnupuQQly91BydM',
      'price_1U1ihsLq4GnupuQQWdv4sdCg'
    );
  get diagnostics v_plans_updated = row_count;
  if v_plans_updated <> 2 then
    raise exception 'Expected to activate 2 live commerce plans, activated %', v_plans_updated;
  end if;

  update public.report_prices
  set active = true, updated_at = now()
  where catalog_version = 1
    and stripe_price_id in (
      'price_1U1iiCLq4GnupuQQMRwT9cDT',
      'price_1U1iiCLq4GnupuQQSai1Gjy4',
      'price_1U1iiCLq4GnupuQQlSJzplCn',
      'price_1U1iiKLq4GnupuQQ6EqcnPDK',
      'price_1U1iiKLq4GnupuQQ956LN1AZ',
      'price_1U1iiKLq4GnupuQQtk88MZ7B'
    );
  get diagnostics v_prices_updated = row_count;
  if v_prices_updated <> 6 then
    raise exception 'Expected to activate 6 live report prices, activated %', v_prices_updated;
  end if;
end;
$$;

comment on table public.commerce_plans is
  'Server-authoritative membership catalogue. Active paid plans reference the approved live Stripe catalogue.';
