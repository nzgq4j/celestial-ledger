-- Celestial Atlas 18-month forecast model, base case.
-- Dialect: PostgreSQL-compatible recursive SQL.
-- This query mirrors the formula-driven workbook and report snapshot.

WITH RECURSIVE assumptions AS (
  SELECT
    500.0::numeric AS starting_users,
    0.80::numeric AS free_mix,
    0.16::numeric AS personal_mix,
    0.04::numeric AS premium_mix,
    9.99::numeric AS personal_price,
    19.99::numeric AS premium_price,
    250.0::numeric AS hosting,
    250.0::numeric AS advertising,
    20.0::numeric AS paid_cac,
    0.01::numeric AS organic_rate,
    0.03::numeric AS churn_rate,
    5.0::numeric AS pack_price,
    14.99::numeric AS report_price,
    0.25::numeric AS model_input_price_per_million,
    2.0::numeric AS model_output_price_per_million,
    0.029::numeric AS card_rate,
    0.30::numeric AS fixed_card_fee,
    0.007::numeric AS billing_rate
),
months AS (
  SELECT 1 AS month_number, DATE '2026-08-01' AS month_start, a.starting_users AS opening_users
  FROM assumptions a
  UNION ALL
  SELECT
    m.month_number + 1,
    (m.month_start + INTERVAL '1 month')::date,
    m.opening_users
      + a.advertising / a.paid_cac
      + m.opening_users * a.organic_rate
      - m.opening_users * a.churn_rate
  FROM months m
  CROSS JOIN assumptions a
  WHERE m.month_number < 18
),
population AS (
  SELECT
    m.*,
    a.advertising / a.paid_cac AS paid_adds,
    m.opening_users * a.organic_rate AS organic_adds,
    m.opening_users * a.churn_rate AS churned_users,
    m.opening_users
      + a.advertising / a.paid_cac
      + m.opening_users * a.organic_rate
      - m.opening_users * a.churn_rate AS closing_users
  FROM months m
  CROSS JOIN assumptions a
),
tier_population AS (
  SELECT
    p.*,
    (p.opening_users + p.closing_users) / 2.0 AS active_users,
    ((p.opening_users + p.closing_users) / 2.0) * a.free_mix AS free_users,
    ((p.opening_users + p.closing_users) / 2.0) * a.personal_mix AS personal_users,
    ((p.opening_users + p.closing_users) / 2.0) * a.premium_mix AS premium_users
  FROM population p
  CROSS JOIN assumptions a
),
revenue AS (
  SELECT
    t.*,
    t.personal_users * a.personal_price + t.premium_users * a.premium_price AS subscription_revenue,
    (t.free_users * 0.08 + t.personal_users * 0.03 + t.premium_users * 0.01) * a.pack_price AS pack_revenue,
    t.free_users * 0.02 * a.report_price
      + t.personal_users * 0.04 * a.report_price * 0.90
      + t.premium_users * 0.02 * a.report_price * 0.80 AS report_revenue,
    t.free_users * 0.02 + t.personal_users * 0.04 + t.premium_users * 0.02 AS paid_reports,
    t.premium_users / 3.0 AS included_reports
  FROM tier_population t
  CROSS JOIN assumptions a
),
economics AS (
  SELECT
    r.*,
    r.subscription_revenue + r.pack_revenue + r.report_revenue AS total_revenue,
    (r.paid_reports + r.included_reports)
      * (((15000.0 / 1000000.0) * a.model_input_price_per_million
      + (20000.0 / 1000000.0) * a.model_output_price_per_million) * 1.10)
      + (r.paid_adds + r.organic_adds)
      * (a.free_mix * 1.0 + a.personal_mix * 1.4 + a.premium_mix * 2.0)
      * ((5000.0 / 1000000.0) * a.model_input_price_per_million
      + (2000.0 / 1000000.0) * a.model_output_price_per_million) AS ai_cost,
    r.subscription_revenue * (a.card_rate + a.billing_rate)
      + (r.personal_users + r.premium_users) * a.fixed_card_fee
      + r.pack_revenue * a.card_rate
      + (r.free_users * 0.08 + r.personal_users * 0.03 + r.premium_users * 0.01) * a.fixed_card_fee
      + r.report_revenue * a.card_rate
      + r.paid_reports * a.fixed_card_fee AS payment_fees
  FROM revenue r
  CROSS JOIN assumptions a
)
SELECT
  e.month_number,
  e.month_start,
  e.opening_users,
  e.closing_users,
  e.active_users,
  e.subscription_revenue,
  e.pack_revenue,
  e.report_revenue,
  e.total_revenue,
  e.ai_cost,
  e.payment_fees,
  a.hosting,
  a.advertising,
  e.ai_cost + e.payment_fees + a.hosting + a.advertising AS total_cost,
  e.total_revenue - e.ai_cost - e.payment_fees - a.hosting - a.advertising AS operating_contribution
FROM economics e
CROSS JOIN assumptions a
ORDER BY e.month_number;
