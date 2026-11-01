import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  ATLAS_PRICES,
  ATLAS_TRIAL_DAYS,
  PLAN_ALLOWANCES,
} from "@/lib/membership/plans";

// Runs the real two-tier migration on top of the real commerce, quota and
// catalogue migrations in an in-process PostgreSQL. No network, no Stripe.
const read = (name: string) =>
  readFileSync(`supabase/migrations/${name}.sql`, "utf8");
const commerce = read("20260806212538_account_capability_entitlements");
const activation = read("20260807093718_activate_live_commerce_catalog");
const weekly = read("20260808074522_weekly_readings_entitlement");
const daily = read("20260805085105_registered_daily_readings");
const allowances = read("20260908074857_enforce_membership_allowances");
const twoTier = read("20261101090000_two_tier_atlas_membership");

let db: PGlite;
const user = "20000000-0000-4000-8000-000000000001";
const other = "20000000-0000-4000-8000-000000000002";

async function scalar<T = unknown>(sql: string, params: unknown[] = []) {
  const result = await db.query<{ value: T }>(sql, params);
  return result.rows[0]?.value as T;
}
const between = (source: string, start: string, end?: string) =>
  source.slice(
    source.indexOf(start),
    end === undefined ? undefined : source.indexOf(end),
  );

async function subscribe(
  planKey: "personal" | "premium",
  createdAt = "now()",
  id = "sub_atlas",
) {
  await db.query(
    `insert into public.account_subscriptions(user_id,billing_customer_id,plan_key,stripe_subscription_id,status,current_period_start,current_period_end,created_at)
     values ($1,$1,$2,$3,'active',now()-interval '2 days',now()+interval '28 days',${createdAt})`,
    [user, planKey, id],
  );
}
async function saveChart(owner = user) {
  return scalar<string>(
    "insert into public.birth_profiles(user_id) values ($1) returning id as value",
    [owner],
  );
}
async function invoice(id: string, paidAt: string, subscription = "sub_atlas") {
  return scalar<string>(
    `select public.record_paid_subscription_invoice($1,$2,$3,$4,${paidAt}) as value`,
    [id, `pi_${id}`, subscription, user],
  );
}
const credits = () =>
  scalar<number>(
    "select count(*)::integer as value from public.account_credits where user_id=$1 and credit_key='report.standard'",
    [user],
  );

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    create function private.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end;$$;
    create table public.admin_roles(user_id uuid,role text);
    create table public.products(report_type text primary key);
    insert into public.products values ('recovery_reflection'),('career_purpose');
    create table public.birth_profiles(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),created_at timestamptz default now(),expires_at timestamptz default now()+interval '1 year');`);
  await db.exec(between(commerce, "create table", "alter table public.orders"));
  await db.exec(
    `create table public.orders(id uuid primary key default gen_random_uuid(), user_id uuid, credit_id uuid references public.account_credits(id));`,
  );
  await db.exec(
    between(
      commerce,
      "insert into public.commerce_plans(",
      "create or replace function public.consume_capability(",
    ),
  );
  await db.exec(
    between(
      commerce,
      "create or replace function public.reverse_paid_subscription_invoice(",
      "create or replace function public.redeem_report_credit(",
    ),
  );
  await db.exec(activation.slice(0, activation.indexOf("comment on")));
  await db.exec(
    between(weekly, "update public.plan_capabilities", "comment on table"),
  );
  await db.exec(`create table public.tarot_decks(id text primary key, minimum_plan text not null references public.commerce_plans(plan_key));
    insert into public.tarot_decks values ('traditional','free'),('cat','personal'),('comic','premium');
    create table public.pending_chart_claims(claim_token_hash text primary key, requested_plan_key text not null references public.commerce_plans(plan_key));`);
  await db.exec(daily.slice(0, daily.indexOf("comment on")));
  await db.exec(allowances);
  await db.exec(twoTier);
}, 60000);

beforeEach(async () => {
  await db.exec(
    "truncate public.daily_readings,public.daily_reading_reservations,public.birth_profiles,public.account_subscriptions,public.billing_customers,public.capability_grants,public.admin_roles,public.subscription_paid_invoices,public.orders,public.account_credits,auth.users cascade",
  );
  await db.query("insert into auth.users values ($1),($2)", [user, other]);
  await db.query(
    "insert into public.billing_customers(id,user_id,stripe_customer_id) values ($1,$1,'cus_atlas')",
    [user],
  );
});

afterAll(async () => {
  await db?.close();
});

describe("two-tier Atlas migration", () => {
  it("names the paid plan Atlas and retires Personal without deleting rows", async () => {
    const plans = await db.query<{
      plan_key: string;
      name: string;
      active: boolean;
    }>("select plan_key,name,active from public.commerce_plans order by rank");
    expect(plans.rows).toEqual([
      { plan_key: "free", name: "Free", active: true },
      { plan_key: "personal", name: "Personal", active: false },
      { plan_key: "premium", name: "Atlas", active: true },
    ]);
    expect(
      await scalar(
        "select count(*)::integer as value from public.report_prices where plan_key='personal' and active",
      ),
    ).toBe(0);
    expect(
      await scalar(
        "select minimum_plan as value from public.tarot_decks where id='cat'",
      ),
    ).toBe("premium");
  });

  it("gives a former Personal subscriber Free limits, never Personal ones", async () => {
    await saveChart();
    await subscribe("personal");
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
  });

  it("seeds monthly and yearly Atlas prices inactive, with a 7-day trial", async () => {
    const prices = await db.query<{
      billing_interval: string;
      unit_amount: number;
      currency: string;
      trial_days: number;
      active: boolean;
      stripe_price_id: string | null;
    }>(
      "select billing_interval,unit_amount,currency,trial_days,active,stripe_price_id from public.commerce_plan_prices where plan_key='premium' order by billing_interval",
    );
    expect(prices.rows).toEqual([
      {
        billing_interval: "month",
        unit_amount: ATLAS_PRICES.month.unitAmount,
        currency: "usd",
        trial_days: ATLAS_TRIAL_DAYS,
        active: false,
        stripe_price_id: null,
      },
      {
        billing_interval: "year",
        unit_amount: ATLAS_PRICES.year.unitAmount,
        currency: "usd",
        trial_days: ATLAS_TRIAL_DAYS,
        active: false,
        stripe_price_id: null,
      },
    ]);
    await expect(
      db.exec(
        "update public.commerce_plan_prices set active=true where billing_interval='month'",
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(
        "insert into public.commerce_plan_prices(plan_key,billing_interval,currency,unit_amount) values ('free','month','usd',0)",
      ),
    ).rejects.toThrow();
  });

  it("exposes only active prices to browser roles and allows one active price per interval", async () => {
    await db.exec(
      "update public.commerce_plan_prices set stripe_price_id='price_TestMonthly', active=true where billing_interval='month'",
    );
    await db.exec("set role anon");
    expect(
      await scalar(
        "select count(*)::integer as value from public.commerce_plan_prices",
      ),
    ).toBe(1);
    await db.exec("reset role");
    await expect(
      db.exec(
        "insert into public.commerce_plan_prices(plan_key,billing_interval,stripe_price_id,currency,unit_amount,active,catalog_version) values ('premium','month','price_Other','usd',1299,true,2)",
      ),
    ).rejects.toThrow();
    await db.exec(
      "update public.commerce_plan_prices set active=false, stripe_price_id=null",
    );
  });

  it("stores the Atlas allowances defined in the catalogue contract", async () => {
    const rows = await db.query<{
      capability_key: string;
      allowance: number | null;
      period: string;
      configuration: Record<string, unknown>;
    }>(
      "select capability_key,allowance,period,configuration from public.plan_capabilities where plan_key='premium'",
    );
    const atlas = Object.fromEntries(
      rows.rows.map((row) => [row.capability_key, row]),
    );
    const contract = PLAN_ALLOWANCES.atlas;
    expect(atlas["birth_profiles.saved"]).toMatchObject({
      allowance: contract.savedCharts,
      period: "none",
    });
    expect(atlas["daily_reading.primary"]).toMatchObject({ allowance: 1 });
    expect(atlas["daily_reading.companion"]).toMatchObject({
      allowance: contract.companionReadingsPerMonth,
      period: "billing_month",
    });
    expect(atlas["weekly_reading.primary"]).toMatchObject({
      allowance: 1,
      period: "week",
    });
    expect(atlas["report.discount_percent"]).toMatchObject({
      allowance: contract.reportDiscountPercent,
      configuration: {},
    });
    expect(atlas["report.standard_credit"]).toMatchObject({
      allowance: contract.includedReportsPerYear,
      period: "year",
    });
    expect(atlas["tarot.spreads"].configuration.spreads).toEqual([
      "daily",
      "ppf",
      "love5",
      "celtic",
      "grand",
    ]);
    expect(atlas["tarot.journal"]).toBeDefined();
  });

  it("keeps Free limits unchanged", async () => {
    const rows = await db.query<{
      capability_key: string;
      allowance: number | null;
      period: string;
      configuration: Record<string, unknown>;
    }>(
      "select capability_key,allowance,period,configuration from public.plan_capabilities where plan_key='free' order by capability_key",
    );
    expect(rows.rows).toEqual([
      {
        capability_key: "birth_profiles.saved",
        allowance: PLAN_ALLOWANCES.free.savedCharts,
        period: "none",
        configuration: {},
      },
      {
        capability_key: "daily_reading.personal",
        allowance: PLAN_ALLOWANCES.free.personalReadingsPerWeek,
        period: "week",
        configuration: {},
      },
      {
        capability_key: "tarot.spreads",
        allowance: null,
        period: "none",
        configuration: { spreads: ["daily"] },
      },
    ]);
    const chart = await saveChart();
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
    const reserve = () =>
      scalar<{ status: string; period: string }>(
        "select public.reserve_daily_reading($1,$2,$3,$4) as value",
        [user, chart, randomUUID().replaceAll("-", "").repeat(2), randomUUID()],
      );
    expect((await reserve()).status).toBe("reserved");
    expect((await reserve()).status).toBe("allowance_exhausted");
  });

  it("enforces Atlas saved charts, daily primary and ten companion readings", async () => {
    await subscribe("premium");
    const primary = await saveChart();
    await db.query(
      "update public.birth_profiles set created_at=now()-interval '1 day' where id=$1",
      [primary],
    );
    const companion = await saveChart();
    for (let i = 0; i < 3; i++) await saveChart();
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
    const reserve = (profile: string) =>
      scalar<{ status: string }>(
        "select public.reserve_daily_reading($1,$2,$3,$4) as value",
        [
          user,
          profile,
          randomUUID().replaceAll("-", "").repeat(2),
          randomUUID(),
        ],
      );
    expect((await reserve(primary)).status).toBe("reserved");
    expect((await reserve(primary)).status).toBe("allowance_exhausted");
    for (let i = 0; i < 10; i++)
      expect((await reserve(companion)).status).toBe("reserved");
    expect((await reserve(companion)).status).toBe("allowance_exhausted");
  });

  it("accepts the year period on plans and grants and rejects unknown periods", async () => {
    await db.query(
      "insert into public.capability_grants(user_id,capability_key,source_type,allowance,period) values ($1,'daily_reading.personal','promotion',2,'year')",
      [user],
    );
    await expect(
      db.query(
        "insert into public.capability_grants(user_id,capability_key,source_type,allowance,period) values ($1,'daily_reading.personal','promotion',2,'decade')",
        [user],
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(
        "update public.plan_capabilities set period='fortnight' where plan_key='free' and capability_key='birth_profiles.saved'",
      ),
    ).rejects.toThrow();
    const chart = await saveChart();
    const access = await scalar<{
      period: string;
      allowance: number;
      resetsAt: string;
    }>("select public.daily_reading_allowance($1,$2) as value", [user, chart]);
    expect(access).toMatchObject({ period: "year", allowance: 2 });
    const nextYear = new Date(Date.UTC(new Date().getUTCFullYear() + 1, 0, 1));
    expect(new Date(access.resetsAt).getTime()).toBe(nextYear.getTime());
  });

  it("anchors the membership year on the subscription anniversary", async () => {
    await subscribe("premium", "now() - interval '400 days'");
    const window = await db.query<{
      period_start: Date;
      period_end: Date;
      anchor: Date;
    }>(
      `select w.period_start, w.period_end, s.created_at as anchor
       from private.membership_period_window($1,'premium','year') w, public.account_subscriptions s`,
      [user],
    );
    const { period_start, period_end, anchor } = window.rows[0];
    const expectedStart = new Date(anchor);
    expectedStart.setUTCFullYear(expectedStart.getUTCFullYear() + 1);
    expect(new Date(period_start).getTime()).toBe(expectedStart.getTime());
    expect(new Date(period_end).getTime()).toBeGreaterThan(Date.now());
    expect(new Date(period_start).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("issues one included report per membership year for monthly billing", async () => {
    await subscribe("premium");
    expect(await invoice("in_m0", "now()")).toBe("credit_granted");
    for (let month = 1; month < 12; month++)
      expect(
        await invoice(`in_m${month}`, `now() + interval '${month} months'`),
      ).toBe("recorded");
    expect(await credits()).toBe(1);
    expect(await invoice("in_m12", "now() + interval '12 months'")).toBe(
      "credit_granted",
    );
    expect(await credits()).toBe(2);
    expect(await invoice("in_m12", "now() + interval '12 months'")).toBe(
      "duplicate",
    );
    expect(
      await scalar(
        "select (expires_at = granted_at + interval '12 months') as value from public.account_credits where source_reference='in_m0'",
      ),
    ).toBe(true);
  });

  it("issues the included report on each yearly renewal and not again after resubscribing", async () => {
    await subscribe("premium");
    expect(await invoice("in_y0", "now()")).toBe("credit_granted");
    await db.exec(
      "update public.account_subscriptions set status='canceled' where stripe_subscription_id='sub_atlas'",
    );
    await subscribe("premium", "now()", "sub_atlas_again");
    expect(
      await invoice("in_y0b", "now() + interval '3 months'", "sub_atlas_again"),
    ).toBe("recorded");
    expect(
      await invoice("in_y1", "now() + interval '1 year'", "sub_atlas_again"),
    ).toBe("credit_granted");
  });

  it("re-issues the year's report after a refunded, unredeemed period", async () => {
    await subscribe("premium");
    expect(await invoice("in_r0", "now()")).toBe("credit_granted");
    expect(
      await scalar(
        "select public.reverse_paid_subscription_invoice('pi_in_r0', now()) as value",
      ),
    ).toBe("reversed");
    expect(await invoice("in_r1", "now() + interval '1 month'")).toBe(
      "credit_granted",
    );
    const redeemed = await scalar<string>(
      "select id as value from public.account_credits where source_reference='in_r1'",
    );
    await db.query(
      "insert into public.orders(user_id,credit_id) values ($1,$2)",
      [user, redeemed],
    );
    await scalar(
      "select public.reverse_paid_subscription_invoice('pi_in_r1', now()) as value",
    );
    expect(await invoice("in_r2", "now() + interval '2 months'")).toBe(
      "recorded",
    );
  });

  it("lets Google Play renewals use the same annual rule directly", async () => {
    expect(
      await scalar(
        "select public.grant_annual_report_credit($1,'google_play:GPA.1',now()) as value",
        [user],
      ),
    ).toBe("credit_granted");
    expect(
      await scalar(
        "select public.grant_annual_report_credit($1,'google_play:GPA.1',now()) as value",
        [user],
      ),
    ).toBe("duplicate");
    expect(
      await scalar(
        "select public.grant_annual_report_credit($1,'google_play:GPA.2',now() + interval '1 month') as value",
        [user],
      ),
    ).toBe("recorded");
  });

  it("prices Atlas reports at 20% below the standard price", async () => {
    const rows = await db.query<{
      report_type: string;
      standard: number;
      atlas: number;
    }>(
      `select f.report_type, f.unit_amount as standard, p.unit_amount as atlas
       from public.report_prices f join public.report_prices p
         on p.report_type=f.report_type and p.plan_key='premium' and p.active
       where f.plan_key='free' and f.active order by f.report_type`,
    );
    expect(rows.rows).toHaveLength(2);
    for (const row of rows.rows)
      expect(row.atlas).toBe(Math.round(row.standard * 0.8));
  });

  it("supports Google Play subscriptions alongside Stripe ones", async () => {
    await db.query(
      `insert into public.account_subscriptions(user_id,plan_key,provider,status,google_play_purchase_token,google_play_product_id,google_play_order_id,current_period_start,current_period_end)
       values ($1,'premium','google_play','active','token-1','atlas_membership','GPA.1',now(),now()+interval '1 month')`,
      [user],
    );
    await saveChart();
    await saveChart();
    await expect(
      db.query(
        "insert into public.account_subscriptions(user_id,plan_key,provider,status) values ($1,'premium','google_play','canceled')",
        [other],
      ),
    ).rejects.toThrow("account_subscriptions_provider_ids_check");
    await expect(
      db.query(
        "insert into public.account_subscriptions(user_id,plan_key,status) values ($1,'premium','canceled')",
        [other],
      ),
    ).rejects.toThrow("account_subscriptions_provider_ids_check");
    await expect(
      db.query(
        `insert into public.account_subscriptions(user_id,plan_key,provider,status,google_play_purchase_token)
         values ($1,'premium','google_play','canceled','token-1')`,
        [other],
      ),
    ).rejects.toThrow();
    await expect(subscribe("premium")).rejects.toThrow(
      "account_subscriptions_one_current_idx",
    );
    expect(await invoice("in_play", "now()")).toBe("ineligible");
  });

  it("keeps privileged functions service-role only", async () => {
    for (const signature of [
      "public.grant_annual_report_credit(uuid,text,timestamptz)",
      "public.record_paid_subscription_invoice(text,text,text,uuid,timestamptz)",
      "public.daily_reading_allowance(uuid,uuid)",
    ]) {
      expect(
        await scalar(
          `select has_function_privilege('authenticated','${signature}','execute') as value`,
        ),
      ).toBe(false);
      expect(
        await scalar(
          `select has_function_privilege('service_role','${signature}','execute') as value`,
        ),
      ).toBe(true);
    }
  });
});
