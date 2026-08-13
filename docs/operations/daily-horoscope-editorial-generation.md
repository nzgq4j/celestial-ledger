# Daily horoscope editorial generation

The daily Sun-sign edition is generated on the server from the calculated
Astronomy Engine snapshot. The model receives immutable placements, aspects,
whole-sign solar-house evidence, and recent published copy to avoid. It must
not calculate, correct, infer, or add astronomical facts.

The editorial contract uses tropical, geocentric, whole-sign solar astrology.
It ranks a small number of relevant signals, produces materially different
readings for all twelve signs, and cites immutable evidence IDs. Reader-facing
fields contain only horoscope content.

Changing the editorial contract requires incrementing
`HOROSCOPE_PROMPT_VERSION`. The hourly protected rollover route will then
generate and validate a fresh edition. Existing published rows remain useful
for historical similarity checks and operational diagnosis.
