# Registered daily reading content schema

## Contract principles

- Output is a private, personalized Daily Astrological Reading for a registered user and a selected owned birth profile.
- All reader-facing fields use the reading's snapshotted locale.
- Evidence IDs, rule IDs, section IDs, timestamps, degrees, and method versions are never translated or altered.
- Every material interpretive section cites immutable evidence IDs and deterministic signal/theme IDs.
- Sections with insufficient relevant evidence are omitted rather than filled with generic copy.
- Technical limitations describe actual calculation/data limits; the system does not append generic skeptical or entertainment disclaimers.
- The **Bottom Line Up Front** is the first content section and summarizes the reading that follows.

## Top-level shape

```ts
type DailyReadingContent = {
  schemaVersion: string;
  readingId: string;
  civilDate: string;
  locale: LocaleTag;
  header: {
    methodologyLabel: string;
    headline: string;
    dateLabel: string;
    observationTimeZoneLabel: string;
  };
  bottomLineUpFront: BottomLineUpFront;
  dominantThemes: ThemeSummary[];
  sections: DailyReadingSection[];
  reflectiveQuestions: EvidenceLinkedQuestion[];
  technicalAppendix: TechnicalAppendix;
  limitations: EvidenceLimitation[];
  generation: GenerationProvenance;
};
```

The renderer outputs `header`, then `bottomLineUpFront`, then every other content element. JSON property order is not trusted; the viewer enforces presentation order.

## Bottom Line Up Front

```ts
type BottomLineUpFront = {
  sectionId: "bottom-line-up-front";
  title: string; // localized display title; underlying ID remains stable
  overview: {
    narrative: string;
    evidenceIds: string[];
    sourceSectionIds: string[];
  };
  activeNow: {
    narrative: string;
    evidenceIds: string[];
    sourceSectionIds: string[];
  };
  practicalPriorities: Array<{
    title: string;
    narrative: string;
    evidenceIds: string[];
    sourceSectionIds: string[];
  }>;
  forwardLook: {
    narrative: string;
    evidenceIds: string[];
    sourceSectionIds: string[];
  };
  tensionToHold?: {
    narrative: string;
    evidenceIds: string[];
    sourceSectionIds: string[];
  };
};
```

### BLUF validation

1. Total reader-facing word count across BLUF narratives and priority titles is 425–575 words for the four supported space-delimited locales.
2. `practicalPriorities` contains 3–5 distinct, actionable, evidence-supported priorities.
3. Every evidence ID exists in the immutable evidence bundle.
4. Every source section ID exists in the final reading body.
5. BLUF evidence is a subset of evidence used by the cited source sections.
6. Source references cover the material present, application, next-72-hour, and longer-term sections when those sections exist.
7. The BLUF introduces no theme, timing window, risk, opportunity, or practical application absent from its cited body sections.
8. A material contradiction in the leading theme requires `tensionToHold`.
9. Unknown-time exclusions apply identically to the BLUF and body.
10. The selected language applies to every BLUF field; IDs and numeric facts remain invariant.

The BLUF is written as a structured executive synthesis, not a duplicated introduction. It answers: what matters most, what is active now, what to do with it, what tension changes the advice, and what the next several days are setting in motion.

## Body sections

```ts
type DailyReadingSection = {
  id: DailySectionId;
  title: string;
  narrative: string;
  practicalApplications: Array<{
    action: string;
    timing?: string;
    evidenceIds: string[];
    signalIds: string[];
  }>;
  evidenceIds: string[];
  signalIds: string[];
  themeIds: string[];
  temporalState?: string;
};
```

Supported section IDs:

1. `strategic-context`
2. `recent-past`
3. `present-conditions`
4. `immediate-application`
5. `time-of-day-map`
6. `work-professional`
7. `finance-resources`
8. `relationships-communication`
9. `energy-self-regulation`
10. `opportunity-risk-matrix`
11. `what-is-ending`
12. `what-is-beginning`
13. `next-72-hours`
14. `longer-term-staging`

The headline and dominant themes are top-level elements. Reflective questions, appendix, and limitations have dedicated structures. A section is conditionally omitted when Stage A has no supported signal for it.

## Length and style budgets

- BLUF: 425–575 words total.
- Strategic, recent, present, next-72-hour, and longer-term sections: normally 180–400 words each.
- Domain and immediate-application sections: normally 120–300 words each.
- Time-of-day map: structured windows with concise narratives rather than one long paragraph.
- Practical applications: 2–5 distinct actions per included section; each must be specific to that section's evidence and timing.
- Reflection questions: 3–6 for the reading, each linked to a theme/signal.
- No minimum length compels unsupported filler.

The voice writes from inside astrological practice: direct planetary, transit, house, aspect, lunar, station, and pass vocabulary; confident pattern recognition; evocative but plain enough to apply. It avoids generic caveats, deterministic outcomes, and opaque technical jargon.

## Opportunity and risk matrix

```ts
type OpportunityRiskMatrix = {
  opportunities: Array<{
    title: string;
    application: string;
    window: string;
    evidenceIds: string[];
  }>;
  risks: Array<{
    title: string;
    watchFor: string;
    response: string;
    window: string;
    evidenceIds: string[];
  }>;
};
```

Risks describe timing, tension, overextension, communication, or execution patterns. They do not predict harm, diagnose conditions, or imply inevitability.

## Technical appendix

The appendix is deterministic, not model-authored where practical:

```text
reading civil date and observation time zone
birth-time status and exclusions
calculation, ephemeris, method, orb, lunar-profile, and rule versions
current positions used
transit-to-natal aspects and active windows
current interplanetary aspects used
lunar phase/sign/house/VOC/final aspect used
ingresses, stations, and repeated passes used
evidence IDs and concise localized labels
generation schema, prompt, model, and completion timestamp
```

Coordinates and raw birth data are not displayed unless a specific private user-facing method need is approved. They never appear in public metadata or URLs.

## Limitations

Limitations are fact-specific, for example:

- Birth time is unknown, so angles, houses, and exact-time-dependent signals were excluded.
- No supported aspect or ingress exists for a conditional section.
- Current angles were not calculated because no explicit current location was supplied.
- A station or exactness time falls outside the bounded search horizon.

They do not become a generic disclaimer section and do not undercut the reading's astrological register.
