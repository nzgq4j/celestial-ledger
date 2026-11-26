import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Dry run of the Celestial Atlas app backend: every migration in order, in an
// in-process PostgreSQL with stand-ins for Supabase's auth and storage schemas.
// Row-level security is exercised as the `authenticated` role.

let db: PGlite;
const alice = "30000000-0000-4000-8000-000000000001";
const bob = "30000000-0000-4000-8000-000000000002";
const admin = "30000000-0000-4000-8000-000000000003";

async function as<T>(uid: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(`set app.uid = '${uid ?? ""}'; set role authenticated;`);
  try {
    return await run();
  } finally {
    await db.exec("reset role; set app.uid = '';");
  }
}
const one = async <T>(sql: string, params: unknown[] = []) =>
  (await db.query<T>(sql, params)).rows[0];

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth; create schema if not exists private; create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb, created_at timestamptz default now());
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.uid', true), '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select 'authenticated' $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;
    grant usage on schema auth to authenticated, anon;`);
  for (const file of readdirSync("supabase/migrations").sort())
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  await db.exec(
    `insert into auth.users(id) values ('${alice}'), ('${bob}'), ('${admin}');`,
  );
  await db.exec(
    `insert into public.billing_customers(id, user_id, stripe_customer_id) values ('${alice}','${alice}','cus_alice'), ('${bob}','${bob}','cus_bob');`,
  );
}, 120_000);

afterAll(async () => {
  await db?.close();
});

describe("Celestial Atlas app backend migration", () => {
  it("adds the full birth name and GeoNames ID to birth profiles", async () => {
    const id = (
      await one<{ id: string }>(
        `insert into public.birth_profiles(user_id,label,birth_date,birth_time,time_unknown,city,country,display_name,latitude,longitude,time_zone,full_name,geoname_id)
         values ($1,'Me','1991-07-28','06:45',false,'Avignon','France','Avignon, France',43.9493,4.8055,'Europe/Paris','Amelia Rose Laurent',3035681) returning id`,
        [alice],
      )
    ).id;
    expect(id).toBeTruthy();
    await expect(
      db.query(
        "update public.birth_profiles set full_name = ' ' where id = $1",
        [id],
      ),
    ).rejects.toThrow();
  });

  it("lets members save, read and delete only their own journal entries", async () => {
    await as(alice, () =>
      db.query(
        "insert into public.atlas_journal_entries(user_id, entry_type, title, body) values ($1,'horoscope','Leo · Today','Body')",
        [alice],
      ),
    );
    await expect(
      as(alice, () =>
        db.query(
          "insert into public.atlas_journal_entries(user_id, entry_type, title, body) values ($1,'horoscope','x','y')",
          [bob],
        ),
      ),
    ).rejects.toThrow();
    const mine = await as(alice, () =>
      db.query("select title from public.atlas_journal_entries"),
    );
    expect(mine.rows).toHaveLength(1);
    const theirs = await as(bob, () =>
      db.query("select title from public.atlas_journal_entries"),
    );
    expect(theirs.rows).toHaveLength(0);
    await as(bob, () => db.query("delete from public.atlas_journal_entries"));
    const stillThere = await one<{ n: number }>(
      "select count(*)::int as n from public.atlas_journal_entries",
    );
    expect(stillThere.n).toBe(1);
    await expect(
      as(alice, () =>
        db.query("update public.atlas_journal_entries set title = 'edited'"),
      ),
    ).rejects.toThrow();
    await as(alice, () => db.query("delete from public.atlas_journal_entries"));
    expect(
      (
        await one<{ n: number }>(
          "select count(*)::int as n from public.atlas_journal_entries",
        )
      ).n,
    ).toBe(0);
  });

  it("sets journal expiry on the server to one year", async () => {
    await as(alice, () =>
      db.query(
        "insert into public.atlas_journal_entries(user_id, entry_type, title, body, expires_at) values ($1,'tarot','t','b', now() + interval '10 years')",
        [alice],
      ),
    );
    const row = await one<{ days: number }>(
      "select round(extract(epoch from expires_at - created_at) / 86400)::int as days from public.atlas_journal_entries where user_id = $1",
      [alice],
    );
    expect([365, 366]).toContain(row.days);
  });

  it("rejects unknown entry types", async () => {
    await expect(
      as(alice, () =>
        db.query(
          "insert into public.atlas_journal_entries(user_id, entry_type, title, body) values ($1,'blog','t','b')",
          [alice],
        ),
      ),
    ).rejects.toThrow();
  });

  it("reports the signed-in member's plan", async () => {
    const plan = async (uid: string | null) =>
      (
        await as(uid, () =>
          one<{ m: { plan: string; status?: string } }>(
            "select public.atlas_membership() as m",
          ),
        )
      ).m;
    expect((await plan(null)).plan).toBe("free");
    expect((await plan(alice)).plan).toBe("free");

    await db.query(
      `insert into public.account_subscriptions(user_id,billing_customer_id,plan_key,stripe_subscription_id,status,current_period_start,current_period_end)
       values ($1,$1,'premium','sub_alice','trialing',now(),now()+interval '3 days')`,
      [alice],
    );
    expect(await plan(alice)).toMatchObject({
      plan: "premium",
      status: "trialing",
    });

    await db.query(
      `insert into public.account_subscriptions(user_id,billing_customer_id,plan_key,stripe_subscription_id,status,current_period_start,current_period_end,grace_ends_at)
       values ($1,$1,'premium','sub_bob','past_due',now()-interval '30 days',now()-interval '1 day',now()+interval '2 days')`,
      [bob],
    );
    expect(await plan(bob)).toMatchObject({
      plan: "premium",
      status: "past_due",
    });

    await db.query(
      "insert into public.admin_roles(user_id, role) values ($1,'site_admin')",
      [admin],
    );
    expect((await plan(admin)).plan).toBe("premium");
  });

  it("adds the inactive USD 6.99 yearly Atlas+ price with a 3-day trial", async () => {
    const price = await one<{
      unit_amount: number;
      trial_days: number;
      active: boolean;
    }>(
      "select unit_amount, trial_days, active from public.commerce_plan_prices where plan_key='premium' and billing_interval='year' and catalog_version=2",
    );
    expect(price).toEqual({ unit_amount: 699, trial_days: 3, active: false });
  });

  it("purges only expired journal entries", async () => {
    await db.query(
      "alter table public.atlas_journal_entries disable trigger atlas_journal_entries_defaults",
    );
    await db.query(
      "insert into public.atlas_journal_entries(user_id, entry_type, title, body, created_at, expires_at) values ($1,'tarot','old','b', now()-interval '2 years', now()-interval '1 year')",
      [alice],
    );
    await db.query(
      "alter table public.atlas_journal_entries enable trigger atlas_journal_entries_defaults",
    );
    const purged = await one<{ n: number }>(
      "select public.purge_expired_atlas_journal_entries() as n",
    );
    expect(purged.n).toBe(1);
  });
});

describe("push notification tables", () => {
  const hash = (n: number) => n.toString(16).padStart(64, "0");
  const web = (n: number) =>
    db.query<{ id: string }>(
      `insert into public.atlas_push_devices(device_key_hash, platform, endpoint, p256dh, auth_secret)
       values ($1, 'web', 'https://web.push.apple.com/abc', $2, $3) returning id`,
      [hash(n), "B".repeat(87), "A".repeat(22)],
    );

  it("are server-only: members and visitors can neither read nor write them", async () => {
    await web(1);
    for (const table of [
      "atlas_push_devices",
      "atlas_push_messages",
      "atlas_push_announcements",
    ]) {
      await expect(
        as(alice, () => db.query(`select * from public.${table}`)),
      ).rejects.toThrow();
    }
    await expect(
      as(alice, () =>
        db.query(
          `insert into public.atlas_push_devices(device_key_hash, platform, fcm_token) values ($1,'android',$2)`,
          [hash(2), "t".repeat(40)],
        ),
      ),
    ).rejects.toThrow();
  });

  it("requires the push address that matches the platform", async () => {
    await expect(
      db.query(
        `insert into public.atlas_push_devices(device_key_hash, platform, fcm_token) values ($1,'web',$2)`,
        [hash(3), "t".repeat(40)],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        `insert into public.atlas_push_devices(device_key_hash, platform, endpoint, p256dh, auth_secret) values ($1,'web','http://insecure.example/x',$2,$3)`,
        [hash(4), "B".repeat(87), "A".repeat(22)],
      ),
    ).rejects.toThrow();
    await expect(
      db.query(
        `insert into public.atlas_push_devices(device_key_hash, platform, fcm_token) values ('not-a-hash','android',$1)`,
        ["t".repeat(40)],
      ),
    ).rejects.toThrow();
  });

  it("deletes a device's messages with it, and purges sent and stale data", async () => {
    const device = (await web(5)).rows[0].id;
    await db.query(
      `insert into public.atlas_push_messages(device_id, send_at, title, body, sent_at) values
        ($1, now() - interval '3 days', 'Old', 'Sent long ago', now() - interval '3 days'),
        ($1, now() + interval '1 day', 'Next', 'Tomorrow', null)`,
      [device],
    );
    const purged = await one<{ r: { messages: number; devices: number } }>(
      "select public.purge_atlas_push() as r",
    );
    expect(purged.r.messages).toBe(1);
    expect(
      (
        await one<{ n: number }>(
          "select count(*)::int as n from public.atlas_push_messages where device_id = $1",
          [device],
        )
      ).n,
    ).toBe(1);

    await db.query(
      "update public.atlas_push_devices set last_seen_at = now() - interval '61 days' where id = $1",
      [device],
    );
    expect(
      (
        await one<{ r: { devices: number } }>(
          "select public.purge_atlas_push() as r",
        )
      ).r.devices,
    ).toBeGreaterThanOrEqual(1);
    expect(
      (
        await one<{ n: number }>(
          "select count(*)::int as n from public.atlas_push_messages where device_id = $1",
          [device],
        )
      ).n,
    ).toBe(0);
  });

  it("only accepts in-app paths for notification links", async () => {
    const device = (await web(6)).rows[0].id;
    await expect(
      db.query(
        `insert into public.atlas_push_messages(device_id, send_at, title, body, url) values ($1, now(), 't', 'b', 'https://evil.example')`,
        [device],
      ),
    ).rejects.toThrow();
  });
});

describe("saved chart allowance", () => {
  const insertChart = (uid: string, name: string) =>
    db.query(
      `insert into public.birth_profiles(user_id,label,birth_date,birth_time,time_unknown,city,country,display_name,latitude,longitude,time_zone,full_name,expires_at)
       values ($1,$2,'1990-01-01','12:00',false,'Avignon','France','Avignon, France',43.9493,4.8055,'Europe/Paris',$2,now()+interval '1 year')`,
      [uid, name],
    );

  it("lets Atlas+ keep its own chart plus 7 more, and no more", async () => {
    // Alice is an Atlas+ member (trialing) from the membership test above.
    const existing = Number(
      (
        await one<{ n: string }>(
          "select count(*) as n from public.birth_profiles where user_id = $1 and expires_at > now()",
          [alice],
        )
      ).n,
    );
    for (let i = existing; i < 8; i++)
      await insertChart(alice, `Companion ${i}`);
    await expect(insertChart(alice, "One too many")).rejects.toThrow(
      /SAVED_CHART_ALLOWANCE_EXHAUSTED/,
    );
  });

  it("keeps the free plan at one chart", async () => {
    const carol = "30000000-0000-4000-8000-000000000004";
    await db.query("insert into auth.users(id) values ($1)", [carol]);
    await insertChart(carol, "Carol");
    await expect(insertChart(carol, "Second")).rejects.toThrow(
      /SAVED_CHART_ALLOWANCE_EXHAUSTED/,
    );
  });
});
