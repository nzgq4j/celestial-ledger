# Daily reading domain model

These are target contracts derived from the audit, not automatic instructions to create one table or TypeScript file per entity.

## Method and provenance

```ts
type DailyMethodProfile = {
  id: string;
  version: string;
  zodiac: "Tropical";
  natalHouseSystem: "Equal (Ascendant)" | "None";
  nodeType: "Mean";
  ephemeris: "astronomy-engine";
  ephemerisVersion: "2.1.19";
  calculationVersion: string;
  natalOrbProfileVersion: string;
  transitOrbProfileVersion: string;
  lunarVoidProfileVersion: string;
  searchStepMinutes: number;
  rootToleranceSeconds: number;
};
```

## Daily reading request

```ts
type DailyReadingRequest = {
  birthProfileId: string;
  civilDate: string; // YYYY-MM-DD in observationTimeZone
  observationTimeZone: string; // validated IANA name
  locale: LocaleTag;
  context?: StructuredDailyContext;
};
```

The authenticated user ID is derived from the verified session and is never accepted from the browser. A current location override, if approved, uses a validated body field and never a URL parameter.

## Birth profile

Mapping decision: use the existing `birth_profiles` row and server adapter unchanged. Fresh calculation produces a `NatalChart`. The daily domain stores only its immutable evidence/provenance snapshot, not a second mutable birth-profile model.

## Celestial position

```ts
type DailyCelestialPosition = {
  evidenceId: string;
  body: PlanetName;
  observedAtUtc: string;
  longitudeDegrees: number;
  sign: ZodiacSign;
  degreeInSign: number;
  minuteInSign: number;
  speedDegreesPerDay: number;
  motion: "direct" | "stationary" | "retrograde";
  natalHouse?: number;
  provenance: CalculationProvenance;
};
```

Latitude and declination remain deferred until the calculation engine and interpretation rules use them.

## Temporal aspect

```ts
type TemporalAspect = {
  evidenceId: string;
  sourceId: string;
  targetId: string;
  aspect: AspectName;
  exactAngleDegrees: number;
  actualAngleDegrees: number;
  orbDegrees: number;
  maximumOrbDegrees: number;
  state: "applying" | "exact" | "separating";
  exactAtUtc?: string;
  activeFromUtc: string;
  activeUntilUtc: string;
  strength: number; // normalized 0..1, deterministic
  provenance: CalculationProvenance;
};
```

## Transit window

```ts
type TransitWindow = {
  evidenceId: string;
  seriesId: string;
  transitingBody: PlanetName;
  natalTargetId: string;
  aspect: TemporalAspect;
  passNumber: number;
  passKind: "single" | "initial" | "retrograde" | "final";
  duration: "intraday" | "short-term" | "developmental" | "structural";
};
```

## Lunar period

```ts
type LunarPeriod = {
  evidenceId: string;
  startsAtUtc: string;
  endsAtUtc: string;
  moonSign: ZodiacSign;
  natalHouse?: number;
  phase: LunarPhase;
  applyingAspectIds: string[];
  voidOfCourse?: {
    startsAtUtc: string;
    endsAtUtc: string;
    profileVersion: string;
  };
  finalAspectId?: string;
};
```

## Structured daily context

Release one uses bounded reviewed values, for example:

```ts
type StructuredDailyContext = {
  priorityDomains: Array<
    | "professional"
    | "finance"
    | "relationships"
    | "communication"
    | "creative"
    | "travel"
    | "home"
    | "strategic_planning"
    | "recovery"
  >;
  eventTypes: Array<
    | "important_meeting"
    | "contract_negotiation"
    | "travel"
    | "relationship_conversation"
    | "creative_work"
    | "financial_decision"
    | "career_decision"
    | "deadline"
  >;
  recoveryThemes?: Array<ReviewedRecoveryTheme>;
  adultConfirmed?: boolean;
};
```

Recovery requires adult confirmation and reviewed themes. No free-text recovery story is accepted. Context is snapshotted and hashed; it changes ordering/emphasis only.

## Evidence fact

```ts
type DailyEvidenceFact = {
  id: string;
  kind:
    | "natal_position"
    | "natal_angle"
    | "natal_house"
    | "current_position"
    | "transit"
    | "current_aspect"
    | "lunar_period"
    | "ingress"
    | "station";
  observedAtUtc?: string;
  validFromUtc?: string;
  validUntilUtc?: string;
  facts: Record<string, string | number | boolean>;
  provenance: CalculationProvenance;
};
```

IDs are immutable, stable within a calculation version, and never translated.

## Interpretive signal

```ts
type InterpretiveSignal = {
  id: string;
  ruleId: string;
  ruleVersion: string;
  evidenceIds: string[];
  themes: string[];
  lifeDomains: string[];
  temporalState:
    | "recent"
    | "emerging"
    | "building"
    | "exact"
    | "separating"
    | "integrating"
    | "recurring";
  duration: TransitWindow["duration"];
  confidence: number;
  relevance: number;
  intensity: number;
  interpretationTokens: string[];
  practicalApplicationTokens: string[];
  riskTokens: string[];
  limitations: string[];
};
```

## Theme cluster

```ts
type ThemeCluster = {
  id: string;
  theme: string;
  supportingSignalIds: string[];
  moderatingSignalIds: string[];
  contradictorySignalIds: string[];
  convergenceScore: number;
  dominantTemporalState: InterpretiveSignal["temporalState"];
  lifeDomains: string[];
};
```

## Deterministic analytical payload

```ts
type DailyReadingAnalysis = {
  schemaVersion: string;
  readingDate: string;
  observationTimeZone: string;
  locale: LocaleTag;
  method: DailyMethodProfile;
  birthTimeKnown: boolean;
  contextSnapshot?: StructuredDailyContext;
  evidence: DailyEvidenceFact[];
  signals: InterpretiveSignal[];
  themes: ThemeCluster[];
  timeline: {
    recentPast: string[];
    present: string[];
    immediateFuture: string[];
    next72Hours: string[];
    mediumTerm: string[];
    longTerm: string[];
  };
  opportunities: string[];
  risks: string[];
  contradictions: string[];
  limitations: string[];
};
```

## Daily reading persistence

Proposed `daily_readings` fields:

```text
id, user_id, birth_profile_id
civil_date, observation_time_zone, locale, context_hash, canonical_key
status, stage, attempts, next_attempt_at, lease_expires_at
analysis_schema_version, content_schema_version, method_profile_version
rule_version, prompt_version, safety_version, model_version
analysis jsonb, output jsonb, failure_code
started_at, completed_at, expires_at, created_at, updated_at
```

Proposed `daily_reading_evidence` fields:

```text
daily_reading_id, user_id, evidence jsonb
calculation_version, ephemeris_version, method_profile_version
observation_time_zone, generated_at
```

Both are owner-scoped. Completed content and evidence are immutable. Deletion cascades from the reading and birth profile. A unique canonical key prevents duplicate reads/model calls.
