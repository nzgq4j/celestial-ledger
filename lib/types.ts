export type ResolvedPlace = {
  id: string;
  city: string;
  region?: string;
  country: string;
  displayName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
};

export type BirthInput = {
  date: string;
  time?: string;
  timeUnknown: boolean;
  disambiguation?: "earlier" | "later";
  place: ResolvedPlace;
};

export type PlanetName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter"
  | "Saturn" | "Uranus" | "Neptune" | "Pluto" | "North Node" | "Ascendant" | "Midheaven";

export type Placement = {
  name: PlanetName;
  longitude: number;
  sign: string;
  degree: number;
  minute: number;
  house?: number;
  retrograde: boolean;
  uncertain?: boolean;
};

export type HouseCusp = { house: number; longitude: number; sign: string; degree: number; minute: number };
export type AspectName = "Conjunction" | "Opposition" | "Trine" | "Square" | "Sextile";
export type Aspect = { body1: PlanetName; body2: PlanetName; type: AspectName; angle: number; orb: number };

export type NatalChart = {
  input: BirthInput;
  utc: string;
  julianDay: number;
  timeKnown: boolean;
  placements: Placement[];
  ascendant?: Placement;
  midheaven?: Placement;
  houses: HouseCusp[];
  aspects: Aspect[];
  moonMayChangeSign: boolean;
  calculation: {
    zodiac: "Tropical";
    houseSystem: "Placidus" | "None";
    ephemeris: string;
    aspectOrbs: Record<AspectName, number>;
  };
};
