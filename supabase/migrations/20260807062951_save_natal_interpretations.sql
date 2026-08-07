alter table public.birth_profiles
  add column natal_reading text
    check (natal_reading is null or char_length(natal_reading) between 1 and 24000),
  add column natal_reading_model_version text
    check (natal_reading_model_version is null or char_length(natal_reading_model_version) between 1 and 100),
  add column natal_reading_prompt_version text
    check (natal_reading_prompt_version is null or char_length(natal_reading_prompt_version) between 1 and 100),
  add column natal_reading_generated_at timestamptz;

comment on column public.birth_profiles.natal_reading is
  'Private owner-authorized natal interpretation generated from the server-calculated chart.';
comment on column public.birth_profiles.natal_reading_model_version is
  'Model identifier used to generate the stored natal interpretation.';
comment on column public.birth_profiles.natal_reading_prompt_version is
  'Immutable prompt version used to generate the stored natal interpretation.';
comment on column public.birth_profiles.natal_reading_generated_at is
  'Time the stored natal interpretation completed.';
