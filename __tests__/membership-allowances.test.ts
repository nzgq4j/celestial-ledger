import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, beforeEach, afterAll, describe, expect, it } from "vitest";

// Run the real quota migration against PostgreSQL, without Docker or production data.
// Supporting relations retain their real migration definitions where possible.
const migration = readFileSync(
  "supabase/migrations/20260908074857_enforce_membership_allowances.sql",
  "utf8",
);
const commerce = readFileSync(
  "supabase/migrations/20260806212538_account_capability_entitlements.sql",
  "utf8",
);
const daily = readFileSync(
  "supabase/migrations/20260805085105_registered_daily_readings.sql",
  "utf8",
);
let db: PGlite;
const user = "10000000-0000-4000-8000-000000000001";
const stranger = "10000000-0000-4000-8000-000000000002";
let chart: string;

async function scalar(sql: string, params: unknown[] = []) {
  const result = await db.query<{ value: unknown }>(sql, params);
  return result.rows[0]?.value;
}
async function saveChart(owner = user) {
  return (await scalar(
    "insert into public.birth_profiles(user_id) values ($1) returning id as value",
    [owner],
  )) as string;
}
async function plan(key: "personal" | "premium") {
  await db.query(
    `insert into public.account_subscriptions(user_id,billing_customer_id,plan_key,stripe_subscription_id,status,current_period_start,current_period_end)
    values ($1,$2,$3,'sub_test','active',now()-interval '2 days',now()+interval '28 days')
    on conflict (stripe_subscription_id) do update set plan_key=excluded.plan_key`,
    [user, user, key],
  );
}
async function reserve(
  profile = chart,
  key = randomUUID().replaceAll("-", "").repeat(2),
  id = randomUUID(),
) {
  return {
    id,
    key,
    result: (await scalar(
      "select public.reserve_daily_reading($1,$2,$3,$4) as value",
      [user, profile, key, id],
    )) as { status: string; remaining?: number; readingId?: string },
  };
}
async function complete(
  reservation: Awaited<ReturnType<typeof reserve>>,
  profile = chart,
) {
  await db.query(
    `insert into public.daily_readings(id,user_id,birth_profile_id,reading_date,observation_time_zone,locale,cache_key,schema_version,method_version,rule_version,calculation_version,ephemeris_version,analysis,content,evidence)
    values ($1,$2,$3,current_date,'UTC','en-GB',$4,'test','test','test','test','test','{}','{}','{}')`,
    [reservation.id, user, profile, reservation.key],
  );
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create schema private;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as 'select null::uuid';
    create function private.set_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end;$$;
    create table public.admin_roles(user_id uuid,role text);
    create table public.products(report_type text primary key);
    create table public.birth_profiles(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id),created_at timestamptz default now(),expires_at timestamptz default now()+interval '1 year');`);
  await db.exec(
    commerce.slice(0, commerce.indexOf("alter table public.orders")),
  );
  const plans = commerce.slice(
    commerce.indexOf("insert into public.commerce_plans("),
    commerce.indexOf("insert into public.credit_report_eligibility"),
  );
  // Seed only plans/capabilities; production price IDs are never used in network calls.
  await db.exec(
    plans.slice(
      0,
      plans.indexOf("insert into public.report_prices") === -1
        ? undefined
        : plans.indexOf("insert into public.report_prices"),
    ),
  );
  await db.exec(daily.slice(0, daily.indexOf("comment on")));
  await db.exec(migration);
}, 60000);
beforeEach(async () => {
  await db.exec(
    "truncate public.daily_readings,public.daily_reading_reservations,public.birth_profiles,public.account_subscriptions,public.billing_customers,public.capability_grants,public.admin_roles,public.subscription_paid_invoices,public.account_credits,auth.users cascade",
  );
  await db.query("insert into auth.users values ($1),($2)", [user, stranger]);
  await db.query(
    "insert into public.billing_customers(id,user_id,stripe_customer_id) values ($1,$1,'cus_test')",
    [user],
  );
  await db.exec("update public.commerce_plans set active=true");
  chart = await saveChart();
});
afterAll(async () => {
  await db?.close();
});

describe("membership quota migration", () => {
  it("keeps the previous API working during rollout while enforcing the same quota", async () => {
    const legacy = {
      id: randomUUID(),
      key: "a".repeat(64),
      result: { status: "legacy" },
    };
    await complete(legacy);
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    await expect(
      complete({ ...legacy, id: randomUUID(), key: "b".repeat(64) }),
    ).rejects.toThrow("DAILY_READING_ALLOWANCE_EXHAUSTED");
  });
  it("resets weekly usage by generation time, independently of the requested reading date", async () => {
    const first = await reserve();
    await complete(first);
    await db.query(
      "update public.daily_reading_reservations set created_at=date_trunc('week',now() at time zone 'UTC') at time zone 'UTC' - interval '1 second' where id=$1",
      [first.id],
    );
    expect((await reserve()).result.status).toBe("reserved");
  });
  it("enforces Free, Personal and Premium saved-chart limits without deleting existing charts", async () => {
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
    await plan("personal");
    await saveChart();
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
    await plan("premium");
    await saveChart();
    await saveChart();
    await saveChart();
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
    await db.exec("update public.account_subscriptions set status='canceled'");
    expect(
      await scalar(
        "select count(*)::integer as value from public.birth_profiles",
      ),
    ).toBe(5);
    await expect(saveChart()).rejects.toThrow(
      "SAVED_CHART_ALLOWANCE_EXHAUSTED",
    );
  });
  it("counts active charts and protects reactivation and owner transfer", async () => {
    await db.query(
      "update public.birth_profiles set expires_at=now()-interval '1 day' where id=$1",
      [chart],
    );
    await saveChart();
    await expect(
      db.query(
        "update public.birth_profiles set expires_at=now()+interval '1 year' where id=$1",
        [chart],
      ),
    ).rejects.toThrow("SAVED_CHART_ALLOWANCE_EXHAUSTED");
    const other = await saveChart(stranger);
    await expect(
      db.query("update public.birth_profiles set user_id=$1 where id=$2", [
        user,
        other,
      ]),
    ).rejects.toThrow("SAVED_CHART_ALLOWANCE_EXHAUSTED");
  });
  it("reserves before generation, handles duplicate requests, and releases failed attempts", async () => {
    const first = await reserve();
    expect(first.result.status).toBe("reserved");
    expect((await reserve(chart, first.key)).result.status).toBe("in_progress");
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    await db.query("select public.release_daily_reading($1,$2)", [
      stranger,
      first.id,
    ]);
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    await db.query("select public.release_daily_reading($1,$2)", [
      user,
      first.id,
    ]);
    expect((await reserve()).result.status).toBe("reserved");
  });
  it("reopens cached readings without charge and retains usage after deletion", async () => {
    const first = await reserve();
    await complete(first);
    await db.query("select public.release_daily_reading($1,$2)", [
      user,
      first.id,
    ]);
    expect((await reserve(chart, first.key)).result).toEqual({
      status: "cached",
      readingId: first.id,
    });
    await db.query("delete from public.daily_readings where id=$1", [first.id]);
    expect((await reserve()).result.status).toBe("allowance_exhausted");
  });
  it("recovers expired leases and refuses a stale generator's save", async () => {
    const first = await reserve();
    await db.query(
      "update public.daily_reading_reservations set lease_expires_at=now()-interval '1 second' where id=$1",
      [first.id],
    );
    expect((await reserve()).result.status).toBe("reserved");
    await expect(complete(first)).rejects.toThrow(
      "DAILY_READING_RESERVATION_REQUIRED",
    );
  });
  it("shares Personal's ten readings across charts within the billing period", async () => {
    await plan("personal");
    const companion = await saveChart();
    for (let i = 0; i < 10; i++)
      expect((await reserve(i % 2 ? companion : chart)).result.status).toBe(
        "reserved",
      );
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    const access = (await scalar(
      "select public.daily_reading_allowance($1,$2) as value",
      [user, chart],
    )) as { resetsAt: string };
    expect(Date.parse(access.resetsAt)).toBeGreaterThan(
      Date.now() + 27 * 86400000,
    );
  });
  it("separates Premium's primary daily allowance from ten companion readings", async () => {
    await plan("premium");
    await db.query(
      "update public.birth_profiles set created_at=now()-interval '1 day' where id=$1",
      [chart],
    );
    const companion = await saveChart();
    expect((await reserve()).result.status).toBe("reserved");
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    for (let i = 0; i < 10; i++)
      expect((await reserve(companion)).result.status).toBe("reserved");
    expect((await reserve(companion)).result.status).toBe(
      "allowance_exhausted",
    );
  });
  it("checks ownership and expiry before reserving", async () => {
    expect((await reserve(await saveChart(stranger))).result.status).toBe(
      "profile_unavailable",
    );
    await db.query(
      "update public.birth_profiles set expires_at=now()-interval '1 day' where id=$1",
      [chart],
    );
    expect((await reserve()).result.status).toBe("profile_unavailable");
  });
  it("honours explicit grants and administrator access", async () => {
    await db.query(
      "insert into public.capability_grants(user_id,capability_key,source_type,allowance,period) values ($1,'daily_reading.personal','administrative',2,'week')",
      [user],
    );
    expect((await reserve()).result.status).toBe("reserved");
    expect((await reserve()).result.status).toBe("reserved");
    expect((await reserve()).result.status).toBe("allowance_exhausted");
    await db.query("insert into public.admin_roles values ($1,'site_admin')", [
      user,
    ]);
    for (let i = 0; i < 7; i++) await saveChart();
    expect((await reserve()).result.status).toBe("reserved");
  });
  it("blocks browser roles from allowance RPCs and private reservations", async () => {
    expect(
      await scalar(
        "select has_function_privilege('authenticated','public.reserve_daily_reading(uuid,uuid,text,uuid)','execute') as value",
      ),
    ).toBe(false);
    expect(
      await scalar(
        "select has_function_privilege('anon','public.daily_reading_allowance(uuid,uuid)','execute') as value",
      ),
    ).toBe(false);
    expect(
      await scalar(
        "select has_table_privilege('authenticated','public.daily_reading_reservations','select') as value",
      ),
    ).toBe(false);
  });
  it("records Premium invoices idempotently without issuing new quarterly credits", async () => {
    await plan("premium");
    for (let i = 0; i < 3; i++)
      expect(
        await scalar(
          "select public.record_paid_subscription_invoice($1,$2,'sub_test',$3,now()) as value",
          [`in_${i}`, `pi_${i}`, user],
        ),
      ).toBe("recorded");
    expect(
      await scalar(
        "select public.record_paid_subscription_invoice('in_0','pi_0','sub_test',$1,now()) as value",
        [user],
      ),
    ).toBe("duplicate");
    expect(
      await scalar(
        "select count(*)::integer as value from public.account_credits",
      ),
    ).toBe(0);
  });
});
