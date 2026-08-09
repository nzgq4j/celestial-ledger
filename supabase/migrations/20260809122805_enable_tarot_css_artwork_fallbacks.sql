alter table public.tarot_decks
drop constraint if exists tarot_decks_check2;

comment on column public.tarot_decks.active is
  'Active decks may use built-in symbolic CSS cover and card-back fallbacks until private artwork is uploaded.';

update public.tarot_decks
set active = true
where id in ('traditional', 'cat', 'comic', 'techno', 'provencal')
  and active = false;
