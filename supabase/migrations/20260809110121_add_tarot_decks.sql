create table public.tarot_decks (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  tagline text not null check (char_length(tagline) between 10 and 240),
  translations jsonb not null check (
    jsonb_typeof(translations) = 'object'
    and translations ?& array['es-ES','fr-FR','de-DE']
    and jsonb_typeof(translations -> 'es-ES') = 'object'
    and jsonb_typeof(translations -> 'fr-FR') = 'object'
    and jsonb_typeof(translations -> 'de-DE') = 'object'
  ),
  accent_token text not null check (
    accent_token in ('gold','copper','map-cyan','map-red','map-chalk')
  ),
  cover_image_path text check (
    cover_image_path is null
    or cover_image_path = id || '/cover.webp'
  ),
  card_back_image_path text check (
    card_back_image_path is null
    or card_back_image_path = id || '/card-back.webp'
  ),
  minimum_plan text not null references public.commerce_plans(plan_key) on delete restrict,
  active boolean not null default false,
  sort_order smallint not null default 0 check (sort_order between 0 and 1000),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not active or (cover_image_path is not null and card_back_image_path is not null))
);

create index tarot_decks_active_order_idx
on public.tarot_decks(sort_order, name)
where active;

create trigger tarot_decks_set_updated_at
before update on public.tarot_decks
for each row execute function private.set_updated_at();

alter table public.tarot_decks enable row level security;

revoke all on public.tarot_decks from public, anon, authenticated;
grant all on public.tarot_decks to service_role;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'tarot-decks',
  'tarot-decks',
  false,
  5242880,
  array['image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.tarot_decks is
  'Server-managed tarot deck catalogue. Private artwork is resolved to short-lived signed URLs only after access checks.';
comment on column public.tarot_decks.cover_image_path is
  'Stable private Storage path. Never persist signed URLs.';
comment on column public.tarot_decks.card_back_image_path is
  'Stable private Storage path. Replacements overwrite the same object to avoid orphan files.';

insert into public.tarot_decks (
  id,
  name,
  tagline,
  translations,
  accent_token,
  minimum_plan,
  active,
  sort_order
)
values
  (
    'traditional',
    'Traditional',
    'The classic deck—timeless symbolism in rich colour and gold.',
    '{
      "es-ES":{"name":"Tradicional","tagline":"La baraja clásica: simbolismo atemporal en colores intensos y dorado."},
      "fr-FR":{"name":"Traditionnel","tagline":"Le jeu classique : symbolisme intemporel, couleurs riches et or."},
      "de-DE":{"name":"Traditionell","tagline":"Das klassische Deck—zeitlose Symbolik in satten Farben und Gold."}
    }'::jsonb,
    'gold',
    'free',
    false,
    0
  ),
  (
    'cat',
    'The Whimsical Cats',
    'Storybook cats stand in for every archetype—soft colour, big charm.',
    '{
      "es-ES":{"name":"Los gatos caprichosos","tagline":"Gatos de cuento encarnan cada arquetipo: colores suaves y mucho encanto."},
      "fr-FR":{"name":"Les Chats fantasques","tagline":"Des chats de conte incarnent chaque archétype, entre couleurs douces et grand charme."},
      "de-DE":{"name":"Die wunderlichen Katzen","tagline":"Märchenhafte Katzen verkörpern jeden Archetyp—sanfte Farben, großer Charme."}
    }'::jsonb,
    'map-chalk',
    'personal',
    false,
    10
  ),
  (
    'comic',
    'Silver Age',
    'Golden-age comic heroes reinterpret the arcana in bold ink and halftone.',
    '{
      "es-ES":{"name":"Edad de Plata","tagline":"Héroes del cómic clásico reinterpretan los arcanos con tinta audaz y semitonos."},
      "fr-FR":{"name":"Âge d’argent","tagline":"Des héros de bande dessinée classique réinterprètent les arcanes à l’encre franche et en demi-teintes."},
      "de-DE":{"name":"Silbernes Zeitalter","tagline":"Klassische Comic-Helden deuten die Arkana in kräftiger Tinte und Rasterpunkten neu."}
    }'::jsonb,
    'map-red',
    'premium',
    false,
    20
  ),
  (
    'techno',
    'Neon Circuit',
    'Circuitry and holographic light for a digital-age deck.',
    '{
      "es-ES":{"name":"Circuito de neón","tagline":"Circuitos y luz holográfica para una baraja de la era digital."},
      "fr-FR":{"name":"Circuit néon","tagline":"Circuits et lumière holographique pour un jeu de l’ère numérique."},
      "de-DE":{"name":"Neon-Schaltkreis","tagline":"Schaltkreise und holografisches Licht für ein Deck des digitalen Zeitalters."}
    }'::jsonb,
    'map-cyan',
    'premium',
    false,
    30
  ),
  (
    'provencal',
    'Provençal',
    'Sun-washed lavender fields and faded linen from the French countryside.',
    '{
      "es-ES":{"name":"Provenzal","tagline":"Lavanda bañada por el sol y lino desvaído de la campiña francesa."},
      "fr-FR":{"name":"Provençal","tagline":"Lavande baignée de soleil et lin patiné de la campagne française."},
      "de-DE":{"name":"Provenzalisch","tagline":"Sonnendurchflutete Lavendelfelder und verblichenes Leinen aus Südfrankreich."}
    }'::jsonb,
    'copper',
    'premium',
    false,
    40
  )
on conflict (id) do nothing;
