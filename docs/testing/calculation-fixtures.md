# Calculation fixture provenance

Planetary fixtures compare Astronomy Engine output with transcribed geocentric reference longitudes at a maximum tolerance of 0.2 degrees.

Angle fixtures use local apparent sidereal time returned by the official U.S. Naval Observatory Sidereal Time API 4.0.1. Expected Ascendant and Midheaven values were generated independently from the recorded USNO sidereal values using standard spherical coordinate transformations and mean obliquity, rather than the production Astronomy Engine sidereal-time result. The accepted angular tolerance is 0.01 degrees.

The fixture set covers Greenwich at J2000, London historical and DST-boundary dates, Tromso above the Arctic Circle, extreme non-polar latitudes, exact equal-house cusp boundaries, unknown birth time, a historical IANA offset expressed in seconds, DST gaps and overlaps, and Mercury motion reversals around known 2024 stations.

USNO provides sidereal data only for 1800–2050. Dates outside that range require a separately reviewed reference source before Celestial Atlas expands its supported production date range.
