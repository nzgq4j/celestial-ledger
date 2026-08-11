create table public.tarot_deck_card_faces (
  deck_id text not null references public.tarot_decks(id) on delete cascade,
  card_id text not null check (card_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  image_path text not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  primary key (deck_id, card_id),
  check (
    image_path ~ (
      '^' || deck_id || '/faces/' || card_id || '-[a-f0-9]{12}\.webp$'
    )
  )
);

create index tarot_deck_card_faces_deck_idx
on public.tarot_deck_card_faces (deck_id, card_id);

create trigger tarot_deck_card_faces_set_updated_at
before update on public.tarot_deck_card_faces
for each row execute function private.set_updated_at();

alter table public.tarot_deck_card_faces enable row level security;

revoke all on public.tarot_deck_card_faces from public, anon, authenticated;
grant all on public.tarot_deck_card_faces to service_role;

comment on table public.tarot_deck_card_faces is
  'Private per-deck tarot card face artwork mappings. Objects stay in the private tarot-decks storage bucket and are served only through short-lived signed URLs.';

comment on column public.tarot_deck_card_faces.card_id is
  'Immutable tarot card id from the application card catalogue, for example major-0 or cups-13.';

comment on column public.tarot_deck_card_faces.image_path is
  'Versioned WebP storage object path in tarot-decks, namespaced under deck_id/faces/.';
