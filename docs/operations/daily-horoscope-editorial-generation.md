# Daily horoscope editorial generation

The daily Sun-sign edition is generated on the server from the calculated
Astronomy Engine snapshot. The model receives immutable placements, aspects,
whole-sign solar-house evidence, and recent published copy to avoid. It must
not calculate, correct, infer, or add astronomical facts.

The editorial contract uses tropical, geocentric, whole-sign solar astrology
as symbolic reflection. It ranks a small number of relevant signals, produces
materially different readings for all twelve signs, cites immutable evidence
IDs, and avoids natal claims, deterministic predictions, diagnosis, and
medical, legal, or financial instructions.

The current ephemeris is a single 12:00 UTC snapshot. It supports a whole-day
reading, not reliable morning-to-evening event timing, so public horoscope
pages do not present the generated phase fields as an astronomical timeline.

Changing the editorial contract requires incrementing
`HOROSCOPE_PROMPT_VERSION`. The hourly protected rollover route will then
generate and validate a fresh edition. Existing published rows remain useful
for historical similarity checks and operational diagnosis.
